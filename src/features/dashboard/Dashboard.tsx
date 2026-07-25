import { useState, useEffect } from 'react';
import { X, Info, Trophy, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { fetchChallengeData, updateJournal } from '../../store/challengeSlice';
import { Today } from '../tasks/Today';
import { WearableSyncModal } from '../integrations/WearableSyncModal';

const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gradient-to-b from-white/10 to-transparent backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl shadow-black/50 relative overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] ${className}`}>
    {children}
  </div>
);


const MINDFUL_PROMPTS = [
  "What was the hardest urge you resisted today, and how did it feel to win?",
  "How did your body feel during today's workouts? Any new strengths?",
  "What is one small win from today that you're genuinely proud of?",
  "Did you face any unexpected mental resistance today? How did you adapt?",
  "What are you most grateful for today as you build your discipline?",
  "How is your energy level compared to day 1?",
  "What did you read today, and what was the most impactful takeaway?",
  "What was the most peaceful or grounded moment of your day?",
  "How did you push past your comfort zone today?",
  "What is one thing you learned about yourself today?"
];

const MOTIVATIONAL_QUOTES = [
  "Don't stop when you're tired. Stop when you're done.",
  "Discipline equals freedom.",
  "Embrace the suck. That's where the growth happens.",
  "Your mind will quit 100 times before your body does.",
  "Small daily improvements over time lead to stunning results.",
  "The only bad workout is the one that didn't happen.",
  "Success is what happens when you survive all your mistakes."
];

import { BackButton } from '../../components/ui/BackButton';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const [showTip, setShowTip] = useState(true);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { streak, todayLog, activeChallenge, isLoading } = useSelector((state: RootState) => state.challenge);

  useEffect(() => {
    dispatch(fetchChallengeData());
  }, [dispatch]);

  const [journalText, setJournalText] = useState(todayLog?.journalEntry || '');

  useEffect(() => {
    if (todayLog?.journalEntry) {
      setJournalText(todayLog.journalEntry);
    }
  }, [todayLog?.journalEntry]);

  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const currentPrompt = MINDFUL_PROMPTS[dayOfYear % MINDFUL_PROMPTS.length];
  const currentQuote = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];

  const handleJournalSave = () => {
    dispatch(updateJournal(journalText));
  };

  if (!activeChallenge) {
    return (
      <>
        <BackButton />
        <div className="w-full max-w-4xl mx-auto px-4 pt-8 h-full flex flex-col items-center justify-center text-center">
          <Trophy className="h-20 w-20 text-white/10 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Active Challenge</h2>
          <p className="text-white/50 mb-6">Start a challenge from the Home page to access your Dashboard.</p>
          <button 
            onClick={() => navigate('/home')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Go to Home
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <BackButton />
      <div className="max-w-6xl mx-auto w-full flex flex-col px-4 md:px-8 py-6 flex-1 min-h-0">

      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-3 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 backdrop-blur-xl px-4 py-3 mb-6 flex-shrink-0"
          >
            <Info className="h-4 w-4 text-indigo-300 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-300/90 flex-1">
              <span className="font-semibold text-indigo-200">Day {streak + 1} 👋 </span>
              Tap any task to log details. Check it off when done. All 8 = confetti! 🎊
            </p>
            <button onClick={() => setShowTip(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area (Balanced Centered Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full my-auto">
        
        {/* LEFT COLUMN — Motivation & Journal (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Motivation Quote */}
          <GlassCard className="p-6 flex flex-col items-center justify-center text-center flex-shrink-0 min-h-[140px]">
            <h2 
              style={{ fontFamily: "'Oswald', sans-serif" }} 
              className="text-xl tracking-wide font-bold text-white uppercase mb-1.5"
            >
              Motivation
            </h2>
            <p className="text-xs text-white/70 italic max-w-[260px]">"{currentQuote}"</p>
          </GlassCard>

          {/* Guided Journal */}
          <GlassCard className="p-6 flex-1 flex flex-col overflow-hidden text-center min-h-[280px]">
            <h2 
              style={{ fontFamily: "'Oswald', sans-serif" }} 
              className="text-xl tracking-wide font-bold text-white uppercase mb-2"
            >
              Reflection
            </h2>
            <p className="text-[11px] text-white/60 mb-3 max-w-[260px] mx-auto leading-relaxed">"{currentPrompt}"</p>
            <textarea
              value={journalText}
              onChange={e => setJournalText(e.target.value)}
              placeholder="Tap here to reflect on your day..."
              className="w-full flex-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/90 placeholder-white/20 p-3.5 resize-none outline-none focus:border-white/30 transition-all text-center leading-relaxed min-h-[100px]"
            />
            <div className="flex justify-center gap-4 mt-3">
              <button onClick={() => setJournalText('')} className="text-[11px] text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest font-bold">Clear</button>
              <button 
                onClick={handleJournalSave}
                className="text-[11px] font-bold uppercase tracking-widest bg-white/20 hover:bg-white/30 text-white px-5 py-1.5 rounded-full border border-white/20 transition-all">
                Save
              </button>
            </div>
          </GlassCard>

        </div>

        {/* RIGHT COLUMN — Tasks Grid (8 Cols) */}
        <GlassCard className="lg:col-span-8 w-full flex flex-col text-center">
          <div className="p-5 pb-3 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
            <div className="text-left">
              <h2 
                style={{ fontFamily: "'Oswald', sans-serif" }} 
                className="text-2xl tracking-wide font-bold text-white uppercase"
              >
                Today's Tasks
              </h2>
              <p className="text-[11px] text-white/50 mt-0.5 uppercase tracking-widest">Complete all {activeChallenge?.tasks.length || 8} before midnight</p>
            </div>

            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300" /> Wearable Sync
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center items-center h-48 text-white/50 text-sm">Loading tasks...</div>
            ) : !activeChallenge ? (
              <div className="flex flex-col justify-center items-center h-48 text-white/50 text-sm gap-4">
                <p>You haven't started a challenge yet.</p>
                <button 
                  onClick={() => window.location.href = '/home'}
                  className="bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-xl border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
                >
                  Go to Home to Start
                </button>
              </div>
            ) : (
              <Today />
            )}
          </div>
        </GlassCard>

      </div>
      </div>

      {/* Wearable Sync Modal */}
      <WearableSyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
      />
    </>
  );
};
