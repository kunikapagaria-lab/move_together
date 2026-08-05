import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X, Check, Info, Dumbbell } from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import { addSplitExercise, type Day, type FocusTag } from '../../store/routineSlice';
import { setFitnessLevel } from '../../store/authSlice';
import { api } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import {
  loadExercises,
  exerciseImageUrl,
  LEVEL_LABEL,
  FOCUS_LABEL,
  DATASET_LEVEL_TO_USER,
  type Exercise,
  type UserFitnessLevel
} from './exerciseLibrary';
import { recommendExercises } from './recommendExercises';
import { ExerciseDetailModal } from './ExerciseDetailModal';

const LEVEL_OPTIONS: (UserFitnessLevel | 'all')[] = ['all', 'beginner', 'intermediate', 'advanced'];
const EQUIPMENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'body only', label: 'Bodyweight' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'cable', label: 'Cable' },
  { value: 'machine', label: 'Machine' },
  { value: 'kettlebells', label: 'Kettlebell' },
];

export const ExerciseLibraryModal = ({
  day,
  focus,
  onClose
}: {
  day: Day;
  focus: FocusTag;
  onClose: () => void;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { showSuccess, showError } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const workoutSplit = useSelector((state: RootState) => state.routine.workoutSplit);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoadingLib, setIsLoadingLib] = useState(true);
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<UserFitnessLevel | 'all'>('all');
  const [equipFilter, setEquipFilter] = useState('all');
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
  const [savingLevel, setSavingLevel] = useState(false);

  useEffect(() => {
    loadExercises()
      .then(setExercises)
      .catch(() => showError('Could not load the exercise library. Please try again.'))
      .finally(() => setIsLoadingLib(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dayEntry = workoutSplit.find(d => d.day === day);
  const addedExerciseIds = useMemo(
    () => new Set((dayEntry?.exercises || []).map(e => e.exerciseId)),
    [dayEntry]
  );
  const coveredMuscles = useMemo(
    () => new Set((dayEntry?.exercises || []).flatMap(e => e.primaryMuscles)),
    [dayEntry]
  );

  const recommended = useMemo(
    () => recommendExercises(exercises, user?.fitnessLevel, focus, coveredMuscles, 6),
    [exercises, user?.fitnessLevel, focus, coveredMuscles]
  );

  const filteredList = useMemo(() => {
    return exercises.filter(e => {
      if (levelFilter !== 'all') {
        const levelMap: Record<UserFitnessLevel, Exercise['level']> = { beginner: 'beginner', intermediate: 'intermediate', advanced: 'expert' };
        if (e.level !== levelMap[levelFilter]) return false;
      }
      if (equipFilter !== 'all' && e.equipment !== equipFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const haystack = `${e.name} ${e.primaryMuscles.join(' ')} ${e.equipment || ''} ${e.category}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [exercises, levelFilter, equipFilter, query]);

  const handleSetLevel = async (level: UserFitnessLevel) => {
    setSavingLevel(true);
    try {
      await api.updateFitnessLevel(level);
      dispatch(setFitnessLevel(level));
    } catch (err: any) {
      showError(err?.message || 'Failed to save your fitness level.');
    } finally {
      setSavingLevel(false);
    }
  };

  const handleAdd = (exercise: Exercise) => {
    dispatch(addSplitExercise({
      day,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      primaryMuscles: exercise.primaryMuscles
    }));
    showSuccess(`Added ${exercise.name} to ${day}!`);
  };

  const renderCard = (exercise: Exercise) => {
    const alreadyAdded = addedExerciseIds.has(exercise.id);
    return (
      <div
        key={exercise.id}
        className="bg-white/10 hover:bg-white/[0.14] border border-white/15 rounded-2xl overflow-hidden transition-colors cursor-pointer relative group"
        onClick={() => !alreadyAdded && handleAdd(exercise)}
      >
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setDetailExercise(exercise); }}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/70 border border-white/20 text-white/80 hover:text-white flex items-center justify-center cursor-pointer"
          title="View details"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
        <img
          src={exerciseImageUrl(exercise.id)}
          alt={exercise.name}
          loading="lazy"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          className="w-full h-24 object-cover"
        />
        <div className="p-2.5">
          <h5
            style={{ fontFamily: "'Oswald', sans-serif" }}
            className="text-xs font-bold text-white uppercase tracking-wide leading-tight mb-1"
          >
            {exercise.name}
          </h5>
          <p className="text-[10px] text-white/60 capitalize">{LEVEL_LABEL[DATASET_LEVEL_TO_USER[exercise.level]]} &middot; {exercise.primaryMuscles[0]}</p>
        </div>
        {alreadyAdded && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="flex items-center gap-1.5 bg-white text-black text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">
              <Check className="w-3 h-3" /> Added
            </span>
          </div>
        )}
      </div>
    );
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-black/95 border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-2xl text-left shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e0531c] via-[#b54619] to-amber-500" />

        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-white/30 bg-white/10 text-white uppercase tracking-wider mb-1 inline-block">
              {day}{focus ? ` · ${FOCUS_LABEL[focus as Exclude<FocusTag, null>] || focus}` : ''}
            </span>
            <h3
              style={{ fontFamily: "'Oswald', sans-serif" }}
              className="text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-2"
            >
              <Dumbbell className="w-5 h-5 text-amber-400" /> Find a Workout
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, muscle, or equipment..."
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none placeholder-white/40 font-medium"
          />
        </div>

        <div className="mb-3">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Level</p>
          <div className="flex flex-wrap gap-1.5">
            {LEVEL_OPTIONS.map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setLevelFilter(l)}
                className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  levelFilter === l ? 'bg-white text-black border-white' : 'bg-white/10 text-white/70 border-white/15 hover:text-white'
                }`}
              >
                {l === 'all' ? 'All' : LEVEL_LABEL[l]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Equipment</p>
          <div className="flex flex-wrap gap-1.5">
            {EQUIPMENT_OPTIONS.map(eq => (
              <button
                key={eq.value}
                type="button"
                onClick={() => setEquipFilter(eq.value)}
                className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  equipFilter === eq.value ? 'bg-white text-black border-white' : 'bg-white/10 text-white/70 border-white/15 hover:text-white'
                }`}
              >
                {eq.label}
              </button>
            ))}
          </div>
        </div>

        {!user?.fitnessLevel ? (
          <div className="bg-white/5 border border-dashed border-white/25 rounded-2xl p-4 mb-6">
            <p className="text-xs text-white/70 mb-3 leading-relaxed">
              Set your fitness level to unlock a Recommended-for-You row, matched to your level and this day's focus.
            </p>
            <div className="flex gap-2 flex-wrap">
              {(['beginner', 'intermediate', 'advanced'] as UserFitnessLevel[]).map(l => (
                <button
                  key={l}
                  type="button"
                  disabled={savingLevel}
                  onClick={() => handleSetLevel(l)}
                  className="text-[11px] font-bold px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {LEVEL_LABEL[l]}
                </button>
              ))}
            </div>
          </div>
        ) : recommended.length > 0 ? (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
              Recommended for You <span className="normal-case font-medium text-white/35">&middot; matched to {LEVEL_LABEL[user.fitnessLevel].toLowerCase()}{focus ? ` · ${FOCUS_LABEL[focus as Exclude<FocusTag, null>]?.toLowerCase()} day` : ''}</span>
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
              {recommended.map(ex => <div key={ex.id} className="w-36 shrink-0">{renderCard(ex)}</div>)}
            </div>
          </div>
        ) : null}

        <div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
            All Exercises <span className="normal-case font-medium text-white/35">({filteredList.length})</span>
          </p>
          {isLoadingLib ? (
            <p className="text-xs text-white/40 py-6 text-center">Loading exercise library...</p>
          ) : filteredList.length === 0 ? (
            <p className="text-xs text-white/40 py-6 text-center">No exercises match that search.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredList.map(renderCard)}
            </div>
          )}
        </div>
      </div>

      <ExerciseDetailModal exercise={detailExercise} onClose={() => setDetailExercise(null)} />
    </div>
  );

  return createPortal(modalContent, document.body);
};
