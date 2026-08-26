import type { BallotState } from '../hooks/useBallot';

type Props = {
  ballotState: BallotState;
  contractAddress?: string;
};

export function ExportResults({ ballotState, contractAddress }: Props) {
  const handleExport = () => {
    const total = Number(ballotState.yesVotes + ballotState.noVotes);
    const yesPct = total > 0 ? Math.round((Number(ballotState.yesVotes) / total) * 100) : 0;

    const result = {
      ballot: {
        proposal: ballotState.proposal,
        status: ballotState.isOpen ? 'open' : 'closed',
        tally: {
          yes: ballotState.yesVotes.toString(),
          no: ballotState.noVotes.toString(),
          total: total.toString(),
          yesPct,
          noPct: 100 - yesPct,
        },
        winner: ballotState.yesVotes > ballotState.noVotes
          ? 'yes'
          : ballotState.noVotes > ballotState.yesVotes
            ? 'no'
            : 'tie',
      },
      network: {
        chain: 'Midnight Preview',
        contractAddress: contractAddress ?? 'simulation',
        privacyModel: 'ZK proofs — voter identities never revealed',
      },
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `night-ballot-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleExport}
      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-all text-[12px] text-white/50 hover:text-white/80">
      ↓ Export JSON
    </button>
  );
}
