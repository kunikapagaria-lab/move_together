import { useState, useEffect } from 'react';
import { Search, UserPlus, Check, X, Users, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { 
  fetchFriends, 
  searchUsers, 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest,
  clearSearchResults
} from '../../store/friendSlice';
import { fetchNotifications, respondToInvite } from '../../store/notificationSlice';
import { BackButton } from '../../components/ui/BackButton';

export const Friends = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { friends, searchResults, isSearching } = useSelector((state: RootState) => state.friend);
  const { notifications } = useSelector((state: RootState) => state.notification);
  
  const [searchQuery, setSearchQuery] = useState('');

  const groupInvites = notifications.filter(n => n.type === 'group_invite' && !n.read);

  useEffect(() => {
    dispatch(fetchFriends());
    dispatch(fetchNotifications());
    const intervalId = setInterval(() => {
      dispatch(fetchFriends());
      dispatch(fetchNotifications());
    }, 3000);
    return () => clearInterval(intervalId);
  }, [dispatch]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        dispatch(searchUsers(searchQuery));
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      dispatch(clearSearchResults());
    }
  }, [searchQuery, dispatch]);

  const handleSendRequest = (id: string) => {
    dispatch(sendFriendRequest(id));
  };

  const handleAccept = (id: string) => {
    dispatch(acceptFriendRequest(id));
  };

  const handleReject = (id: string) => {
    dispatch(rejectFriendRequest(id));
  };

  const pendingIncoming = friends.filter(f => f.recipient._id === user?._id && f.status === 'pending');
  const pendingOutgoing = friends.filter(f => f.requester._id === user?._id && f.status === 'pending');
  const acceptedFriends = friends.filter(f => f.status === 'accepted');

  return (
    <>
      <BackButton />
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 pt-8 pb-12 h-full overflow-y-auto scrollbar-none">
        
        <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Friends</h1>
        <p className="text-white/60 mt-1">Connect with others to share your journey.</p>
      </div>

      {/* Search Section */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-6">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-white/40" />
          </div>
          <input
            type="text"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Self-search Notice */}
        {searchQuery.trim().toLowerCase() === user?.email?.toLowerCase() && (
          <div className="mt-3 p-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white/80 font-medium">
            💡 This is your logged-in account (You). Your friends on other accounts can search for <span className="font-bold text-white">{user?.email}</span> to send you a friend request!
          </div>
        )}
        {/* Searching Indicator */}
        {isSearching && (
          <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" /> Searching database...
          </div>
        )}

        {/* Empty Search Results */}
        {!isSearching && searchQuery.length > 2 && searchResults.length === 0 && searchQuery.trim().toLowerCase() !== user?.email?.toLowerCase() && (
          <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 font-medium">
            🔍 No athlete found matching "<span className="text-white font-bold">{searchQuery}</span>". Make sure your friend has registered an account on MOVE TOGETHER!
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Search Results</h3>
            {searchResults.map(resultUser => {
              // Check if already friends or requested
              const existingFriendship = friends.find(f => 
                (f.requester._id === resultUser._id && f.recipient._id === user?._id) ||
                (f.recipient._id === resultUser._id && f.requester._id === user?._id)
              );

              return (
                <div key={resultUser._id} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">
                      {resultUser.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-white">{resultUser.displayName}</div>
                      <div className="text-xs text-white/50">{resultUser.email}</div>
                    </div>
                  </div>
                  
                  {!existingFriendship ? (
                    <button 
                      onClick={() => handleSendRequest(resultUser._id)}
                      className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-md cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4" /> Add Friend
                    </button>
                  ) : existingFriendship.status === 'accepted' ? (
                    <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-1.5">
                      ✓ Friends
                    </span>
                  ) : (existingFriendship.requester?._id || existingFriendship.requester) === user?._id ? (
                    <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center gap-1.5 shadow-sm">
                      ⏳ Pending...
                    </span>
                  ) : (
                    <div className="flex gap-2">
                       <button onClick={() => handleAccept(existingFriendship._id)} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30"><Check className="h-4 w-4" /></button>
                       <button onClick={() => handleReject(existingFriendship._id)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30"><X className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
          <div className="text-center text-white/40 py-4">No users found.</div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Pending Requests */}
        <div className="space-y-4">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <User className="h-5 w-5 text-indigo-400" /> Requests
           </h2>
           
           {pendingIncoming.length === 0 && pendingOutgoing.length === 0 && groupInvites.length === 0 && (
             <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center">
               <p className="text-white/40">No pending requests or invites.</p>
             </div>
           )}

           {/* Group Invites */}
           {groupInvites.map(invite => (
              <div key={invite._id} className="flex flex-col bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-black/80 backdrop-blur-2xl rounded-2xl p-5 border border-indigo-400/40 shadow-xl relative overflow-hidden mb-3">
                <div className="flex items-center gap-3 mb-3">
                   <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-bold text-black text-lg shadow-lg">
                     🏆
                   </div>
                   <div className="text-sm">
                     <p className="text-white font-extrabold text-base tracking-wide">
                       {invite.relatedData?.inviterName || 'A Friend'}
                     </p>
                     <p className="text-indigo-200 text-xs">
                       Invited you to a <span className="font-bold text-white">{invite.relatedData?.durationDays}-Day Group Challenge</span>
                     </p>
                   </div>
                </div>
                <div className="flex gap-2.5 mt-1">
                   <button 
                     onClick={() => dispatch(respondToInvite({ id: invite._id, action: 'accept' })).then(() => navigate('/dashboard'))}
                     className="flex-1 bg-white hover:bg-white/90 text-black rounded-xl py-2.5 text-xs font-extrabold transition-all shadow-lg cursor-pointer"
                   >
                     Accept & Join Challenge 🏃
                   </button>
                   <button 
                     onClick={() => dispatch(respondToInvite({ id: invite._id, action: 'decline' }))}
                     className="bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-xl px-4 py-2.5 text-xs font-bold transition-all border border-white/10 cursor-pointer"
                   >
                     Decline
                   </button>
                </div>
              </div>
           ))}

           {pendingIncoming.map(req => (
              <div key={req._id} className="flex items-center justify-between bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/10 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">
                    {req.requester.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-white">{req.requester.displayName}</div>
                    <div className="text-xs text-white/50">wants to be friends</div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => handleAccept(req._id)} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30"><Check className="h-4 w-4" /></button>
                   <button onClick={() => handleReject(req._id)} className="p-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30"><X className="h-4 w-4" /></button>
                </div>
              </div>
           ))}

           {pendingOutgoing.map(req => (
              <div key={req._id} className="flex items-center justify-between bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/10 shadow-lg opacity-70">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-surfaceHighlight flex items-center justify-center font-bold text-white">
                    {req.recipient.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-white">{req.recipient.displayName}</div>
                    <div className="text-xs text-white/50">Request sent</div>
                  </div>
                </div>
              </div>
           ))}
        </div>

        {/* My Friends */}
        <div className="space-y-4">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <Users className="h-5 w-5 text-emerald-400" /> My Friends
           </h2>

           {acceptedFriends.length === 0 && (
             <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center">
               <p className="text-white/40">You haven't added any friends yet.</p>
             </div>
           )}

           {acceptedFriends.map(friendship => {
             const friend = friendship.requester._id === user?._id ? friendship.recipient : friendship.requester;
             return (
               <div key={friendship._id} className="flex items-center justify-between bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/10 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">
                      {friend.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-white">{friend.displayName}</div>
                      <div className="text-xs text-white/50">{friend.email}</div>
                    </div>
                  </div>
                  {/* Future: View Profile or Remove Friend */}
               </div>
             );
           })}
          </div>
        </div>
      </div>
    </>
  );
};
