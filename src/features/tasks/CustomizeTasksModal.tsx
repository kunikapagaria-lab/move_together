import { useState } from 'react';
import { Plus, Trash2, X, Sparkles, Dumbbell, Activity, Utensils, Apple, BookOpen, Droplets, Camera } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { fetchChallengeData } from '../../store/challengeSlice';
import { useToast } from '../../components/ui/Toast';

const PRESET_ICONS = [
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Activity', icon: Activity },
  { name: 'Utensils', icon: Utensils },
  { name: 'Apple', icon: Apple },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Droplets', icon: Droplets },
  { name: 'Camera', icon: Camera },
];

export const CustomizeTasksModal = ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { showSuccess } = useToast();
  const { activeChallenge } = useSelector((state: RootState) => state.challenge);

  const initialTasks = activeChallenge?.tasks && activeChallenge.tasks.length > 0
    ? activeChallenge.tasks
    : [
        { id: 'weight', title: 'Weight Training', iconName: 'Dumbbell', color: '#f97316' },
        { id: 'cardio', title: 'Cardio / Walk', iconName: 'Activity', color: '#22d3ee' },
        { id: 'diet', title: 'Protein + Fibre', iconName: 'Utensils', color: '#4ade80' },
        { id: 'fruit', title: 'Fruit', iconName: 'Apple', color: '#fb7185' },
        { id: 'reading', title: 'Read 10–15 Pages', iconName: 'BookOpen', color: '#a78bfa' },
        { id: 'selfcare', title: 'Self-Care', iconName: 'Sparkles', color: '#f472b6' },
        { id: 'water', title: 'Water Intake', iconName: 'Droplets', color: '#38bdf8' },
        { id: 'photo', title: 'Progress Photo', iconName: 'Camera', color: '#facc15' },
      ];

  const [taskList, setTaskList] = useState<any[]>(initialTasks);
  const [newTitle, setNewTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Sparkles');

  if (!isOpen) return null;

  const handleUpdateTaskTitle = (id: string, newTitle: string) => {
    setTaskList(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
  };

  const handleDeleteTask = (id: string) => {
    if (taskList.length <= 1) return;
    setTaskList(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTask = () => {
    if (!newTitle.trim()) return;
    const newTask = {
      id: 'custom_' + Date.now(),
      title: newTitle.trim(),
      iconName: selectedIcon,
      color: '#ffffff'
    };
    setTaskList(prev => [...prev, newTask]);
    setNewTitle('');
  };

  const handleSaveAll = () => {
    if (activeChallenge) {
      const updatedChallenge = {
        ...activeChallenge,
        tasks: taskList
      };
      localStorage.setItem('move_together_active_challenge', JSON.stringify(updatedChallenge));
      dispatch(fetchChallengeData());
    }
    showSuccess('Personalized habit checklist saved!');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-black/95 border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-lg text-left shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-white" /> Customize My Personal Habits
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              Personalize your tasks. Changes apply only to your personal checklist.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Tasks List */}
        <div className="space-y-2.5 mb-6">
          {taskList.map((task, idx) => (
            <div key={task.id} className="bg-white/10 border border-white/15 rounded-2xl p-3 flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-white/50 w-5">#{idx + 1}</span>
              <input
                type="text"
                value={task.title}
                onChange={e => handleUpdateTaskTitle(task.id, e.target.value)}
                className="flex-1 bg-transparent text-white font-bold text-sm outline-none border-b border-transparent focus:border-white/40 pb-0.5"
              />
              <button
                onClick={() => handleDeleteTask(task.id)}
                disabled={taskList.length <= 1}
                className="text-white/40 hover:text-rose-400 p-1 transition-colors disabled:opacity-30"
                title="Remove task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Custom Task Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
          <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">Add New Custom Task</label>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. 20 Mins Meditation"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder-white/40"
            />
            <button
              onClick={handleAddTask}
              className="bg-white hover:bg-white/90 text-black font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Add
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[10px] text-white/50 shrink-0 font-bold">ICON:</span>
            {PRESET_ICONS.map(ic => {
              const Icon = ic.icon;
              const isSelected = selectedIcon === ic.name;
              return (
                <button
                  key={ic.name}
                  type="button"
                  onClick={() => setSelectedIcon(ic.name)}
                  className={`p-1.5 rounded-lg border text-xs transition-all ${
                    isSelected ? 'bg-white text-black border-white' : 'bg-white/10 text-white border-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </div>

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
            onClick={handleSaveAll}
            className="flex-1 bg-white hover:bg-white/90 text-black font-bold text-xs py-3 rounded-xl shadow-lg transition-all"
          >
            Save Personal Tasks
          </button>
        </div>
      </div>
    </div>
  );
};
