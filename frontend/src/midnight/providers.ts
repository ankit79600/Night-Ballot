/**
 * Build MidnightProviders from the Lace DApp connector's ConnectedAPI.
 *
 * The providers are required by @midnight-ntwrk/midnight-js-contracts for
 * findDeployedContract() and submitCallTx().
 */

import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import type {
  MidnightProviders,
  PrivateStateId,
  WalletProvider,
  MidnightProvider,
  PrivateStateProvider,
  ZKConfigProvider,
  ProofProvider,
} from '@midnight-ntwrk/midnight-js-types';
import type { ConnectedAPI, KeyMaterialProvider } from '@midnight-ntwrk/dapp-connector-api';
import { INDEXER_URLS } from './network.js';

// ---------------------------------------------------------------------------
// ZK key material provider
// Loads prover keys, verifier keys, and ZKIR for each ballot circuit.
// The key files are served as static assets from /keys/.
// ---------------------------------------------------------------------------

const CIRCUITS = ['openBallot', 'castYes', 'castNo', 'closeBallot'] as const;
type CircuitId = typeof CIRCUITS[number];

async function fetchBinary(path: string): Promise<Uint8Array> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
  return new Uint8Array(await res.arrayBuffer());
}

export function buildKeyMaterialProvider(): KeyMaterialProvider {
  const cache = new Map<string, Uint8Array>();

  async function load(path: string): Promise<Uint8Array> {
    if (!cache.has(path)) cache.set(path, await fetchBinary(path));
    return cache.get(path)!;
  }

  return {
    getZKIR: (circuit: string) => load(`/keys/${circuit}.bzkir`),
    getProverKey: (circuit: string) => load(`/keys/${circuit}.prover`),
    getVerifierKey: (circuit: string) => load(`/keys/${circuit}.verifier`),
  };
}

// ---------------------------------------------------------------------------
// ZK config provider (wraps KeyMaterialProvider for midnight-js-types)
// ---------------------------------------------------------------------------

export function buildZkConfigProvider(kmp: KeyMaterialProvider): ZKConfigProvider<CircuitId> {
  return {
    getZKConfig: async (circuitId: CircuitId) => ({
      circuitId,
      proverKey: await kmp.getProverKey(circuitId) as any,
      verifierKey: await kmp.getVerifierKey(circuitId) as any,
      zkir: await kmp.getZKIR(circuitId) as any,
    }),
  } as unknown as ZKConfigProvider<CircuitId>;
}

// ---------------------------------------------------------------------------
// Wallet provider — delegates balancing and key material to Lace
// ---------------------------------------------------------------------------

export async function buildWalletProvider(connectedApi: ConnectedAPI): Promise<WalletProvider> {
  const { shieldedCoinPublicKey, shieldedEncryptionPublicKey } =
    await connectedApi.getShieldedAddresses();

  return {
    getCoinPublicKey() {
      return shieldedCoinPublicKey as any;
    },
    getEncryptionPublicKey() {
      return shieldedEncryptionPublicKey as any;
    },
    async balanceTx(tx: any, ttl?: Date) {
      const serialized = JSON.stringify(tx);
      const { tx: balanced } = await connectedApi.balanceUnsealedTransaction(serialized, {
        payFees: true,
      });
      return JSON.parse(balanced);
    },
  };
}

// ---------------------------------------------------------------------------
// Midnight provider — submits transactions via Lace
// ---------------------------------------------------------------------------

export function buildMidnightProvider(connectedApi: ConnectedAPI): MidnightProvider {
  return {
    async submitTx(tx: any) {
      const serialized = JSON.stringify(tx);
      await connectedApi.submitTransaction(serialized);
      return tx.hash ?? '' as any;
    },
  };
}

// ---------------------------------------------------------------------------
// In-memory private state provider (ballot has null private state)
// ---------------------------------------------------------------------------

export function buildPrivateStateProvider(): PrivateStateProvider<PrivateStateId, null> {
  const store = new Map<PrivateStateId, null>();
  return {
    get: async (id: PrivateStateId) => store.get(id) ?? null,
    set: async (id: PrivateStateId, state: null) => { store.set(id, state); },
    remove: async (id: PrivateStateId) => { store.delete(id); },
  } as unknown as PrivateStateProvider<PrivateStateId, null>;
}

// ---------------------------------------------------------------------------
// Assemble all providers
// ---------------------------------------------------------------------------

export async function buildMidnightProviders(
  connectedApi: ConnectedAPI,
): Promise<MidnightProviders<CircuitId, PrivateStateId, null>> {
  const keyMaterialProvider = buildKeyMaterialProvider();
  const zkConfigProvider = buildZkConfigProvider(keyMaterialProvider);
  const proofProvider = await connectedApi.getProvingProvider(keyMaterialProvider) as unknown as ProofProvider;
  const walletProvider = await buildWalletProvider(connectedApi);
  const midnightProvider = buildMidnightProvider(connectedApi);
  const publicDataProvider = indexerPublicDataProvider(INDEXER_URLS.query, INDEXER_URLS.ws);
  const privateStateProvider = buildPrivateStateProvider();

  return {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  };
}
