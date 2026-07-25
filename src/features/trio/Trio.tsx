import { useState, useEffect } from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { fetchMyGroups, createGroup, joinGroup } from '../../store/groupSlice';

export const Trio = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { myGroups, isLoading } = useSelector((state: RootState) => state.group);
  const { activeChallenge } = useSelector((state: RootState) => state.challenge);

  const [joinCode, setJoinCode] = useState('');
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    dispatch(fetchMyGroups());
  }, [dispatch]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode) dispatch(joinGroup(joinCode));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName && activeChallenge) dispatch(createGroup({ name: groupName, challengeTemplateId: activeChallenge._id }));
  };

  if (isLoading) {
    return <div className="p-8 text-center text-white/50">Loading groups...</div>;
  }

  if (myGroups.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 md:px-8 space-y-8 pb-12 pt-8 text-center h-full overflow-y-auto scrollbar-none">
        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Social Accountability</h2>
        <p className="text-white/60 mb-8">You are currently flying solo. Research shows you are 65% more likely to complete a challenge if you do it with a group.</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Create a Group</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input 
                type="text" 
                placeholder="Group Name" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
              <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl py-3 transition-colors">
                Create & Get Invite Code
              </button>
            </form>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Join via Code</h3>
            <form onSubmit={handleJoin} className="space-y-4">
              <input 
                type="text" 
                placeholder="6-Character Code" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white uppercase"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                maxLength={6}
              />
              <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl py-3 transition-colors border border-white/10">
                Join Group
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const group = myGroups[0];
  const members = group.members;
  const totalGroupTasks = members.reduce((acc, m) => acc + m.todayCompleted, 0);
  const maxPossibleTasks = members.length * 8;
  const synergyPercentage = maxPossibleTasks > 0 ? Math.round((totalGroupTasks / maxPossibleTasks) * 100) : 0;
  
  // Calculate average streak
  const avgStreak = members.length > 0 ? Math.round(members.reduce((acc, m) => acc + m.streak, 0) / members.length) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-8 space-y-6 pb-12 h-full overflow-y-auto scrollbar-none">
      <header className="pb-2">
        <h2 className="text-2xl font-bold text-white tracking-tight mb-4">The Trio ({group.name})</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full border border-indigo-500/30 w-max">
            <Flame className="h-5 w-5" />
            <span className="font-bold tracking-widest uppercase text-sm">Group Streak: {avgStreak} Days</span>
          </div>

          <div className="flex-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 p-2 flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-amber-400 ml-2" />
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-1000"
                style={{ width: `${synergyPercentage}%` }}
              />
            </div>
            <span className="text-xs font-bold text-amber-400 mr-2 whitespace-nowrap">
              {synergyPercentage}% Synergy
            </span>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {members.map(member => (
          <div key={member.userId._id} className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-5 relative overflow-hidden">
            
            {/* Background Glow based on status */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 pointer-events-none transition-colors ${
              member.todayCompleted === 8 ? 'bg-emerald-500' :
              member.todayCompleted >= 4 ? 'bg-amber-500' : 'bg-red-500'
            }`} />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  {member.userId.displayName}
                </h3>
                <p className="text-xs text-white/50 mt-1 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    member.todayCompleted === 8 ? 'bg-emerald-400' :
                    member.todayCompleted >= 4 ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                  {member.todayCompleted === 8 ? 'COMPLETED' : member.todayCompleted >= 4 ? 'ON TRACK' : 'AT RISK'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">{member.streak}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Day Streak</div>
              </div>
            </div>

            <div className="mb-4 relative z-10">
              <div className="flex justify-between text-xs text-white/60 mb-2 font-semibold">
                <span>Tasks Today</span>
                <span>{member.todayCompleted} / 8</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    member.todayCompleted === 8 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                    member.todayCompleted >= 4 ? 'bg-amber-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${(member.todayCompleted / 8) * 100}%` }}
                />
              </div>
            </div>

          </div>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-white/10 text-center">
         <p className="text-white/50 text-sm mb-4">Invite friends to your group:</p>
         <div className="inline-block bg-white/5 border border-white/10 rounded-xl px-6 py-3 font-mono text-xl tracking-widest text-white cursor-pointer hover:bg-white/10 transition-colors"
           onClick={() => navigator.clipboard.writeText(group.joinCode)}
         >
           {group.joinCode}
         </div>
         <p className="text-white/30 text-xs mt-2">(Click to copy code)</p>
      </div>
    </div>
  );
};
