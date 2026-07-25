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
      <div className="h-full w-full flex flex-col pt-2 pb-6 px-2">

      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-3 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 backdrop-blur-xl px-4 py-2.5 flex-shrink-0"
          >
            <Info className="h-3.5 w-3.5 text-indigo-300 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-indigo-300/80 flex-1">
              <span className="font-semibold text-indigo-200">Day {streak + 1} 👋 </span>
              Tap any task to log details. Check it off when done. All 8 = confetti! 🎊
            </p>
            <button onClick={() => setShowTip(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area (2 Columns Bento Grid) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start h-full min-h-0 flex-1">
        
        {/* LEFT COLUMN — Motivation & Journal */}
        <div className="w-full lg:w-[35%] flex-shrink-0 flex flex-col gap-6 h-full pb-4">
          
          {/* Motivation Quote */}
          <GlassCard className="p-8 flex flex-col items-center justify-center text-center flex-shrink-0 min-h-[160px]">
            <h2 
              style={{ fontFamily: "'Oswald', sans-serif" }} 
              className="text-2xl tracking-wide font-bold text-white uppercase mb-2"
            >
              Motivation
            </h2>
            <p className="text-sm text-white/70 italic max-w-[280px]">"{currentQuote}"</p>
          </GlassCard>

          {/* Guided Journal */}
          <GlassCard className="p-8 flex-1 flex flex-col overflow-hidden text-center">
            <h2 
              style={{ fontFamily: "'Oswald', sans-serif" }} 
              className="text-2xl tracking-wide font-bold text-white uppercase mb-3"
            >
              Reflection
            </h2>
            <p className="text-xs text-white/60 mb-4 max-w-[280px] mx-auto leading-relaxed">"{currentPrompt}"</p>
            <textarea
              value={journalText}
              onChange={e => setJournalText(e.target.value)}
              placeholder="Tap here to reflect on your day..."
              className="w-full flex-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-sm text-white/90 placeholder-white/20 p-4 resize-none outline-none focus:border-white/30 transition-all text-center leading-relaxed"
            />
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={() => setJournalText('')} className="text-xs text-white/40 hover:text-white/70 transition-colors uppercase tracking-widest font-bold">Clear</button>
              <button 
                onClick={handleJournalSave}
                className="text-xs font-bold uppercase tracking-widest bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full border border-white/20 transition-all">
                Save
              </button>
            </div>
          </GlassCard>

        </div>

        {/* RIGHT COLUMN — Tasks */}
        <GlassCard className="flex-1 w-full h-full flex flex-col text-center">
          <div className="p-6 pb-2 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
            <div className="text-left">
              <h2 
                style={{ fontFamily: "'Oswald', sans-serif" }} 
                className="text-3xl tracking-wide font-bold text-white uppercase"
              >
                Today's Tasks
              </h2>
              <p className="text-xs text-white/50 mt-0.5 uppercase tracking-widest">Complete all {activeChallenge?.tasks.length || 8} before midnight</p>
            </div>

            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Zap className="w-4 h-4 text-yellow-300" /> Wearable Sync
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center items-center h-full text-white/50 text-sm">Loading tasks...</div>
            ) : !activeChallenge ? (
              <div className="flex flex-col justify-center items-center h-full text-white/50 text-sm gap-4">
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
