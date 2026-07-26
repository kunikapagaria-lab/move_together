import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles, Plus, Trash2, XCircle, ArrowLeft, Trophy, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { fetchChallengeData, startChallenge, cancelChallenge } from '../../store/challengeSlice';
import { fetchMyGroups } from '../../store/groupSlice';
import { fetchFriends } from '../../store/friendSlice';
import { PRESET_TEMPLATES } from '../../data/presetTemplates';
import type { ChallengePreset } from '../../data/presetTemplates';
import { getAthleteRank } from '../../utils/athleteRanks';
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
        className="mb-10"
      >
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          <span className="text-xs text-white/90 font-medium">Sunday · July 26, 2026</span>
          <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> GP Powered LLM
          </span>
        </div>
        
        <h1 
          style={{ fontFamily: "'Oswald', sans-serif" }} 
          className="text-6xl sm:text-7xl font-black text-white tracking-tight leading-none mb-4 uppercase drop-shadow-md"
        >
          Welcome back,<br />
          <span className="text-white drop-shadow-lg">{user?.displayName} 👋</span>
        </h1>
        <p className="text-sm sm:text-base text-white/80 max-w-sm mx-auto font-medium tracking-wide">
          Keep showing up. Every rep counts.
        </p>
      </motion.div>

      {/* Athlete Rank Progress Card (Bento Box matching user screenshot) */}
      <div 
        onClick={() => setIsRankModalOpen(true)}
        className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 text-left mb-6 relative overflow-hidden cursor-pointer group transition-all shadow-xl hover:bg-white/[0.15]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-white/30 bg-white/10 text-white uppercase tracking-wider">
                  {rank.name}
                </span>
                <span className="text-xs text-white/70 font-medium">Day In - Active</span>
              </div>
              <p className="text-xs sm:text-sm text-white/90 font-medium">
                Building foundation and consistency daily habits. <span className="underline font-bold text-white group-hover:text-white/90">View the Roadmap &rarr;</span>
              </p>
            </div>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); setIsSyncModalOpen(true); }}
            className="self-start sm:self-center flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            <span>⏱</span> Wearable Sync
          </button>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center text-xs text-white/80 mb-1.5 font-medium">
            <span>Progress · {streak} / {activeChallenge.durationDays} days</span>
            <span className="font-bold">{Math.round((streak / activeChallenge.durationDays) * 100)}%</span>
          </div>
          <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-amber-200 to-amber-100 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, Math.round((streak / activeChallenge.durationDays) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4 Bento Stat Cards matching user screenshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
        {/* Card 1: Streak */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 flex flex-col justify-between items-start text-left min-h-[130px] shadow-lg">
          <span className="text-2xl mb-2">🔥</span>
          <div>
            <p className="text-4xl font-black text-white leading-none mb-1">{streak}</p>
            <p className="text-[11px] text-white/70 uppercase tracking-widest font-bold">STREAK</p>
          </div>
        </div>

        {/* Card 2: Today */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 flex flex-col justify-between items-start text-left min-h-[130px] shadow-lg">
          <span className="text-xl mb-2 bg-emerald-400 text-black font-bold p-1 rounded-lg flex items-center justify-center h-7 w-7">✓</span>
          <div>
            <p className="text-4xl font-black text-white leading-none mb-1">{completedCount}/{totalCount}</p>
            <p className="text-[11px] text-white/70 uppercase tracking-widest font-bold">TODAY</p>
          </div>
        </div>

        {/* Card 3: Log Tasks */}
        <div 
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 flex flex-col justify-between items-start text-left min-h-[130px] shadow-lg hover:bg-white/[0.15] transition-colors cursor-pointer group"
          onClick={() => navigate('/dashboard')}
        >
          <span className="text-2xl mb-2">📋</span>
          <div>
            <p className="text-base font-extrabold text-white leading-tight mb-0.5">Log Tasks</p>
            <p className="text-[11px] text-white/70 font-bold tracking-wide group-hover:underline">Dashboard &rarr;</p>
          </div>
        </div>

        {/* Card 4: View Stats */}
        <div 
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 flex flex-col justify-between items-start text-left min-h-[130px] shadow-lg hover:bg-white/[0.15] transition-colors cursor-pointer group"
          onClick={() => navigate('/progress')}
        >
          <span className="text-2xl mb-2">📊</span>
          <div>
            <p className="text-base font-extrabold text-white leading-tight mb-0.5">View Stats</p>
            <p className="text-[11px] text-white/70 font-bold tracking-wide group-hover:underline">Weekly &rarr;</p>
          </div>
        </div>
      </div>

      {/* Weekly Routine & Timetable Banner Card */}
      <div 
        onClick={() => navigate('/routine')}
        className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 sm:p-6 text-left mb-8 relative overflow-hidden cursor-pointer group transition-all shadow-xl hover:bg-white/[0.15]"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0">
              📅
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-white/30 bg-white/10 text-white uppercase tracking-wider mb-1 inline-block">
                Weekly Timetable
              </span>
              <h3 className="font-extrabold text-white text-lg tracking-tight">
                Daily Time-Blocking Routine
              </h3>
              <p className="text-xs text-white/70">
                Structure your day hour by hour. <span className="underline font-bold text-white group-hover:text-white">View & Edit Schedule &rarr;</span>
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-white/20 border border-white/30 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-md">
            <span>⏱</span> Routine Planner
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
