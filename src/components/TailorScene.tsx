import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Scissors, Shirt, Palette, Sparkles, Pencil, Pin, Wand2 } from 'lucide-react';

/**
 * "A Day at Salem Tailors" — synchronized two-side storytelling loop.
 * Left: a richer, multi-step process animation (tools moving, fabric being
 *   worked on, stitches forming) that visually narrates the work.
 * Right: the finished product reveal.
 * Both sides change in sync, cycling through each service category.
 */

type Pattern = 'chitenge' | 'bag' | 'formal' | 'alteration' | 'custom' | 'measure';

type Stage = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  processLabel: string;
  steps: string[]; // micro-steps shown beneath the label
  processGradient: string;
  resultGradient: string;
  pattern: Pattern;
};

const stages: Stage[] = [
  {
    id: 'chitenge',
    emoji: '👗',
    title: 'Chitenge Wear',
    desc: 'Beautiful African prints for men & women',
    processLabel: 'Crafting chitenge wear',
    steps: ['Selecting fabric', 'Marking the cut', 'Cutting the chitenge', 'Stitching the panels'],
    processGradient: 'from-[hsl(var(--terracotta))] to-[hsl(var(--gold))]',
    resultGradient: 'from-[hsl(var(--gold))] via-[hsl(var(--terracotta))] to-[hsl(var(--earth))]',
    pattern: 'chitenge',
  },
  {
    id: 'bags',
    emoji: '🎒',
    title: 'Bags',
    desc: 'Backpacks, laptop bags, clutch purses, school bags & more',
    processLabel: 'Building the bag',
    steps: ['Sketching the pattern', 'Cutting the panels', 'Setting the lining', 'Attaching straps'],
    processGradient: 'from-[hsl(var(--earth))] to-[hsl(var(--sage))]',
    resultGradient: 'from-[hsl(var(--earth))] via-[hsl(var(--earth-light))] to-[hsl(var(--sage))]',
    pattern: 'bag',
  },
  {
    id: 'formal',
    emoji: '👔',
    title: 'Formal & Casual',
    desc: 'Professional and everyday wear',
    processLabel: 'Tailoring formal wear',
    steps: ['Measuring the client', 'Marking the pattern', 'Sewing the seams', 'Pressing the finish'],
    processGradient: 'from-[hsl(var(--earth))] to-[hsl(var(--foreground))]',
    resultGradient: 'from-[hsl(var(--foreground))] via-[hsl(var(--earth))] to-[hsl(var(--earth-light))]',
    pattern: 'formal',
  },
  {
    id: 'alterations',
    emoji: '✂️',
    title: 'Alterations',
    desc: 'Perfect fit adjustments',
    processLabel: 'Adjusting for the perfect fit',
    steps: ['Pinning the garment', 'Marking the changes', 'Re-stitching seams', 'Final fitting'],
    processGradient: 'from-[hsl(var(--sage))] to-[hsl(var(--accent))]',
    resultGradient: 'from-[hsl(var(--sage))] via-[hsl(var(--accent))] to-[hsl(var(--gold-light))]',
    pattern: 'alteration',
  },
  {
    id: 'custom',
    emoji: '🎨',
    title: 'Custom Designs',
    desc: 'Bring your vision to life',
    processLabel: 'Bringing the design to life',
    steps: ['Sketching the vision', 'Choosing materials', 'Drafting the pattern', 'Final stitching'],
    processGradient: 'from-[hsl(var(--gold))] to-[hsl(var(--terracotta))]',
    resultGradient: 'from-[hsl(var(--gold-light))] via-[hsl(var(--gold))] to-[hsl(var(--terracotta))]',
    pattern: 'custom',
  },
  {
    id: 'measurements',
    emoji: '📐',
    title: 'Measurements',
    desc: 'Professional body measurements',
    processLabel: 'Taking precise measurements',
    steps: ['Stretching the tape', 'Recording numbers', 'Cross-checking', 'Saving the profile'],
    processGradient: 'from-[hsl(var(--accent))] to-[hsl(var(--earth))]',
    resultGradient: 'from-[hsl(var(--cream))] via-[hsl(var(--gold-light))] to-[hsl(var(--gold))]',
    pattern: 'measure',
  },
];

/* ── Decorative SVG patterns for the result side ─────────────────────────── */
const PatternArt = ({ pattern }: { pattern: Pattern }) => {
  const stroke = 'hsl(var(--primary-foreground))';
  switch (pattern) {
    case 'chitenge':
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-52 md:h-52" aria-hidden>
          <defs>
            <pattern id="chit" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="7" cy="7" r="2" fill={stroke} opacity="0.35" />
              <path d="M0 7 L14 7 M7 0 L7 14" stroke={stroke} strokeWidth="0.5" opacity="0.25" />
            </pattern>
          </defs>
          <path d="M80 30 L120 30 L130 70 L150 170 L50 170 L70 70 Z" fill="url(#chit)" stroke={stroke} strokeWidth="2" />
          <circle cx="100" cy="40" r="8" fill="none" stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case 'bag':
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-52 md:h-52" aria-hidden>
          <path d="M70 60 Q70 40 100 40 Q130 40 130 60" fill="none" stroke={stroke} strokeWidth="3" />
          <rect x="50" y="60" width="100" height="110" rx="10" fill="none" stroke={stroke} strokeWidth="2.5" />
          <line x1="50" y1="100" x2="150" y2="100" stroke={stroke} strokeWidth="1.5" opacity="0.6" />
          <circle cx="100" cy="130" r="6" fill={stroke} opacity="0.6" />
        </svg>
      );
    case 'formal':
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-52 md:h-52" aria-hidden>
          <path d="M70 50 L100 70 L130 50 L160 70 L150 180 L50 180 L40 70 Z" fill="none" stroke={stroke} strokeWidth="2.5" />
          <path d="M100 70 L90 100 L100 130 L110 100 Z" fill={stroke} opacity="0.6" />
          <line x1="70" y1="50" x2="100" y2="90" stroke={stroke} strokeWidth="2" />
          <line x1="130" y1="50" x2="100" y2="90" stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case 'alteration':
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-52 md:h-52" aria-hidden>
          <path d="M60 50 L140 50 L150 170 L50 170 Z" fill="none" stroke={stroke} strokeWidth="2.5" />
          <path d="M60 50 L60 30 M140 50 L140 30" stroke={stroke} strokeWidth="2" strokeDasharray="4 3" />
          <path d="M70 110 L130 110" stroke={stroke} strokeWidth="2" strokeDasharray="3 3" opacity="0.7" />
          <circle cx="70" cy="110" r="3" fill={stroke} />
          <circle cx="130" cy="110" r="3" fill={stroke} />
        </svg>
      );
    case 'custom':
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-52 md:h-52" aria-hidden>
          <path d="M100 30 Q100 50 80 60 L60 80 L140 80 L120 60 Q100 50 100 30" fill="none" stroke={stroke} strokeWidth="2.5" />
          <path d="M60 80 Q40 130 50 180 L150 180 Q160 130 140 80" fill="none" stroke={stroke} strokeWidth="2.5" />
          <path d="M80 110 Q100 130 120 110" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.7" />
          <circle cx="100" cy="150" r="4" fill={stroke} opacity="0.7" />
        </svg>
      );
    case 'measure':
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-52 md:h-52" aria-hidden>
          <rect x="30" y="90" width="140" height="20" rx="3" fill="none" stroke={stroke} strokeWidth="2.5" />
          {Array.from({ length: 13 }).map((_, i) => (
            <line
              key={i}
              x1={40 + i * 10}
              y1="90"
              x2={40 + i * 10}
              y2={i % 2 === 0 ? 102 : 98}
              stroke={stroke}
              strokeWidth="1.5"
            />
          ))}
          <circle cx="100" cy="100" r="4" fill={stroke} />
        </svg>
      );
  }
};

/* ── Process scenes (left side) — one per pattern, each tells a story ─── */

const FG = 'hsl(var(--primary-foreground))';

const Workbench = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
    {/* Workbench surface */}
    <rect x="0" y="220" width="400" height="80" fill={FG} opacity="0.08" />
    <line x1="0" y1="220" x2="400" y2="220" stroke={FG} strokeWidth="1" opacity="0.3" />
    {children}
  </svg>
);

const ChitengeProcess = () => (
  <Workbench>
    <defs>
      <pattern id="chit-bg" width="18" height="18" patternUnits="userSpaceOnUse">
        <circle cx="9" cy="9" r="2.5" fill={FG} opacity="0.45" />
        <path d="M0 9 L18 9 M9 0 L9 18" stroke={FG} strokeWidth="0.6" opacity="0.3" />
      </pattern>
    </defs>
    {/* Fabric on the bench */}
    <motion.path
      d="M60 230 Q200 200 340 230 L340 270 Q200 250 60 270 Z"
      fill="url(#chit-bg)"
      stroke={FG}
      strokeWidth="1.5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    />
    {/* Cutting line being drawn */}
    <motion.path
      d="M80 245 Q200 220 320 245"
      stroke={FG}
      strokeWidth="2"
      strokeDasharray="5 4"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: [0, 1, 1, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 0.85, 1] }}
    />
    {/* Animated scissors travelling along the cut */}
    <motion.g
      initial={{ x: 0, y: 0 }}
      animate={{ x: [0, 240, 240, 0], y: [0, -10, -10, 0], rotate: [0, 8, 8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 0.85, 1] }}
      style={{ originX: '80px', originY: '245px' }}
    >
      <foreignObject x="64" y="220" width="32" height="32">
        <Scissors className="h-7 w-7 text-primary-foreground drop-shadow" />
      </foreignObject>
    </motion.g>
    {/* Falling thread accents */}
    {[120, 180, 250, 300].map((cx, i) => (
      <motion.circle
        key={cx}
        cx={cx}
        cy="240"
        r="2"
        fill={FG}
        opacity="0.7"
        animate={{ cy: [240, 270], opacity: [0.7, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.35, ease: 'easeIn' }}
      />
    ))}
  </Workbench>
);

const BagProcess = () => (
  <Workbench>
    {/* Bag panels appearing one by one */}
    <motion.rect x="80" y="120" width="90" height="100" rx="4" fill="none" stroke={FG} strokeWidth="2"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} />
    <motion.rect x="190" y="130" width="70" height="80" rx="4" fill="none" stroke={FG} strokeWidth="2"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} />
    <motion.path d="M280 140 Q310 110 330 150 L330 210 L280 210 Z" fill="none" stroke={FG} strokeWidth="2"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} />
    {/* Stitching forming around the main panel */}
    <motion.path
      d="M82 122 H168 V218 H82 Z"
      stroke={FG}
      strokeWidth="1.5"
      strokeDasharray="4 3"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop' }}
    />
    {/* Strap being attached */}
    <motion.path
      d="M95 120 Q125 70 155 120"
      stroke={FG}
      strokeWidth="3"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: [0, 1] }}
      transition={{ duration: 1.4, delay: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
    />
  </Workbench>
);

const FormalProcess = () => (
  <Workbench>
    {/* Suit silhouette being assembled */}
    <motion.path
      d="M150 90 L200 110 L250 90 L290 120 L280 220 L120 220 L110 120 Z"
      fill={FG}
      fillOpacity="0.1"
      stroke={FG}
      strokeWidth="2"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.2 }}
    />
    {/* Lapels drawn in */}
    <motion.path d="M150 90 L200 140 M250 90 L200 140" stroke={FG} strokeWidth="2"
      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.8 }} />
    {/* Tie appearing */}
    <motion.path d="M200 140 L193 170 L200 200 L207 170 Z" fill={FG} fillOpacity="0.6"
      initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} style={{ originY: '140px' }}
      transition={{ duration: 0.6, delay: 1.4 }} />
    {/* Needle running along the seam */}
    <motion.line x1="120" y1="220" x2="280" y2="220" stroke={FG} strokeWidth="1.5" strokeDasharray="3 3"
      initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1.6 }} />
    <motion.circle r="3" fill={FG}
      animate={{ cx: [120, 280, 120], cy: [220, 220, 220] }}
      transition={{ duration: 3, repeat: Infinity, delay: 1.6, ease: 'easeInOut' }} />
  </Workbench>
);

const AlterationProcess = () => (
  <Workbench>
    {/* Garment */}
    <motion.path
      d="M130 80 L270 80 L290 230 L110 230 Z"
      fill={FG}
      fillOpacity="0.1"
      stroke={FG}
      strokeWidth="2"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
    />
    {/* Original seam */}
    <line x1="130" y1="155" x2="270" y2="155" stroke={FG} strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />
    {/* New (taken-in) seam being drawn */}
    <motion.path
      d="M150 155 L250 155"
      stroke={FG}
      strokeWidth="2.5"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
    />
    {/* Pins being placed */}
    {[{ x: 160, d: 0 }, { x: 200, d: 0.5 }, { x: 240, d: 1 }].map((p) => (
      <motion.g key={p.x}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: [0, 1, 1, 0], y: [-8, 0, 0, -8] }}
        transition={{ duration: 3.2, repeat: Infinity, delay: p.d, ease: 'easeOut' }}
      >
        <foreignObject x={p.x - 8} y="140" width="16" height="16">
          <Pin className="h-4 w-4 text-primary-foreground" />
        </foreignObject>
      </motion.g>
    ))}
  </Workbench>
);

const CustomProcess = () => (
  <Workbench>
    {/* Sketchpad */}
    <rect x="90" y="80" width="220" height="160" rx="6" fill={FG} fillOpacity="0.08" stroke={FG} strokeWidth="1.5" />
    {/* Drawing the design */}
    <motion.path
      d="M150 110 Q200 90 250 110 Q260 150 250 200 Q200 220 150 200 Q140 150 150 110 Z"
      stroke={FG}
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: [0, 1, 1, 0] }}
      transition={{ duration: 4, repeat: Infinity, times: [0, 0.55, 0.85, 1] }}
    />
    <motion.path
      d="M170 140 Q200 130 230 140 M180 170 Q200 180 220 170"
      stroke={FG}
      strokeWidth="1.5"
      fill="none"
      opacity="0.8"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: [0, 1, 1, 0] }}
      transition={{ duration: 4, delay: 0.3, repeat: Infinity, times: [0, 0.55, 0.85, 1] }}
    />
    {/* Pencil following the path */}
    <motion.g
      animate={{
        x: [150, 250, 250, 150, 150],
        y: [110, 110, 200, 200, 110],
        rotate: [0, 0, 0, 0, 0],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <foreignObject x="-10" y="-22" width="22" height="22">
        <Pencil className="h-5 w-5 text-primary-foreground" />
      </foreignObject>
    </motion.g>
    {/* Sparkle */}
    <motion.g animate={{ opacity: [0, 1, 0], scale: [0.6, 1.1, 0.6] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }}>
      <foreignObject x="280" y="90" width="22" height="22">
        <Sparkles className="h-5 w-5 text-primary-foreground" />
      </foreignObject>
    </motion.g>
  </Workbench>
);

const MeasureProcess = () => (
  <Workbench>
    {/* Mannequin silhouette */}
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <circle cx="200" cy="80" r="18" fill="none" stroke={FG} strokeWidth="2" />
      <path d="M200 98 L200 200 M170 130 L230 130 M200 200 L180 240 M200 200 L220 240" stroke={FG} strokeWidth="2" fill="none" />
    </motion.g>
    {/* Tape measure stretching */}
    <motion.rect
      x="150" y="125" height="10" rx="2"
      fill="none" stroke={FG} strokeWidth="1.5"
      initial={{ width: 0 }}
      animate={{ width: [0, 100, 100, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.5, 0.85, 1], ease: 'easeInOut' }}
    />
    {/* Tick marks animating in */}
    {Array.from({ length: 9 }).map((_, i) => (
      <motion.line
        key={i}
        x1={155 + i * 11}
        y1="125"
        x2={155 + i * 11}
        y2={i % 2 === 0 ? 137 : 132}
        stroke={FG}
        strokeWidth="1.2"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.5, 0.85, 1], delay: i * 0.05 }}
      />
    ))}
    {/* Floating ruler icon */}
    <motion.g animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
      <foreignObject x="290" y="100" width="28" height="28">
        <Ruler className="h-6 w-6 text-primary-foreground" />
      </foreignObject>
    </motion.g>
  </Workbench>
);

const ProcessByPattern: Record<Pattern, React.FC> = {
  chitenge: ChitengeProcess,
  bag: BagProcess,
  formal: FormalProcess,
  alteration: AlterationProcess,
  custom: CustomProcess,
  measure: MeasureProcess,
};

const stepIconByPattern: Record<Pattern, React.ComponentType<{ className?: string }>> = {
  chitenge: Scissors,
  bag: Palette,
  formal: Shirt,
  alteration: Pin,
  custom: Wand2,
  measure: Ruler,
};

const ProcessScene = ({ stage, stageDurationMs }: { stage: Stage; stageDurationMs: number }) => {
  const Scene = ProcessByPattern[stage.pattern];
  const StepIcon = stepIconByPattern[stage.pattern];
  const [stepIdx, setStepIdx] = useState(0);
  const stepDuration = Math.floor(stageDurationMs / stage.steps.length);

  useEffect(() => {
    setStepIdx(0);
    const t = setInterval(() => {
      setStepIdx(p => (p < stage.steps.length - 1 ? p + 1 : p));
    }, stepDuration);
    return () => clearInterval(t);
  }, [stage.id, stage.steps.length, stepDuration]);

  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${stage.processGradient} overflow-hidden`}>
      {/* Subtle grid */}
      <svg className="absolute inset-0 w-full h-full opacity-15" aria-hidden>
        <defs>
          <pattern id={`grid-${stage.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke={FG} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${stage.id})`} />
      </svg>

      {/* Animated workbench scene */}
      <Scene />

      {/* Bottom overlay: label + animated step */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-4 pt-10 bg-gradient-to-t from-black/40 via-black/15 to-transparent text-primary-foreground">
        <span className="block text-[10px] uppercase tracking-[0.22em] text-primary-foreground/85 mb-1">
          Process
        </span>
        <p className="font-serif text-base md:text-lg leading-tight text-primary-foreground drop-shadow-sm">
          {stage.processLabel}
        </p>
        <div className="mt-2 flex items-center gap-2 min-h-[22px]">
          <StepIcon className="h-4 w-4 text-primary-foreground/90 shrink-0" />
          <AnimatePresence mode="wait">
            <motion.span
              key={`${stage.id}-${stepIdx}`}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -6, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="text-xs md:text-sm text-primary-foreground/95"
            >
              {stage.steps[stepIdx]}
            </motion.span>
          </AnimatePresence>
        </div>
        {/* Step progress dots */}
        <div className="mt-2 flex gap-1.5">
          {stage.steps.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === stepIdx ? 'w-6 bg-primary-foreground' : 'w-3 bg-primary-foreground/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Animated result scene (right side) ──────────────────────────────────── */
const ResultScene = ({ stage }: { stage: Stage }) => {
  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${stage.resultGradient} overflow-hidden`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary-foreground)/0.25),transparent_60%)]" />

      {/* Light sweep on reveal */}
      <motion.div
        key={`sweep-${stage.id}`}
        initial={{ x: '-120%' }}
        animate={{ x: '120%' }}
        transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.2 }}
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent skew-x-12"
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-primary-foreground">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-3 drop-shadow-lg"
        >
          <PatternArt pattern={stage.pattern} />
        </motion.div>

        <motion.span
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="text-xs uppercase tracking-[0.2em] text-primary-foreground/85 mb-1 flex items-center gap-1.5"
        >
          <span aria-hidden>{stage.emoji}</span> Finished
        </motion.span>
        <motion.h3
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.32, duration: 0.5 }}
          className="font-serif text-xl md:text-2xl text-center text-primary-foreground"
        >
          {stage.title}
        </motion.h3>
        <motion.p
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-sm text-center text-primary-foreground/90 max-w-xs mt-1"
        >
          {stage.desc}
        </motion.p>
      </div>
    </div>
  );
};

/* ── Main scene with synchronized cycling ────────────────────────────────── */
const STAGE_DURATION_MS = 6400; // longer so the multi-step process can play

const TailorScene = () => {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(m.matches);
    const onChange = () => setReduced(m.matches);
    m.addEventListener?.('change', onChange);
    return () => m.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setIndex(p => (p + 1) % stages.length), STAGE_DURATION_MS);
    return () => clearInterval(t);
  }, [reduced]);

  const stage = stages[index];

  return (
    <div className="relative w-full">
      <div className="grid md:grid-cols-2 rounded-2xl overflow-hidden border border-border shadow-warm bg-card">
        {/* Left — Process */}
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[380px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`p-${stage.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <ProcessScene stage={stage} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Connector arrow (desktop only) */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <motion.div
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-12 h-12 rounded-full bg-card border border-border shadow-warm flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12 H19 M13 6 L19 12 L13 18" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </div>

        {/* Right — Result */}
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[380px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`r-${stage.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut', delay: 0.1 }}
              className="absolute inset-0"
            >
              <ResultScene stage={stage} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {stages.map((s, i) => {
          const active = i === index;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${s.title}`}
              aria-current={active}
              className={`group flex items-center gap-1.5 rounded-full border transition-all ${
                active
                  ? 'border-primary bg-primary/10 px-3 py-1.5'
                  : 'border-border bg-card hover:border-primary/50 px-2.5 py-1.5'
              }`}
            >
              <span className="text-sm" aria-hidden>{s.emoji}</span>
              <span className={`text-xs font-medium transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.title}
              </span>
              {active && !reduced && (
                <motion.span
                  layoutId="stage-progress"
                  className="ml-1 block h-1 w-6 rounded-full bg-primary/30 overflow-hidden"
                >
                  <motion.span
                    key={stage.id}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: STAGE_DURATION_MS / 1000, ease: 'linear' }}
                    className="block h-full bg-primary"
                  />
                </motion.span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TailorScene;
