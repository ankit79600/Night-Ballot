import { WalletBar } from './components/WalletBar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { PrivacySection } from './components/PrivacyBadge';
import { OpenBallotForm } from './components/OpenBallotForm';
import { VotePanel } from './components/VotePanel';
import { ClosedResult } from './components/ClosedResult';
import { useBallot } from './hooks/useBallot';
import { useWallet } from './hooks/useWallet';

export default function App() {
  const { state: walletState, connect, disconnect } = useWallet();

  const connectedApi =
    walletState.status === 'connected' ? walletState.info.connectedApi : null;

  const { ballotState, txStatus, error, mode, openBallot, castVote, closeBallot } =
    useBallot(connectedApi);

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

          <div className="max-w-xl">
            {!ballotState.isOpen && ballotState.proposal === null && (
              <OpenBallotForm onOpen={openBallot} txStatus={txStatus} error={error} />
            )}
            {ballotState.isOpen && (
              <VotePanel ballotState={ballotState} onVote={castVote} onClose={closeBallot}
                txStatus={txStatus} error={error} />
            )}
            {!ballotState.isOpen && ballotState.proposal !== null && (
              <ClosedResult ballotState={ballotState} />
            )}
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
