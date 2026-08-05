import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Trash2, Info, Moon, ChevronDown } from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import { setDayFocus, removeSplitExercise, updateSplitExercise, DAYS, type Day } from '../../store/routineSlice';
import { loadExercises, exerciseImageUrl, FOCUS_LABEL, FOCUS_ORDER, FOCUS_COLOR, type Exercise } from './exerciseLibrary';
import { ExerciseLibraryModal } from './ExerciseLibraryModal';
import { ExerciseDetailModal } from './ExerciseDetailModal';

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
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 sm:gap-4 w-full">
        {DAYS.map(day => {
          const entry = workoutSplit.find(d => d.day === day);
          const focus = entry?.focus ?? null;
          const isRest = focus === 'rest';
          const focusColor = focus ? FOCUS_COLOR[focus] : undefined;

          return (
            <div
              key={day}
              className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-3 sm:p-4 flex flex-col justify-between min-h-[400px] shadow-xl transition-all hover:bg-white/[0.13]"
            >
              <div>
                <div className="bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center mb-3 shadow-sm">
                  <div className="text-white font-black text-sm uppercase tracking-wider mb-2">{day}</div>
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={() => setFocusPickerDay(focusPickerDay === day ? null : day)}
                      style={focus ? { backgroundColor: `${focusColor}26`, borderColor: `${focusColor}80`, color: focusColor } : undefined}
                      className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                        !focus ? 'bg-white/10 border-white/25 text-white/50 hover:text-white' : ''
                      }`}
                    >
                      {focus ? FOCUS_LABEL[focus] : 'Set Focus'} <ChevronDown className="w-3 h-3" />
                    </button>

                    {focusPickerDay === day && (
                      <div className="absolute z-20 top-full mt-1.5 left-1/2 -translate-x-1/2 bg-black/95 border border-white/20 rounded-xl p-1.5 shadow-2xl w-36">
                        <button
                          type="button"
                          onClick={() => { dispatch(setDayFocus({ day, focus: null })); setFocusPickerDay(null); }}
                          className="w-full text-left text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                          Unset
                        </button>
                        {FOCUS_ORDER.map(f => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => { dispatch(setDayFocus({ day, focus: f })); setFocusPickerDay(null); }}
                            className="w-full flex items-center gap-2 text-left text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                            style={{ color: FOCUS_COLOR[f] }}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FOCUS_COLOR[f] }} />
                            {FOCUS_LABEL[f]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isRest ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 text-white/40">
                    <Moon className="w-6 h-6 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wide">Rest Day</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(entry?.exercises || []).map(ex => {
                      const isEditing = editingCell?.day === day && editingCell.exerciseCellId === ex.id;
                      return (
                        <div
                          key={ex.id}
                          className="bg-white/10 border border-white/20 rounded-2xl p-2.5 flex gap-2.5 items-center relative group"
                        >
                          <img
                            src={exerciseImageUrl(ex.exerciseId)}
                            alt={ex.exerciseName}
                            loading="lazy"
                            onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 bg-white/10"
                          />
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-[11px] font-black text-white uppercase tracking-wide leading-tight truncate">{ex.exerciseName}</p>
                            {isEditing ? (
                              <div className="flex items-center gap-1 mt-1" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) handleCommitEdit(); }}>
                                <input
                                  type="number"
                                  min={1}
                                  value={editSets}
                                  onChange={e => setEditSets(Number(e.target.value) || 1)}
                                  onKeyDown={e => e.key === 'Enter' && handleCommitEdit()}
                                  autoFocus
                                  className="w-9 bg-white/10 border border-white/20 rounded text-[10px] text-white text-center outline-none py-0.5"
                                />
                                <span className="text-white/40 text-[10px]">x</span>
                                <input
                                  type="text"
                                  value={editReps}
                                  onChange={e => setEditReps(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleCommitEdit()}
                                  className="w-14 bg-white/10 border border-white/20 rounded text-[10px] text-white text-center outline-none py-0.5"
                                />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(day, ex.id, ex.sets, ex.reps)}
                                className="text-[10px] text-white/60 hover:text-white mt-0.5 cursor-pointer"
                              >
                                {ex.sets} &times; {ex.reps}
                              </button>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={() => setDetailExerciseId(ex.exerciseId)}
                              className="text-white/40 hover:text-white p-0.5 cursor-pointer"
                              title="View details"
                            >
                              <Info className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => dispatch(removeSplitExercise({ day, exerciseCellId: ex.id }))}
                              className="text-white/40 hover:text-rose-400 p-0.5 cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {!isRest && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setLibraryDay(day)}
                    className="w-full py-2.5 border border-dashed border-white/30 rounded-2xl flex items-center justify-center gap-1 text-white/50 hover:text-white hover:border-white/60 hover:bg-white/10 transition-all text-xs font-bold group cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-white/50 group-hover:text-white group-hover:scale-110 transition-transform" />
                    <span className="text-[11px]">Add Exercise</span>
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
