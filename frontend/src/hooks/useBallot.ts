import { useState, useCallback, useRef, useEffect } from 'react';
import { BallotAPI, type BallotState, type BallotMode } from '../midnight/ballot-api';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export type { BallotState };

const DEFAULT_ORGANIZER_KEY = new Uint8Array(32).fill(0x42);

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export function useBallot(connectedApi: ConnectedAPI | null) {
  const apiRef = useRef<BallotAPI>(new BallotAPI(DEFAULT_ORGANIZER_KEY));
  const [ballotState, setBallotState] = useState<BallotState>(
    () => apiRef.current.getSimulatedState(),
  );
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<BallotMode>('simulation');

  // When wallet connects/disconnects, switch between on-chain and simulation
  useEffect(() => {
    const api = apiRef.current;
    if (connectedApi) {
      api.connectWallet(connectedApi).then(() => {
        setMode(api.getMode());
        api.getState().then(setBallotState).catch(console.error);
      });
    } else {
      api.disconnectWallet();
      setMode('simulation');
      setBallotState(api.getSimulatedState());
    }
  }, [connectedApi]);

  const refresh = useCallback(async () => {
    const state = await apiRef.current.getState();
    setBallotState(state);
  }, []);

  const run = useCallback(async (action: () => Promise<void>) => {
    setTxStatus('pending');
    setError(null);
    try {
      await action();
      await refresh();
      setTxStatus('success');
      setTimeout(() => setTxStatus('idle'), 2000);
    } catch (e) {
      setError((e as Error).message);
      setTxStatus('error');
      setTimeout(() => setTxStatus('idle'), 3000);
    }
  }, [refresh]);

  const openBallot = useCallback((proposal: string) =>
    run(() => apiRef.current.openBallot(proposal)), [run]);

  const castVote = useCallback((vote: 'yes' | 'no') =>
    run(() => apiRef.current.castVote(vote)), [run]);

  const closeBallot = useCallback(() =>
    run(() => apiRef.current.closeBallot()), [run]);

  return { ballotState, txStatus, error, mode, openBallot, castVote, closeBallot };
}
