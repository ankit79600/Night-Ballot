export type NetworkId = 'preprod' | 'preview';

export const NETWORKS: Record<NetworkId, { query: string; ws: string }> = {
  preprod: {
    query: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
    ws: 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws',
  },
  preview: {
    query: 'https://indexer.testnet.midnight.network/api/v1/graphql',
    ws: 'wss://indexer.testnet.midnight.network/api/v1/graphql/ws',
  },
};

export const ACTIVE_NETWORK: NetworkId = 'preprod';
export const INDEXER_URLS = NETWORKS[ACTIVE_NETWORK];

// Deployed contract address on Midnight Preprod.
// Set via VITE_CONTRACT_ADDRESS at build time or falls back to empty (simulation mode).
export const CONTRACT_ADDRESS: string =
  (import.meta as any).env?.VITE_CONTRACT_ADDRESS ?? '';
