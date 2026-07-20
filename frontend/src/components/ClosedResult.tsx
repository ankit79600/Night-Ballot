import type { BallotState } from '../hooks/useBallot';

type Props = { ballotState: BallotState };

export function ClosedResult({ ballotState }: Props) {
  const total = Number(ballotState.yesVotes + ballotState.noVotes);
  const yesPct = total > 0 ? Math.round((Number(ballotState.yesVotes) / total) * 100) : 0;
  const winner =
    ballotState.yesVotes > ballotState.noVotes ? 'Yes wins'
    : ballotState.noVotes > ballotState.yesVotes ? 'No wins'
    : 'It\'s a tie';

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
      <div className="text-[11px] font-semibold text-white/25 uppercase tracking-widest mb-6">
        Final result · Ballot closed
      </div>

      <div className="text-[48px] font-black tracking-tight text-white mb-1">{winner}</div>
      <p className="text-[15px] text-white/40 mb-8">{ballotState.proposal}</p>

      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex mb-4">
        <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${yesPct}%` }} />
        <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${100 - yesPct}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="text-[28px] font-black text-emerald-400">{ballotState.yesVotes.toString()}</div>
          <div className="text-[12px] text-white/30 mt-1">Yes · {yesPct}%</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="text-[28px] font-black text-red-400">{ballotState.noVotes.toString()}</div>
          <div className="text-[12px] text-white/30 mt-1">No · {100 - yesPct}%</div>
        </div>
      </div>

      <p className="text-[12px] text-white/20">
        {total} votes cast · no voter was ever identified · verified on Midnight Preprod
      </p>
    </div>
  );
}
