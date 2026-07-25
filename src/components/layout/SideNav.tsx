import { NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, Users, TrendingUp, Volume2, VolumeX, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { cn } from '../ui/Button';
import type { RootState } from '../../store';
import { toggleZenMode, setChallengeMode } from '../../store/settingsSlice';

const navItems = [
  { name: 'Home',      path: '/home',      icon: Home },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'The Trio',  path: '/trio',      icon: Users, groupOnly: true },
  { name: 'Progress',  path: '/progress',  icon: TrendingUp },
];

export const SideNav = () => {
  const dispatch = useDispatch();
  const zenMode = useSelector((state: RootState) => state.settings.zenMode);
  const challengeMode = useSelector((state: RootState) => state.settings.challengeMode);

  return (
    <div className="w-64 h-[calc(100vh-3rem)] rounded-3xl border border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl flex flex-col p-4 mr-6 overflow-hidden relative">
      
      {/* Profile Section */}
      <div className="flex items-center gap-3 mb-8 px-2 mt-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg border border-white/20">
          K
        </div>
        <div>
          <h3 className="text-sm font-bold text-white/90 leading-tight">Kunika's</h3>
          <p className="text-[11px] text-white/50">Workspace</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.filter(item => !(item.groupOnly && challengeMode === 'solo')).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300',
              isActive 
                ? 'bg-white/10 text-white font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                : 'text-white/60 hover:text-white hover:bg-white/5 font-medium'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Settings / Bottom items */}
      <div className="mt-auto pt-4 border-t border-white/5 space-y-1">
        
        {/* Challenge Mode Toggle */}
        <button
          onClick={() => dispatch(setChallengeMode(challengeMode === 'solo' ? 'group' : 'solo'))}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
        >
          <div className="flex items-center gap-3">
            {challengeMode === 'solo' ? <User className="h-4 w-4 text-emerald-400" /> : <Users className="h-4 w-4 text-amber-400" />}
            <span>Mode</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold bg-white/10 px-2 py-0.5 rounded-full text-white/50">{challengeMode}</span>
        </button>

        {/* Zen Mode Toggle */}
        <button
          onClick={() => dispatch(toggleZenMode())}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
        >
          <div className="flex items-center gap-3">
            {zenMode ? <Volume2 className="h-4 w-4 text-indigo-400" /> : <VolumeX className="h-4 w-4" />}
            <span>Zen Audio</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold bg-white/10 px-2 py-0.5 rounded-full text-white/50">{zenMode ? 'ON' : 'OFF'}</span>
        </button>

      </div>
    </div>
  );
};
