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
  const networks = ['testnet', 'preprod', 'preview', 'undeployed', 'mainnet'];
  for (const network of networks) {
    try {
      return await lace.connect(network);
    } catch {}
  }
  return null;
}

export async function connectWallet(): Promise<WalletInfo> {
  const lace = findLace();
  if (!lace) {
    throw new Error(
      'Lace Midnight wallet not found. Make sure the extension is enabled on this site.',
    );
  }

  // Try each network in order until one matches the wallet's current network
  const networks = ['testnet', 'preprod', 'preview', 'undeployed', 'mainnet'];
  let connectedApi: ConnectedAPI | null = null;

  for (const network of networks) {
    try {
      connectedApi = await lace.connect(network);
      break;
    } catch {
      // Try next network
    }
  }

  if (!connectedApi) {
    throw new Error('Could not connect — check your Lace wallet network setting.');
  }

  const { shieldedAddress } = await connectedApi.getShieldedAddresses();
  return { address: shieldedAddress, connectedApi };
}
