import { useState, useEffect } from 'react';
import { Users, X, Send, Check } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { fetchFriends } from '../../store/friendSlice';
import { api } from '../../services/api';
import { useToast } from './Toast';

export const MidChallengeInviteModal = ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { showSuccess, showError } = useToast();
  const { friends } = useSelector((state: RootState) => state.friend);
  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchFriends());
    }
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const acceptedFriends = friends.filter(f => f.status === 'accepted');

  const toggleSelectFriend = (id: string) => {
    if (selectedFriendIds.includes(id)) {
      setSelectedFriendIds(prev => prev.filter(fId => fId !== id));
    } else {
      setSelectedFriendIds(prev => [...prev, id]);
    }
  };

  const handleSendInvites = async () => {
    if (selectedFriendIds.length === 0) {
      return showError('Please select at least one friend to invite!');
    }

    setIsSending(true);
    try {
      await api.inviteFriendsToGroup(selectedFriendIds);
      showSuccess(`Challenge invites sent to ${selectedFriendIds.length} friend(s)!`);
      setInvitedIds(prev => [...prev, ...selectedFriendIds]);
      setSelectedFriendIds([]);
      onClose();
    } catch (err: any) {
      showError(err.message || 'Failed to send challenge invites.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-black/95 border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-md text-left shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-white" /> Invite Friends to Challenge
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-white/70 mb-4 font-medium">
          Invite friends to join your active challenge. Once they accept, they will appear on your shared crew leaderboard!
        </p>

        {acceptedFriends.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center mb-6">
            <p className="text-xs text-white/50 mb-3">You don't have any added friends yet.</p>
            <button
              onClick={() => window.location.href = '/friends'}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
            >
              Find & Add Friends
            </button>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {acceptedFriends.map(friend => {
              const friendId = friend.recipient._id === user?._id ? friend.requester._id : friend.recipient._id;
              const friendName = friend.recipient._id === user?._id ? friend.requester.displayName : friend.recipient.displayName;
              const friendEmail = friend.recipient._id === user?._id ? friend.requester.email : friend.recipient.email;
              const isSelected = selectedFriendIds.includes(friendId);
              const isAlreadyInvited = invitedIds.includes(friendId);

              return (
                <div
                  key={friend._id}
                  onClick={() => !isAlreadyInvited && toggleSelectFriend(friendId)}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/20 border-white text-white shadow-md'
                      : isAlreadyInvited
                      ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
                      {friendName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">{friendName}</p>
                      <p className="text-[10px] text-white/50">{friendEmail}</p>
                    </div>
                  </div>

                  {isAlreadyInvited ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      ✓ Invited
                    </span>
                  ) : isSelected ? (
                    <span className="text-xs bg-white text-black font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                      + Select
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-3 rounded-xl border border-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSending || selectedFriendIds.length === 0}
            onClick={handleSendInvites}
            className="flex-1 bg-white hover:bg-white/90 text-black font-extrabold text-xs py-3 rounded-xl shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {isSending ? 'Sending...' : `Send Invite (${selectedFriendIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
