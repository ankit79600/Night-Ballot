import { useState, useEffect } from 'react';

type BallotRecord = {
  proposal: string;
  yesVotes: number;
  noVotes: number;
  closedAt: string;
};

const STORAGE_KEY = 'nightballot:history';

export function useBallotHistory() {
  const [history, setHistory] = useState<BallotRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const addRecord = (record: BallotRecord) => {
    setHistory(prev => {
      const next = [record, ...prev].slice(0, 10);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return { history, addRecord };
}

type Props = {
  history: BallotRecord[];
};

export function BallotRounds({ history }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold text-white/25 uppercase tracking-widest">Past ballots</p>
      <div className="space-y-2">
        {history.map((r, i) => {
          const total = r.yesVotes + r.noVotes;
          const yesPct = total > 0 ? Math.round((r.yesVotes / total) * 100) : 0;
          const winner = r.yesVotes > r.noVotes ? 'Yes' : r.noVotes > r.yesVotes ? 'No' : 'Tie';
          return (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-[13px] text-white/60 leading-snug truncate">{r.proposal}</p>
                <span className={`text-[11px] font-semibold shrink-0 ${
                  winner === 'Yes' ? 'text-emerald-400' : winner === 'No' ? 'text-red-400' : 'text-white/40'
                }`}>{winner} won</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden flex mb-1.5">
                <div className="h-full bg-emerald-400/60 rounded-full" style={{ width: `${yesPct}%` }} />
                <div className="h-full bg-red-400/60 rounded-full" style={{ width: `${100 - yesPct}%` }} />
              </div>
              <p className="text-[11px] text-white/20">{total} votes · {r.closedAt}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
