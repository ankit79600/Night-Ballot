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

  let connectedApi: ConnectedAPI;
  try {
    connectedApi = await lace.connect('preview');
  } catch (err) {
    throw new Error(
      'Could not connect to Midnight Preview network. ' +
      'In your Lace wallet, go to Settings → Network and set Midnight to "Preview", then try again.',
    );
  }

  const config = await connectedApi.getConfiguration().catch(() => null);
  console.log('[Night Ballot] Lace wallet configuration:', config);

  const { shieldedAddress } = await connectedApi.getShieldedAddresses();
  return { address: shieldedAddress, connectedApi };
}
