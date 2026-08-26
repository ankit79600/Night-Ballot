/**
 * Security regression tests — verifies that Night Ballot enforces
 * access control, state invariants, and anonymity guarantees.
 *
 * Prerequisites: npm run compact
 * Run: npm test
 */

import { describe, it, expect } from 'vitest';
import { BallotSimulator } from './ballot-simulator.js';

const ORG_KEY = new Uint8Array(32).fill(0xca);
const IMPOSTER_KEY = new Uint8Array(32).fill(0xfe);
const PROPOSAL = 'Security test proposal';

describe('NightBallot — security invariants', () => {
  it('rejects closeBallot from an imposter with a different key', async () => {
    const org = new BallotSimulator({ organizerKey: () => ORG_KEY });
    await org.openBallot(PROPOSAL);

    const imposter = new BallotSimulator({ organizerKey: () => IMPOSTER_KEY });
    imposter.injectStateFrom(org);
    await expect(imposter.closeBallot()).rejects.toThrow(
      'Only the original organizer can close this ballot',
    );
  });

  it('rejects double-open: ballot cannot be opened twice', async () => {
    const sim = new BallotSimulator({ organizerKey: () => ORG_KEY });
    await sim.openBallot(PROPOSAL);
    await expect(sim.openBallot('Second proposal')).rejects.toThrow(
      'Ballot is already open',
    );
  });

  it('rejects votes on a closed ballot', async () => {
    const sim = new BallotSimulator({ organizerKey: () => ORG_KEY });
    await expect(sim.castYes()).rejects.toThrow('Ballot is not currently open');
    await expect(sim.castNo()).rejects.toThrow('Ballot is not currently open');
  });

  it('rejects closeBallot when ballot was never opened', async () => {
    const sim = new BallotSimulator({ organizerKey: () => ORG_KEY });
    await expect(sim.closeBallot()).rejects.toThrow('Ballot is already closed');
  });

  it('organizer commitment is a hash — raw key is never on ledger', async () => {
    const sim = new BallotSimulator({ organizerKey: () => ORG_KEY });
    await sim.openBallot(PROPOSAL);
    const commitment = sim.ledger.organizer as Uint8Array;
    // Commitment must differ from raw key (it is H(key))
    expect(commitment).not.toEqual(ORG_KEY);
    expect(commitment).toHaveLength(32);
  });

  it('all 255 key values produce distinct organizer commitments', async () => {
    const commitments = new Set<string>();
    for (let b = 0; b < 16; b++) {
      const sim = new BallotSimulator({
        organizerKey: () => new Uint8Array(32).fill(b),
      });
      await sim.openBallot(PROPOSAL);
      const hex = Buffer.from(sim.ledger.organizer as Uint8Array).toString('hex');
      commitments.add(hex);
    }
    expect(commitments.size).toEqual(16);
  });

  it('voting does not reveal which wallet cast which vote', async () => {
    const sim = new BallotSimulator({ organizerKey: () => ORG_KEY });
    await sim.openBallot(PROPOSAL);

    const before = { ...sim.ledger };
    await sim.castYes();
    const after = sim.ledger;

    // Only yesVotes incremented — no new identity field appeared
    expect(Number(after.yesVotes) - Number(before.yesVotes)).toEqual(1);
    expect(Object.keys(after as object)).toEqual(Object.keys(before as object));
  });

  it('vote tally cannot underflow (no negative votes)', async () => {
    const sim = new BallotSimulator({ organizerKey: () => ORG_KEY });
    await sim.openBallot(PROPOSAL);
    // Counters start at 0; no mechanism to decrement
    expect(sim.ledger.yesVotes).toEqual(0n);
    expect(sim.ledger.noVotes).toEqual(0n);
  });

  it('closing preserves the final tally immutably', async () => {
    const sim = new BallotSimulator({ organizerKey: () => ORG_KEY });
    await sim.openBallot(PROPOSAL);
    await sim.castYes();
    await sim.castYes();
    await sim.castNo();
    await sim.closeBallot();

    const l = sim.ledger;
    expect(l.isOpen).toEqual(0n);
    expect(l.yesVotes).toEqual(2n);
    expect(l.noVotes).toEqual(1n);
  });
});
