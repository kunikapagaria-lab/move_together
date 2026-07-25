import { Trophy, Star, Shield, Zap, Target, Lock } from 'lucide-react';
import { cn } from '../../components/ui/Button';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

const achievements = [
  { id: 'first_step', title: 'First Step', desc: 'Complete Day 1.', icon: Target, unlocked: true },
  { id: 'one_week', title: 'One Week Warrior', desc: 'Complete 7 consecutive days.', icon: Shield, unlocked: true },
  { id: 'two_week', title: 'Two Week Beast', desc: 'Complete 14 consecutive days.', icon: Zap, unlocked: true },
  { id: 'hydration_hero', title: 'Hydration Hero', desc: 'Complete the water requirement for 10 consecutive days.', icon: Star, unlocked: false },
  { id: 'halfway', title: 'Halfway There', desc: 'Reach Day 38.', icon: Trophy, unlocked: false },
  { id: 'champion', title: '75 Champion', desc: 'Complete all 75 days.', icon: Trophy, unlocked: false },
];

export const Achievements = () => {
  const { streak } = useSelector((state: RootState) => state.challenge);

  const activeAchievements = achievements.map(ach => {
    let unlocked = false;
    switch (ach.id) {
      case 'first_step': unlocked = streak >= 1; break;
      case 'one_week': unlocked = streak >= 7; break;
      case 'two_week': unlocked = streak >= 14; break;
      case 'hydration_hero': unlocked = streak >= 10; break;
      case 'halfway': unlocked = streak >= 38; break;
      case 'champion': unlocked = streak >= 75; break;
    }
    return { ...ach, unlocked };
  });

  return (
    <div className="min-h-screen p-4 pb-24 max-w-lg mx-auto space-y-6">
      <header className="pt-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Achievements</h1>
        <p className="text-textMuted mt-1">Unlock badges as you progress.</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {activeAchievements.map((badge) => {
          const Icon = badge.icon;
          return (
            <div 
              key={badge.id}
              className={cn(
                "border rounded-2xl p-4 flex flex-col items-center text-center space-y-3 transition-all",
                badge.unlocked 
                  ? "bg-black/40 border-white/20 shadow-[0_0_15px_rgba(79,70,229,0.15)]" 
                  : "bg-black/20 border-white/5 grayscale opacity-60"
              )}
            >
              <div className={cn(
                "h-16 w-16 rounded-full flex items-center justify-center mb-2",
                badge.unlocked ? "bg-primary/20 text-primary" : "bg-surfaceHighlight text-textMuted"
              )}>
                {badge.unlocked ? <Icon className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{badge.title}</h3>
                <p className="text-xs text-textMuted mt-1 leading-relaxed">{badge.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
