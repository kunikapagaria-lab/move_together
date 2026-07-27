import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, X, Sparkles, Dumbbell, Activity, Utensils, Apple, BookOpen, Droplets, Camera } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { fetchChallengeData } from '../../store/challengeSlice';
import { api } from '../../services/api';
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
  const { showSuccess, showError } = useToast();
  const { activeChallenge } = useSelector((state: RootState) => state.challenge);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await api.updateChallengeTasks(taskList);
      await dispatch(fetchChallengeData());
      showSuccess('Personalized habit checklist saved!');
      onClose();
    } catch (err: any) {
      showError(err?.message || 'Failed to save your checklist. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-black/95 border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-lg text-left shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar"
      >
        {/* Terracotta Top Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e0531c] via-[#b54619] to-amber-500" />

        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-white/30 bg-white/10 text-white uppercase tracking-wider mb-1 inline-block">
              Personal Checklist
            </span>
            <h3 
              style={{ fontFamily: "'Oswald', sans-serif" }}
              className="text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-amber-400" /> CUSTOMIZE DAILY HABITS
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Tasks List */}
        <div className="space-y-2.5 mb-6">
          {taskList.map((task, idx) => (
            <div key={task.id} className="bg-white/10 border border-white/15 rounded-2xl p-3 flex items-center gap-3 shadow-md">
              <span className="text-xs font-mono font-bold text-white/50 w-5">#{idx + 1}</span>
              <input
                type="text"
                value={task.title}
                onChange={e => handleUpdateTaskTitle(task.id, e.target.value)}
                className="flex-1 bg-transparent text-white font-bold text-sm outline-none border-b border-transparent focus:border-white/40 pb-0.5"
              />
              <button
                type="button"
                onClick={() => handleDeleteTask(task.id)}
                disabled={taskList.length <= 1}
                className="text-white/40 hover:text-rose-400 p-1.5 transition-colors disabled:opacity-30 cursor-pointer"
                title="Remove task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Custom Task Form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
          <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Add New Custom Task</label>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. 20 Mins Meditation"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none placeholder-white/40 font-medium"
            />
            <button
              type="button"
              onClick={handleAddTask}
              className="bg-white hover:bg-white/90 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Add
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <span className="text-[10px] text-white/50 shrink-0 font-bold">ICON:</span>
            {PRESET_ICONS.map(ic => {
              const Icon = ic.icon;
              const isSelected = selectedIcon === ic.name;
              return (
                <button
                  key={ic.name}
                  type="button"
                  onClick={() => setSelectedIcon(ic.name)}
                  className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                    isSelected ? 'bg-white text-black border-white shadow-md' : 'bg-white/10 text-white/70 border-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-3.5 rounded-2xl border border-white/20 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex-1 bg-white hover:bg-white/90 text-black font-extrabold uppercase tracking-wider text-xs py-3.5 rounded-2xl shadow-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Personal Tasks'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
