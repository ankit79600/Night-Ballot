import type { InitialAPI, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export type WalletInfo = {
  address: string;
  connectedApi: ConnectedAPI;
};

function findLace(): InitialAPI | undefined {
  const midnight = window.midnight ?? {};

  // Try known key first, then fall back to any available wallet
  return (
    (midnight['mnLace'] as InitialAPI | undefined) ??
    Object.values(midnight).find(Boolean) as InitialAPI | undefined
  );
}

export function isLaceAvailable(): boolean {
  return findLace() !== undefined;
}

export async function connectWallet(): Promise<WalletInfo> {
  const lace = findLace();
  if (!lace) {
    throw new Error(
      'Lace Midnight wallet not found. Make sure the extension is enabled on this site.',
    );
  }

  const connectedApi = await lace.connect('preprod');
  const { shieldedAddress } = await connectedApi.getShieldedAddresses();

  return { address: shieldedAddress, connectedApi };
}
