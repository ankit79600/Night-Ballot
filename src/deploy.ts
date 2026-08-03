/**
 * Night Ballot — deployment script for Midnight Preprod
 *
 * Prerequisites:
 *   1. Contract compiled:  npm run compact
 *   2. Proof server:       docker run -p 6300:6300 midnightntwrk/proof-server midnight-proof-server
 *   3. .env populated:     ORGANIZER_KEY, WALLET_SEED (24-word BIP-39), NETWORK=preprod, PROOF_SERVER_URL
 *
 * Memory strategy
 * ───────────────
 * The default DustWallet sync (batchSize=10, spacing=4ms) consumes events at ~2,500/sec
 * while the indexer delivers historical events much faster, causing a multi-GB buffer OOM.
 *
 * Fix: set batchUpdates { size: 100_000, spacing: 0 } so the consumer is always faster
 * than the producer.  Peak in-flight memory becomes ≈ 1 batch × event_size instead of
 * the full 1.34 M-event backlog.
 *
 * Run with:
 *   $env:NODE_OPTIONS='--max-old-space-size=4096'; npm run deploy
 */

import 'dotenv/config';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { firstValueFrom, filter, timeout } from 'rxjs';

import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  DustSecretKey,
  ZswapSecretKeys,
  LedgerParameters,
  unshieldedToken,
} from '@midnight-ntwrk/ledger-v8';
import {
  PreprodTestEnvironment,
  PreviewTestEnvironment,
  MidnightWalletProvider,
  WalletSeeds,
  initializeMidnightProviders,
  inMemoryPrivateStateProvider,
  createDefaultTestLogger,
} from '@midnight-ntwrk/testkit-js';
import {
  DustWallet,
  WalletFacade,
  ShieldedWallet,
  UnshieldedWallet,
  InMemoryTransactionHistoryStorage,
  WalletEntrySchema,
  mergeWalletEntries,
  createKeystore,
  PublicKey,
} from '@midnight-ntwrk/wallet-sdk';

import { createWitnesses } from './witnesses.js';
import { Contract } from './managed/ballot/contract/index.js';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const NETWORK = (process.env['NETWORK'] ?? 'preprod') as 'preprod' | 'preview';
const PROOF_SERVER_URL = process.env['PROOF_SERVER_URL'] ?? 'http://localhost:6300';
const __dirname = dirname(fileURLToPath(import.meta.url));
const MANAGED_DIR = join(__dirname, 'managed', 'ballot');

// How long to wait for the dust wallet to report a positive balance after start()
const DUST_SYNC_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

// ---------------------------------------------------------------------------
// Deploy
// ---------------------------------------------------------------------------

async function deploy(): Promise<void> {
  console.log(`\nNight Ballot — deploying to Midnight ${NETWORK}`);
  console.log('─'.repeat(50));

  // 1. Network environment
  setNetworkId(NETWORK);
  const logger = createDefaultTestLogger();
  const env = NETWORK === 'preprod'
    ? new PreprodTestEnvironment(logger)
    : new PreviewTestEnvironment(logger);
  const envConfig = {
    ...env.getEnvironmentConfiguration(),
    proofServer: PROOF_SERVER_URL,
  };
  console.log(`Indexer  : ${envConfig.indexer}`);
  console.log(`Relay WS : ${envConfig.nodeWS}`);
  console.log(`Proof srv: ${envConfig.proofServer}`);

  // 2. Seeds from BIP-39 mnemonic
  const mnemonic = process.env['WALLET_SEED'];
  if (!mnemonic) throw new Error('WALLET_SEED must be set in .env (24-word BIP-39 mnemonic)');
  console.log('\nDeriving wallet keys from WALLET_SEED…');
  const seeds = WalletSeeds.fromMnemonic(mnemonic.trim());
  const zswapSecretKeys = ZswapSecretKeys.fromSeed(seeds.shielded);
  const dustSecretKey = DustSecretKey.fromSeed(seeds.dust);
  const unshieldedKeystore = createKeystore(seeds.unshielded, envConfig.walletNetworkId);
  console.log(`Unshielded address: ${unshieldedKeystore.getBech32Address().asString()}`);

  // 3. Shared wallet configuration
  //    batchUpdates: process 100 k events per batch with 0 ms inter-batch delay.
  //    This keeps the Effect/RxJS consumer faster than the indexer producer,
  //    preventing the multi-GB buffer that causes OOM with the defaults (10 / 4 ms).
  const walletConfig = {
    indexerClientConnection: {
      indexerHttpUrl: envConfig.indexer,
      indexerWsUrl: envConfig.indexerWS,
    },
    provingServerUrl: new URL(envConfig.proofServer),
    networkId: envConfig.walletNetworkId,
    relayURL: new URL(envConfig.nodeWS),
    txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema, mergeWalletEntries),
    costParameters: { feeBlocksMargin: 5 },
    batchUpdates: {
      size: 100_000,   // process 100 k events per WASM call instead of 10
      spacing: 0,      // no artificial delay — consume as fast as possible
      timeout: 200,    // wait up to 200 ms to fill a batch
    },
  } as any;

  // 4. Build wallet components
  //    Dust wallet uses startWithSeed so the SDK handles historical sync internally,
  //    but with the aggressive batchUpdates config above to prevent OOM.
  const shieldedWallet = (ShieldedWallet as any)(walletConfig).startWithSeed(seeds.shielded);
  const unshieldedWallet = (UnshieldedWallet as any)({
    ...walletConfig,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema, mergeWalletEntries),
  }).startWithPublicKey((PublicKey as any).fromKeyStore(unshieldedKeystore));
  const dustWallet = (DustWallet as any)({
    ...walletConfig,
    costParameters: {
      ledgerParams: LedgerParameters.initialParameters(),
      additionalFeeOverhead: 0n,
      feeBlocksMargin: 5,
    },
  }).startWithSeed(seeds.dust, LedgerParameters.initialParameters().dust);

  // 5. Assemble WalletFacade
  console.log('\nBuilding WalletFacade…');
  const facade = await WalletFacade.init({
    configuration: walletConfig,
    shielded: () => shieldedWallet,
    unshielded: () => unshieldedWallet,
    dust: () => dustWallet,
  });

  // 6. Wrap in MidnightWalletProvider
  const walletProvider = await MidnightWalletProvider.withWallet(
    logger,
    envConfig,
    facade,
    zswapSecretKeys,
    dustSecretKey,
    unshieldedKeystore,
  );

  // 7. Start wallet — triggers indexer subscription and historical sync
  console.log('Starting wallet (historical dust sync — may take several minutes)…');
  console.log('Memory tip: watch Task Manager; heap should stay under 2 GB with batchSize=100k.');
  await walletProvider.start(false); // false = don't block waiting for balance

  // 8. Wait for dust balance (proves the historical sync found our registered UTXO)
  console.log('\nWaiting for dust balance (up to 20 min)…');
  const startedAt = Date.now();
  let lastPct = '';
  try {
    await firstValueFrom(
      (facade as any).state().pipe(
        filter((s: any) => {
          // Progress reporting — all arithmetic must be safe (no BigInt/number mixing)
          try {
            const applied = Number(s?.dust?.progress?.appliedIndex ?? 0n);
            const maxId   = Number(s?.dust?.progress?.maxId ?? 1n);
            const pct = maxId > 0 ? ((applied / maxId) * 100).toFixed(1) : '0.0';
            const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
            if (pct !== lastPct) {
              lastPct = pct;
              process.stdout.write(`\r  Dust sync: ${pct}%  (${elapsed}s elapsed)   `);
            }
          } catch { /* never throw from filter */ }

          // Check for positive dust balance
          try { return (s?.dust?.balance?.(new Date()) ?? 0n) > 0n; } catch { return false; }
        }),
        timeout({
          each: DUST_SYNC_TIMEOUT_MS,
          with: () => { throw new Error(`Dust balance did not appear within ${DUST_SYNC_TIMEOUT_MS / 60000} minutes`); },
        }),
      ),
    );
    process.stdout.write('\n');
    console.log(`Dust balance confirmed in ${((Date.now() - startedAt) / 1000).toFixed(0)}s.`);
  } catch (err: any) {
    process.stdout.write('\n');
    console.warn(`WARNING: ${(err as any).message ?? err}. Attempting deployment anyway…`);
  }

  // 9. Register NIGHT UTXOs for dust generation if dust balance is still 0
  //    On Midnight, tNight tokens in the unshielded wallet must be explicitly
  //    registered on-chain before the dust wallet can use them to pay fees.
  try {
    const currentState = await firstValueFrom((facade as any).state()) as any;
    const dustBal = currentState?.dust?.balance?.(new Date()) ?? 0n;
    if (dustBal === 0n) {
      console.log('\nDust balance is 0 — registering NIGHT UTXOs for dust generation…');
      const unshieldedRaw = unshieldedToken().raw;
      const unregistered = (currentState?.unshielded?.availableCoins ?? [])
        .filter((coin: any) => coin.utxo.type === unshieldedRaw && coin.meta.registeredForDustGeneration === false);
      if (unregistered.length === 0) {
        console.warn('WARNING: No unregistered NIGHT UTXOs found. Make sure the faucet sent tokens to the unshielded address.');
      } else {
        console.log(`  Found ${unregistered.length} unregistered NIGHT UTXO(s). Submitting registration tx…`);
        const recipe = await (facade as any).registerNightUtxosForDustGeneration(
          unregistered,
          unshieldedKeystore.getPublicKey(),
          (payload: Uint8Array) => unshieldedKeystore.signData(payload),
        );
        const finalized = await (facade as any).finalizeRecipe(recipe);
        const txId = await (facade as any).submitTransaction(finalized);
        console.log(`  Registration tx submitted: ${txId}`);
        console.log('  Waiting 30s for on-chain confirmation…');
        await new Promise(resolve => setTimeout(resolve, 30_000));
      }
    } else {
      console.log(`\nDust balance confirmed: ${dustBal}`);
    }
  } catch (err: any) {
    console.warn(`WARNING: Dust registration check failed: ${err?.message ?? err}. Attempting deployment anyway…`);
  }

  // 11. Build midnight-js providers
  const providers = initializeMidnightProviders<string, null>(
    walletProvider,
    envConfig,
    { privateStateStoreName: 'ballot-deploy', zkConfigPath: MANAGED_DIR },
  );
  (providers as any).privateStateProvider = inMemoryPrivateStateProvider();

  // 12. Compile contract with witnesses
  const witnesses = createWitnesses();
  const compiledContract = CompiledContract.make('ballot', Contract).pipe(
    CompiledContract.withWitnesses({
      organizerKey: (_ctx: unknown) => [null, witnesses.organizerKey()] as [null, Uint8Array],
    }),
    CompiledContract.withCompiledFileAssets(MANAGED_DIR),
  );

  // 13. Deploy!
  console.log('\nCalling deployContract()…');
  const deployed = await deployContract(providers as any, {
    compiledContract: compiledContract as any,
    privateStateId: 'ballot',
    initialPrivateState: null,
  } as any);

  await walletProvider.stop();

  const contractAddress =
    (deployed as any).deployTxData?.public?.contractAddress
    ?? String(deployed);

  console.log('\n✓ Contract deployed!');
  console.log(`  Address : ${contractAddress}`);
  console.log(`  Network : Midnight ${NETWORK}`);
  console.log('\nNext steps:');
  console.log(`  1. .env             : CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`  2. README.md        : replace placeholder with ${contractAddress}`);
  console.log(`  3. Vercel env var   : VITE_CONTRACT_ADDRESS=${contractAddress}`);
}

deploy().catch((err) => {
  console.error('\nDeployment failed:', err);
  process.exit(1);
});
