const publicRows = [
  ['Proposal text',   'The question — readable by anyone'],
  ['Vote tally',      'Yes / No counts updated live'],
  ['Ballot status',   'Open or closed'],
  ['Organizer hash',  'SHA-256 of key via disclose() — not the key'],
];

const privateRows = [
  ['Voter identity',  'Who voted — never stored, never seen'],
  ['Organizer key',   'Used to prove ownership; stays local'],
  ['Private state',   'Consumed by the ZK circuit; never transmitted'],
];

export function PrivacySection() {
  return (
    <section id="privacy" className="py-32 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <p className="text-[12px] font-semibold text-white/30 uppercase tracking-widest mb-3">Privacy model</p>
          <h2 className="text-[40px] md:text-[52px] font-black tracking-tight text-white leading-tight max-w-lg">
            Public by choice. <br />Private by default.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Public */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[13px] font-semibold text-emerald-400">Visible on-chain</span>
            </div>
            <div className="space-y-4">
              {publicRows.map(([title, desc]) => (
                <div key={title} className="flex gap-4">
                  <span className="text-emerald-400/60 text-[12px] mt-0.5 shrink-0">✓</span>
                  <div>
                    <div className="text-[14px] font-medium text-white">{title}</div>
                    <div className="text-[13px] text-white/30">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Private */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 rounded-full bg-violet-400/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-violet-400" />
              </div>
              <span className="text-[13px] font-semibold text-violet-400">Proven, never shown</span>
            </div>
            <div className="space-y-4">
              {privateRows.map(([title, desc]) => (
                <div key={title} className="flex gap-4">
                  <span className="text-violet-400/60 text-[12px] mt-0.5 shrink-0">⚡</span>
                  <div>
                    <div className="text-[14px] font-medium text-white">{title}</div>
                    <div className="text-[13px] text-white/30">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Code block */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 overflow-x-auto">
          <p className="text-[11px] text-white/20 uppercase tracking-widest font-semibold mb-4">ballot.compact</p>
          <pre className="text-[13px] leading-7 font-mono text-white/60">{`<span class="text-white/25">// Only the hash goes on-chain — key stays private</span>
organizer = <span class="text-violet-400">disclose</span>(ballotKey(<span class="text-sky-400">organizerKey()</span>));
proposal  = <span class="text-violet-400">disclose</span>(some(question));
isOpen    = <span class="text-violet-400">disclose</span>(1 as Field);

<span class="text-white/25">// Counters need no disclose — pure state mutation</span>
yesVotes.<span class="text-emerald-400">increment</span>();`}</pre>
        </div>
      </div>
    </section>
  );
}
