/**
 * Infinite-loop SVG animations: tailor sewing + client changing clothes.
 * Pure SVG + CSS keyframes — lightweight, works offline, low-bandwidth friendly.
 */
const TailorScene = () => {
  return (
    <div className="relative w-full">
      <style>{`
        @keyframes needle-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(14px); }
        }
        @keyframes wheel-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fabric-feed {
          0% { transform: translateX(0); }
          100% { transform: translateX(-24px); }
        }
        @keyframes hand-stitch {
          0%, 100% { transform: translate(0, 0) rotate(-4deg); }
          50% { transform: translate(3px, 4px) rotate(2deg); }
        }
        @keyframes head-nod {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes thread-pulse {
          0%, 100% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -20; }
        }
        @keyframes outfit-cycle {
          0%, 28% { opacity: 1; transform: translateY(0) scale(1); }
          33%, 61% { opacity: 0; transform: translateY(-8px) scale(0.96); }
          66%, 100% { opacity: 0; }
        }
        @keyframes outfit-cycle-2 {
          0%, 28% { opacity: 0; }
          33%, 61% { opacity: 1; transform: translateY(0) scale(1); }
          66%, 94% { opacity: 0; transform: translateY(-8px) scale(0.96); }
          100% { opacity: 0; }
        }
        @keyframes outfit-cycle-3 {
          0%, 61% { opacity: 0; }
          66%, 94% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-8px) scale(0.96); }
        }
        @keyframes arm-wave {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes mirror-shine {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.55; }
        }
        @keyframes float-thread {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          20% { opacity: 0.6; }
          100% { transform: translate(40px, -60px) rotate(180deg); opacity: 0; }
        }
        .anim-needle { animation: needle-bob 0.55s ease-in-out infinite; transform-origin: center top; }
        .anim-wheel { animation: wheel-spin 1.4s linear infinite; transform-origin: center; transform-box: fill-box; }
        .anim-fabric { animation: fabric-feed 1.1s linear infinite; }
        .anim-hand-l { animation: hand-stitch 0.55s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .anim-hand-r { animation: hand-stitch 0.55s ease-in-out infinite reverse; transform-origin: center; transform-box: fill-box; }
        .anim-head { animation: head-nod 2.4s ease-in-out infinite; transform-origin: center bottom; transform-box: fill-box; }
        .anim-thread { stroke-dasharray: 4 6; animation: thread-pulse 0.8s linear infinite; }
        .anim-outfit-1 { animation: outfit-cycle 6s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .anim-outfit-2 { animation: outfit-cycle-2 6s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .anim-outfit-3 { animation: outfit-cycle-3 6s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .anim-arm { animation: arm-wave 2.2s ease-in-out infinite; transform-origin: top center; transform-box: fill-box; }
        .anim-mirror { animation: mirror-shine 3s ease-in-out infinite; }
        .anim-float-1 { animation: float-thread 4s ease-out infinite; }
        .anim-float-2 { animation: float-thread 5s ease-out infinite 1.5s; }
        .anim-float-3 { animation: float-thread 4.5s ease-out infinite 2.8s; }
        @media (prefers-reduced-motion: reduce) {
          .anim-needle, .anim-wheel, .anim-fabric, .anim-hand-l, .anim-hand-r,
          .anim-head, .anim-thread, .anim-outfit-1, .anim-outfit-2, .anim-outfit-3,
          .anim-arm, .anim-mirror, .anim-float-1, .anim-float-2, .anim-float-3 {
            animation: none;
          }
        }
      `}</style>

      <div className="grid md:grid-cols-2 gap-6 items-center">
        {/* Tailor sewing scene */}
        <div className="relative bg-card rounded-xl border border-border p-4 overflow-hidden shadow-warm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            In the workshop
          </p>
          <svg viewBox="0 0 320 220" className="w-full h-auto" aria-label="Tailor working at a sewing machine">
            {/* Background shelf */}
            <rect x="0" y="160" width="320" height="60" fill="hsl(var(--muted))" />
            <rect x="0" y="158" width="320" height="3" fill="hsl(var(--border))" />

            {/* Floating thread bits */}
            <g className="anim-float-1"><circle cx="60" cy="180" r="2" fill="hsl(var(--primary))" /></g>
            <g className="anim-float-2"><circle cx="240" cy="190" r="2" fill="hsl(var(--gold, var(--primary)))" /></g>
            <g className="anim-float-3"><circle cx="150" cy="200" r="1.5" fill="hsl(var(--primary))" /></g>

            {/* Tailor body */}
            <g>
              {/* head */}
              <g className="anim-head">
                <circle cx="90" cy="70" r="18" fill="hsl(28 45% 55%)" />
                <path d="M72 64 Q90 48 108 64 Q108 56 90 50 Q72 56 72 64Z" fill="hsl(20 25% 20%)" />
                <circle cx="84" cy="70" r="1.5" fill="hsl(20 25% 15%)" />
                <circle cx="96" cy="70" r="1.5" fill="hsl(20 25% 15%)" />
                <path d="M84 78 Q90 82 96 78" stroke="hsl(20 25% 15%)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              </g>
              {/* torso */}
              <path d="M70 88 L110 88 L118 150 L62 150 Z" fill="hsl(var(--primary))" />
              {/* left arm (toward fabric) */}
              <g className="anim-hand-l">
                <path d="M72 100 L100 130 L108 138" stroke="hsl(28 45% 55%)" strokeWidth="9" strokeLinecap="round" fill="none" />
              </g>
              {/* right arm */}
              <g className="anim-hand-r">
                <path d="M108 100 L130 128 L142 134" stroke="hsl(28 45% 55%)" strokeWidth="9" strokeLinecap="round" fill="none" />
              </g>
            </g>

            {/* Sewing machine base */}
            <rect x="130" y="125" width="140" height="16" rx="2" fill="hsl(var(--foreground))" />
            <rect x="135" y="120" width="130" height="6" fill="hsl(var(--foreground) / 0.8)" />

            {/* Machine arm */}
            <path d="M140 120 L140 80 L235 80 L235 120 Z" fill="hsl(var(--foreground))" />
            <rect x="225" y="80" width="14" height="50" fill="hsl(var(--foreground))" />

            {/* Wheel */}
            <g>
              <circle cx="150" cy="100" r="10" fill="hsl(var(--gold, var(--primary)))" />
              <g className="anim-wheel">
                <circle cx="150" cy="100" r="10" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1" />
                <line x1="150" y1="92" x2="150" y2="108" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
                <line x1="142" y1="100" x2="158" y2="100" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
              </g>
            </g>

            {/* Needle holder + needle */}
            <rect x="228" y="108" width="8" height="14" fill="hsl(var(--muted-foreground))" />
            <g className="anim-needle">
              <line x1="232" y1="118" x2="232" y2="138" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
              <circle cx="232" cy="138" r="1.5" fill="hsl(var(--foreground))" />
            </g>

            {/* Thread spool */}
            <rect x="200" y="68" width="6" height="14" fill="hsl(var(--primary))" />
            <line className="anim-thread" x1="203" y1="82" x2="232" y2="118"
              stroke="hsl(var(--primary))" strokeWidth="1.2" />

            {/* Fabric being fed */}
            <g style={{ overflow: 'hidden' }}>
              <rect x="120" y="138" width="140" height="14" fill="hsl(var(--accent, var(--primary) / 0.3))" />
              <g className="anim-fabric">
                <path d="M120 142 L260 142 M120 146 L260 146 M120 150 L260 150"
                  stroke="hsl(var(--foreground) / 0.25)" strokeWidth="0.8" />
                <path d="M132 140 L132 152 M156 140 L156 152 M180 140 L180 152 M204 140 L204 152 M228 140 L228 152 M252 140 L252 152"
                  stroke="hsl(var(--foreground) / 0.15)" strokeWidth="0.6" />
              </g>
            </g>
          </svg>
          <p className="text-center text-xs text-muted-foreground mt-2 italic">
            Every stitch, crafted by hand
          </p>
        </div>

        {/* Client trying on clothes scene */}
        <div className="relative bg-card rounded-xl border border-border p-4 overflow-hidden shadow-warm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            The fitting room
          </p>
          <svg viewBox="0 0 320 220" className="w-full h-auto" aria-label="Client trying on different outfits">
            {/* Floor */}
            <rect x="0" y="195" width="320" height="25" fill="hsl(var(--muted))" />
            {/* Mirror */}
            <rect x="20" y="30" width="70" height="160" rx="4" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
            <rect className="anim-mirror" x="24" y="34" width="62" height="152" rx="2" fill="hsl(var(--primary) / 0.4)" />

            {/* Curtain rod */}
            <rect x="220" y="20" width="90" height="3" fill="hsl(var(--foreground))" />
            <path d="M225 23 L225 60 L240 50 L255 65 L270 45 L285 60 L300 50 L300 23 Z"
              fill="hsl(var(--primary) / 0.3)" />

            {/* Client body (legs + torso skeleton) */}
            <g>
              {/* head */}
              <circle cx="180" cy="60" r="15" fill="hsl(28 45% 60%)" />
              <path d="M165 56 Q180 42 195 56 L195 50 Q180 40 165 50 Z" fill="hsl(20 30% 25%)" />
              {/* neck */}
              <rect x="176" y="73" width="8" height="8" fill="hsl(28 45% 60%)" />
              {/* legs */}
              <rect x="170" y="155" width="8" height="40" fill="hsl(28 45% 55%)" />
              <rect x="182" y="155" width="8" height="40" fill="hsl(28 45% 55%)" />
              <ellipse cx="174" cy="198" rx="7" ry="3" fill="hsl(20 25% 20%)" />
              <ellipse cx="186" cy="198" rx="7" ry="3" fill="hsl(20 25% 20%)" />

              {/* OUTFIT 1: chitenge dress */}
              <g className="anim-outfit-1">
                <path d="M160 80 L200 80 L210 160 L150 160 Z" fill="hsl(15 75% 50%)" />
                <path d="M150 160 L210 160 L210 165 L150 165 Z" fill="hsl(45 80% 55%)" />
                <circle cx="170" cy="100" r="3" fill="hsl(45 80% 55%)" />
                <circle cx="190" cy="115" r="3" fill="hsl(45 80% 55%)" />
                <circle cx="175" cy="130" r="3" fill="hsl(45 80% 55%)" />
                <circle cx="195" cy="145" r="3" fill="hsl(45 80% 55%)" />
                {/* arms */}
                <g className="anim-arm">
                  <rect x="155" y="82" width="8" height="38" rx="3" fill="hsl(15 75% 50%)" />
                </g>
                <rect x="197" y="82" width="8" height="38" rx="3" fill="hsl(15 75% 50%)" />
              </g>

              {/* OUTFIT 2: suit */}
              <g className="anim-outfit-2">
                <path d="M162 80 L198 80 L205 160 L155 160 Z" fill="hsl(220 25% 20%)" />
                <path d="M180 80 L180 160" stroke="hsl(220 15% 35%)" strokeWidth="1" />
                <path d="M170 82 L180 95 L190 82 Z" fill="hsl(0 0% 95%)" />
                <circle cx="180" cy="110" r="1.5" fill="hsl(45 80% 55%)" />
                <circle cx="180" cy="125" r="1.5" fill="hsl(45 80% 55%)" />
                <circle cx="180" cy="140" r="1.5" fill="hsl(45 80% 55%)" />
                <rect x="156" y="82" width="8" height="55" rx="3" fill="hsl(220 25% 20%)" />
                <g className="anim-arm">
                  <rect x="196" y="82" width="8" height="55" rx="3" fill="hsl(220 25% 20%)" />
                </g>
              </g>

              {/* OUTFIT 3: wedding gown */}
              <g className="anim-outfit-3">
                <path d="M165 80 L195 80 L220 195 L140 195 Z" fill="hsl(0 0% 98%)" />
                <path d="M170 82 Q180 90 190 82 L190 100 Q180 108 170 100 Z" fill="hsl(45 60% 90%)" />
                <circle cx="180" cy="115" r="2" fill="hsl(45 80% 70%)" />
                <circle cx="172" cy="135" r="1.5" fill="hsl(45 80% 70%)" />
                <circle cx="188" cy="140" r="1.5" fill="hsl(45 80% 70%)" />
                <rect x="156" y="82" width="8" height="40" rx="3" fill="hsl(0 0% 98%)" />
                <g className="anim-arm">
                  <rect x="196" y="82" width="8" height="40" rx="3" fill="hsl(0 0% 98%)" />
                </g>
              </g>
            </g>

            {/* Hangers nearby */}
            <g opacity="0.7">
              <line x1="270" y1="100" x2="270" y2="110" stroke="hsl(var(--foreground))" strokeWidth="1" />
              <path d="M255 110 Q270 118 285 110" stroke="hsl(var(--foreground))" strokeWidth="1" fill="none" />
              <rect x="255" y="110" width="30" height="40" rx="2" fill="hsl(var(--primary) / 0.5)" />
            </g>
          </svg>
          <p className="text-center text-xs text-muted-foreground mt-2 italic">
            From chitenge to couture — perfectly fitted
          </p>
        </div>
      </div>
    </div>
  );
};

export default TailorScene;
