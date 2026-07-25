import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckSquare, Users, Sparkles, Plus, Trash2, XCircle, ArrowLeft, Zap, Trophy, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { fetchChallengeData, startChallenge, cancelChallenge } from '../../store/challengeSlice';
import { fetchMyGroups } from '../../store/groupSlice';
import { fetchFriends } from '../../store/friendSlice';
import { PRESET_TEMPLATES } from '../../data/presetTemplates';
import type { ChallengePreset } from '../../data/presetTemplates';
import { getAthleteRank, getNextRankProgress } from '../../utils/athleteRanks';
import { WearableSyncModal } from '../integrations/WearableSyncModal';
import { AthleteRanksModal } from '../ranks/AthleteRanksModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "Small daily improvements are the key to staggering long-term results.",
  "The body achieves what the mind believes.",
  "Consistency is what transforms average into excellence.",
];
const today = new Date();
const quote = QUOTES[today.getDate() % QUOTES.length];

const defaultTasks = [
  { id: 't1', title: 'Weight Training', iconName: 'Dumbbell', color: 'bg-orange-500' },
  { id: 't2', title: 'Cardio / Walk', iconName: 'Activity', color: 'bg-cyan-500' },
  { id: 't3', title: 'Protein + Fibre', iconName: 'Utensils', color: 'bg-emerald-400' },
  { id: 't4', title: 'Fruit', iconName: 'Apple', color: 'bg-rose-400' },
  { id: 't5', title: 'Read 10–15 Pages', iconName: 'BookOpen', color: 'bg-violet-400' },
  { id: 't6', title: 'Self-Care', iconName: 'Sparkles', color: 'bg-pink-400' },
  { id: 't7', title: 'Water Intake', iconName: 'Droplets', color: 'bg-sky-400' },
  { id: 't8', title: 'Progress Photo', iconName: 'Camera', color: 'bg-yellow-400' }
];

import { useToast } from '../../components/ui/Toast';

export const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showError, showSuccess } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const { streak, todayLog, activeChallenge, isLoading } = useSelector((state: RootState) => state.challenge);
  const { myGroups } = useSelector((state: RootState) => state.group);
  const { friends } = useSelector((state: RootState) => state.friend);

  // Setup State
  const [showSetup, setShowSetup] = useState(false);
  const [duration, setDuration] = useState(75);
  const [tasks, setTasks] = useState(defaultTasks);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [invitedFriendIds, setInvitedFriendIds] = useState<string[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('grit-75');

  // Sync, Rank & Cancel Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const rank = getAthleteRank(streak);
  const rankProgress = getNextRankProgress(streak);

  useEffect(() => {
    dispatch(fetchChallengeData());
    dispatch(fetchMyGroups());
    dispatch(fetchFriends());
  }, [dispatch]);

  const handleApplyPreset = (preset: ChallengePreset) => {
    setSelectedPresetId(preset.id);
    setDuration(preset.durationDays);
    setTasks(preset.tasks.map(t => ({
      id: t.id,
      title: t.title,
      iconName: t.iconName,
      color: t.color
    })));
  };

  const handleStart = async () => {
    if (tasks.length === 0) return showError('Please add at least one task to your challenge!');
    try {
      await dispatch(startChallenge({ durationDays: duration, tasks, invitedFriendIds })).unwrap();
      await dispatch(fetchChallengeData());
      setShowSetup(false);
      showSuccess('Challenge started successfully! Welcome to Day 1.');
    } catch (err: any) {
      showError(typeof err === 'string' ? err : err?.message || 'Failed to start challenge. Please retry!');
    }
  };

  const handleCancelClick = () => {
    setIsCancelModalOpen(true);
  };

  const executeCancel = () => {
    dispatch(cancelChallenge());
    setIsCancelModalOpen(false);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    setTasks([...tasks, {
      id: `t${Date.now()}`,
      title: newTaskTitle,
      iconName: 'CheckCircle',
      color: 'bg-indigo-500'
    }]);
    setNewTaskTitle('');
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  if (isLoading) {
    return <div className="p-8 text-center text-white/50">Loading...</div>;
  }

  // ==========================================
  // STATE A: NO ACTIVE CHALLENGE
  // ==========================================
  if (!activeChallenge) {
    if (!showSetup) {
      return (
        <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col items-center pt-8 h-full overflow-y-auto scrollbar-none pb-12 text-center relative">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full text-xs text-white/70 mb-5">
              <Sparkles className="h-3 w-3 text-violet-300" />
              Ready to start?
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3">
              Welcome back,<br />
              <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">{user?.displayName} 👋</span>
            </h1>
            <p className="text-sm text-white/50 max-w-xs mx-auto leading-relaxed italic mb-8">
              "{quote}"
            </p>
            
            <button 
              onClick={() => setShowSetup(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-[1.02] active:scale-95 text-white font-bold text-xl rounded-2xl px-8 py-4 shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all"
            >
              START A CHALLENGE
            </button>
          </motion.div>
        </div>
      );
    }

    return (
      <>
        <button 
          onClick={() => setShowSetup(false)}
          className="absolute top-24 left-4 sm:left-8 z-40 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-full p-2 text-white/70 hover:text-white transition-all group"
          aria-label="Go Back"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="w-full max-w-2xl mx-auto px-4 md:px-8 pb-12 h-full overflow-y-auto scrollbar-none text-center">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 mt-8">Build Your Challenge</h1>
        <p className="text-white/50 mb-6">Select an athletic program preset or customize your own rules.</p>

        {/* Preset Program Selector */}
        <div className="mb-8 text-left">
          <label className="block text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Athletic Preset Programs
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            {PRESET_TEMPLATES.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all relative overflow-hidden ${
                    isSelected 
                      ? 'bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.01]' 
                      : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white">
                      {preset.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-white/60">{preset.durationDays} Days</span>
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">{preset.title}</h4>
                  <p className="text-[11px] text-white/50 leading-snug line-clamp-2">{preset.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-6 text-left mb-6">
          <label className="block text-sm font-bold text-white/70 uppercase tracking-widest mb-3">Challenge Duration (Days)</label>
          <input 
            type="number" 
            min="1" 
            max="365"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xl font-bold font-mono"
          />
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-6 text-left mb-8">
          <label className="block text-sm font-bold text-white/70 uppercase tracking-widest mb-4">Daily Tasks</label>
          
          <div className="space-y-3 mb-4">
            {tasks.map(t => (
              <div key={t.id} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl px-4 py-3">
                <span className="text-white font-medium">{t.title}</span>
                <button onClick={() => removeTask(t.id)} className="text-rose-400 hover:text-rose-300 p-1"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. Meditate for 10 minutes"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            />
            <button type="submit" className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 flex items-center justify-center transition-colors">
              <Plus className="h-5 w-5" />
            </button>
          </form>
        </div>

        {/* Invite Friends Section */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-6 text-left mb-8">
          <label className="block text-sm font-bold text-white/70 uppercase tracking-widest mb-4">Invite Friends (Group Challenge)</label>
          {friends.filter(f => f.status === 'accepted').length === 0 ? (
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
              <p className="text-white/50 text-sm mb-3">You don't have any friends yet!</p>
              <button 
                onClick={() => navigate('/friends')}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Users className="h-4 w-4" /> Find Friends
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {friends.filter(f => f.status === 'accepted').map(friend => {
                const isInvited = invitedFriendIds.includes(friend.recipient._id === user?._id ? friend.requester._id : friend.recipient._id);
                const friendId = friend.recipient._id === user?._id ? friend.requester._id : friend.recipient._id;
                const friendName = friend.recipient._id === user?._id ? friend.requester.displayName : friend.recipient.displayName;

                return (
                  <button
                    key={friend._id}
                    onClick={() => {
                      if (isInvited) {
                        setInvitedFriendIds(prev => prev.filter(id => id !== friendId));
                      } else {
                        setInvitedFriendIds(prev => [...prev, friendId]);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                      isInvited 
                        ? 'bg-indigo-500/20 border-indigo-500 text-white' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                      {friendName.charAt(0).toUpperCase()}
                    </div>
                    {friendName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => setShowSetup(false)}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold text-xl rounded-2xl py-4 transition-all"
          >
            CANCEL
          </button>
          <button 
            onClick={handleStart}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:scale-[1.02] active:scale-95 text-white font-bold text-xl rounded-2xl py-4 shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all"
          >
            START
          </button>
        </div>
      </div>
    </>
  );
  }

  // ==========================================
  // STATE B: ACTIVE CHALLENGE (COMMAND CENTER)
  // ==========================================
  const completedCount = todayLog?.completedTaskIds?.length || 0;
  const totalCount = activeChallenge.tasks.length;
  
  // Group logic for widget
  const group = myGroups[0];
  const groupAvgStreak = group && group.members.length > 0 
    ? Math.round(group.members.reduce((acc, m) => acc + m.streak, 0) / group.members.length) 
    : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 flex flex-col items-center pt-8 h-full overflow-y-auto scrollbar-none pb-12 text-center">
      
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full text-xs text-white/70">
            <Sparkles className="h-3 w-3 text-violet-300" />
            Day {streak + 1} of {activeChallenge.durationDays}
          </div>

          <div className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-xl px-3 py-1.5 rounded-full text-xs text-cyan-300 font-bold shadow-lg shadow-cyan-950/50">
            ❄️ {(activeChallenge.freezeDaysAllowed || 5) - (activeChallenge.freezeDaysUsed || 0)}/5 Freezes Left
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3">
          Welcome back,<br />
          <span className="text-white font-extrabold">{user?.displayName} 👋</span>
        </h1>
        <p className="text-xs text-white/70 max-w-xs mx-auto leading-relaxed italic">
          "{quote}"
        </p>
      </motion.div>

      {/* Athlete Rank Progress Card */}
      <div 
        onClick={() => setIsRankModalOpen(true)}
        className="w-full bg-black/60 backdrop-blur-2xl neon-border-cyan rounded-2xl p-5 text-left mb-6 relative overflow-hidden cursor-pointer group transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{rank.badge}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-lg tracking-tight group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  {rank.name} <Trophy className="w-4 h-4 text-amber-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold">
                  Day {streak} Active
                </span>
              </div>
              <p className="text-xs text-white/60">{rank.description} <span className="text-amber-400 text-[10px] underline ml-1 font-bold">View Tier Roadmap &rarr;</span></p>
            </div>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); setIsSyncModalOpen(true); }}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-lg transition-all z-10"
          >
            <Zap className="w-4 h-4 text-yellow-300" /> Wearable Sync
          </button>
        </div>

        {/* Level Up Progress Bar */}
        {rankProgress.nextRank && (
          <div>
            <div className="flex justify-between items-center text-[11px] text-white/50 mb-1 font-mono">
              <span>Progress to {rankProgress.nextRank.badge} {rankProgress.nextRank.name}</span>
              <span>{rankProgress.daysLeft} days remaining</span>
            </div>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-indigo-400 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${rankProgress.progressPct}%` }}
              />
            </div>
          </div>
        )}

        <button 
          onClick={() => setIsSyncModalOpen(true)}
          className="sm:hidden w-full mt-3 flex items-center justify-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs py-2 rounded-xl shadow-lg transition-all"
        >
          <Zap className="w-4 h-4 text-yellow-300" /> Wearable Sync
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
        <div className="bg-black/40 border border-white/10 shadow-xl rounded-2xl p-4 flex flex-col items-center justify-center">
          <Flame className="h-6 w-6 text-amber-500 mb-2" />
          <p className="text-3xl font-black text-white">{streak}</p>
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Streak</p>
        </div>
        <div className="bg-black/40 border border-white/10 shadow-xl rounded-2xl p-4 flex flex-col items-center justify-center">
          <CheckSquare className="h-6 w-6 text-emerald-500 mb-2" />
          <p className="text-3xl font-black text-white">{completedCount}/{totalCount}</p>
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Today</p>
        </div>
        <div className="bg-black/40 border border-white/10 shadow-xl rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:border-indigo-500/50 transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 z-0" />
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <p className="text-sm md:text-base font-bold text-white mb-1">Log Tasks</p>
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Dashboard &rarr;</p>
          </div>
        </div>
        <div className="bg-black/40 border border-white/10 shadow-xl rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group hover:border-emerald-500/50 transition-colors cursor-pointer" onClick={() => navigate('/progress')}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 z-0" />
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <p className="text-sm md:text-base font-bold text-white mb-1">View Stats</p>
            <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest">Progress &rarr;</p>
          </div>
        </div>
      </div>

      {/* Athletic Crew Leaderboard */}
      {group ? (
        <div className="w-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-5 text-left mb-8 relative overflow-hidden cursor-pointer hover:border-indigo-500/30 transition-all" onClick={() => navigate('/friends')}>
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users className="w-32 h-32" />
           </div>
           <div className="relative z-10 flex justify-between items-center mb-4">
             <div>
               <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">Athletic Crew Leaderboard</span>
               <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                 <ShieldCheck className="h-5 w-5 text-indigo-400" /> {group.name}
               </h3>
             </div>
             <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
               <Trophy className="w-3 h-3 text-amber-400" /> {groupAvgStreak} Day Crew Avg
             </span>
           </div>
           
           <div className="relative z-10 space-y-2.5">
             {group.members.map((member, idx) => (
               <div key={member.userId._id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-3">
                 <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-white/40 w-4">{idx + 1}.</span>
                    <div className="h-8 w-8 rounded-full bg-indigo-500/30 border border-indigo-500/40 flex items-center justify-center font-bold text-xs text-white">
                      {member.userId.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-white text-sm block">{member.userId.displayName}</span>
                      <span className="text-[10px] text-white/40">{member.streak} Day Streak</span>
                    </div>
                 </div>
                 <div className="text-right">
                   <div className="text-sm font-bold text-emerald-400">{member.todayCompleted}/{totalCount} Completed</div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      ) : (
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-center mb-8 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => navigate('/friends')}>
          <Users className="h-8 w-8 text-white/30 mx-auto mb-2" />
          <h3 className="font-bold text-white">Form an Athletic Crew</h3>
          <p className="text-sm text-white/50">Invite friends to share challenges and hold each other accountable on leaderboards.</p>
        </div>
      )}

      {/* Danger Zone */}
      <div className="mt-8 pt-8 border-t border-white/10 w-full">
         <button onClick={handleCancelClick} className="flex items-center justify-center gap-2 text-rose-500 hover:text-rose-400 mx-auto text-sm font-bold uppercase tracking-widest transition-colors">
           <XCircle className="h-4 w-4" /> Cancel Challenge
         </button>
      </div>

      {/* Modals */}
      <WearableSyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
      />

      <AthleteRanksModal 
        isOpen={isRankModalOpen} 
        onClose={() => setIsRankModalOpen(false)} 
        currentStreak={streak} 
      />

      <ConfirmModal 
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={executeCancel}
        title="Cancel Active Challenge?"
        message="Are you sure you want to cancel your current challenge? You will lose all active streak progress."
        confirmText="Cancel Challenge"
        cancelText="Keep Going"
        type="danger"
      />
    </div>
  );
};
