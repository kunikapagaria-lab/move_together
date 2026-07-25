import React, { useEffect, useState, useRef } from 'react';
import { Sun, Moon, Cloud, CloudRain, Zap, CloudSnow, Sparkles, SlidersHorizontal } from 'lucide-react';

export type TimeMode = 'auto' | 'dawn' | 'day' | 'dusk' | 'night';
export type WeatherMode = 'auto' | 'clear' | 'rain' | 'thunder' | 'snow' | 'clouds';

interface DynamicAtmosphereProps {
  children: React.ReactNode;
}

export const DynamicAtmosphere: React.FC<DynamicAtmosphereProps> = ({ children }) => {
  const [timeMode, setTimeMode] = useState<TimeMode>('auto');
  const [weatherMode, setWeatherMode] = useState<WeatherMode>('auto');
  const [activePeriod, setActivePeriod] = useState<'dawn' | 'day' | 'dusk' | 'night'>('night');
  const [activeWeather, setActiveWeather] = useState<'clear' | 'rain' | 'thunder' | 'snow' | 'clouds'>('clear');
  const [isHudOpen, setIsHudOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute Time Period
  useEffect(() => {
    if (timeMode !== 'auto') {
      setActivePeriod(timeMode);
      return;
    }

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) setActivePeriod('dawn');
    else if (hour >= 9 && hour < 17) setActivePeriod('day');
    else if (hour >= 17 && hour < 20) setActivePeriod('dusk');
    else setActivePeriod('night');
  }, [timeMode]);

  // Compute Weather Mode
  useEffect(() => {
    if (weatherMode !== 'auto') {
      setActiveWeather(weatherMode);
      return;
    }

    // Try fetching IP weather (fallback to clear)
    fetch('https://wttr.in/?format=j1')
      .then(res => res.json())
      .then(data => {
        const condition = data?.current_condition?.[0]?.weatherDesc?.[0]?.value?.toLowerCase() || '';
        if (condition.includes('thunder') || condition.includes('storm')) setActiveWeather('thunder');
        else if (condition.includes('rain') || condition.includes('drizzle')) setActiveWeather('rain');
        else if (condition.includes('snow') || condition.includes('ice')) setActiveWeather('snow');
        else if (condition.includes('cloud') || condition.includes('overcast')) setActiveWeather('clouds');
        else setActiveWeather('clear');
      })
      .catch(() => {
        setActiveWeather('clear');
      });
  }, [weatherMode]);

  // Canvas Particle Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle seeds
    const particlesCount = activeWeather === 'rain' || activeWeather === 'thunder' ? 120 : activeWeather === 'snow' ? 80 : 50;
    const particles = Array.from({ length: particlesCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speedY: Math.random() * 4 + 1,
      speedX: Math.random() * 1 - 0.5,
      opacity: Math.random() * 0.7 + 0.3
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        ctx.beginPath();
        if (activeWeather === 'rain' || activeWeather === 'thunder') {
          // Rain drops
          ctx.strokeStyle = `rgba(0, 243, 255, ${p.opacity * 0.6})`;
          ctx.lineWidth = 1.5;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + p.speedY * 4);
          ctx.stroke();
          p.y += p.speedY * 3;
          p.x -= 0.5;
        } else if (activeWeather === 'snow') {
          // Soft snowflakes
          ctx.fillStyle = `rgba(186, 230, 253, ${p.opacity})`;
          ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.speedY * 0.5;
          p.x += Math.sin(p.y * 0.02) * 0.5;
        } else {
          // Floating cyber stars / dust
          ctx.fillStyle = activePeriod === 'dawn' || activePeriod === 'dusk' 
            ? `rgba(255, 0, 127, ${p.opacity * 0.5})` 
            : `rgba(0, 243, 255, ${p.opacity * 0.5})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          p.y -= 0.3;
          if (p.y < 0) p.y = height;
        }

        // Reset off-screen particles
        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activePeriod, activeWeather]);

  // Background Gradient Classes based on Period & Weather
  const getAtmosphereGradient = () => {
    switch (activePeriod) {
      case 'dawn':
        return 'from-[#1a0b2e] via-[#2d114c] to-[#4a154b]'; // Cyber Sunrise
      case 'day':
        return 'from-[#0a1128] via-[#001f3f] to-[#0f172a]'; // Electric Day
      case 'dusk':
        return 'from-[#2b0938] via-[#1a0826] to-[#0d0221]'; // Vaporwave Twilight
      case 'night':
      default:
        return 'from-[#080711] via-[#0d091e] to-[#040209]'; // Cyber Midnight
    }
  };

  const getWeatherIcon = () => {
    switch (activeWeather) {
      case 'thunder': return <Zap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />;
      case 'rain': return <CloudRain className="w-3.5 h-3.5 text-cyan-300" />;
      case 'snow': return <CloudSnow className="w-3.5 h-3.5 text-sky-200" />;
      case 'clouds': return <Cloud className="w-3.5 h-3.5 text-slate-300" />;
      default: return <Sun className="w-3.5 h-3.5 text-yellow-300" />;
    }
  };

  const getPeriodIcon = () => {
    switch (activePeriod) {
      case 'dawn': return <Sparkles className="w-3.5 h-3.5 text-pink-300" />;
      case 'day': return <Sun className="w-3.5 h-3.5 text-amber-300" />;
      case 'dusk': return <Sparkles className="w-3.5 h-3.5 text-purple-300" />;
      case 'night': return <Moon className="w-3.5 h-3.5 text-indigo-300" />;
    }
  };

  return (
    <div className={`min-h-screen w-full relative bg-gradient-to-b ${getAtmosphereGradient()} transition-colors duration-1000 overflow-x-hidden`}>
      
      {/* Background Canvas Particles */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Lightning Flash Layer */}
      {activeWeather === 'thunder' && (
        <div className="fixed inset-0 bg-cyan-100/10 pointer-events-none z-0 lightning-bg" />
      )}

      {/* Ambient Neon Lighting Spheres */}
      <div className="fixed top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none z-0 animate-pulse" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-fuchsia-600/10 blur-[130px] pointer-events-none z-0 animate-pulse" />

      {/* TOP FLOATING CYBER-ATMOSPHERE HUD CONTROL BAR */}
      <div className="fixed top-3 right-4 z-[90] flex items-center gap-2">
        <button
          onClick={() => setIsHudOpen(!isHudOpen)}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all active:scale-95 cursor-pointer"
        >
          <span className="flex items-center gap-1">
            {getPeriodIcon()} <span className="capitalize">{activePeriod}</span>
          </span>
          <span className="text-white/30">|</span>
          <span className="flex items-center gap-1">
            {getWeatherIcon()} <span className="capitalize">{activeWeather}</span>
          </span>
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 ml-1" />
        </button>

        {/* HUD SETTINGS MODAL POPUP */}
        {isHudOpen && (
          <div className="absolute top-10 right-0 w-64 bg-[#120d24]/95 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl p-4 shadow-[0_0_40px_rgba(0,243,255,0.3)] z-[100] text-xs text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
              <span className="font-bold text-cyan-300 uppercase tracking-widest text-[10px]">Cyber Atmosphere Controls</span>
              <button onClick={() => setIsHudOpen(false)} className="text-white/40 hover:text-white">✕</button>
            </div>

            {/* Time Mode Select */}
            <div className="mb-3">
              <p className="text-[10px] text-white/50 mb-1.5 uppercase font-bold">Time Sky Cycle</p>
              <div className="grid grid-cols-3 gap-1">
                {(['auto', 'dawn', 'day', 'dusk', 'night'] as TimeMode[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeMode(t)}
                    className={`py-1 rounded-lg border capitalize font-bold transition-all ${
                      timeMode === t 
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Weather Mode Select */}
            <div>
              <p className="text-[10px] text-white/50 mb-1.5 uppercase font-bold">Live Weather Overlay</p>
              <div className="grid grid-cols-3 gap-1">
                {(['auto', 'clear', 'rain', 'thunder', 'snow', 'clouds'] as WeatherMode[]).map(w => (
                  <button
                    key={w}
                    onClick={() => setWeatherMode(w)}
                    className={`py-1 rounded-lg border capitalize font-bold transition-all ${
                      weatherMode === w 
                        ? 'bg-purple-500/30 border-purple-400 text-purple-200' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main App Canvas Wrapper */}
      <div className="relative z-10">
        {children}
      </div>

    </div>
  );
};
