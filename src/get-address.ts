/**
 * Print wallet addresses derived from WALLET_SEED without connecting to the network.
 * Usage: npx tsx src/get-address.ts
 */
import 'dotenv/config';
import {
  PreprodTestEnvironment,
  PreviewTestEnvironment,
  WalletSeeds,
  createDefaultTestLogger,
} from '@midnight-ntwrk/testkit-js';
import { createKeystore } from '@midnight-ntwrk/wallet-sdk';
import {
  DustSecretKey,
  ZswapSecretKeys,
} from '@midnight-ntwrk/ledger-v8';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

const NETWORK = (process.env['NETWORK'] ?? 'preprod') as 'preprod' | 'preview';

const mnemonic = process.env['WALLET_SEED'];
if (!mnemonic) {
  console.error('WALLET_SEED not set in .env');
  process.exit(1);
}

setNetworkId(NETWORK);
const logger = createDefaultTestLogger();
const env = NETWORK === 'preprod'
  ? new PreprodTestEnvironment(logger)
  : new PreviewTestEnvironment(logger);
const { walletNetworkId } = env.getEnvironmentConfiguration();

const seeds = WalletSeeds.fromMnemonic(mnemonic.trim());
const unshieldedKeystore = createKeystore(seeds.unshielded, walletNetworkId);
const dustSecretKey = DustSecretKey.fromSeed(seeds.dust);
const zswapKeys = ZswapSecretKeys.fromSeed(seeds.shielded);

console.log(`Network             : Midnight ${NETWORK}`);
console.log(`Unshielded address  : ${unshieldedKeystore.getBech32Address().asString()}`);
const dustPkBytes: Uint8Array =
  typeof dustSecretKey.publicKey === 'function'
    ? dustSecretKey.publicKey().bytes()
    : (dustSecretKey as any).pk?.bytes?.() ?? (dustSecretKey as any).toPublicKey?.()?.bytes?.() ?? new Uint8Array();
console.log(`Dust public key     : ${Buffer.from(dustPkBytes).toString('hex') || '(not directly accessible — use unshielded address for faucet)'}`);
console.log('\nFund the wallet via the Midnight preprod faucet, then run:');
console.log('  $env:NODE_OPTIONS=\'--max-old-space-size=4096\'; npm run deploy');
