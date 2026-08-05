import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Calendar, GripVertical, CalendarDays, Dumbbell } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { setCell, moveCell, deleteCell, bootstrapRoutine, saveRoutine, type TimetableCell } from '../../store/routineSlice';
import { BackButton } from '../../components/ui/BackButton';
import { useToast } from '../../components/ui/Toast';
import { WorkoutSplitBoard } from './WorkoutSplitBoard';

const DAYS: TimetableCell['day'][] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

type RoutineMode = 'schedule' | 'split';

export const Routine = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showSuccess, showError } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const { cells, timeRows, workoutSplit, hasLoadedOnce } = useSelector((state: RootState) => state.routine);

  const [mode, setMode] = useState<RoutineMode>(() => {
    const saved = localStorage.getItem('movetribe_routine_mode');
    return saved === 'split' ? 'split' : 'schedule';
  });

  useEffect(() => {
    localStorage.setItem('movetribe_routine_mode', mode);
  }, [mode]);

  // Load this account's routine from the backend once (with a one-time local
  // localStorage-to-backend migration baked into the thunk itself).
  useEffect(() => {
    if (user?._id) {
      dispatch(bootstrapRoutine(user._id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // Debounced autosave: fires on ANY change to cells/timeRows/workoutSplit,
  // regardless of which mode or handler caused it - a single state-keyed effect
  // covers every mutation path (present or future) instead of relying on each
  // handler remembering to also dispatch a save.
  const skipNextSaveRef = useRef(true);
  useEffect(() => {
    if (hasLoadedOnce) skipNextSaveRef.current = true;
  }, [hasLoadedOnce]);

  useEffect(() => {
    if (!hasLoadedOnce) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      dispatch(saveRoutine()).unwrap().catch((err: any) => {
        showError(err?.message || 'Failed to sync your routine. Please check your connection.');
      });
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, timeRows, workoutSplit, hasLoadedOnce]);

  // Editing state: cellId or null
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');

  // New slot creation for a day
  const [addingDay, setAddingDay] = useState<TimetableCell['day'] | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');

  // Drag and Drop State
  const [draggedCellId, setDraggedCellId] = useState<string | null>(null);

  // Set right before an Escape-cancel so the blur it triggers (when the input
  // unmounts) doesn't also save/add - blur-to-save below is otherwise the only
  // way edits/new tasks get committed if you click away instead of pressing Enter.
  const cancellingRef = useRef(false);

  const handleStartEdit = (cell: TimetableCell) => {
    setEditingCellId(cell.id);
    setEditTitle(cell.title);
    setEditSubtitle(cell.subtitle || '');
  };

  const handleSaveEdit = (cell: TimetableCell) => {
    if (!editTitle.trim()) {
      dispatch(deleteCell(cell.id));
      showSuccess('Removed slot');
    } else {
      dispatch(setCell({
        cellId: cell.id,
        day: cell.day,
        timeRow: cell.timeRow || 'Custom',
        title: editTitle,
        subtitle: editSubtitle
      }));
      showSuccess('Saved slot!');
    }
    setEditingCellId(null);
  };

  const handleCancelEdit = () => {
    cancellingRef.current = true;
    setEditingCellId(null);
  };

  const handleEditBlur = (e: React.FocusEvent<HTMLDivElement>, cell: TimetableCell) => {
    if (cancellingRef.current) {
      cancellingRef.current = false;
      return;
    }
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      handleSaveEdit(cell);
    }
  };

  const handleAddNewTask = (day: TimetableCell['day']) => {
    if (!newTitle.trim()) return;
    dispatch(setCell({
      day,
      timeRow: newSubtitle || 'Custom',
      title: newTitle,
      subtitle: newSubtitle || undefined
    }));
    showSuccess(`Added task to ${day}!`);
    setNewTitle('');
    setNewSubtitle('');
    setAddingDay(null);
  };

  const handleCancelAdd = () => {
    cancellingRef.current = true;
    setAddingDay(null);
  };

  const handleAddBlur = (e: React.FocusEvent<HTMLDivElement>, day: TimetableCell['day']) => {
    if (cancellingRef.current) {
      cancellingRef.current = false;
      return;
    }
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      handleAddNewTask(day);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, cellId: string) => {
    setDraggedCellId(cellId);
    e.dataTransfer.setData('text/plain', cellId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDay: TimetableCell['day']) => {
    e.preventDefault();
    const cellId = e.dataTransfer.getData('text/plain') || draggedCellId;
    if (cellId) {
      dispatch(moveCell({ cellId, targetDay, targetTimeRow: 'Custom' }));
      showSuccess(`Moved task to ${targetDay}!`);
      setDraggedCellId(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full px-2 sm:px-6 py-6 text-left">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 text-left">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/20 border border-white/20 px-3.5 py-1 rounded-full text-xs font-bold text-white mb-2">
            <Calendar className="w-3.5 h-3.5 text-white" /> Weekly Routine Planner
          </div>
          <h1
            style={{ fontFamily: "'Oswald', sans-serif" }}
            className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight"
          >
            {mode === 'schedule' ? 'Weekly Routine Timetable' : 'Weekly Workout Split'}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
            {mode === 'schedule'
              ? 'Click directly on any card to edit text. Drag and drop task blocks between days to re-arrange your weekly routine.'
              : 'Give each day a training focus, then fill it with real exercises - sets, reps, photos, and instructions included.'}
          </p>
        </div>

        {/* SCHEDULE / WORKOUT SPLIT TOGGLE */}
        <div className="inline-flex items-center bg-white/10 border border-white/20 rounded-2xl p-1 shrink-0 self-start">
          <button
            type="button"
            onClick={() => setMode('schedule')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
              mode === 'schedule' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Schedule
          </button>
          <button
            type="button"
            onClick={() => setMode('split')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer ${
              mode === 'split' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" /> Workout Split
          </button>
        </div>
      </div>

      {mode === 'split' ? (
        <WorkoutSplitBoard />
      ) : (
      /* CLEAN 7-DAY WEEKLY ROUTINE BOARD */
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 sm:gap-4 w-full">
        {DAYS.map(day => {
          const dayCells = cells.filter(c => c.day === day);

          return (
            <div
              key={day}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-3 sm:p-4 flex flex-col justify-between min-h-[400px] shadow-xl transition-all hover:bg-white/[0.13]"
            >
              <div>
                {/* DAY HEADER */}
                <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center text-white font-black text-sm uppercase tracking-wider mb-4 shadow-sm">
                  {day}
                </div>

                {/* TASKS LIST FOR THIS DAY */}
                <div className="space-y-2.5">
                  {dayCells.map(cell => {
                    const isEditing = editingCellId === cell.id;

                    return isEditing ? (
                      /* SEAMLESS IN-PLACE GLASS EDITING (NO BLACK BOX, NO SAVE/CANCEL BUTTONS) */
                      <div
                        key={cell.id}
                        className="bg-white/25 backdrop-blur-md border border-white/40 rounded-2xl p-3 text-center shadow-lg relative"
                        onBlur={e => handleEditBlur(e, cell)}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          placeholder="TASK (e.g. YOGA)"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(cell);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="w-full bg-transparent text-white font-black text-xs sm:text-sm uppercase tracking-wide leading-tight text-center outline-none border-b border-white/40 focus:border-white pb-0.5 placeholder-white/40"
                        />
                        <input
                          type="text"
                          value={editSubtitle}
                          onChange={e => setEditSubtitle(e.target.value)}
                          placeholder="Time (e.g. 5:00am - 7:00am)"
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(cell);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="w-full bg-transparent text-white/80 font-medium text-[10px] sm:text-xs text-center outline-none border-b border-white/20 focus:border-white mt-1.5 placeholder-white/30"
                        />
                      </div>
                    ) : (
                      /* NORMAL CARD UI */
                      <div
                        key={cell.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, cell.id)}
                        onClick={() => handleStartEdit(cell)}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center cursor-grab active:cursor-grabbing transition-all shadow-md group relative"
                      >
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(deleteCell(cell.id));
                              showSuccess('Removed slot');
                            }}
                            className="text-white/40 hover:text-white p-0.5"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <GripVertical className="w-3 h-3 text-white/50" />
                        </div>
                        <h4 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide leading-tight drop-shadow-md">
                          {cell.title}
                        </h4>
                        {cell.subtitle && (
                          <p className="text-[10px] sm:text-xs text-white/80 font-medium mt-1">
                            {cell.subtitle}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* + ADD TASK BUTTON AT BOTTOM OF EACH COLUMN */}
              <div className="mt-3">
                {addingDay === day ? (
                  /* SEAMLESS IN-PLACE ADD TASK FORM (NO BLACK BOX) */
                  <div
                    className="bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl p-3 text-center shadow-lg relative"
                    onBlur={e => handleAddBlur(e, day)}
                  >
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="TASK (e.g. GYM)"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddNewTask(day);
                        if (e.key === 'Escape') handleCancelAdd();
                      }}
                      className="w-full bg-transparent text-white font-black text-xs sm:text-sm uppercase tracking-wide leading-tight text-center outline-none border-b border-white/40 focus:border-white pb-0.5 placeholder-white/40"
                    />
                    <input
                      type="text"
                      value={newSubtitle}
                      onChange={e => setNewSubtitle(e.target.value)}
                      placeholder="Time (e.g. 8:00am - 10:00am)"
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddNewTask(day);
                        if (e.key === 'Escape') handleCancelAdd();
                      }}
                      className="w-full bg-transparent text-white/80 font-medium text-[10px] sm:text-xs text-center outline-none border-b border-white/20 focus:border-white mt-1.5 placeholder-white/30"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingDay(day)}
                    className="w-full py-2.5 border border-dashed border-white/30 rounded-2xl flex items-center justify-center gap-1 text-white/50 hover:text-white hover:border-white/60 hover:bg-white/10 transition-all text-xs font-bold group"
                  >
                    <Plus className="w-4 h-4 text-white/50 group-hover:text-white group-hover:scale-110 transition-transform" />
                    <span className="text-[11px]">Add Task</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
