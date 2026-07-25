import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Flame, Activity, X } from 'lucide-react';
import type { AppDispatch, RootState } from '../../store';
import { fetchAllChallenges, fetchChallengeLogs } from '../../store/historySlice';
import type { Challenge } from '../../store/challengeSlice';
import { BackButton } from '../../components/ui/BackButton';

export const Journey = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { challenges, selectedChallengeLogs, isLoading } = useSelector((state: RootState) => state.history);
  
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [selectedLog, setSelectedLog] = useState<any | null>(null); // DailyLog

  useEffect(() => {
    dispatch(fetchAllChallenges());
  }, [dispatch]);

  const handleSelectChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    dispatch(fetchChallengeLogs(challenge._id));
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'failed': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'cancelled': return 'bg-white/10 text-white/50 border-white/20';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  return (
    <>
      <BackButton />
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-8 space-y-8 pb-12 h-full overflow-y-auto scrollbar-none">
        <header className="pt-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Journey</h1>
        <p className="text-white/60 mt-1">Look back on every challenge, every day, and every journal entry.</p>
      </header>

      {isLoading && challenges.length === 0 && (
        <div className="text-white/40 text-center py-8">Loading history...</div>
      )}

      {/* Main Layout */}
      {!selectedChallenge ? (
        // LIST OF CHALLENGES
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          {challenges.map((challenge, idx) => (
             <div 
               key={challenge._id} 
               onClick={() => handleSelectChallenge(challenge)}
               className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-6 cursor-pointer hover:border-indigo-500/50 transition-colors group relative overflow-hidden"
             >
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Flame className="w-24 h-24" />
               </div>
               
               <div className="relative z-10 flex justify-between items-start mb-4">
                 <div>
                   <h3 className="font-bold text-white text-lg">Challenge #{challenges.length - idx}</h3>
                   <p className="text-xs text-white/50">{new Date(challenge.startDate).toLocaleDateString()} - {challenge.durationDays} Days</p>
                 </div>
                 <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-lg border ${getStatusColor(challenge.status)}`}>
                   {challenge.status}
                 </span>
               </div>
               
               <div className="relative z-10 text-sm text-white/70">
                 {challenge.tasks.length} Daily Tasks
               </div>
             </div>
          ))}
          {challenges.length === 0 && !isLoading && (
            <div className="col-span-full text-center py-12 text-white/40 bg-white/5 rounded-3xl border border-white/5">
              You haven't started any challenges yet.
            </div>
          )}
        </div>
      ) : (
        // CHALLENGE DETAIL VIEW
        <div className="mt-8">
           <button 
             onClick={() => setSelectedChallenge(null)}
             className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest flex items-center gap-2 mb-6"
           >
             &larr; Back to all challenges
           </button>
           
           <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-3xl p-6 md:p-10 mb-8">
             <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
               <div>
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                   <Calendar className="h-6 w-6 text-indigo-400" />
                   Challenge {selectedChallenge.durationDays} Days
                 </h2>
                 <p className="text-white/50 text-sm mt-1">Started {new Date(selectedChallenge.startDate).toLocaleDateString()}</p>
               </div>
               <span className={`text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-xl border ${getStatusColor(selectedChallenge.status)}`}>
                 {selectedChallenge.status}
               </span>
             </div>

             {isLoading ? (
               <div className="text-white/40 text-center py-12">Loading days...</div>
             ) : (
               <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-12 gap-2">
                 {/* Generate grid of days based on duration */}
                 {Array.from({ length: selectedChallenge.durationDays }).map((_, i) => {
                   const dayNumber = i + 1;
                   // Find if there is a log for this day number.
                   // Since we sort logs chronologically, we can try to map them.
                   // A safer way is to check the date, but for simplicity we match by index since it's 1 log per day.
                   // In reality, logs might skip if failed, so we'll just map logs to days consecutively.
                   const log = selectedChallengeLogs[i]; 
                   
                   const isCompleted = log && log.completedTaskIds.length === selectedChallenge.tasks.length;
                   const isPartial = log && log.completedTaskIds.length > 0 && !isCompleted;
                   
                   let blockColor = 'bg-white/5 border-white/10 hover:border-white/30'; // Future or unlogged
                   if (isCompleted) blockColor = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30';
                   else if (isPartial) blockColor = 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30';
                   else if (log) blockColor = 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30'; // Log exists but 0 tasks

                   return (
                     <button
                       key={i}
                       onClick={() => log && setSelectedLog(log)}
                       disabled={!log}
                       className={`aspect-square rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${blockColor} ${!log ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-lg'}`}
                     >
                       {dayNumber}
                     </button>
                   );
                 })}
               </div>
             )}
           </div>
        </div>
      )}

      {/* DAY DETAIL MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#12101a] border border-white/10 shadow-2xl rounded-3xl p-6 md:p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                 <div>
                   <h2 className="text-2xl font-bold text-white mb-1">
                     Daily Log
                   </h2>
                   <p className="text-white/50 text-sm font-mono">{selectedLog.date}</p>
                 </div>
                 <button onClick={() => setSelectedLog(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="space-y-6">
                {/* Journal */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Reflection
                  </h3>
                  {selectedLog.journalEntry ? (
                    <p className="text-white/80 leading-relaxed italic">"{selectedLog.journalEntry}"</p>
                  ) : (
                    <p className="text-white/30 italic">No journal entry recorded for this day.</p>
                  )}
                </div>
                
                {/* Tasks */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" /> Completed Tasks
                  </h3>
                  
                  <div className="space-y-2">
                    {selectedChallenge?.tasks.map((task: any) => {
                      const isDone = selectedLog.completedTaskIds.includes(task.id);
                      return (
                        <div key={task.id} className={`flex justify-between items-center p-3 rounded-xl border ${isDone ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-black/20 border-white/5'}`}>
                          <span className={`text-sm ${isDone ? 'text-white' : 'text-white/40 line-through'}`}>{task.title}</span>
                          {isDone ? (
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Done</span>
                          ) : (
                            <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Missed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </>
  );
};

// Simple stub for missing import CheckSquare
const CheckSquare = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
);
