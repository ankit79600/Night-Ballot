import { useState, useCallback } from 'react';
import { connectWallet, isLaceAvailable, type WalletInfo } from '../midnight/connector';

export type WalletState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'connected'; info: WalletInfo }
  | { status: 'error'; message: string; recoveryHint?: string };

const INSTALL_URL =
  'https://chromewebstore.google.com/detail/lace-midnight-preview/hgeekaiplokcnmakghbdfbgnlfheichg';

export function useWallet() {
  const [state, setState] = useState<WalletState>({ status: 'disconnected' });

  const connect = useCallback(async () => {
    if (!isLaceAvailable()) {
      setState({
        status: 'error',
        message: 'Lace Midnight wallet not detected.',
        recoveryHint: `Install the Lace Midnight Preview extension from the Chrome Web Store, then reload this page.`,
      });
      return;
    }
    setState({ status: 'connecting' });
    try {
      const info = await connectWallet();
      setState({ status: 'connected', info });
    } catch (e) {
      const msg = (e as Error).message ?? 'Unknown error';
      setState({
        status: 'error',
        message: msg,
        recoveryHint: msg.toLowerCase().includes('network')
          ? 'Make sure your Lace wallet is set to Midnight Preview network.'
          : 'Try refreshing the page or reconnecting your wallet.',
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ status: 'disconnected' });
  }, []);

  const installUrl = INSTALL_URL;

  return { state, connect, disconnect, installUrl };
}
