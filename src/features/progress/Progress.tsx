import { cn } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { BackButton } from '../../components/ui/BackButton';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

export const Progress = () => {
  const { streak, history, activeChallenge } = useSelector((state: RootState) => state.challenge);
  const duration = activeChallenge?.durationDays || 75;

  // Calculate consistency data from history
  const calculateConsistency = () => {
    if (!history || history.length === 0) {
      return [
        { subject: 'Water', A: 0, fullMark: 100 },
        { subject: 'Workout', A: 0, fullMark: 100 },
        { subject: 'Diet', A: 0, fullMark: 100 },
        { subject: 'Reading', A: 0, fullMark: 100 },
        { subject: 'Photo', A: 0, fullMark: 100 },
        { subject: 'Self-Care', A: 0, fullMark: 100 },
      ];
    }

    const counts: Record<string, number> = { water: 0, weight: 0, cardio: 0, diet: 0, reading: 0, photo: 0, selfcare: 0 };
    (history || []).forEach((log: any) => {
      (log?.completedTaskIds || []).forEach((id: string) => {
        if (counts[id] !== undefined) counts[id]++;
      });
    });

    const daysCount = history.length;
    const pct = (id: string) => Math.round((counts[id] / daysCount) * 100);

    return [
      { subject: 'Water', A: pct('water'), fullMark: 100 },
      { subject: 'Workout', A: pct('weight') + pct('cardio'), fullMark: 200 }, // Can be > 100 if both done but let's normalize
      { subject: 'Diet', A: pct('diet'), fullMark: 100 },
      { subject: 'Reading', A: pct('reading'), fullMark: 100 },
      { subject: 'Photo', A: pct('photo'), fullMark: 100 },
      { subject: 'Self-Care', A: pct('selfcare'), fullMark: 100 },
    ].map(item => ({ ...item, A: Math.min(item.A, 100) })); // Cap at 100
  };

  const consistencyData = calculateConsistency();

  // Generate 75 days
  const currentDay = streak + 1; // Assuming streak indicates the current day

  const getDayStatus = (day: number) => {
    if (day < currentDay) return 'completed';
    if (day === currentDay) return 'current';
    return 'upcoming';
  };

  return (
    <>
      <BackButton />
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 space-y-6 pb-12 pt-8 h-full overflow-y-auto scrollbar-none">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Journey</h1>
            <p className="text-white/70 mt-1">75 Days to a better you.</p>
          </div>
          <Link 
            to="/achievements" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors shadow-lg backdrop-blur-md"
          >
            <Trophy className="h-5 w-5" />
          </Link>
        </header>


      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-4 flex flex-col justify-center space-y-1">
          <p className="text-xs text-white/60 font-semibold tracking-wider uppercase">Current Streak</p>
          <p className="text-2xl font-bold text-white">{streak} Days</p>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-4 flex flex-col justify-center space-y-1">
          <p className="text-xs text-white/60 font-semibold tracking-wider uppercase">Best Streak</p>
          <p className="text-2xl font-bold text-white">{streak} Days</p>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-4 flex flex-col justify-center space-y-1">
          <p className="text-xs text-white/60 font-semibold tracking-wider uppercase">Completed</p>
          <p className="text-2xl font-bold text-green-400">{streak} Days</p>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-4 flex flex-col justify-center space-y-1">
          <p className="text-xs text-white/60 font-semibold tracking-wider uppercase">Remaining</p>
          <p className="text-2xl font-bold text-white/60">{Math.max(0, duration - streak)} Days</p>
        </div>
      </div>

      {/* Consistency Chart */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-5">
        <h2 className="text-lg font-bold text-white mb-2">Consistency Profile</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={consistencyData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="You" dataKey="A" stroke="#818cf8" fill="#4f46e5" fillOpacity={0.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">The {duration} Days</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-3 sm:gap-4">
          {Array.from({ length: duration }, (_, i) => i + 1).map((day) => {
            const status = getDayStatus(day);
            const isMilestone = [7, 14, 21, 30, 37, 50, 60, 75].includes(day);

            return (
              <div
                key={day}
                className={cn(
                  "relative aspect-square rounded-xl flex items-center justify-center font-bold text-base sm:text-xl transition-all",
                  status === 'completed' 
                    ? isMilestone ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_0_20px_rgba(251,191,36,0.5)] border border-amber-300' : 'bg-primary text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] border border-primary/50'
                    : status === 'current' 
                      ? 'border-2 border-primary bg-primary/20 text-white animate-pulse shadow-[0_0_20px_rgba(79,70,229,0.6)]' 
                      : isMilestone ? 'bg-black/60 text-amber-500/50 border border-amber-500/30 shadow-[inset_0_0_10px_rgba(251,191,36,0.1)]' : 'bg-black/50 text-white/40 border border-white/5 hover:border-white/20'
                )}
              >
                {isMilestone && status !== 'completed' && status !== 'current' && (
                  <Trophy className="absolute top-1 right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500/30" />
                )}
                {isMilestone && status === 'completed' && (
                  <Trophy className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 text-yellow-200 drop-shadow-md" />
                )}
                {day}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </>
  );
};
