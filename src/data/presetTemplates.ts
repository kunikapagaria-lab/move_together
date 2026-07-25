export interface TaskPreset {
  id: string;
  title: string;
  iconName: string;
  color: string;
  category?: 'cardio' | 'strength' | 'nutrition' | 'mindset' | 'recovery';
}

export interface ChallengePreset {
  id: string;
  title: string;
  tagline: string;
  durationDays: number;
  badge: string;
  accentColor: string;
  description: string;
  tasks: TaskPreset[];
}

export const PRESET_TEMPLATES: ChallengePreset[] = [
  {
    id: 'grit-75',
    title: 'Classic Move Together (Mental Grit)',
    tagline: 'The ultimate mental toughness program',
    durationDays: 75,
    badge: '🔥 GRIT',
    accentColor: 'from-amber-500 to-red-600',
    description: '2 Workouts daily, 1 Gallon water, Clean diet, 10 Pages reading, Progress photo.',
    tasks: [
      { id: 't1', title: 'Outdoor Workout (45 min)', iconName: 'Activity', color: 'bg-cyan-500', category: 'cardio' },
      { id: 't2', title: 'Indoor / Strength Workout (45 min)', iconName: 'Dumbbell', color: 'bg-orange-500', category: 'strength' },
      { id: 't3', title: '1 Gallon Water (3.8L)', iconName: 'Droplets', color: 'bg-sky-400', category: 'nutrition' },
      { id: 't4', title: 'Strict Clean Diet (No Alcohol/Cheat)', iconName: 'Utensils', color: 'bg-emerald-400', category: 'nutrition' },
      { id: 't5', title: 'Read 10 Pages Non-Fiction', iconName: 'BookOpen', color: 'bg-violet-400', category: 'mindset' },
      { id: 't6', title: 'Daily Progress Photo', iconName: 'Camera', color: 'bg-yellow-400', category: 'mindset' }
    ]
  },
  {
    id: 'endurance-run',
    title: 'Endurance & Speed (Run Club)',
    tagline: 'Build cardiovascular engine & stamina',
    durationDays: 30,
    badge: '⚡ ENDURANCE',
    accentColor: 'from-cyan-500 to-blue-600',
    description: 'Daily run/walk progression, hydration targets, foam rolling & mobility recovery.',
    tasks: [
      { id: 'er1', title: 'Daily Run or Interval (5 km+)', iconName: 'Activity', color: 'bg-cyan-400', category: 'cardio' },
      { id: 'er2', title: 'Dynamic Warmup & Mobility (15 min)', iconName: 'Sparkles', color: 'bg-emerald-400', category: 'recovery' },
      { id: 'er3', title: '3L Electrolyte Hydration', iconName: 'Droplets', color: 'bg-sky-400', category: 'nutrition' },
      { id: 'er4', title: 'Post-Run Foam Rolling & Stretch', iconName: 'HeartPulse', color: 'bg-rose-400', category: 'recovery' },
      { id: 'er5', title: '8 Hours Quality Sleep Target', iconName: 'Moon', color: 'bg-indigo-400', category: 'recovery' }
    ]
  },
  {
    id: 'hypertrophy-strength',
    title: 'Hypertrophy & Power (Strength Squad)',
    tagline: 'Maximize muscle mass & functional power',
    durationDays: 45,
    badge: '🏋️ STRENGTH',
    accentColor: 'from-emerald-400 to-teal-600',
    description: 'Heavy compound training, high-protein intake, sleep hygiene & injury prevention.',
    tasks: [
      { id: 'hs1', title: 'Heavy Resistance Training', iconName: 'Dumbbell', color: 'bg-orange-500', category: 'strength' },
      { id: 'hs2', title: 'Hit Protein Macro Target (1.6g/kg)', iconName: 'Utensils', color: 'bg-emerald-400', category: 'nutrition' },
      { id: 'hs3', title: 'Low Intensity Cardio (20 min Walk)', iconName: 'Activity', color: 'bg-cyan-400', category: 'cardio' },
      { id: 'hs4', title: '3.5L Water Intake', iconName: 'Droplets', color: 'bg-sky-400', category: 'nutrition' },
      { id: 'hs5', title: 'Joint Mobility & Core Work', iconName: 'Sparkles', color: 'bg-violet-400', category: 'recovery' }
    ]
  },
  {
    id: 'active-recovery',
    title: 'Active Recovery & Mindset',
    tagline: 'Recharge body, sharpen mental focus',
    durationDays: 21,
    badge: '🧘 RECOVERY',
    accentColor: 'from-purple-500 to-pink-600',
    description: 'Yoga, breathwork, cold therapy, clean nutrition, and digital detox.',
    tasks: [
      { id: 'ar1', title: '30 min Yoga or Full Body Stretch', iconName: 'Sparkles', color: 'bg-pink-400', category: 'recovery' },
      { id: 'ar2', title: '15 min Mindfulness Meditation', iconName: 'HeartPulse', color: 'bg-violet-400', category: 'mindset' },
      { id: 'ar3', title: 'Cold Shower / Contrast Hydrotherapy', iconName: 'Droplets', color: 'bg-cyan-400', category: 'recovery' },
      { id: 'ar4', title: 'Zero Refined Sugar Day', iconName: 'Utensils', color: 'bg-emerald-400', category: 'nutrition' },
      { id: 'ar5', title: 'No Screen Time 1 Hr Before Bed', iconName: 'Moon', color: 'bg-indigo-400', category: 'mindset' }
    ]
  }
];
