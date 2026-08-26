type Props = {
  vote: 'yes' | 'no';
  onDismiss: () => void;
};

export function VoteReceipt({ vote, onDismiss }: Props) {
  const isYes = vote === 'yes';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-8 text-center">
        <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl ${
          isYes ? 'bg-emerald-400/10 border border-emerald-400/20' : 'bg-red-400/10 border border-red-400/20'
        }`}>
          {isYes ? '👍' : '👎'}
        </div>

        <h3 className="text-[22px] font-black text-white mb-2">Vote Recorded</h3>
        <p className={`text-[13px] font-semibold mb-4 ${isYes ? 'text-emerald-400' : 'text-red-400'}`}>
          You voted {isYes ? 'YES' : 'NO'}
        </p>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-[12px] text-white/50">
            <span className="text-emerald-400">✓</span>
            <span>ZK proof generated locally on your device</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-white/50">
            <span className="text-emerald-400">✓</span>
            <span>Identity never transmitted or stored</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-white/50">
            <span className="text-emerald-400">✓</span>
            <span>Tally verified on Midnight Preview</span>
          </div>
        </div>

        <button onClick={onDismiss}
          className="w-full h-10 bg-white text-black text-[13px] font-semibold rounded-xl hover:bg-white/90 transition-all">
          Done
        </button>
      </div>
    </div>
  );
}
