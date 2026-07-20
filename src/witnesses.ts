/**
 * Witness implementations for the Night Ballot contract.
 *
 * Witnesses are TypeScript functions that supply PRIVATE inputs to the ZK
 * circuit.  Their return values are consumed locally during proof generation
 * and are NEVER sent on-chain or visible to observers.
 *
 * In production: load the organizer key from an encrypted key-store or a
 * hardware wallet.  In development/testing: use a deterministic test secret.
 */

import { randomBytes } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types (mirrored from the generated managed/ballot/contract once compiled)
// ---------------------------------------------------------------------------

export interface BallotWitnesses {
  /** Returns the organizer's 32-byte secret key. */
  organizerKey: () => Uint8Array;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a hex string into a Uint8Array (32 bytes). */
export function hexToKey(hex: string): Uint8Array {
  if (hex.length !== 64) {
    throw new Error(`organizerKey must be 64 hex chars (32 bytes), got ${hex.length}`);
  }
  return Uint8Array.from(Buffer.from(hex, 'hex'));
}

/** Generate a fresh random 32-byte key and print it (for first-time setup). */
export function generateKey(): Uint8Array {
  const key = randomBytes(32);
  console.log('Generated organizer key (save this securely):');
  console.log(Buffer.from(key).toString('hex'));
  return key;
}

// ---------------------------------------------------------------------------
// Production witnesses  (reads ORGANIZER_KEY from environment)
// ---------------------------------------------------------------------------

export function createWitnesses(): BallotWitnesses {
  return {
    organizerKey(): Uint8Array {
      const envKey = process.env['ORGANIZER_KEY'];
      if (!envKey) {
        throw new Error(
          'ORGANIZER_KEY is not set.\n' +
            'Run `node -e "require(\'crypto\').randomBytes(32).toString(\'hex\')" | clip` ' +
            'to generate one, then add it to your .env file.'
        );
      }
      return hexToKey(envKey);
    },
  };
}

// ---------------------------------------------------------------------------
// Test witnesses  (deterministic, safe to commit)
// ---------------------------------------------------------------------------

export function createTestWitnesses(keyByte = 0x42): BallotWitnesses {
  return {
    organizerKey: () => new Uint8Array(32).fill(keyByte),
  };
}
