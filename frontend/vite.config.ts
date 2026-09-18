import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'path';

export default defineConfig({
  plugins: [wasm(), topLevelAwait(), react()],
  envDir: path.resolve(__dirname, '..'),
  resolve: {
    dedupe: [
      '@midnight-ntwrk/midnight-js-network-id',
      '@midnight-ntwrk/ledger-v8',
      '@midnight-ntwrk/onchain-runtime-v3',
      '@midnight-ntwrk/compact-runtime',
    ],
    alias: {
      '@contract': path.resolve(__dirname, '../src/managed/ballot/contract'),
    },
  },
  optimizeDeps: {
    exclude: ['@midnight-ntwrk/midnight-js-network-id'],
  },
});
