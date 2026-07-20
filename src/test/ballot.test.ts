/**
 * Night Ballot — contract test suite
 *
 * Prerequisites: run `npm run compact` first to generate src/managed/ballot/
 * These tests use the Midnight simulator, which executes circuit logic locally
 * (no blockchain or proof server required for unit tests).
 *
 * Run: npm test
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { BallotSimulator } from './ballot-simulator.js';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const ORG_KEY_A = new Uint8Array(32).fill(0x42); // valid organizer
const ORG_KEY_B = new Uint8Array(32).fill(0x99); // different (imposter) key

const PROPOSAL = 'Should Night City fund a community skate park?';

function makeSim(keyByte = 0x42): InstanceType<typeof BallotSimulator> {
  return new BallotSimulator({
    organizerKey: () => new Uint8Array(32).fill(keyByte),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NightBallot — initial state', () => {
  it('starts with a closed ballot', () => {
    const sim = makeSim();
    expect(sim.ledger.isOpen).toEqual(0n);
  });

  it('starts with no votes', () => {
    const sim = makeSim();
    expect(sim.ledger.yesVotes).toEqual(0n);
    expect(sim.ledger.noVotes).toEqual(0n);
  });

  it('starts with no proposal set', () => {
    const sim = makeSim();
    // Maybe<Opaque<"string">> — none variant
    expect(sim.ledger.proposal.is_some).toBe(false);
  });
});

describe('NightBallot — openBallot', () => {
  it('sets isOpen to 1 after openBallot', async () => {
    const sim = makeSim();
    await sim.openBallot(PROPOSAL);
    expect(sim.ledger.isOpen).toEqual(1n);
  });

  it('stores the proposal text on the ledger', async () => {
    const sim = makeSim();
    await sim.openBallot(PROPOSAL);
    expect(sim.ledger.proposal.is_some).toBe(true);
  });

  it('stores the organizer commitment (not the raw key)', async () => {
    const sim = makeSim();
    await sim.openBallot(PROPOSAL);
    // The organizer field is a 32-byte hash — it must not equal the raw key
    const organizerBytes = sim.ledger.organizer as Uint8Array;
    expect(organizerBytes).not.toEqual(ORG_KEY_A);
    expect(organizerBytes).toHaveLength(32);
  });

  it('rejects a second openBallot while already open', async () => {
    const sim = makeSim();
    await sim.openBallot(PROPOSAL);
    await expect(sim.openBallot('Another proposal')).rejects.toThrow(
      'Ballot is already open'
    );
  });
});

describe('NightBallot — voting', () => {
  let sim: InstanceType<typeof BallotSimulator>;

  beforeEach(async () => {
    sim = makeSim();
    await sim.openBallot(PROPOSAL);
  });

  it('increments yesVotes on castYes', async () => {
    await sim.castYes();
    expect(sim.ledger.yesVotes).toEqual(1n);
    expect(sim.ledger.noVotes).toEqual(0n);
  });

  it('increments noVotes on castNo', async () => {
    await sim.castNo();
    expect(sim.ledger.noVotes).toEqual(1n);
    expect(sim.ledger.yesVotes).toEqual(0n);
  });

  it('accumulates multiple votes correctly', async () => {
    await sim.castYes();
    await sim.castYes();
    await sim.castNo();
    expect(sim.ledger.yesVotes).toEqual(2n);
    expect(sim.ledger.noVotes).toEqual(1n);
  });

  it('rejects castYes when ballot is closed', async () => {
    await sim.closeBallot();
    await expect(sim.castYes()).rejects.toThrow('Ballot is not currently open');
  });

  it('rejects castNo when ballot is closed', async () => {
    await sim.closeBallot();
    await expect(sim.castNo()).rejects.toThrow('Ballot is not currently open');
  });
});

describe('NightBallot — closeBallot', () => {
  it('sets isOpen to 0 after closeBallot by the organizer', async () => {
    const sim = makeSim();
    await sim.openBallot(PROPOSAL);
    await sim.closeBallot();
    expect(sim.ledger.isOpen).toEqual(0n);
  });

  it('rejects closeBallot when ballot is already closed', async () => {
    const sim = makeSim();
    await expect(sim.closeBallot()).rejects.toThrow('Ballot is already closed');
  });

  it('preserves final vote tallies after closing', async () => {
    const sim = makeSim();
    await sim.openBallot(PROPOSAL);
    await sim.castYes();
    await sim.castYes();
    await sim.castNo();
    await sim.closeBallot();
    expect(sim.ledger.yesVotes).toEqual(2n);
    expect(sim.ledger.noVotes).toEqual(1n);
    expect(sim.ledger.isOpen).toEqual(0n);
  });

  it('rejects closeBallot with wrong organizer key', async () => {
    // Open with key A
    const sim = makeSim(0x42);
    await sim.openBallot(PROPOSAL);

    // Try to close using a simulator constructed with key B (imposter)
    // We copy the ledger state into a new sim with wrong key — then attempt close.
    const imposter = new BallotSimulator({ organizerKey: () => ORG_KEY_B });
    // Inject the opened ledger state so isOpen check passes
    imposter.injectStateFrom(sim);
    await expect(imposter.closeBallot()).rejects.toThrow(
      'Only the original organizer can close this ballot'
    );
  });
});
