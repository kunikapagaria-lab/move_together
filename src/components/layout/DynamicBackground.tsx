import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

const getGreetingAndBg = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
};

const THEMES = {
  morning: {
    bg: '#0a0f1d', // Very dark slate blue
    orb1: 'rgba(56, 189, 248, 0.6)',  // Soft sky blue (Left)
    orb2: 'rgba(125, 211, 252, 0.6)', // Ice blue (Right)
    orb3: 'rgba(99, 102, 241, 0.4)',  // Soft indigo (Center)
    particleColors: ['#38bdf8', '#7dd3fc', '#ffffff'],
  },
  afternoon: {
    bg: '#080d19', // Deep navy
    orb1: 'rgba(6, 182, 212, 0.7)',   // Bright Cyan (Left)
    orb2: 'rgba(59, 130, 246, 0.7)',  // Bright Blue (Right)
    orb3: 'rgba(255, 255, 255, 0.3)', // White glow (Center)
    particleColors: ['#06b6d4', '#3b82f6', '#ffffff'],
  },
  evening: {
    bg: '#060913', // Very dark blue
    orb1: 'rgba(79, 70, 229, 0.7)',   // Deep Indigo (Left)
    orb2: 'rgba(14, 165, 233, 0.7)',  // Ocean Blue (Right)
    orb3: 'rgba(139, 92, 246, 0.4)',  // Soft violet (Center)
    particleColors: ['#4f46e5', '#0ea5e9', '#ffffff'],
  },
  night: {
    bg: '#03040a', // Midnight black/blue
    orb1: 'rgba(30, 64, 175, 0.7)',   // Deep Cobalt Blue (Left)
    orb2: 'rgba(99, 102, 241, 0.7)',  // Deep Indigo (Right)
    orb3: 'rgba(14, 116, 144, 0.5)',  // Deep Cyan (Center)
    particleColors: ['#1e40af', '#6366f1', '#ffffff', '#0e7490'],
  },
};

export const DynamicBackground = () => {
  const [time, setTime] = useState<TimeOfDay>(getGreetingAndBg());
  const theme = THEMES[time];

  // Mouse Parallax Logic
  const mouseX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const mouseY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);

  // Increased stiffness for quicker, more responsive parallax
  const springConfig = { stiffness: 100, damping: 30 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Drastically increased depth multipliers for rapid parallax
  const x1 = useTransform(springX, [0, window.innerWidth || 1000], [120, -120]);
  const y1 = useTransform(springY, [0, window.innerHeight || 1000], [120, -120]);
  
  const x2 = useTransform(springX, [0, window.innerWidth || 1000], [300, -300]);
  const y2 = useTransform(springY, [0, window.innerHeight || 1000], [300, -300]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = getGreetingAndBg();
      if (newTime !== time) setTime(newTime);
    }, 60000);
    return () => clearInterval(interval);
  }, [time]);

  // Generate random particles (stars/dust) once
  const particles = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: Math.random() * 110 - 5 + '%',
      y: Math.random() * 110 - 5 + '%',
      size: Math.random() * 1.5 + 0.5 + 'px', // Crisp, tiny sizes (0.5px to 2px)
      colorIndex: Math.floor(Math.random() * 4), 
      duration: Math.random() * 20 + 20 + 's', 
      delay: Math.random() * 5 + 's',
      driftX: (Math.random() - 0.5) * 100, 
      driftY: (Math.random() - 0.5) * 100, 
      baseOpacity: Math.random() * 0.5 + 0.5, // Increased base opacity (0.5 to 1.0)
    }));
  }, []);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-black transition-colors duration-1000" style={{ backgroundColor: theme.bg }}>
      
      {/* 1. Subtle Dot Grid Pattern (Static Background Layer) */}
      <div 
        className="absolute inset-0 opacity-[0.15]" 
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={time}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {/* 2. Glowing Orbs (Ambient Lights) */}
          {/* Orb 1 - Left/Bottom */}
          <motion.div
            className="absolute rounded-full blur-[100px] pointer-events-none"
            style={{
              background: theme.orb1,
              width: '45vw',
              height: '45vw',
              left: '-15vw',
              bottom: '-10vw',
            }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 0.9, 0.7], // Slightly less vibrant
              x: [0, 50, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Orb 2 - Right/Top */}
          <motion.div
            className="absolute rounded-full blur-[100px] pointer-events-none"
            style={{
              background: theme.orb2,
              width: '50vw',
              height: '50vw',
              right: '-15vw',
              top: '-10vw',
            }}
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.6, 0.9, 0.6], // Slightly less vibrant
              x: [0, -40, 0],
              y: [0, 40, 0]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />

          {/* Orb 3 - Center/Top Subtle */}
          <motion.div
            className="absolute rounded-full blur-[80px] pointer-events-none"
            style={{
              background: theme.orb3,
              width: '30vw',
              height: '30vw',
              left: '35vw',
              top: '-15vw',
            }}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.7, 0.3] // Slightly less vibrant
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          />
        </motion.div>
      </AnimatePresence>

      {/* 3. Drifting Particles (Parallax Layer 2) */}
      <motion.div style={{ x: x1, y: y1 }} className="absolute inset-[-10%] pointer-events-none">
        {particles.map((p) => {
          return (
            <motion.div
              key={`p1-${p.id}`}
              className="absolute rounded-full"
              style={{
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                backgroundColor: '#ffffff', // Pure white stars
                opacity: p.baseOpacity,
              }}
              animate={{ 
                x: [0, p.driftX, 0],
                y: [0, p.driftY, 0],
                opacity: [p.baseOpacity * 0.5, p.baseOpacity, p.baseOpacity * 0.5] 
              }}
              transition={{
                duration: parseFloat(p.duration),
                delay: parseFloat(p.delay),
                repeat: Infinity,
                ease: "linear"
              }}
            />
          );
        })}
      </motion.div>

      {/* 4. Foreground Particles (Faster, Slightly Larger, Parallax Layer 3) */}
      <motion.div style={{ x: x2, y: y2 }} className="absolute inset-[-20%] pointer-events-none">
        {particles.slice(0, 50).map((p) => {
          return (
            <motion.div
              key={`p2-${p.id}`}
              className="absolute rounded-full"
              style={{
                left: p.x, 
                top: p.y,
                width: parseFloat(p.size) * 1.5 + 'px', 
                backgroundColor: '#ffffff', // Pure white
                opacity: p.baseOpacity,
              }}
              animate={{ 
                x: [0, -p.driftX * 2, 0], // Faster drift
                y: [0, -p.driftY * 2, 0],
                opacity: [0, p.baseOpacity, 0] 
              }}
              transition={{
                duration: parseFloat(p.duration) * 0.8, // Faster
                delay: parseFloat(p.delay),
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          );
        })}
      </motion.div>

    </div>
  );
};
