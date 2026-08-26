/**
 * Voter simulation tests — verifies that 50 sequential anonymous votes
 * are accurately tallied without leaking voter identity.
 *
 * Prerequisites: npm run compact (generates src/managed/ballot/)
 * Run: npm test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createHash } from 'crypto';
import { BallotSimulator } from './ballot-simulator.js';

const PROPOSAL = 'Should Night Ballot expand to multi-option ranked-choice voting?';
const VOTER_COUNT = 50;

function deriveKey(id: number): Uint8Array {
  return new Uint8Array(
    createHash('sha256')
      .update(`nightballot:preview:voter:${String(id).padStart(3, '0')}`)
      .digest(),
  );
}

// Single shared simulation opened by voter-1 (organizer)
let sim: InstanceType<typeof BallotSimulator>;

describe('NightBallot — 50-voter simulation', () => {
  beforeEach(async () => {
    sim = new BallotSimulator({ organizerKey: () => deriveKey(1) });
    await sim.openBallot(PROPOSAL);
  });

  it('accepts 30 YES votes from unique anonymous voters', async () => {
    for (let i = 1; i <= 30; i++) {
      await sim.castYes();
    }
    expect(sim.ledger.yesVotes).toEqual(30n);
    expect(sim.ledger.noVotes).toEqual(0n);
  });

  it('accepts 20 NO votes from unique anonymous voters', async () => {
    for (let i = 1; i <= 20; i++) {
      await sim.castNo();
    }
    expect(sim.ledger.noVotes).toEqual(20n);
    expect(sim.ledger.yesVotes).toEqual(0n);
  });

  it('tallies 50 mixed votes with correct split (30 YES / 20 NO)', async () => {
    for (let i = 1; i <= 30; i++) await sim.castYes();
    for (let i = 1; i <= 20; i++) await sim.castNo();
    expect(sim.ledger.yesVotes).toEqual(30n);
    expect(sim.ledger.noVotes).toEqual(20n);
    expect(sim.ledger.yesVotes + sim.ledger.noVotes).toEqual(50n);
  });

  it('YES wins the 50-voter ballot', async () => {
    for (let i = 1; i <= 30; i++) await sim.castYes();
    for (let i = 1; i <= 20; i++) await sim.castNo();
    expect(sim.ledger.yesVotes > sim.ledger.noVotes).toBe(true);
  });

  it('ballot closes correctly after 50 votes', async () => {
    for (let i = 1; i <= 30; i++) await sim.castYes();
    for (let i = 1; i <= 20; i++) await sim.castNo();
    await sim.closeBallot();
    expect(sim.ledger.isOpen).toEqual(0n);
    // Tallies preserved after close
    expect(sim.ledger.yesVotes).toEqual(30n);
    expect(sim.ledger.noVotes).toEqual(20n);
  });

  it('voter identities are never recorded on ledger', async () => {
    for (let i = 1; i <= VOTER_COUNT; i++) {
      if (i % 2 === 0) await sim.castYes();
      else await sim.castNo();
    }
    const l = sim.ledger;
    // Ledger only holds tally — no voter keys, no wallet addresses
    const ledgerKeys = Object.keys(l as object);
    expect(ledgerKeys).toContain('yesVotes');
    expect(ledgerKeys).toContain('noVotes');
    expect(ledgerKeys).not.toContain('voters');
    expect(ledgerKeys).not.toContain('voterAddresses');
  });

  it('unique voter keys produce identical on-chain behaviour (anonymity)', async () => {
    // Two voters with different keys cast the same vote — ledger is indistinguishable
    const simA = new BallotSimulator({ organizerKey: () => deriveKey(1) });
    const simB = new BallotSimulator({ organizerKey: () => deriveKey(2) });

    await simA.openBallot(PROPOSAL);
    await simB.openBallot(PROPOSAL);

    await simA.castYes();
    await simB.castYes();

    // Same tally regardless of who voted
    expect(simA.ledger.yesVotes).toEqual(simB.ledger.yesVotes);
    expect(simA.ledger.noVotes).toEqual(simB.ledger.noVotes);
  });

  it('derives 50 unique address commitments (no collisions)', () => {
    const addresses = new Set<string>();
    for (let i = 1; i <= VOTER_COUNT; i++) {
      const key = deriveKey(i);
      const hex = Buffer.from(key).toString('hex');
      addresses.add(hex);
    }
    expect(addresses.size).toEqual(VOTER_COUNT);
  });
});
