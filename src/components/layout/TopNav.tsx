import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Users, Volume2, VolumeX, User, LogOut, Key, Camera, Book, Calendar } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { cn } from '../ui/Button';
import type { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/authSlice';
import { toggleZenMode } from '../../store/settingsSlice';
import { getAthleteRank, ATHLETE_RANKS, type AthleteRank } from '../../utils/athleteRanks';

const navItems = [
  { name: 'Home',      path: '/home',      icon: Home },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Friends',   path: '/friends',   icon: Users },
  { name: 'Routine',   path: '/routine',   icon: Calendar },
  { name: 'Journey',   path: '/journey',   icon: Book },
];

export const TopNav = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const zenMode = useSelector((state: RootState) => state.settings.zenMode);
  const { user } = useSelector((state: RootState) => state.auth);
  const { friends } = useSelector((state: RootState) => state.friend);
  const { notifications } = useSelector((state: RootState) => state.notification);
  const { streak } = useSelector((state: RootState) => state.challenge);
  
  const rank = getAthleteRank(streak);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth');
  };

  return (
    <>
      <nav className="w-full py-4 sm:py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/home')}>
          <div className="h-9 w-9 sm:h-10 sm:w-10 bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-lg sm:text-xl shadow-md">
            🏃
          </div>
          <span className="text-white font-black tracking-wider text-base sm:text-xl uppercase font-sans">MOVE TOGETHER</span>
        </div>

        {/* Center Nav (Desktop & Tablet) */}
        <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-inner">
          {navItems.map((item) => {
            let hasBadge = false;
            
            if (item.name === 'Friends') {
              const pendingRequests = friends.filter(f => f.status === 'pending' && f.recipient._id === user?._id).length;
              const pendingInvites = notifications.filter(n => n.type === 'group_invite' && !n.read).length;
              if (pendingRequests > 0 || pendingInvites > 0) hasBadge = true;
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "relative flex items-center justify-center px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200",
                  isActive 
                    ? "text-white bg-white/20 shadow-md border border-white/20" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <>
                  <span className="tracking-wide">{item.name}</span>
                  
                  {hasBadge && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full shadow-sm animate-pulse" />
                  )}
                </>
              </NavLink>
            );
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 relative" ref={dropdownRef}>
          {/* Athlete Rank Pill with Hover Tooltip (No Popup Box) */}
          <div className="relative group">
            <div 
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold text-white tracking-widest uppercase transition-all cursor-pointer shadow-md"
            >
              <span>{rank.badge}</span>
              <span>{rank.name}</span>
            </div>

            {/* Rank Tooltip on Hover */}
            <div className="absolute top-full right-0 mt-2 w-64 bg-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50 text-left">
              <div className="border-b border-white/10 pb-2 mb-2">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Athlete Rank Tiers</p>
                <p className="text-[10px] text-white/60">Active: {rank.badge} {rank.name} ({streak} Days)</p>
              </div>

              <div className="space-y-1.5">
                {ATHLETE_RANKS.map((r: AthleteRank) => {
                  const isCurrent = r.name === rank.name;
                  return (
                    <div 
                      key={r.name}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        isCurrent 
                          ? 'bg-white/20 border-white text-white font-bold shadow-md' 
                          : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{r.badge}</span>
                        <div>
                          <p className="font-extrabold text-[11px] text-white">{r.name}</p>
                          <p className="text-[9px] text-white/50">{r.minStreak}-{r.maxStreak === 999 ? '75+' : r.maxStreak} Days</p>
                        </div>
                      </div>
                      {isCurrent && <span className="text-[9px] bg-white text-black font-extrabold px-1.5 py-0.5 rounded-full">CURRENT</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Profile Dropdown Toggle */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            {user?.displayName?.charAt(0).toUpperCase() || <User className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-12 right-0 w-56 bg-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 z-50">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-bold text-white">{user?.displayName}</p>
                <p className="text-xs text-white/50 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button className="w-full px-4 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors">
                  <Camera className="h-4 w-4" /> Change Avatar
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors">
                  <Key className="h-4 w-4" /> Change Password
                </button>
                <button 
                  onClick={() => dispatch(toggleZenMode())}
                  className="w-full px-4 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {zenMode ? <Volume2 className="h-4 w-4 text-white" /> : <VolumeX className="h-4 w-4" />} 
                    Sound Effects
                  </span>
                  <span className={cn("text-xs font-bold", zenMode ? "text-white" : "text-white/30")}>
                    {zenMode ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              <div className="pt-1 border-t border-white/10">
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>

    {/* MOBILE BOTTOM GLASS NAVIGATION BAR */}
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-2xl border-t border-white/20 px-3 py-2 flex items-center justify-around shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => {
        let hasBadge = false;
        if (item.name === 'Friends') {
          const pendingRequests = friends.filter(f => f.status === 'pending' && f.recipient._id === user?._id).length;
          const pendingInvites = notifications.filter(n => n.type === 'group_invite' && !n.read).length;
          if (pendingRequests > 0 || pendingInvites > 0) hasBadge = true;
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200",
              isActive 
                ? "text-white bg-white/20 font-bold border border-white/20" 
                : "text-white/60 hover:text-white"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-5 w-5 mb-0.5", isActive ? "text-white" : "")} />
                <span className="text-[10px] tracking-wide font-medium">{item.name}</span>
                {hasBadge && (
                  <span className="absolute top-1 right-2 w-2 h-2 bg-white rounded-full animate-pulse shadow-sm" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  </>
);
};
