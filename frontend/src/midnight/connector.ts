import type { InitialAPI, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export type WalletInfo = {
  address: string;
  connectedApi: ConnectedAPI;
};

function findLace(): InitialAPI | undefined {
  return Object.values(window.midnight ?? {}).find(
    (w) => w.rdns === 'io.lace.midnight',
  );
}

export function isLaceAvailable(): boolean {
  return findLace() !== undefined;
}

export async function connectWallet(): Promise<WalletInfo> {
  const lace = findLace();
  if (!lace) throw new Error('Lace Midnight wallet not found. Please install the extension.');

  const connectedApi = await lace.connect('preprod');
  const { shieldedAddress } = await connectedApi.getShieldedAddresses();

  return { address: shieldedAddress, connectedApi };
}
