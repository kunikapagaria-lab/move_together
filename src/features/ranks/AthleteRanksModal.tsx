import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle2, ShieldCheck, Trophy, Sparkles } from 'lucide-react';
import { ATHLETE_RANKS, getAthleteRank } from '../../utils/athleteRanks';

interface AthleteRanksModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
}

export const AthleteRanksModal = ({ isOpen, onClose, currentStreak }: AthleteRanksModalProps) => {
  if (!isOpen) return null;

  const currentRank = getAthleteRank(currentStreak);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#14121f] border border-white/10 shadow-2xl rounded-2xl p-5 w-full max-w-md relative overflow-hidden flex flex-col"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-4 shrink-0">
            <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight leading-none">Athlete Rank Roadmap</h2>
              <p className="text-[11px] text-white/50 mt-1">Streak: <span className="font-mono font-bold text-amber-400">{currentStreak} Days</span></p>
            </div>
          </div>

          {/* Rank Tier List */}
          <div className="space-y-2 overflow-y-auto max-h-[55vh] custom-scrollbar pr-0.5 flex-1">
            {ATHLETE_RANKS.map((rank) => {
              const isCurrent = rank.name === currentRank.name;
              const isUnlocked = currentStreak >= rank.minStreak;
              const daysNeeded = rank.minStreak - currentStreak;

              return (
                <div 
                  key={rank.name}
                  className={`rounded-xl p-3 border transition-all relative overflow-hidden ${
                    isCurrent 
                      ? 'bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                      : isUnlocked 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-black/30 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{rank.badge}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-white text-xs tracking-wide">{rank.name}</h3>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white/60">
                            {rank.minStreak === 0 ? '0–7d' : rank.maxStreak >= 999 ? '75d+' : `${rank.minStreak}–${rank.maxStreak}d`}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/50 truncate mt-0.5">{rank.description}</p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                          <Sparkles className="w-2.5 h-2.5" /> ACTIVE
                        </span>
                      ) : isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-2.5 h-2.5" /> UNLOCKED
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-rose-400" />
                          <span className="text-[9px] text-rose-400/90 font-mono font-semibold">
                            +{daysNeeded}d
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-white/5 text-center shrink-0">
            <p className="text-[10px] text-white/40 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" /> Complete tasks daily to rank up!
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
