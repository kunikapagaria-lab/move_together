import { useState } from 'react';
import {
  Dumbbell, Activity, Utensils, Apple, BookOpen, Sparkles, Droplets, Camera, Check, HeartPulse, Moon, CheckCircle, Trophy, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { toggleTask } from '../../store/challengeSlice';
import { triggerConfetti } from '../../utils/confetti';
import { WaterTracker } from './WaterTracker';
import { PhotoUpload } from './PhotoUpload';
import { CustomizeTasksModal } from './CustomizeTasksModal';

type TaskId = 'weight' | 'cardio' | 'diet' | 'fruit' | 'reading' | 'selfcare' | 'water' | 'photo';

interface TaskLog {
  [key: string]: string;
}

interface Task {
  id: TaskId;
  title: string;
  icon: any;
  color: string;
  completed: boolean;
}

const INITIAL_TASKS: Task[] = [
  { id: 'weight',   title: 'Weight Training', icon: Dumbbell, color: '#f97316', completed: false },
  { id: 'cardio',   title: 'Cardio / Walk',   icon: Activity, color: '#22d3ee', completed: false },
  { id: 'diet',     title: 'Protein + Fibre', icon: Utensils, color: '#4ade80', completed: false },
  { id: 'fruit',    title: 'Fruit',           icon: Apple,    color: '#fb7185', completed: false },
  { id: 'reading',  title: 'Read 10–15 Pages',icon: BookOpen, color: '#a78bfa', completed: false },
  { id: 'selfcare', title: 'Self-Care',        icon: Sparkles, color: '#f472b6', completed: false },
  { id: 'water',    title: 'Water Intake',    icon: Droplets, color: '#38bdf8', completed: false },
  { id: 'photo',    title: 'Progress Photo',  icon: Camera,   color: '#facc15', completed: false },
];

// Task-specific log fields
const TASK_FIELDS: Record<TaskId, { label: string; placeholder: string; key: string }[]> = {
  weight: [
    { label: 'What did you train?',       placeholder: 'e.g. Push day — chest, shoulders, triceps…', key: 'muscle_group' },
    { label: 'Duration / Sets',           placeholder: 'e.g. 60 min, 4×12 bench press…',            key: 'duration' },
  ],
  cardio: [
    { label: 'What cardio did you do?',   placeholder: 'e.g. 5 km run, 30 min cycle…',              key: 'type' },
    { label: 'Distance / Duration',       placeholder: 'e.g. 5.2 km in 28 min…',                    key: 'distance' },
  ],
  diet: [
    { label: 'What did you eat today?',   placeholder: 'e.g. Grilled chicken, broccoli, oats…',     key: 'meals' },
    { label: 'Protein source',            placeholder: 'e.g. Chicken breast, eggs, paneer…',         key: 'protein' },
  ],
  fruit: [
    { label: 'Which fruit(s)?',           placeholder: 'e.g. 1 banana + handful of berries…',       key: 'fruits' },
  ],
  reading: [
    { label: 'Which book?',               placeholder: 'e.g. Atomic Habits — James Clear…',          key: 'book' },
    { label: 'Pages read (today / total)',placeholder: 'e.g. Pages 48–63 (15 pages)…',              key: 'pages' },
  ],
  selfcare: [
    { label: 'What was your routine?',    placeholder: 'e.g. Cleanser, toner, moisturiser, SPF…',   key: 'routine' },
  ],
  water:    [],   // handled by WaterTracker
  photo:    [],   // handled by PhotoUpload
};

export const SOUND_EFFECTS = {
  click: 'https://cdn.freesound.org/previews/415/415510_7761012-lq.mp3', // Simple click
  success: 'https://cdn.freesound.org/previews/511/511484_6890478-lq.mp3', // Chime
  milestone: 'https://cdn.freesound.org/previews/607/607207_11861866-lq.mp3' // Sparkle
};

const ICON_MAP: Record<string, any> = {
  Dumbbell,
  Activity,
  Utensils,
  Apple,
  BookOpen,
  Sparkles,
  Droplets,
  Camera,
  HeartPulse,
  Moon,
  CheckCircle,
  Trophy,
  Zap
};

export const Today = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const dispatch = useDispatch<AppDispatch>();
  const zenMode = useSelector((state: RootState) => state.settings.zenMode);
  const { todayLog, activeChallenge } = useSelector((state: RootState) => state.challenge);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, TaskLog>>({});
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  const tasks = activeChallenge?.tasks && activeChallenge.tasks.length > 0
    ? activeChallenge.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        icon: ICON_MAP[t.iconName] || Sparkles,
        color: t.color || '#6366f1',
        completed: todayLog?.completedTaskIds?.includes(t.id) || false
      }))
    : INITIAL_TASKS.map(t => ({
        ...t,
        completed: todayLog?.completedTaskIds?.includes(t.id) || false
      }));

  const playDing = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  };

  const totalCount = tasks.length || 8;
  const completedCount = tasks.filter((t: any) => t.completed).length;

  const handleToggleTask = (id: string) => {
    if (navigator.vibrate) navigator.vibrate(30);
    const isCurrentlyCompleted = todayLog?.completedTaskIds?.includes(id);
    
    if (!isCurrentlyCompleted) {
      if (zenMode) playDing();
      if (completedCount === totalCount - 1) triggerConfetti();
    }
    
    dispatch(toggleTask({ taskId: id, isCompleted: !isCurrentlyCompleted }));
  };

  const setLog = (taskId: string, key: string, value: string) => {
    setLogs((prev: Record<string, TaskLog>) => ({ ...prev, [taskId]: { ...(prev[taskId] || {}), [key]: value } }));
  };

  return (
    <div className="w-full space-y-2">
      {/* Mini header + progress */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              Today's Tasks
              <button
                onClick={() => setIsCustomizeModalOpen(true)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 border border-white/20 transition-all cursor-pointer"
                title="Customize my personal habit list"
              >
                ⚙️ Customize Tasks
              </button>
            </h2>
            <p className="text-xs text-white/50">Complete all {totalCount} before midnight</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 text-white/60">
            {completedCount} / {totalCount}
          </span>
        </div>
      )}

      <CustomizeTasksModal 
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
      />
      
      {/* Progress Bar always shown */}
      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full bg-white rounded-full"
          animate={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Task list in 2-column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start">
        {tasks.map((task: any) => {
          const Icon = task.icon;
          const isExpanded = expandedId === task.id;
          const fields = (TASK_FIELDS as any)[task.id] || [];

          return (
            <motion.div
              layout
              key={task.id}
              className={`rounded-xl overflow-hidden border transition-all duration-300 ${
                task.completed
                  ? 'border-white/10 bg-white/[0.05]'
                  : 'border-white/[0.06] bg-black/25 hover:bg-white/[0.04]'
              }`}
            >
              {/* Row */}
              <div
                className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : task.id)}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/10">
                  <Icon className="h-5 w-5 text-white" />
                </div>

                <p className={`flex-1 text-sm font-bold truncate ${task.completed ? 'text-white/40 line-through' : 'text-white'}`}>
                  {task.title}
                </p>

                {/* Log indicator dot */}
                {Object.values(logs[task.id] || {}).some(v => typeof v === 'string' && v.trim() !== '') && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white flex-shrink-0" />
                )}

                <button
                  onClick={e => { e.stopPropagation(); handleToggleTask(task.id); }}
                  className={`relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    task.completed
                      ? 'bg-white border-white text-black'
                      : 'border-white/30 hover:border-white'
                  }`}
                >
                  <AnimatePresence>
                    {task.completed && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                      >
                        <Check className="h-3 w-3 text-black stroke-[3]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>

              {/* Expanded */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1 border-t border-white/[0.05] space-y-2">
                      {/* Task-specific fields */}
                      {fields.length > 0 && fields.map((f: any) => (
                        <div key={f.key}>
                          <label className="text-[10px] text-white/40 mb-1 block">{f.label}</label>
                          <textarea
                            rows={2}
                            value={logs[task.id]?.[f.key] || ''}
                            onChange={e => setLog(task.id, f.key, e.target.value)}
                            placeholder={f.placeholder}
                            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/80 placeholder-white/20 px-2.5 py-2 resize-none outline-none focus:border-white/20 transition-all"
                          />
                        </div>
                      ))}

                      {/* Generic Notes field if no specific fields exist and not special */}
                      {fields.length === 0 && !task.title.toLowerCase().includes('water') && !task.title.toLowerCase().includes('photo') && (
                        <div>
                          <label className="text-[10px] text-white/40 mb-1 block">Activity Notes & Metrics</label>
                          <textarea
                            rows={2}
                            value={logs[task.id]?.notes || ''}
                            onChange={e => setLog(task.id, 'notes', e.target.value)}
                            placeholder={`Record your notes or progress for ${task.title}...`}
                            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/80 placeholder-white/20 px-2.5 py-2 resize-none outline-none focus:border-white/20 transition-all"
                          />
                        </div>
                      )}

                      {/* Special components */}
                      {(task.id === 'water' || task.title.toLowerCase().includes('water')) && (
                        <WaterTracker
                          isTaskCompleted={task.completed}
                          onComplete={() => handleToggleTask(task.id)}
                          onUndo={() => handleToggleTask(task.id)}
                        />
                      )}
                      {(task.id === 'photo' || task.title.toLowerCase().includes('photo')) && (
                        <PhotoUpload
                          isTaskCompleted={task.completed}
                          onComplete={() => { if (!task.completed) handleToggleTask(task.id); }}
                        />
                      )}

                      {/* Mark Done Action Button */}
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-full text-xs font-bold py-2 rounded-xl border transition-all mt-2 ${
                          task.completed 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : 'bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-400'
                        }`}
                      >
                        {task.completed ? '✓ Completed (Click to Undo)' : 'Mark Task Completed'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
