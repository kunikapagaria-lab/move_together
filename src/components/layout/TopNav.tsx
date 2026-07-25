import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Users, Volume2, VolumeX, User, LogOut, Key, Camera, Book, Flame } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { cn } from '../ui/Button';
import type { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/authSlice';
import { toggleZenMode } from '../../store/settingsSlice';
import { getAthleteRank } from '../../utils/athleteRanks';
import { AthleteRanksModal } from '../../features/ranks/AthleteRanksModal';

const navItems = [
  { name: 'Home',      path: '/home',      icon: Home },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Friends',   path: '/friends',   icon: Users },
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
  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
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
      <nav className="fixed top-0 w-full bg-[#0d0a1b]/80 backdrop-blur-2xl border-b border-cyan-500/20 z-50 shadow-[0_4px_30px_rgba(0,243,255,0.15)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between relative">
        
        {/* Brand */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
          <div className="bg-white/10 border border-white/20 rounded-xl p-1.5">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-black tracking-tight text-lg">MOVE TOGETHER</span>
        </div>

        {/* Center Nav */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2 bg-black/80 border border-white/10 rounded-2xl p-1 shadow-lg">
          {navItems.map((item) => {
            let hasBadge = false;
            
            // Badge logic for Friends tab
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
                  "relative flex items-center justify-center p-2 sm:px-4 sm:py-2 rounded-xl text-sm font-bold transition-all duration-300",
                  isActive 
                    ? "text-white bg-white/20 border border-white/20" 
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn(
                      "h-5 w-5 sm:mr-2",
                      isActive ? "text-white" : ""
                    )} />
                    <span className="hidden sm:block tracking-wide">{item.name}</span>
                    
                    {/* Notification Badge */}
                    {hasBadge && (
                      <span className="absolute top-1 right-1 sm:top-2 sm:right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        <div className="flex items-center gap-2 relative" ref={dropdownRef}>
          {/* Athlete Rank Pill */}
          <button 
            onClick={() => setIsRankModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 bg-black/40 hover:bg-white/10 border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-white transition-all cursor-pointer group relative"
            title="View Rank Roadmap & Locked Tiers"
          >
            <span>{rank.badge}</span>
            <span className="text-white font-bold group-hover:underline">{rank.name}</span>
          </button>

          {/* Profile Dropdown Toggle */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-sm shadow-lg hover:scale-105 transition-transform"
          >
            {user?.displayName?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-12 right-0 w-56 bg-[#1a1725] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-white/5">
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
                    {zenMode ? <Volume2 className="h-4 w-4 text-indigo-400" /> : <VolumeX className="h-4 w-4" />} 
                    Sound Effects
                  </span>
                  <span className={cn("text-xs font-bold", zenMode ? "text-indigo-400" : "text-white/30")}>
                    {zenMode ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              <div className="pt-1 border-t border-white/5">
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
    <AthleteRanksModal 
      isOpen={isRankModalOpen} 
      onClose={() => setIsRankModalOpen(false)} 
      currentStreak={streak} 
    />
  </>
);
};
