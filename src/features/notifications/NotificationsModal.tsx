import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { AppDispatch, RootState } from '../../store';
import { fetchNotifications, markRead } from '../../store/notificationSlice';

export const NotificationsModal = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications } = useSelector((state: RootState) => state.notification);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, user]);

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
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[#1a1525] border border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.2)] rounded-3xl p-8 md:p-12 w-full max-w-xl text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-600 to-orange-500" />
          
          <div className="flex justify-center mb-6">
            <div className="bg-rose-500/20 p-4 rounded-full border border-rose-500/30">
              <AlertTriangle className="w-12 h-12 text-rose-500" />
            </div>
          </div>
          
          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Challenge Failed</h2>
          
          <p className="text-xl text-white/80 leading-relaxed mb-8">
            {failureNotification.message}
          </p>

          <button 
            onClick={handleAcknowledge}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xl rounded-2xl py-4 shadow-lg transition-colors"
          >
            I Understand. Start Over.
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
