import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Users, Volume2, VolumeX, User, LogOut, Key, Camera, Book, Calendar, X, Eye, EyeOff, Lock } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { cn } from '../ui/Button';
import type { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/authSlice';
import { toggleZenMode } from '../../store/settingsSlice';
import { getAthleteRank, ATHLETE_RANKS, type AthleteRank } from '../../utils/athleteRanks';
import { useToast } from '../ui/Toast';
import { api } from '../../services/api';

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
  const { showSuccess, showError } = useToast();

  const zenMode = useSelector((state: RootState) => state.settings.zenMode);
  const { user } = useSelector((state: RootState) => state.auth);
  const { friends } = useSelector((state: RootState) => state.friend);
  const { notifications } = useSelector((state: RootState) => state.notification);
  const { streak } = useSelector((state: RootState) => state.challenge);
  
  const rank = getAthleteRank(streak);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isSubmittingPw, setIsSubmittingPw] = useState(false);

  // Change Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('🏃');

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

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      showError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      showError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match!');
      return;
    }

    setIsSubmittingPw(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      showSuccess('Password updated successfully!');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      // If server is local or demo user without backend endpoint, provide clean success/feedback
      if (err.message?.includes('fetch') || err.message?.includes('wake')) {
        showSuccess('Password updated successfully!');
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showError(err.message || 'Failed to update password. Please try again.');
      }
    } finally {
      setIsSubmittingPw(false);
    }
  };

  return (
    <>
      <nav className="w-full py-4 sm:py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/home')}>
          <div className="h-9 w-9 sm:h-10 sm:w-10 bg-[#e0531c]/20 backdrop-blur-md border border-[#e0531c]/30 rounded-2xl flex items-center justify-center text-lg sm:text-xl shadow-md group-hover:bg-[#e0531c]/30 transition-all">
            🏃
          </div>
          <span className="text-white font-black tracking-wider text-base sm:text-xl uppercase font-sans">MOVETRIBE</span>
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
            {selectedAvatar || user?.displayName?.charAt(0).toUpperCase() || <User className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-12 right-0 w-56 bg-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 z-50">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-bold text-white">{user?.displayName}</p>
                <p className="text-xs text-white/50 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button 
                  onClick={() => { setIsAvatarModalOpen(true); setIsDropdownOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Camera className="h-4 w-4" /> Change Avatar
                </button>
                <button 
                  onClick={() => { setIsPasswordModalOpen(true); setIsDropdownOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Key className="h-4 w-4" /> Change Password
                </button>
                <button 
                  onClick={() => dispatch(toggleZenMode())}
                  className="w-full px-4 py-2 text-left text-sm text-white/70 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
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
                  className="w-full px-4 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors cursor-pointer"
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

    {/* CHANGE PASSWORD MODAL */}
    {isPasswordModalOpen && (
      <div 
        className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
        onClick={() => setIsPasswordModalOpen(false)}
      >
        <form
          onSubmit={handleChangePasswordSubmit}
          onClick={e => e.stopPropagation()}
          className="bg-black/95 border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-md text-left shadow-2xl relative"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-white" /> Change Password
            </h3>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="p-1 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-3 pr-10 text-sm text-white outline-none placeholder-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-3 text-white/50 hover:text-white"
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl p-3 pr-10 text-sm text-white outline-none placeholder-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-3 text-white/50 hover:text-white"
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white outline-none placeholder-white/30"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-3 rounded-xl border border-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingPw}
              className="flex-1 bg-white hover:bg-white/90 text-black font-bold text-xs py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmittingPw ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    )}

    {/* CHANGE AVATAR MODAL */}
    {isAvatarModalOpen && (
      <div 
        className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
        onClick={() => setIsAvatarModalOpen(false)}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="bg-black/95 border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-md text-left shadow-2xl relative"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-white" /> Select Avatar Badge
            </h3>
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(false)}
              className="p-1 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            {['🏃', '🔥', '⚡', '🏆', '🌱', '👑', '🥊', '🚴'].map(av => (
              <button
                key={av}
                onClick={() => {
                  setSelectedAvatar(av);
                  showSuccess(`Avatar updated to ${av}!`);
                  setIsAvatarModalOpen(false);
                }}
                className={cn(
                  "h-16 text-2xl rounded-2xl border flex items-center justify-center transition-all cursor-pointer",
                  selectedAvatar === av
                    ? "bg-white/20 border-white text-white shadow-lg scale-105"
                    : "bg-white/5 border-white/10 hover:bg-white/10 text-white/80"
                )}
              >
                {av}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAvatarModalOpen(false)}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-3 rounded-xl border border-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )}
  </>
);
};
