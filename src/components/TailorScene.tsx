import { useEffect, useState } from 'react';
import sewing from '@/assets/tailor-sewing-frame.jpg';
import measuring from '@/assets/tailor-measuring.jpg';
import dress from '@/assets/fitting-room-frame.jpg';
import suit from '@/assets/fitting-suit.jpg';

/**
 * Cinematic infinite-loop showcase: crossfading photos of the tailor at work
 * and the fitting room, with a slow Ken Burns zoom on each frame.
 * Photographic instead of cartoonish — feels editorial and on-brand.
 */
const workshop = [
  { src: sewing, alt: 'Hands guiding chitenge fabric under a sewing machine' },
  { src: measuring, alt: 'Tailor measuring fabric with measuring tape and pattern paper' },
];

const fitting = [
  { src: dress, alt: 'Tailored chitenge dress on a mannequin in the fitting room' },
  { src: suit, alt: 'Sharp navy suit on a mannequin in the boutique' },
];

const useCycle = (length: number, intervalMs: number) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(p => (p + 1) % length), intervalMs);
    return () => clearInterval(t);
  }, [length, intervalMs]);
  return i;
};

const Slideshow = ({
  items,
  intervalMs,
  panDirection,
}: {
  items: { src: string; alt: string }[];
  intervalMs: number;
  panDirection: 'in' | 'out';
}) => {
  const active = useCycle(items.length, intervalMs);
  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl border border-border shadow-warm bg-foreground/5">
      {items.map((item, idx) => (
        <img
          key={item.src}
          src={item.src}
          alt={item.alt}
          loading="lazy"
          width={1280}
          height={960}
          className={`absolute inset-0 w-full h-full object-cover will-change-transform ${
            panDirection === 'in' ? 'anim-kb-in' : 'anim-kb-out'
          }`}
          style={{
            opacity: idx === active ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
          }}
        />
      ))}
      {/* Subtle gradient finish */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-foreground/60 to-transparent pointer-events-none" />
    </div>
  );
};

const TailorScene = () => {
  return (
    <div className="relative w-full">
      <style>{`
        @keyframes ken-burns-in {
          0% { transform: scale(1.02) translate(0, 0); }
          50% { transform: scale(1.12) translate(-1.5%, -1%); }
          100% { transform: scale(1.02) translate(0, 0); }
        }
        @keyframes ken-burns-out {
          0% { transform: scale(1.12) translate(1%, 0); }
          50% { transform: scale(1.02) translate(0, -1.5%); }
          100% { transform: scale(1.12) translate(1%, 0); }
        }
        .anim-kb-in { animation: ken-burns-in 14s ease-in-out infinite; }
        .anim-kb-out { animation: ken-burns-out 16s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .anim-kb-in, .anim-kb-out { animation: none; }
        }
      `}</style>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        <figure className="space-y-2">
          <Slideshow items={workshop} intervalMs={5500} panDirection="in" />
          <figcaption className="text-center text-sm text-muted-foreground italic">
            In the workshop — every stitch, crafted by hand
          </figcaption>
        </figure>

        <figure className="space-y-2">
          <Slideshow items={fitting} intervalMs={6500} panDirection="out" />
          <figcaption className="text-center text-sm text-muted-foreground italic">
            The fitting room — perfectly tailored, just for you
          </figcaption>
        </figure>
      </div>
    </div>
  );
};

export default TailorScene;
