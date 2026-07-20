import { useState, useCallback } from 'react';
import { connectWallet, isLaceAvailable, type WalletInfo } from '../midnight/connector';

export type WalletState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'connected'; info: WalletInfo }
  | { status: 'error'; message: string };

export function useWallet() {
  const [state, setState] = useState<WalletState>({ status: 'disconnected' });

  const connect = useCallback(async () => {
    if (!isLaceAvailable()) {
      setState({ status: 'error', message: 'Lace Midnight wallet not found. Install the extension first.' });
      return;
    }
    setState({ status: 'connecting' });
    try {
      const info = await connectWallet();
      setState({ status: 'connected', info });
    } catch (e) {
      setState({ status: 'error', message: (e as Error).message });
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ status: 'disconnected' });
  }, []);

  return { state, connect, disconnect };
}
