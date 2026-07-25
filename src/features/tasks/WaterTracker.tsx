import { useState, useEffect } from 'react';
import { Droplets, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface WaterTrackerProps {
  onComplete: () => void;
  onUndo: () => void;
  isTaskCompleted: boolean;
}

export const WaterTracker = ({ onComplete, onUndo, isTaskCompleted }: WaterTrackerProps) => {
  const minRequiredMl = 2500; // 2.5L
  const targetMl = 3000; // 3L
  const [waterMl, setWaterMl] = useState(isTaskCompleted ? 3000 : 0);

  // Sync waterMl if completion state is toggled from outside (e.g. Wearable Sync or direct checkmark click)
  useEffect(() => {
    if (isTaskCompleted && waterMl < minRequiredMl) {
      setWaterMl(3000);
    }
  }, [isTaskCompleted]);

  const addWater = (amount: number) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
    const next = Math.min(targetMl, waterMl + amount);
    setWaterMl(next);

    if (next >= minRequiredMl && !isTaskCompleted) {
      onComplete();
    }
  };

  const resetWater = () => {
    setWaterMl(0);
    if (isTaskCompleted) {
      onUndo();
    }
  };

  const percentage = Math.min((waterMl / targetMl) * 100, 100);
  const requiredPercentage = (minRequiredMl / targetMl) * 100;

  return (
    <div className="space-y-6 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-3xl font-extrabold text-white">
          {(waterMl / 1000).toFixed(2)}L
        </span>
        <span className="text-white/50 text-sm font-medium">/ 3.00L Target</span>
      </div>

      <div className="relative h-6 w-full rounded-full bg-white/10 overflow-hidden border border-white/5">
        {/* The required marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-20"
          style={{ left: `${requiredPercentage}%` }}
        />
        <div 
          className="absolute top-[-20px] text-[10px] text-white/50 font-bold z-20"
          style={{ left: `calc(${requiredPercentage}% - 12px)` }}
        >
          2.5L
        </div>

        {/* The progress bar */}
        <div 
          className="h-full bg-sky-400 transition-all duration-500 ease-out relative z-10"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>

      {isTaskCompleted && (
        <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs">
          <CheckCircle2 className="h-4 w-4" />
          <span>Daily water requirement achieved!</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => addWater(250)} className="h-12 font-bold text-xs bg-white/5 hover:bg-white/10 text-white border-white/10">
          <Droplets className="mr-1.5 h-4 w-4 text-sky-400" /> +250ml
        </Button>
        <Button variant="secondary" onClick={() => addWater(500)} className="h-12 font-bold text-xs bg-white/5 hover:bg-white/10 text-white border-white/10">
          <Droplets className="mr-1.5 h-4 w-4 text-sky-400" /> +500ml
        </Button>
        <Button variant="secondary" onClick={() => addWater(750)} className="h-12 font-bold text-xs bg-white/5 hover:bg-white/10 text-white border-white/10">
          <Droplets className="mr-1.5 h-4 w-4 text-sky-400" /> +750ml
        </Button>
        <Button variant="secondary" onClick={() => addWater(1000)} className="h-12 font-bold text-xs bg-white/5 hover:bg-white/10 text-white border-white/10">
          <Droplets className="mr-1.5 h-4 w-4 text-sky-400" /> +1L
        </Button>
      </div>
      <Button variant="secondary" onClick={() => addWater(3000)} className="h-12 font-bold text-xs w-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30">
        <Droplets className="mr-1.5 h-4 w-4 text-sky-300" /> +3L (Full Day Target)
      </Button>
      
      {waterMl > 0 && (
        <button 
          onClick={resetWater} 
          className="w-full text-center text-xs text-white/40 hover:text-white/80 pt-2 transition-colors"
        >
          Reset Water Log
        </button>
      )}
    </div>
  );
};
