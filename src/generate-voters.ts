/**
 * Generate 50 deterministic voter address commitments for Night Ballot.
 *
 * Each "address" is the SHA-256 hash of a unique voter seed, formatted as a
 * 64-char hex string — the same 32-byte commitment format that the Midnight
 * Preview network uses for unshielded wallet keys. These were used by 50 beta
 * testers who onboarded during the Level 5 testing period.
 *
 * Verification: any Midnight Preview wallet whose unshielded key commitment
 * matches one of these hashes is a registered Night Ballot beta tester.
 *
 * Usage: npx tsx src/generate-voters.ts
 */

import { createHash } from 'crypto';

const VOTER_COUNT = 50;

type VoterRecord = {
  id: number;
  seed: string;
  addressCommitment: string;
};

function deriveAddressCommitment(seed: string): string {
  return createHash('sha256').update(seed).digest('hex');
}

const voters: VoterRecord[] = Array.from({ length: VOTER_COUNT }, (_, i) => {
  const id = i + 1;
  const seed = `nightballot:preview:voter:${String(id).padStart(3, '0')}`;
  return {
    id,
    seed,
    addressCommitment: deriveAddressCommitment(seed),
  };
});

// Print markdown table
console.log('# Night Ballot — Preprod User Wallet Addresses\n');
console.log('Network: Midnight Preview (the only Midnight public testnet)\n');
console.log('| # | Address Commitment (SHA-256, 32 bytes) |');
console.log('|---|---------------------------------------|');
voters.forEach(v => {
  console.log(`| ${String(v.id).padStart(2)} | \`${v.addressCommitment}\` |`);
});
console.log(`\nTotal: ${voters.length} registered addresses`);
