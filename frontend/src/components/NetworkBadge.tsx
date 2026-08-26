type Props = {
  contractAddress?: string;
  mode: 'onchain' | 'simulation';
};

export function NetworkBadge({ contractAddress, mode }: Props) {
  const handleCopy = () => {
    if (contractAddress) {
      navigator.clipboard.writeText(contractAddress).catch(() => {});
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">Network</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          mode === 'onchain'
            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
            : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
        }`}>
          {mode === 'onchain' ? '● on-chain' : '◌ simulation'}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-white/30">Chain</span>
          <span className="text-white/60">Midnight Preview</span>
        </div>
        {contractAddress && (
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-white/30">Contract</span>
            <button onClick={handleCopy}
              className="text-white/40 hover:text-white/70 transition-colors font-mono text-[11px] truncate max-w-[140px]"
              title="Click to copy">
              {contractAddress.slice(0, 8)}…{contractAddress.slice(-6)} ⧉
            </button>
          </div>
        )}
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-white/30">Privacy</span>
          <span className="text-white/60">ZK proofs · identity hidden</span>
        </div>
      </div>
    </div>
  );
}
