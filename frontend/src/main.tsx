import { Buffer } from 'buffer';
if (!(globalThis as any).Buffer) (globalThis as any).Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import App from './App.tsx';
import './index.css';

setNetworkId('preview');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
