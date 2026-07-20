/**
 * Night Ballot — deployment script for Midnight Preprod / Preview
 *
 * Prerequisites:
 *   1. Toolchain installed (compact, Node 22, Docker)
 *   2. Contract compiled: npm run compact
 *   3. Proof server running: docker run -p 6300:6300 midnightntwrk/proof-server:latest
 *   4. .env file populated (copy .env.example and fill in values)
 *
 * Usage:
 *   npx tsx src/deploy.ts
 *
 * The script will:
 *   - Connect to the Preprod indexer and proof server
 *   - Deploy the ballot contract with the configured organizer key
 *   - Print the contract address (copy this to your .env as CONTRACT_ADDRESS)
 */

import 'dotenv/config';
import { createWitnesses } from './witnesses.js';

// ---------------------------------------------------------------------------
// Network configuration
// ---------------------------------------------------------------------------

const NETWORK = (process.env['NETWORK'] ?? 'preprod') as 'preprod' | 'preview';

const INDEXER_URLS: Record<string, string> = {
  preprod: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
  preview: 'https://indexer.testnet.midnight.network/api/v1/graphql',
};

const PROOF_SERVER_URL = process.env['PROOF_SERVER_URL'] ?? 'http://localhost:6300';

// ---------------------------------------------------------------------------
// Deploy
// ---------------------------------------------------------------------------

async function deploy(): Promise<void> {
  console.log(`\nNight Ballot — deploying to ${NETWORK}`);
  console.log('─'.repeat(50));

  const indexerUrl = INDEXER_URLS[NETWORK];
  if (!indexerUrl) throw new Error(`Unknown network: ${NETWORK}`);

  const witnesses = createWitnesses();

  console.log(`Indexer  : ${indexerUrl}`);
  console.log(`Proof srv: ${PROOF_SERVER_URL}`);

  // -------------------------------------------------------------------------
  // NOTE: The Midnight JS SDK (midnight-js-wallet, midnight-js-node-provider,
  // etc.) is imported dynamically here because it requires the compiled
  // managed/ directory to exist.  Install the SDK packages once known-stable
  // versions are published:
  //
  //   npm install @midnight-ntwrk/midnight-js-wallet \
  //               @midnight-ntwrk/midnight-js-node-provider \
  //               @midnight-ntwrk/midnight-js-indexer-client
  //
  // Then replace the TODO block below with the actual SDK calls.
  // -------------------------------------------------------------------------

  // TODO: replace with actual Midnight SDK deployment once SDK packages are installed
  //
  // import { deployContract } from '@midnight-ntwrk/midnight-js-node-provider';
  // import { Contract } from './managed/ballot/contract/index.cjs';
  //
  // const contract = new Contract(witnesses);
  // const result = await deployContract(contract, {
  //   indexerUrl,
  //   proofServerUrl: PROOF_SERVER_URL,
  //   walletSeed: process.env['WALLET_SEED']!,
  // });
  //
  // console.log('\n✓ Contract deployed!');
  // console.log(`  Address : ${result.contractAddress}`);
  // console.log(`  Tx hash : ${result.transactionHash}`);
  // console.log('\nAdd to .env:');
  // console.log(`  CONTRACT_ADDRESS=${result.contractAddress}`);

  console.log('\n[deploy.ts] SDK integration placeholder.');
  console.log('See the TODO comments above to wire in the Midnight JS SDK.');
  console.log('You can also deploy interactively via the Lace Midnight wallet.');
}

deploy().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});
