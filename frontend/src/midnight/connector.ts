import type { InitialAPI, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export type WalletInfo = {
  address: string;
  connectedApi: ConnectedAPI;
};

function findLace(): InitialAPI | undefined {
  const midnight = window.midnight ?? {};
  return (
    (midnight['mnLace'] as InitialAPI | undefined) ??
    Object.values(midnight).find(Boolean) as InitialAPI | undefined
  );
}

export function isLaceAvailable(): boolean {
  return findLace() !== undefined;
}

// Re-acquire a fresh ConnectedAPI from the extension (used after port disconnect).
export async function reconnectWallet(): Promise<ConnectedAPI | null> {
  const lace = findLace();
  if (!lace) return null;
  try {
    return await lace.connect('preview');
  } catch {
    return null;
  }
}

export async function connectWallet(): Promise<WalletInfo> {
  const lace = findLace();
  if (!lace) {
    throw new Error(
      'Lace Midnight wallet not found. Make sure the extension is enabled on this site.',
    );
  }

  console.log('[Night Ballot] Lace wallet found, API version:', lace.apiVersion);

  let connectedApi: ConnectedAPI;
  try {
    connectedApi = await lace.connect('preview');
  } catch (err) {
    throw new Error(
      'Could not connect to Midnight Preview network. ' +
      'In your Lace wallet, go to Settings → Network and set Midnight to "Preview", then try again.',
    );
  }

  // Log the full Lace configuration so it is visible in DevTools console.
  // Pay particular attention to proverServerUri: if it is http://localhost:6300
  // and the wallet uses it internally during prove(), that fetch will fail in
  // production and produce "TypeError: Failed to fetch".
  const config = await connectedApi.getConfiguration().catch(() => null);
  if (config) {
    console.log('[Night Ballot] Lace configuration:', config);

    if (config.proverServerUri) {
      const isLocalhost =
        config.proverServerUri.includes('localhost') ||
        config.proverServerUri.includes('127.0.0.1');
      if (isLocalhost) {
        console.warn(
          `[Night Ballot] WARNING: Lace proverServerUri is set to a localhost address: ` +
          `${config.proverServerUri}\n` +
          `If the Lace wallet uses this URL internally during proof generation, ` +
          `transactions will fail in production with "TypeError: Failed to fetch".\n` +
          `Ensure you are running the Midnight proof server Docker image on port 6300, ` +
          `OR use a Lace version that supports in-wallet proving without an external server.`,
        );
      } else {
        console.log('[Night Ballot] Lace proverServerUri:', config.proverServerUri);
      }
    } else {
      console.log(
        '[Night Ballot] Lace proverServerUri: not set ' +
        '(wallet uses built-in proving — this is the expected state for production)',
      );
    }

    console.log('[Night Ballot] Lace networkId:', config.networkId);
    console.log('[Night Ballot] Lace indexerUri:', config.indexerUri);
  } else {
    console.warn('[Night Ballot] Could not read Lace configuration');
  }

  const { shieldedAddress } = await connectedApi.getShieldedAddresses();
  return { address: shieldedAddress, connectedApi };
}
