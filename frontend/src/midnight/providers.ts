/**
 * Build MidnightProviders from the Lace DApp connector's ConnectedAPI.
 *
 * The providers are required by @midnight-ntwrk/midnight-js-contracts for
 * findDeployedContract() and submitCallTx().
 */

import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { Transaction, CostModel } from '@midnight-ntwrk/ledger-v8';
import {
  ZKConfigProvider,
  createZKIR,
  createProverKey,
  createVerifierKey,
} from '@midnight-ntwrk/midnight-js-types';
import type {
  MidnightProviders,
  PrivateStateId,
  WalletProvider,
  MidnightProvider,
  PrivateStateProvider,
  ProofProvider,
  ZKIR,
  ProverKey,
  VerifierKey,
} from '@midnight-ntwrk/midnight-js-types';
import type { ConnectedAPI, KeyMaterialProvider, ProvingProvider } from '@midnight-ntwrk/dapp-connector-api';
import { INDEXER_URLS } from './network.js';

// ---------------------------------------------------------------------------
// ZK key material provider
// Loads prover keys, verifier keys, and ZKIR for each ballot circuit.
// Key files are served as static assets from /keys/.
// We use an absolute origin-relative base so paths resolve correctly even if
// Lace calls these methods from a sandboxed context.
// ---------------------------------------------------------------------------

const CIRCUITS = ['openBallot', 'castYes', 'castNo', 'closeBallot'] as const;
type CircuitId = typeof CIRCUITS[number];

/** Fetch a binary asset and return its bytes with rich diagnostics on failure. */
async function fetchBinary(url: string): Promise<Uint8Array> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    // fetch() itself threw — most commonly: connection refused (localhost proof
    // server not running), CORS pre-flight abort, or an invalid URL.
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `ZK asset fetch failed (network error): ${url} — ${reason}\n` +
      `If this is TypeError: Failed to fetch, the most common cause is that ` +
      `the Lace wallet is trying to reach a local proof server (http://localhost:6300) ` +
      `that is not running. Check the Chrome DevTools Network tab for the failing request.`,
    );
  }

  if (!res.ok) {
    const ct = res.headers.get('content-type') ?? 'unknown';
    throw new Error(
      `ZK asset fetch failed: ${url} → HTTP ${res.status} ${res.statusText} ` +
      `(content-type: ${ct})`,
    );
  }

  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('text/html')) {
    // Vercel SPA fallback returned index.html instead of the binary key file.
    throw new Error(
      `ZK asset fetch returned HTML instead of binary: ${url}\n` +
      `This means the file is missing from the deployment. ` +
      `Ensure frontend/public/keys/ contains all .bzkir/.prover/.verifier files.`,
    );
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  console.log(
    `[Night Ballot] ZK asset loaded: ${url} ` +
    `(${bytes.byteLength.toLocaleString()} bytes, content-type: ${ct || 'none'})`,
  );
  return bytes;
}

/** Build the absolute URL for a ZK key asset so it resolves correctly from any context. */
function zkAssetUrl(circuit: string, ext: string): string {
  // Use window.location.origin so the URL is always absolute, which is
  // necessary if Lace invokes the key-material provider from a web worker or
  // sandboxed iframe where relative paths would resolve to a different origin.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/keys/${circuit}${ext}`;
}

/**
 * Pre-flight check: verify that all 12 ZK key files are reachable before
 * attempting any on-chain transaction.  Failures here give a clear, actionable
 * error message instead of the generic "TypeError: Failed to fetch" from the
 * ledger WASM prover.
 */
export async function checkZKAssets(): Promise<void> {
  const checks = CIRCUITS.flatMap(c => [
    { url: zkAssetUrl(c, '.bzkir'), label: `${c} ZKIR` },
    { url: zkAssetUrl(c, '.prover'), label: `${c} prover key` },
    { url: zkAssetUrl(c, '.verifier'), label: `${c} verifier key` },
  ]);

  const errors: string[] = [];

  await Promise.all(checks.map(async ({ url, label }) => {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) {
        errors.push(`${label}: HTTP ${res.status} at ${url}`);
      } else {
        const size = res.headers.get('content-length');
        console.log(
          `[Night Ballot] ZK asset check OK: ${label} ` +
          `(${size ? `${Number(size).toLocaleString()} bytes` : 'size unknown'}) ${url}`,
        );
      }
    } catch {
      errors.push(`${label}: unreachable at ${url}`);
    }
  }));

  if (errors.length > 0) {
    throw new Error(
      `ZK key files are missing or inaccessible:\n${errors.map(e => `  • ${e}`).join('\n')}\n` +
      `Ensure frontend/public/keys/ is committed and the Vercel build copies it to dist/keys/.`,
    );
  }
}

export function buildKeyMaterialProvider(): KeyMaterialProvider {
  const cache = new Map<string, Uint8Array>();

  async function load(url: string): Promise<Uint8Array> {
    if (!cache.has(url)) cache.set(url, await fetchBinary(url));
    return cache.get(url)!;
  }

  return {
    getZKIR: (circuit: string) => {
      const url = zkAssetUrl(circuit, '.bzkir');
      console.log(`[Night Ballot] keyMaterialProvider.getZKIR("${circuit}") → ${url}`);
      return load(url);
    },
    getProverKey: (circuit: string) => {
      const url = zkAssetUrl(circuit, '.prover');
      console.log(`[Night Ballot] keyMaterialProvider.getProverKey("${circuit}") → ${url}`);
      return load(url);
    },
    getVerifierKey: (circuit: string) => {
      const url = zkAssetUrl(circuit, '.verifier');
      console.log(`[Night Ballot] keyMaterialProvider.getVerifierKey("${circuit}") → ${url}`);
      return load(url);
    },
  };
}

// ---------------------------------------------------------------------------
// ZK config provider (wraps KeyMaterialProvider for midnight-js-types)
// Must extend the abstract ZKConfigProvider class so the concrete
// getVerifierKeys() method is available on the prototype.
// ---------------------------------------------------------------------------

export function buildZkConfigProvider(kmp: KeyMaterialProvider): ZKConfigProvider<CircuitId> {
  class BrowserZKConfigProvider extends ZKConfigProvider<CircuitId> {
    async getZKIR(circuitId: CircuitId): Promise<ZKIR> {
      return createZKIR(await kmp.getZKIR(circuitId));
    }
    async getProverKey(circuitId: CircuitId): Promise<ProverKey> {
      return createProverKey(await kmp.getProverKey(circuitId));
    }
    async getVerifierKey(circuitId: CircuitId): Promise<VerifierKey> {
      return createVerifierKey(await kmp.getVerifierKey(circuitId));
    }
  }
  return new BrowserZKConfigProvider();
}

// ---------------------------------------------------------------------------
// Proof provider — wraps Lace's ProvingProvider with diagnostics.
//
// The ledger WASM calls provingProvider.prove(preimage, keyLocation) where
// keyLocation is the circuit name (e.g. "openBallot").  Lace's implementation
// then calls keyMaterialProvider.getProverKey(keyLocation) to fetch the key
// bytes before running the WASM prover.  If that fetch fails (e.g. because
// Lace internally tries http://localhost:6300) the WASM wraps the error as
// "'prove' returned an error: TypeError: Failed to fetch".
//
// This wrapper intercepts that error and re-throws a message that names the
// circuit and explains the most likely cause.
// ---------------------------------------------------------------------------

function buildDiagnosticProofProvider(provingProvider: ProvingProvider): ProofProvider {
  const costModel = CostModel.initialCostModel();
  return {
    async proveTx(unprovenTx: any) {
      try {
        return await (unprovenTx as any).prove(provingProvider, costModel);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);

        // Detect the Lace "prove returned an error: TypeError: Failed to fetch" pattern.
        const isProveFetchError =
          msg.includes("'prove' returned an error") && msg.includes('Failed to fetch');

        if (isProveFetchError) {
          throw new Error(
            `ZK proof generation failed — the Lace wallet's proving provider ` +
            `made a network request that was rejected.\n\n` +
            `Most likely causes:\n` +
            `  1. The Lace wallet is configured to use a local proof server ` +
            `(http://localhost:6300) which is not running in production.\n` +
            `     Fix: Ensure you are using a Lace version that supports ` +
            `in-wallet proving, or run the Midnight proof server Docker image.\n` +
            `  2. The Midnight network's cloud proving service is unreachable ` +
            `or blocked by your network.\n\n` +
            `To diagnose: open Chrome DevTools → Network tab → filter by "6300" ` +
            `or "prove". The failing request URL will be visible there.\n\n` +
            `Original error: ${msg}`,
          );
        }

        // Detect the case where our own fetchBinary threw (the key asset was not
        // reachable).  This is already a rich message from fetchBinary; just rethrow.
        if (msg.startsWith('ZK asset fetch failed')) throw err;

        // Unknown proving error — rethrow as-is.
        throw err;
      }
    },
  };
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
    async balanceTx(tx: any, _ttl?: Date) {
      const txStr = tx.toString();
      console.log('[Night Ballot] balanceTx: input tx.toString() prefix:', txStr.slice(0, 100));

      const result = await connectedApi.balanceUnsealedTransaction(txStr, { payFees: true });
      const balanced = result.tx;
      console.log(
        '[Night Ballot] balanceTx: balanceUnsealedTransaction result.tx type:', typeof balanced,
        'prefix:', typeof balanced === 'string' ? balanced.slice(0, 100) : JSON.stringify(balanced),
      );

      if (typeof balanced !== 'string' || !balanced) {
        throw new Error(
          `balanceUnsealedTransaction returned unexpected result: ${JSON.stringify(result)}\n` +
          `The wallet may not have sufficient tDUST to pay transaction fees.`,
        );
      }

      // The result is the full transaction string: "midnight:transaction[v9]{...}:HEXDATA"
      // Extract the hex-encoded binary payload after the last colon.
      const colonIdx = balanced.lastIndexOf(':');
      if (colonIdx === -1 || colonIdx === balanced.length - 1) {
        throw new Error(
          `balanceUnsealedTransaction returned a transaction string with no hex payload: ${balanced.slice(0, 200)}`,
        );
      }
      const hexData = balanced.slice(colonIdx + 1);
      console.log('[Night Ballot] balanceTx: hexData length:', hexData.length, 'first 20 chars:', hexData.slice(0, 20));

      const bytes = new Uint8Array(hexData.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)));
      console.log('[Night Ballot] balanceTx: bytes length:', bytes.length);
      return Transaction.deserialize('signature', 'proof', 'binding', bytes);
    },
  };
}

// ---------------------------------------------------------------------------
// Midnight provider — submits transactions via Lace
// ---------------------------------------------------------------------------

export function buildMidnightProvider(connectedApi: ConnectedAPI): MidnightProvider {
  return {
    async submitTx(tx: any) {
      await connectedApi.submitTransaction(tx.toString());
      return tx.identifiers()[0] as any;
    },
  };
}

// ---------------------------------------------------------------------------
// In-memory private state provider (ballot has null private state)
// ---------------------------------------------------------------------------

export function buildPrivateStateProvider(): PrivateStateProvider<PrivateStateId, null> {
  const store = new Map<PrivateStateId, null>();
  const signingKeys = new Map<string, unknown>();

  return {
    setContractAddress: (_address: string) => {},
    get: async (id: PrivateStateId) => store.get(id) ?? null,
    set: async (id: PrivateStateId, state: null) => { store.set(id, state); },
    remove: async (id: PrivateStateId) => { store.delete(id); },
    clear: async () => { store.clear(); },
    getSigningKey: async (address: unknown) => signingKeys.get(String(address)) ?? null,
    setSigningKey: async (address: unknown, key: unknown) => { signingKeys.set(String(address), key); },
    removeSigningKey: async (address: unknown) => { signingKeys.delete(String(address)); },
    clearSigningKeys: async () => { signingKeys.clear(); },
    exportPrivateStates: async () => { throw new Error('exportPrivateStates not supported in browser session'); },
    importPrivateStates: async () => { throw new Error('importPrivateStates not supported in browser session'); },
    exportSigningKeys: async () => { throw new Error('exportSigningKeys not supported in browser session'); },
    importSigningKeys: async () => { throw new Error('importSigningKeys not supported in browser session'); },
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

  // Delegate proving to Lace.  The keyMaterialProvider callbacks are invoked
  // by Lace when it needs the raw prover/verifier key bytes.
  const provingProvider = await connectedApi.getProvingProvider(keyMaterialProvider);

  // Wrap with diagnostics so prove() failures surface a clear message.
  const proofProvider = buildDiagnosticProofProvider(provingProvider);

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
