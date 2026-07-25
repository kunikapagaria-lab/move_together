import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, CheckCircle2, Zap, Sparkles } from 'lucide-react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';


interface WearableSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APPS = [
  { id: 'apple', name: 'Apple Health', icon: '🍎', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { id: 'nrc', name: 'Nike Run Club / NTC', icon: '⚡', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'strava', name: 'Strava', icon: '🏃', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: 'google', name: 'Google Fit', icon: '💚', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'garmin', name: 'Garmin Connect', icon: '⌚', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
];

import { api } from '../../services/api';
import { fetchChallengeData } from '../../store/challengeSlice';

export const WearableSyncModal = ({ isOpen, onClose }: WearableSyncModalProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncedResult, setSyncedResult] = useState<{ appName: string; details: string; taskTitle: string } | null>(null);

  const [syncError, setSyncError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSync = async (app: typeof APPS[0]) => {
    setSyncingId(app.id);
    setSyncedResult(null);
    setSyncError(null);

    try {
      // Execute REAL backend HTTP request to /api/integrations/sync
      const response = await api.syncWearableData(app.name);
      
      // Refresh redux store state to reflect completed task & healthData
      await dispatch(fetchChallengeData()).unwrap();

      setSyncingId(null);
      setSyncedResult({
        appName: app.name,
        details: `${response.telemetry.distanceKm} km Outdoor ${response.telemetry.workoutName} (${response.telemetry.calories} kcal | ${response.telemetry.steps} steps)`,
        taskTitle: response.syncedTaskTitle
      });
    } catch (err: any) {
      setSyncingId(null);
      setSyncError(err.message || 'Error syncing wearable data');
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[#14121f] border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-8 w-full max-w-lg relative overflow-hidden"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Fitness Wearable & App Sync</h2>
              <p className="text-xs text-white/50">Mock integration pipeline to auto-sync activities</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {APPS.map((app) => (
              <div 
                key={app.id}
                className="flex items-center justify-between bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{app.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{app.name}</p>
                    <p className="text-[11px] text-white/40">Auto-sync workouts, distance & calories</p>
                  </div>
                </div>

                <button
                  onClick={() => handleSync(app)}
                  disabled={syncingId === app.id}
                  className="bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {syncingId === app.id ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Sync Data
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {syncedResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-300">Successfully Synced from {syncedResult.appName}!</p>
                <p className="text-xs text-white/80 font-mono mt-1">{syncedResult.details}</p>
                <p className="text-[10px] text-white/50 mt-1">Auto-completed task: <span className="text-emerald-400 font-bold">"{syncedResult.taskTitle}"</span></p>
              </div>
            </motion.div>
          )}
          {syncError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3 mb-3 text-xs text-rose-300 font-bold"
            >
              <span>⚠️ {syncError}</span>
            </motion.div>
          )}

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <span className="text-[10px] text-indigo-300/80 tracking-widest uppercase font-bold flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Active Production Webhook Route: POST /api/integrations/sync
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
