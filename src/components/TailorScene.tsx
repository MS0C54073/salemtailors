import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Scissors, Shirt, Briefcase, Palette, Sparkles } from 'lucide-react';

/**
 * "A Day at Salem Tailors" — synchronized two-side storytelling loop.
 * Left: process stage (measuring, cutting, sewing, design setup).
 * Right: finished product. Both sides change in sync, cycling through
 * each service category as a refined visual narrative.
 */

type Stage = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  // process side
  processIcon: React.ComponentType<{ className?: string }>;
  processLabel: string;
  processGradient: string; // tailwind gradient classes for process card
  // result side
  resultGradient: string;
  pattern: 'chitenge' | 'bag' | 'formal' | 'alteration' | 'custom' | 'measure';
};

const stages: Stage[] = [
  {
    id: 'chitenge',
    emoji: '👗',
    title: 'Chitenge Wear',
    desc: 'Beautiful African prints for men & women',
    processIcon: Scissors,
    processLabel: 'Cutting the chitenge',
    processGradient: 'from-[hsl(var(--terracotta))] to-[hsl(var(--gold))]',
    resultGradient: 'from-[hsl(var(--gold))] via-[hsl(var(--terracotta))] to-[hsl(var(--earth))]',
    pattern: 'chitenge',
  },
  {
    id: 'bags',
    emoji: '🎒',
    title: 'Bags',
    desc: 'Backpacks, laptop bags, clutch purses, school bags & more',
    processIcon: Palette,
    processLabel: 'Designing the pattern',
    processGradient: 'from-[hsl(var(--earth))] to-[hsl(var(--sage))]',
    resultGradient: 'from-[hsl(var(--earth))] via-[hsl(var(--earth-light))] to-[hsl(var(--sage))]',
    pattern: 'bag',
  },
  {
    id: 'formal',
    emoji: '👔',
    title: 'Formal & Casual',
    desc: 'Professional and everyday wear',
    processIcon: Shirt,
    processLabel: 'Sewing the seams',
    processGradient: 'from-[hsl(var(--earth))] to-[hsl(var(--foreground))]',
    resultGradient: 'from-[hsl(var(--foreground))] via-[hsl(var(--earth))] to-[hsl(var(--earth-light))]',
    pattern: 'formal',
  },
  {
    id: 'alterations',
    emoji: '✂️',
    title: 'Alterations',
    desc: 'Perfect fit adjustments',
    processIcon: Scissors,
    processLabel: 'Adjusting for the perfect fit',
    processGradient: 'from-[hsl(var(--sage))] to-[hsl(var(--accent))]',
    resultGradient: 'from-[hsl(var(--sage))] via-[hsl(var(--accent))] to-[hsl(var(--gold-light))]',
    pattern: 'alteration',
  },
  {
    id: 'custom',
    emoji: '🎨',
    title: 'Custom Designs',
    desc: 'Bring your vision to life',
    processIcon: Sparkles,
    processLabel: 'Sketching the vision',
    processGradient: 'from-[hsl(var(--gold))] to-[hsl(var(--terracotta))]',
    resultGradient: 'from-[hsl(var(--gold-light))] via-[hsl(var(--gold))] to-[hsl(var(--terracotta))]',
    pattern: 'custom',
  },
  {
    id: 'measurements',
    emoji: '📐',
    title: 'Measurements',
    desc: 'Professional body measurements',
    processIcon: Ruler,
    processLabel: 'Taking precise measurements',
    processGradient: 'from-[hsl(var(--accent))] to-[hsl(var(--earth))]',
    resultGradient: 'from-[hsl(var(--cream))] via-[hsl(var(--gold-light))] to-[hsl(var(--gold))]',
    pattern: 'measure',
  },
];

/* ── Decorative SVG patterns for the result side ─────────────────────────── */
const PatternArt = ({ pattern }: { pattern: Stage['pattern'] }) => {
  const stroke = 'hsl(var(--primary-foreground))';
  switch (pattern) {
    case 'chitenge':
      // Flowing dress silhouette
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-52 md:h-52" aria-hidden>
          <defs>
            <pattern id="chit" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="7" cy="7" r="2" fill={stroke} opacity="0.35" />
              <path d="M0 7 L14 7 M7 0 L7 14" stroke={stroke} strokeWidth="0.5" opacity="0.25" />
            </pattern>
          </defs>
          <path
            d="M80 30 L120 30 L130 70 L150 170 L50 170 L70 70 Z"
            fill="url(#chit)"
            stroke={stroke}
            strokeWidth="2"
          />
          <circle cx="100" cy="40" r="8" fill="none" stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case 'bag':
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-52 md:h-52" aria-hidden>
          <path
            d="M70 60 Q70 40 100 40 Q130 40 130 60"
            fill="none"
            stroke={stroke}
            strokeWidth="3"
          />
          <rect x="50" y="60" width="100" height="110" rx="10" fill="none" stroke={stroke} strokeWidth="2.5" />
          <line x1="50" y1="100" x2="150" y2="100" stroke={stroke} strokeWidth="1.5" opacity="0.6" />
          <circle cx="100" cy="130" r="6" fill={stroke} opacity="0.6" />
        </svg>
      );
    case 'formal':
      // Suit with tie
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-52 md:h-52" aria-hidden>
          <path d="M70 50 L100 70 L130 50 L160 70 L150 180 L50 180 L40 70 Z" fill="none" stroke={stroke} strokeWidth="2.5" />
          <path d="M100 70 L90 100 L100 130 L110 100 Z" fill={stroke} opacity="0.6" />
          <line x1="70" y1="50" x2="100" y2="90" stroke={stroke} strokeWidth="2" />
          <line x1="130" y1="50" x2="100" y2="90" stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case 'alteration':
      // Garment with measurement adjustment lines
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
      // Sketch on a hanger
      return (
        <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-52 md:h-52" aria-hidden>
          <path d="M100 30 Q100 50 80 60 L60 80 L140 80 L120 60 Q100 50 100 30" fill="none" stroke={stroke} strokeWidth="2.5" />
          <path d="M60 80 Q40 130 50 180 L150 180 Q160 130 140 80" fill="none" stroke={stroke} strokeWidth="2.5" />
          <path d="M80 110 Q100 130 120 110" fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.7" />
          <circle cx="100" cy="150" r="4" fill={stroke} opacity="0.7" />
        </svg>
      );
    case 'measure':
      // Tape measure
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

/* ── Animated process scene (left side) ──────────────────────────────────── */
const ProcessScene = ({ stage }: { stage: Stage }) => {
  const Icon = stage.processIcon;
  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${stage.processGradient} overflow-hidden`}>
      {/* Subtle pattern grid */}
      <svg className="absolute inset-0 w-full h-full opacity-20" aria-hidden>
        <defs>
          <pattern id={`grid-${stage.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${stage.id})`} />
      </svg>

      {/* Animated stitch line crossing the workspace */}
      <svg className="absolute inset-0 w-full h-full" aria-hidden viewBox="0 0 400 300" preserveAspectRatio="none">
        <motion.path
          d="M 20 250 Q 200 180 380 250"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2"
          strokeDasharray="6 6"
          fill="none"
          opacity="0.8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' }}
        />
      </svg>

      {/* Centerpiece: animated icon */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-primary-foreground">
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/30 flex items-center justify-center shadow-warm mb-4"
        >
          <motion.div
            animate={{ rotate: [0, -8, 8, -8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon className="h-10 w-10 md:h-12 md:w-12" />
          </motion.div>
        </motion.div>

        <motion.span
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70 mb-1"
        >
          Process
        </motion.span>
        <motion.p
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="font-serif text-lg md:text-xl text-center text-primary-foreground"
        >
          {stage.processLabel}
        </motion.p>
      </div>

      {/* Floating sparkles */}
      <motion.div
        className="absolute top-6 right-6 w-2 h-2 rounded-full bg-primary-foreground/70"
        animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-10 left-8 w-1.5 h-1.5 rounded-full bg-primary-foreground/60"
        animate={{ y: [0, -8, 0], opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
    </div>
  );
};

/* ── Animated result scene (right side) ──────────────────────────────────── */
const ResultScene = ({ stage }: { stage: Stage }) => {
  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${stage.resultGradient} overflow-hidden`}>
      {/* Soft radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary-foreground)/0.25),transparent_60%)]" />

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
          className="text-xs uppercase tracking-[0.2em] text-primary-foreground/80 mb-1 flex items-center gap-1.5"
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
          className="text-sm text-center text-primary-foreground/85 max-w-xs mt-1"
        >
          {stage.desc}
        </motion.p>
      </div>
    </div>
  );
};

/* ── Main scene with synchronized cycling ────────────────────────────────── */
const STAGE_DURATION_MS = 4200;

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
