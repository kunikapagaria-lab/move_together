import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppDispatch, RootState } from '../../store';
import { fetchNotifications, markRead } from '../../store/notificationSlice';
import { useToast } from '../../components/ui/Toast';
import { triggerConfetti } from '../../utils/confetti';

export const NotificationsModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showSuccess } = useToast();
  const { notifications } = useSelector((state: RootState) => state.notification);
  const { user } = useSelector((state: RootState) => state.auth);
  const shownSignalIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    dispatch(fetchNotifications());
    const intervalId = setInterval(() => {
      dispatch(fetchNotifications());
    }, 3000);
    return () => clearInterval(intervalId);
  }, [dispatch, user]);

  // Surface unread Nudge/Cheer crew signals as a toast (Cheer also gets confetti),
  // then mark them read so they don't re-fire on the next poll.
  useEffect(() => {
    const unreadSignals = notifications.filter(
      n => (n.type === 'nudge' || n.type === 'cheer') && !n.read && !shownSignalIds.current.has(n._id)
    );
    unreadSignals.forEach(n => {
      shownSignalIds.current.add(n._id);
      showSuccess(n.message);
      if (n.type === 'cheer') triggerConfetti();
      dispatch(markRead(n._id));
    });
  }, [notifications, dispatch, showSuccess]);

  // Find the first unread failure notification to display
  const failureNotification = notifications.find(n => n.type === 'failed' && !n.read);

  if (!failureNotification) return null;

  const handleAcknowledge = () => {
    dispatch(markRead(failureNotification._id));
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-black/95 border border-white/20 shadow-2xl rounded-3xl p-6 sm:p-8 w-full max-w-md text-center relative overflow-hidden"
        >
          {/* Top Amber Accent Line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e0531c] via-[#b54619] to-amber-500" />
          
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/20 shadow-lg text-3xl">
              🛡️
            </div>
          </div>
          
          <h2 
            style={{ fontFamily: "'Oswald', sans-serif" }}
            className="text-3xl font-black text-white mb-2 uppercase tracking-wide"
          >
            CHALLENGE RESET
          </h2>
          
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-6 font-medium">
            {failureNotification.message || "A task was missed yesterday. Your streak has reset so you can build back stronger today."}
          </p>

          <button 
            onClick={handleAcknowledge}
            className="w-full bg-white hover:bg-white/90 text-black font-extrabold uppercase tracking-widest text-xs py-3.5 rounded-2xl shadow-xl transition-all cursor-pointer"
          >
            Start Fresh Today 🏃
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
