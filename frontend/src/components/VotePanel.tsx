import { useEffect, useState } from 'react';
import type { BallotState, TxStatus } from '../hooks/useBallot';
import { VoteReceipt } from './VoteReceipt';

type Props = {
  ballotState: BallotState;
  onVote: (v: 'yes' | 'no') => void;
  onClose: () => void;
  txStatus: TxStatus;
  error: string | null;
};

export function VotePanel({ ballotState, onVote, onClose, txStatus, error }: Props) {
  const [lastVote, setLastVote] = useState<'yes' | 'no' | null>(null);

  const total = Number(ballotState.yesVotes + ballotState.noVotes);
  const yesPct = total > 0 ? Math.round((Number(ballotState.yesVotes) / total) * 100) : 0;
  const noPct  = 100 - yesPct;

  // Show receipt when vote succeeds, then auto-dismiss
  const showReceipt = txStatus === 'success' && lastVote !== null;

  const handleVote = (v: 'yes' | 'no') => {
    setLastVote(v);
    onVote(v);
  };

  // Keyboard shortcuts: Y = yes, N = no
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (txStatus === 'pending') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'y' || e.key === 'Y') handleVote('yes');
      if (e.key === 'n' || e.key === 'N') handleVote('no');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [txStatus]);

  return (
    <>
      {showReceipt && lastVote && (
        <VoteReceipt vote={lastVote} onDismiss={() => setLastVote(null)} />
      )}

      <div className="space-y-4">
        {/* Proposal */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest">Ballot open</span>
          </div>
          <p className="text-[20px] font-semibold text-white leading-snug mb-7">
            {ballotState.proposal}
          </p>

          {/* Tally */}
          <div className="space-y-3">
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex">
              <div className="h-full bg-emerald-400 transition-all duration-700 rounded-full"
                style={{ width: `${yesPct}%` }} />
            </div>
            <div className="flex justify-between text-[12px] text-white/30">
              <span>Yes · {ballotState.yesVotes.toString()} votes ({yesPct}%)</span>
              <span>No · {ballotState.noVotes.toString()} votes ({noPct}%)</span>
            </div>
            <p className="text-[11px] text-white/20">
              {total} total · voter identities never revealed
            </p>
          </div>
        </div>

        {/* Vote buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleVote('yes')} disabled={txStatus === 'pending'}
            className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10 disabled:opacity-30 transition-all p-7 text-left group">
            <div className="text-2xl mb-3">👍</div>
            <div className="text-[15px] font-semibold text-emerald-300">Vote Yes</div>
            <div className="text-[11px] text-white/25 mt-1">Press Y · proof local</div>
          </button>

          <button onClick={() => handleVote('no')} disabled={txStatus === 'pending'}
            className="rounded-2xl border border-red-400/20 bg-red-400/5 hover:bg-red-400/10 disabled:opacity-30 transition-all p-7 text-left group">
            <div className="text-2xl mb-3">👎</div>
            <div className="text-[15px] font-semibold text-red-300">Vote No</div>
            <div className="text-[11px] text-white/25 mt-1">Press N · identity private</div>
          </button>
        </div>

        {/* Status */}
        {txStatus === 'pending' && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-4 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full spin shrink-0" />
            <div>
              <div className="text-[13px] font-medium">Generating zero-knowledge proof…</div>
              <div className="text-[12px] text-white/30">Your identity will never appear on-chain</div>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-5 py-4 text-[13px] text-red-300">
            {error}
          </div>
        )}

        <button onClick={onClose} disabled={txStatus === 'pending'}
          className="w-full h-10 text-[12px] font-medium text-white/25 border border-white/[0.06] rounded-xl hover:text-white/50 hover:border-white/10 disabled:opacity-30 transition-all">
          Close ballot (organizer only)
        </button>
      </div>
    </>
  );
}
