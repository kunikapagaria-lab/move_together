import { createPortal } from 'react-dom';
import { X, Dumbbell } from 'lucide-react';
import { exerciseImageUrl, LEVEL_LABEL, DATASET_LEVEL_TO_USER, type Exercise } from './exerciseLibrary';

export const ExerciseDetailModal = ({
  exercise,
  onClose
}: {
  exercise: Exercise | null;
  onClose: () => void;
}) => {
  if (!exercise) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-black/95 border border-white/20 rounded-3xl w-full max-w-lg text-left shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#e0531c] via-[#b54619] to-amber-500 z-10" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-black/70 border border-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <img
          src={exerciseImageUrl(exercise.id)}
          alt={exercise.name}
          loading="lazy"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          className="w-full h-48 object-cover"
        />

        <div className="p-6 sm:p-8 pt-5">
          <h3
            style={{ fontFamily: "'Oswald', sans-serif" }}
            className="text-2xl font-bold text-white uppercase tracking-wide mb-3"
          >
            {exercise.name}
          </h3>

          <div className="flex flex-wrap gap-2 mb-5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-white/80">
              {LEVEL_LABEL[DATASET_LEVEL_TO_USER[exercise.level]]}
            </span>
            {exercise.equipment && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-white/80 capitalize">
                {exercise.equipment}
              </span>
            )}
            {exercise.primaryMuscles.map(m => (
              <span key={m} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/20 bg-white/10 text-white/80 capitalize">
                {m}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            {exercise.instructions.map((step, i) => (
              <div key={i} className="flex gap-3 text-sm text-white/70 leading-relaxed">
                <span className="shrink-0 w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[11px] font-bold text-white mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          {exercise.instructions.length === 0 && (
            <p className="text-sm text-white/50 flex items-center gap-2">
              <Dumbbell className="w-4 h-4" /> No instructions available for this exercise.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
