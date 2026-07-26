import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, Calendar, Sparkles, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { addSlot, deleteSlot, applyPreset, type RoutineSlot } from '../../store/routineSlice';
import { BackButton } from '../../components/ui/BackButton';
import { useToast } from '../../components/ui/Toast';

const DAYS: RoutineSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TASK_OPTIONS = [
  { id: 't1', label: '🏋️ Weight Training' },
  { id: 't2', label: '🏃 Outdoor Workout / Walk' },
  { id: 't3', label: '🥗 Protein & Clean Diet' },
  { id: 't4', label: '🍎 Fruit / Micronutrients' },
  { id: 't5', label: '📖 Read 10-15 Pages' },
  { id: 't6', label: '✨ Self-Care / Cold Shower' },
  { id: 't7', label: '💧 Water Intake Goal' },
  { id: 't8', label: '📷 Progress Photo' },
];

export const Routine = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showSuccess } = useToast();
  const { slots } = useSelector((state: RootState) => state.routine);

  const [selectedDay, setSelectedDay] = useState<RoutineSlot['day'] | 'All'>('Monday');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formDay, setFormDay] = useState<RoutineSlot['day']>('Monday');
  const [formTime, setFormTime] = useState('07:00 AM');
  const [formTitle, setFormTitle] = useState('');
  const [formTaskId, setFormTaskId] = useState('');
  const [formNote, setFormNote] = useState('');

  const filteredSlots = selectedDay === 'All' 
    ? slots 
    : slots.filter(s => s.day === selectedDay);

  // Sort chronologically
  const sortedSlots = [...filteredSlots].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    dispatch(addSlot({
      day: formDay,
      time: formTime,
      title: formTitle,
      taskId: formTaskId || undefined,
      note: formNote || undefined
    }));

    showSuccess(`Routine slot added for ${formDay}!`);
    setFormTitle('');
    setFormNote('');
    setIsAddModalOpen(false);
  };

  const handleApplyPreset = (type: 'early' | 'standard' | 'night') => {
    dispatch(applyPreset(type));
    showSuccess(`Loaded ${type.toUpperCase()} Routine Timetable!`);
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 md:px-8 py-6">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-left">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3.5 py-1 rounded-full text-xs font-bold text-white mb-3">
            <Calendar className="w-3.5 h-3.5 text-white" /> Weekly Routine Planner
          </div>
          <h1 
            style={{ fontFamily: "'Oswald', sans-serif" }}
            className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight"
          >
            Timetable & Routine
          </h1>
          <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-lg">
            Time-block your day to build bulletproof discipline. Scheduled slots help you hit all 8 habits effortlessly.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start md:self-center flex items-center gap-2 bg-white hover:bg-white/90 text-black font-bold text-xs px-5 py-3 rounded-2xl shadow-xl transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Time Slot
        </button>
      </div>

      {/* Quick Routine Presets */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-5 mb-8 text-left">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-white" /> 1-Click Routine Presets
          </span>
          <span className="text-[10px] text-white/50">Replaces current slots</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleApplyPreset('early')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl p-3.5 text-left transition-all group"
          >
            <p className="text-xs font-bold text-white group-hover:underline">🌅 Early Bird Athlete</p>
            <p className="text-[10px] text-white/60 mt-0.5">5:30 AM Morning Workout & Fasted Walk</p>
          </button>

          <button
            onClick={() => handleApplyPreset('standard')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl p-3.5 text-left transition-all group"
          >
            <p className="text-xs font-bold text-white group-hover:underline">💼 Standard 9-5 Athlete</p>
            <p className="text-[10px] text-white/60 mt-0.5">6:45 AM Cardio + 6:00 PM Evening Gym</p>
          </button>

          <button
            onClick={() => handleApplyPreset('night')}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl p-3.5 text-left transition-all group"
          >
            <p className="text-xs font-bold text-white group-hover:underline">🌙 Night Owl Athlete</p>
            <p className="text-[10px] text-white/60 mt-0.5">9:00 AM Walk + 7:30 PM Night Lifting</p>
          </button>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-3 mb-6">
        <button
          onClick={() => setSelectedDay('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedDay === 'All'
              ? 'bg-white text-black font-extrabold shadow-lg'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          All Days ({slots.length})
        </button>

        {DAYS.map(day => {
          const count = slots.filter(s => s.day === day).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedDay === day
                  ? 'bg-white text-black font-extrabold shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <span>{day.substring(0, 3)}</span>
              {count > 0 && <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Routine Slots List */}
      <div className="space-y-3 text-left">
        {sortedSlots.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center text-white/50">
            <Clock className="w-12 h-12 mx-auto mb-3 text-white/20" />
            <p className="font-bold text-white text-base">No Routine Slots Scheduled</p>
            <p className="text-xs text-white/60 mt-1">Tap "Add Time Slot" or pick a preset to build your timetable.</p>
          </div>
        ) : (
          sortedSlots.map(slot => (
            <motion.div
              layout
              key={slot.id}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all hover:bg-white/[0.15]"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/15 border border-white/20 flex flex-col items-center justify-center text-white shrink-0">
                  <Clock className="w-4 h-4 mb-0.5 text-white/80" />
                  <span className="text-[10px] font-bold font-mono">{slot.time.split(' ')[0]}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-white/10 text-white border border-white/20">
                      {slot.time}
                    </span>
                    {selectedDay === 'All' && (
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{slot.day}</span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-white text-base mt-1">{slot.title}</h3>
                  {slot.note && <p className="text-xs text-white/70 italic mt-0.5">{slot.note}</p>}
                </div>
              </div>

              <button
                onClick={() => {
                  dispatch(deleteSlot(slot.id));
                  showSuccess('Time slot removed');
                }}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                title="Delete slot"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* ADD TIME SLOT MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.form
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onSubmit={handleAddSlot}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-md text-left relative shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-white" /> Schedule Time Slot
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5">Day of Week</label>
                  <select
                    value={formDay}
                    onChange={e => setFormDay(e.target.value as any)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white outline-none"
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d} className="bg-black text-white">{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5">Scheduled Time</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    placeholder="e.g. 06:30 AM"
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white outline-none placeholder-white/30 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5">Routine Activity Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="e.g. 45 Mins Gym Workout"
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white outline-none placeholder-white/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5">Link to Challenge Task (Optional)</label>
                  <select
                    value={formTaskId}
                    onChange={e => setFormTaskId(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white outline-none"
                  >
                    <option value="" className="bg-black text-white">None / Custom Routine</option>
                    {TASK_OPTIONS.map(t => (
                      <option key={t.id} value={t.id} className="bg-black text-white">{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5">Notes (Optional)</label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={e => setFormNote(e.target.value)}
                    placeholder="e.g. Leg Day + 10 mins treadmill"
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white outline-none placeholder-white/30"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-3 rounded-xl border border-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-white hover:bg-white/90 text-black font-bold text-xs py-3 rounded-xl shadow-lg"
                >
                  Save Time Slot
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
