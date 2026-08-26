import { WalletBar } from './components/WalletBar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { PrivacySection } from './components/PrivacyBadge';
import { OpenBallotForm } from './components/OpenBallotForm';
import { VotePanel } from './components/VotePanel';
import { ClosedResult } from './components/ClosedResult';
import { NetworkBadge } from './components/NetworkBadge';
import { UserRegistry } from './components/UserRegistry';
import { ShareBallot } from './components/ShareBallot';
import { BallotRounds, useBallotHistory } from './components/BallotRounds';
import { useBallot } from './hooks/useBallot';
import { useWallet } from './hooks/useWallet';

const CONTRACT_ADDRESS = import.meta.env['VITE_CONTRACT_ADDRESS'] as string | undefined;

export default function App() {
  const { state: walletState, connect, disconnect } = useWallet();

  const connectedApi =
    walletState.status === 'connected' ? walletState.info.connectedApi : null;

  const { ballotState, txStatus, error, mode, openBallot, castVote, closeBallot } =
    useBallot(connectedApi);

  const { history, addRecord } = useBallotHistory();

  // Record ballot into history when it closes
  const handleClose = async () => {
    await closeBallot();
    if (ballotState.proposal) {
      addRecord({
        proposal: ballotState.proposal,
        yesVotes: Number(ballotState.yesVotes),
        noVotes: Number(ballotState.noVotes),
        closedAt: new Date().toLocaleDateString(),
      });
    }
  };

  const isOpen = ballotState.isOpen;
  const isClosed = !ballotState.isOpen && ballotState.proposal !== null;

  return (
    <div className="min-h-screen bg-black text-white">
      <WalletBar walletState={walletState} onConnect={connect} onDisconnect={disconnect} />
      <Hero />
      <HowItWorks />
      <PrivacySection />

      {/* Vote section */}
      <section id="vote" className="py-32 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-[12px] font-semibold text-white/30 uppercase tracking-widest mb-3">
              Live ballot
              {mode === 'onchain' && (
                <span className="ml-2 text-emerald-400">● on-chain</span>
              )}
              {mode === 'simulation' && (
                <span className="ml-2 text-yellow-500/60">◌ simulation</span>
              )}
            </p>
            <h2 className="text-[40px] md:text-[52px] font-black tracking-tight text-white leading-tight">
              Cast your vote.
            </h2>
            <p className="text-[15px] text-white/30 mt-3 max-w-md">
              Your identity is protected by zero-knowledge cryptography — not a privacy policy.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">
            {/* Main ballot panel */}
            <div className="max-w-xl">
              {!isOpen && !isClosed && (
                <OpenBallotForm onOpen={openBallot} txStatus={txStatus} error={error} />
              )}
              {isOpen && (
                <VotePanel
                  ballotState={ballotState}
                  onVote={castVote}
                  onClose={handleClose}
                  txStatus={txStatus}
                  error={error}
                />
              )}
              {isClosed && (
                <ClosedResult ballotState={ballotState} contractAddress={CONTRACT_ADDRESS} />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <NetworkBadge contractAddress={CONTRACT_ADDRESS} mode={mode} />
              <UserRegistry count={50} />
              {isClosed && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Share</p>
                  <ShareBallot proposal={ballotState.proposal} />
                </div>
              )}
              <BallotRounds history={history} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🗳️</span>
            <span className="font-semibold text-[14px]">Night Ballot</span>
          </div>
          <p className="text-[12px] text-white/20">
            Built on Midnight Network · Zero-Knowledge Proofs · Open Source
          </p>
          <a href="https://github.com/ankit79600/Night-Ballot" target="_blank" rel="noreferrer"
            className="text-[12px] text-white/25 hover:text-white/60 transition-colors">
            View on GitHub →
          </a>
        </div>
      </footer>
    </div>
  );
}
