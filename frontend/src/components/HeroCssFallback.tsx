'use client';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function HeroCssFallback() {
  const x = useMotionValue(0), y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-.5, .5], [10, -10]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(x, [-.5, .5], [-14, 14]), { stiffness: 120, damping: 18 });
  const layer = (z: number, delay: number, cls: string) => (
    <motion.div className={`glass pearl-edge absolute ${cls}`} style={{ transform: `translateZ(${z}px)` }}
      animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity, delay, ease: 'easeInOut' }} />
  );
  return (
    <div className="absolute inset-0 grid place-items-center [perspective:1000px]"
      onPointerMove={e => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left) / r.width - .5); y.set((e.clientY - r.top) / r.height - .5); }}
      onPointerLeave={() => { x.set(0); y.set(0); }}>
      <motion.div className="relative h-[320px] w-[320px] [transform-style:preserve-3d]" style={{ rotateX: rx, rotateY: ry }}>
        {layer(0, 0, 'inset-0')}
        {layer(60, 1, 'left-10 top-10 h-48 w-48 !rounded-full')}
        {layer(120, 2, 'right-4 bottom-8 h-28 w-40')}
      </motion.div>
    </div>
  );
}