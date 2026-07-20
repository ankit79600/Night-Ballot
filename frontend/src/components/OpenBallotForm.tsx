import { useState } from 'react';
import type { TxStatus } from '../hooks/useBallot';

type Props = {
  onOpen: (proposal: string) => void;
  txStatus: TxStatus;
  error: string | null;
};

const SUGGESTIONS = [
  'Should we allocate 20% of the treasury to community grants?',
  'Should Night City fund a public skate park?',
  'Do you support the proposed protocol upgrade v2.1?',
];

export function OpenBallotForm({ onOpen, txStatus, error }: Props) {
  const [proposal, setProposal] = useState('');

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7">
      <h3 className="text-[18px] font-semibold mb-1">Open a ballot</h3>
      <p className="text-[13px] text-white/30 mb-6">
        Your secret key is never transmitted — only its hash.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); if (proposal.trim()) onOpen(proposal.trim()); }}
        className="space-y-4">
        <textarea
          value={proposal}
          onChange={(e) => setProposal(e.target.value)}
          placeholder="Write your proposal question…"
          rows={3}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-white/20 transition-colors"
        />

        <div className="space-y-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => setProposal(s)}
              className="w-full text-left text-[12px] text-white/30 hover:text-white/60 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all truncate">
              → {s}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-[13px] text-red-400 bg-red-400/5 border border-red-400/10 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button type="submit" disabled={!proposal.trim() || txStatus === 'pending'}
          className="w-full h-11 rounded-xl bg-white text-black text-[14px] font-semibold hover:bg-white/90 disabled:opacity-30 transition-all flex items-center justify-center gap-2">
          {txStatus === 'pending' ? (
            <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full spin" /> Generating proof…</>
          ) : txStatus === 'success' ? '✓ Ballot opened' : 'Open ballot'}
        </button>
      </form>
    </div>
  );
}
