export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center grid-bg overflow-hidden pt-14">
      {/* Single subtle accent glow — not 5 orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-32">
        <div className="max-w-4xl">
          {/* Tag */}
          <div className="fade-up inline-flex items-center gap-2 mb-8 text-[12px] font-medium text-white/40 border border-white/[0.08] rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            Live on Midnight Preprod Testnet
          </div>

          {/* Headline — big, tight, structured */}
          <h1 className="fade-up-1 text-[64px] md:text-[80px] lg:text-[96px] font-black leading-[0.95] tracking-tighter mb-8">
            <span className="block text-white">Anonymous</span>
            <span className="block text-white/20">on-chain</span>
            <span className="block text-white">voting.</span>
          </h1>

          <p className="fade-up-2 text-[17px] text-white/40 max-w-lg leading-relaxed mb-10">
            Cast your vote without revealing your identity.
            Zero-knowledge proofs guarantee integrity — not policy.
            Built on Midnight Network.
          </p>

          <div className="fade-up-3 flex flex-wrap gap-3">
            <a href="#vote"
              className="h-11 px-6 bg-white text-black text-[14px] font-semibold rounded-xl hover:bg-white/90 transition-all flex items-center">
              Cast a Vote →
            </a>
            <a href="#how"
              className="h-11 px-6 border border-white/[0.1] text-white/60 text-[14px] font-medium rounded-xl hover:text-white hover:border-white/20 transition-all flex items-center">
              How it works
            </a>
          </div>
        </div>

        {/* Metric strip */}
        <div className="mt-24 pt-8 border-t border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { n: '100%', label: 'Voter anonymity' },
            { n: 'ZK',   label: 'Proofs on Midnight' },
            { n: '0',    label: 'Identity leaks' },
            { n: '4',    label: 'Circuits compiled' },
          ].map(({ n, label }) => (
            <div key={label}>
              <div className="text-3xl font-black text-white tracking-tight">{n}</div>
              <div className="text-[13px] text-white/30 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
