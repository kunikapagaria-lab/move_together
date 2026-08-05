import type { FocusTag } from '../../store/routineSlice';

export interface Exercise {
  id: string;
  name: string;
  force: string | null;
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
}

export type UserFitnessLevel = 'beginner' | 'intermediate' | 'advanced';

// Dataset uses 'expert' for the top tier; the user-facing field stays 'advanced'.
export const LEVEL_TO_DATASET: Record<UserFitnessLevel, Exercise['level']> = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'expert'
};

export const LEVEL_LABEL: Record<UserFitnessLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced'
};

export const DATASET_LEVEL_TO_USER: Record<Exercise['level'], UserFitnessLevel> = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  expert: 'advanced'
};

export const FOCUS_LABEL: Record<Exclude<FocusTag, null>, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  upper: 'Upper',
  lower: 'Lower',
  full_body: 'Full Body',
  cardio: 'Cardio',
  rest: 'Rest'
};

export const FOCUS_ORDER: Exclude<FocusTag, null>[] = ['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'cardio', 'rest'];

export const FOCUS_COLOR: Record<Exclude<FocusTag, null>, string> = {
  push: '#fb7185',
  pull: '#60a5fa',
  legs: '#c084fc',
  upper: '#fbbf24',
  lower: '#34d399',
  full_body: '#f472b6',
  cardio: '#38bdf8',
  rest: '#94a3b8'
};

// What a given training focus is "about" - used to prioritize recommendations.
// Not an exclusive filter: exercises outside the map still show up, just ranked lower.
export const FOCUS_MUSCLE_MAP: Record<Exclude<FocusTag, null>, { force?: string[]; muscles?: string[]; category?: string[] }> = {
  push: { force: ['push'], muscles: ['chest', 'shoulders', 'triceps'] },
  pull: { force: ['pull'], muscles: ['lats', 'middle back', 'lower back', 'biceps', 'traps'] },
  legs: { muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'] },
  upper: { muscles: ['chest', 'shoulders', 'triceps', 'lats', 'middle back', 'traps', 'biceps', 'forearms'] },
  lower: { muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'] },
  full_body: {},
  cardio: { category: ['cardio'] },
  rest: {}
};

export function exerciseImageUrl(exerciseId: string, index: 0 | 1 = 0): string {
  return `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/${exerciseId}/${index}.jpg`;
}

let cachedExercises: Exercise[] | null = null;
let inFlight: Promise<Exercise[]> | null = null;

export async function loadExercises(): Promise<Exercise[]> {
  if (cachedExercises) return cachedExercises;
  if (inFlight) return inFlight;

  inFlight = fetch('/data/exercises.json')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load exercise library');
      return res.json();
    })
    .then((data: Exercise[]) => {
      cachedExercises = data;
      return data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
