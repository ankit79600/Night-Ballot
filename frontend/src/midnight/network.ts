export type NetworkId = 'preprod' | 'preview';

export const NETWORKS: Record<NetworkId, { query: string; ws: string }> = {
  preprod: {
    query: 'https://indexer.preprod.midnight.network/api/v3/graphql',
    ws: 'wss://indexer.preprod.midnight.network/api/v3/graphql/ws',
  },
  preview: {
    query: 'https://indexer.preview.midnight.network/api/v4/graphql',
    ws: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  },
};

export const ACTIVE_NETWORK: NetworkId = 'preview';
export const INDEXER_URLS = NETWORKS[ACTIVE_NETWORK];

// Deployed contract address on Midnight Preview.
// Set via VITE_CONTRACT_ADDRESS at build time or falls back to empty (simulation mode).
export const CONTRACT_ADDRESS: string =
  (import.meta as any).env?.VITE_CONTRACT_ADDRESS ?? '';
