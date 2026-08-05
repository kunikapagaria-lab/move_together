import type { FocusTag } from '../../store/routineSlice';
import { FOCUS_MUSCLE_MAP, LEVEL_TO_DATASET, type Exercise, type UserFitnessLevel } from './exerciseLibrary';

function focusScore(ex: Exercise, focus: FocusTag): number {
  if (!focus || focus === 'rest') return 0;
  const spec = FOCUS_MUSCLE_MAP[focus];
  if (!spec) return 0;

  let score = 0;
  if (spec.force?.includes(ex.force || '')) score += 2;
  if (spec.category?.includes(ex.category)) score += 2;
  if (spec.muscles) {
    score += ex.primaryMuscles.filter(m => spec.muscles!.includes(m)).length;
  }
  return score;
}

// Ranks exercises for a "Recommended for You" section: matched to the user's
// fitness level, prioritized by the day's training focus (if set), then by how
// many muscle groups they'd add that this day's exercises haven't already hit.
// Caps 2-per-category so the list isn't six bench-press variants in a row.
export function recommendExercises(
  exercises: Exercise[],
  fitnessLevel: UserFitnessLevel | undefined,
  focus: FocusTag,
  coveredMuscles: Set<string>,
  limit = 6
): Exercise[] {
  if (!fitnessLevel) return [];

  const datasetLevel = LEVEL_TO_DATASET[fitnessLevel];
  const candidates = exercises.filter(e => e.level === datasetLevel);

  const scored = candidates.map(e => ({
    exercise: e,
    focus: focusScore(e, focus),
    novelty: e.primaryMuscles.filter(m => !coveredMuscles.has(m)).length
  }));

  scored.sort((a, b) => (b.focus - a.focus) || (b.novelty - a.novelty));

  const picked: Exercise[] = [];
  const categoryCounts: Record<string, number> = {};
  for (const { exercise } of scored) {
    const count = categoryCounts[exercise.category] || 0;
    if (count >= 2) continue;
    picked.push(exercise);
    categoryCounts[exercise.category] = count + 1;
    if (picked.length >= limit) break;
  }
  return picked;
}
