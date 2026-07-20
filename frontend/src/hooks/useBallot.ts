import { useState, useCallback, useRef } from 'react';
import { BallotAPI, type BallotState } from '../midnight/ballot-api';

const DEFAULT_ORGANIZER_KEY = new Uint8Array(32).fill(0x42);

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export function useBallot() {
  const apiRef = useRef<BallotAPI>(new BallotAPI(DEFAULT_ORGANIZER_KEY));
  const [ballotState, setBallotState] = useState<BallotState>(
    () => apiRef.current.getState(),
  );
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setBallotState(apiRef.current.getState());
  }, []);

  const run = useCallback(async (action: () => Promise<void>) => {
    setTxStatus('pending');
    setError(null);
    try {
      await action();
      refresh();
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

  return { ballotState, txStatus, error, openBallot, castVote, closeBallot };
}
