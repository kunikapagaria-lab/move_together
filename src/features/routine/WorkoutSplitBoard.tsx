import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trash2, Info, Moon } from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import { setDayFocus, removeSplitExercise, updateSplitExercise, DAYS, type Day } from '../../store/routineSlice';
import { loadExercises, FOCUS_LABEL, FOCUS_ORDER, FOCUS_COLOR, type Exercise } from './exerciseLibrary';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { ExerciseDetailModal } from './ExerciseDetailModal';

// Sunday=0..Saturday=6 in JS -> reindex so Monday is first, matching DAYS.
const getTodayName = (): Day => {
  const jsDay = new Date().getDay();
  return DAYS[jsDay === 0 ? 6 : jsDay - 1];
};

export const WorkoutSplitBoard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const workoutSplit = useSelector((state: RootState) => state.routine.workoutSplit);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [focusPickerDay, setFocusPickerDay] = useState<Day | null>(null);
  const [libraryDay, setLibraryDay] = useState<Day | null>(null);
  const [detailExerciseId, setDetailExerciseId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ day: Day; exerciseCellId: string } | null>(null);
  const [editSets, setEditSets] = useState(3);
  const [editReps, setEditReps] = useState('8-12');

  const todayName = getTodayName();

  useEffect(() => {
    loadExercises().then(setExercises).catch(() => {});
  }, []);

  const detailExercise = detailExerciseId ? exercises.find(e => e.id === detailExerciseId) || null : null;

  const handleStartEdit = (day: Day, exerciseCellId: string, sets: number, reps: string) => {
    setEditingCell({ day, exerciseCellId });
    setEditSets(sets);
    setEditReps(reps);
  };

  const handleCommitEdit = () => {
    if (!editingCell) return;
    dispatch(updateSplitExercise({ day: editingCell.day, exerciseCellId: editingCell.exerciseCellId, sets: editSets, reps: editReps }));
    setEditingCell(null);
  };

  return (
    <div className="font-sans">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-x-7 gap-y-10 w-full">
        {DAYS.map(day => {
          const entry = workoutSplit.find(d => d.day === day);
          const focus = entry?.focus ?? null;
          const isRest = focus === 'rest';
          const focusColor = focus ? FOCUS_COLOR[focus] : undefined;
          const isToday = day === todayName;

          return (
            <div key={day} className="flex flex-col min-w-0">
              <div className={`flex items-baseline gap-2 pb-3 mb-4 border-b ${isToday ? 'border-amber-400/50' : 'border-white/10'}`}>
                <span className="text-lg text-white">{day.slice(0, 3)}</span>
                {isToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Today" />}
              </div>

              <div className="relative mb-3.5">
                <button
                  type="button"
                  onClick={() => setFocusPickerDay(focusPickerDay === day ? null : day)}
                  style={focus ? { color: focusColor } : undefined}
                  className="text-sm font-semibold text-white/50 hover:text-white transition-colors cursor-pointer text-left"
                >
                  {focus ? FOCUS_LABEL[focus] : 'Set focus'}
                </button>

                {focusPickerDay === day && (
                  <div className="absolute z-20 top-full mt-1.5 left-0 bg-black/95 border border-white/20 rounded-xl p-1.5 shadow-2xl w-36">
                    <button
                      type="button"
                      onClick={() => { dispatch(setDayFocus({ day, focus: null })); setFocusPickerDay(null); }}
                      className="w-full text-left text-[11px] font-bold uppercase px-2.5 py-1.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white cursor-pointer"
                    >
                      Unset
                    </button>
                    {FOCUS_ORDER.map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => { dispatch(setDayFocus({ day, focus: f })); setFocusPickerDay(null); }}
                        className="w-full flex items-center gap-2 text-left text-[11px] font-bold uppercase px-2.5 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                        style={{ color: FOCUS_COLOR[f] }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FOCUS_COLOR[f] }} />
                        {FOCUS_LABEL[f]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isRest ? (
                <p className="flex items-center gap-1.5 text-sm text-white/40 italic">
                  <Moon className="w-3.5 h-3.5" /> Rest day
                </p>
              ) : (
                <div className="flex flex-col gap-3 flex-1">
                  {(entry?.exercises || []).map(ex => {
                    const isEditing = editingCell?.day === day && editingCell.exerciseCellId === ex.id;
                    return (
                      <div key={ex.id} className="group relative">
                        <p className="text-[15px] text-white leading-snug pr-10">{ex.exerciseName}</p>
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 mt-1" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) handleCommitEdit(); }}>
                            <input
                              type="number"
                              min={1}
                              value={editSets}
                              onChange={e => setEditSets(Number(e.target.value) || 1)}
                              onKeyDown={e => e.key === 'Enter' && handleCommitEdit()}
                              autoFocus
                              className="w-10 bg-white/10 border border-white/20 rounded text-xs text-white text-center outline-none py-0.5"
                            />
                            <span className="text-white/40 text-xs">&times;</span>
                            <input
                              type="text"
                              value={editReps}
                              onChange={e => setEditReps(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleCommitEdit()}
                              className="w-16 bg-white/10 border border-white/20 rounded text-xs text-white text-center outline-none py-0.5"
                            />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(day, ex.id, ex.sets, ex.reps)}
                            className="text-[13px] text-white/40 hover:text-white/70 mt-0.5 cursor-pointer"
                          >
                            {ex.sets} &times; {ex.reps}
                          </button>
                        )}
                        <div className="absolute top-0 right-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setDetailExerciseId(ex.exerciseId)}
                            className="text-white/40 hover:text-white cursor-pointer"
                            title="View details"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => dispatch(removeSplitExercise({ day, exerciseCellId: ex.id }))}
                            className="text-white/40 hover:text-rose-400 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {(entry?.exercises || []).length === 0 && (
                    <p className="text-sm text-white/40">Nothing yet</p>
                  )}

                  <button
                    type="button"
                    onClick={() => setLibraryDay(day)}
                    className="mt-1 text-sm font-semibold text-white/40 hover:text-amber-400 underline decoration-transparent hover:decoration-amber-400 underline-offset-4 transition-colors cursor-pointer text-left"
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {libraryDay && (
        <ExerciseLibraryModal
          day={libraryDay}
          focus={workoutSplit.find(d => d.day === libraryDay)?.focus ?? null}
          onClose={() => setLibraryDay(null)}
        />
      )}
      <ExerciseDetailModal exercise={detailExercise} onClose={() => setDetailExerciseId(null)} />
    </div>
  );
};
