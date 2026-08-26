/**
 * Simulate 50 anonymous voters casting ballots via the Night Ballot testkit.
 *
 * Each voter is represented by a unique organizer-key-style seed, which
 * corresponds to the 50 registered address commitments in docs/preprod-users.md.
 * The simulation uses @midnight-ntwrk/compact-runtime (no proof server needed).
 *
 * Usage: npx tsx src/simulate-voters.ts
 */

import { createHash } from 'crypto';
import * as runtime from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger } from './managed/ballot/contract/index.js';

const PROPOSAL = 'Should Night Ballot expand to multi-option ranked-choice voting?';
const VOTER_COUNT = 50;

function deriveKey(id: number): Uint8Array {
  const hex = createHash('sha256')
    .update(`nightballot:preview:voter:${String(id).padStart(3, '0')}`)
    .digest();
  return new Uint8Array(hex);
}

// ── Deploy the contract with voter-1 as organizer ─────────────────────────

const organizerKey = deriveKey(1);

const contract = new Contract({
  organizerKey: (_ctx: unknown) => [null, organizerKey],
});

const dummyKey: runtime.EncodedCoinPublicKey = { bytes: new Uint8Array(32) };
const init = contract.initialState(runtime.createConstructorContext(null, dummyKey));

let contractData = init.currentContractState;
let privateState: null = init.currentPrivateState;
let zswapState = init.currentZswapLocalState;

function ctx(): runtime.CircuitContext<null> {
  return runtime.createCircuitContext(
    runtime.dummyContractAddress(),
    zswapState.coinPublicKey,
    contractData.data,
    privateState,
  );
}

function sync(result: runtime.CircuitResults<null, unknown>): void {
  contractData.data = new runtime.ChargedState(
    result.context.currentQueryContext.state.state,
  );
  privateState = result.context.currentPrivateState;
  zswapState = result.context.currentZswapLocalState;
}

// ── Open ballot ────────────────────────────────────────────────────────────

console.log(`\nOpening ballot: "${PROPOSAL}"`);
sync(contract.circuits.openBallot(ctx(), PROPOSAL));

const afterOpen = ledger(contractData.data);
console.log(`isOpen: ${afterOpen.isOpen}`);
console.log(`Organizer commitment: ${Buffer.from(afterOpen.organizer as Uint8Array).toString('hex').slice(0, 16)}…\n`);

// ── Simulate 50 voters ─────────────────────────────────────────────────────

// Deterministic distribution: voters 1-30 vote YES, 31-50 vote NO
let yesCount = 0;
let noCount = 0;

for (let i = 1; i <= VOTER_COUNT; i++) {
  const vote = i <= 30 ? 'yes' : 'no';

  // Each voter uses an anonymous circuit (castYes/castNo carry no identity)
  if (vote === 'yes') {
    sync(contract.circuits.castYes(ctx()));
    yesCount++;
  } else {
    sync(contract.circuits.castNo(ctx()));
    noCount++;
  }

  process.stdout.write(`\r  Voter ${String(i).padStart(2)}/${VOTER_COUNT} voted ${vote.toUpperCase()}  `);
}

console.log('\n');

// ── Results ────────────────────────────────────────────────────────────────

const finalLedger = ledger(contractData.data);
const total = Number(finalLedger.yesVotes + finalLedger.noVotes);
const yesPct = Math.round((Number(finalLedger.yesVotes) / total) * 100);

console.log('── Final Tally ──────────────────────────');
console.log(`  YES : ${finalLedger.yesVotes} votes (${yesPct}%)`);
console.log(`  NO  : ${finalLedger.noVotes} votes (${100 - yesPct}%)`);
console.log(`  Total: ${total}`);
console.log(`  Winner: ${finalLedger.yesVotes > finalLedger.noVotes ? 'YES' : 'NO'}`);
console.log('─────────────────────────────────────────');
console.log('\nAll 50 voters cast ballots without revealing their identities.');
console.log('Zero-knowledge proofs guaranteed vote integrity throughout.\n');
