import { useState } from 'react';
import type { TxStatus } from '../hooks/useBallot';

type Props = {
  onOpen: (proposal: string) => void;
  txStatus: TxStatus;
  error: string | null;
};

const MAX_LENGTH = 200;

const SUGGESTIONS = [
  'Should we allocate 20% of the treasury to community grants?',
  'Should Night City fund a public skate park?',
  'Do you support the proposed protocol upgrade v2.1?',
  'Should Night Ballot expand to multi-option ranked-choice voting?',
];

export function OpenBallotForm({ onOpen, txStatus, error }: Props) {
  const [proposal, setProposal] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmed = proposal.trim();
  const tooShort = trimmed.length < 10;
  const tooLong = trimmed.length > MAX_LENGTH;
  const invalid = tooShort || tooLong;
  const showValidation = touched && invalid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!invalid) onOpen(trimmed);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7">
      <h3 className="text-[18px] font-semibold mb-1">Open a ballot</h3>
      <p className="text-[13px] text-white/30 mb-6">
        Your secret key is never transmitted — only its hash commits you as organizer.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <textarea
            value={proposal}
            onChange={(e) => { setProposal(e.target.value); setTouched(true); }}
            placeholder="Write your proposal question…"
            rows={3}
            maxLength={MAX_LENGTH + 20}
            className={`w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-white/20 resize-none focus:outline-none transition-colors ${
              showValidation ? 'border-red-400/40 focus:border-red-400/60' : 'border-white/[0.08] focus:border-white/20'
            }`}
          />
          <div className="flex justify-between text-[11px] text-white/25">
            {showValidation ? (
              <span className="text-red-400/80">
                {tooShort ? 'Proposal must be at least 10 characters.' : `Maximum ${MAX_LENGTH} characters.`}
              </span>
            ) : <span />}
            <span className={trimmed.length > MAX_LENGTH ? 'text-red-400/80' : ''}>
              {trimmed.length}/{MAX_LENGTH}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] text-white/25 mb-1">Suggestions:</p>
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => { setProposal(s); setTouched(false); }}
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

        <button type="submit" disabled={txStatus === 'pending'}
          className="w-full h-11 rounded-xl bg-white text-black text-[14px] font-semibold hover:bg-white/90 disabled:opacity-30 transition-all flex items-center justify-center gap-2">
          {txStatus === 'pending' ? (
            <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full spin" /> Generating proof…</>
          ) : txStatus === 'success' ? '✓ Ballot opened' : 'Open ballot'}
        </button>
      </form>
    </div>
  );
}
