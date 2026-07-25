export interface AthleteRank {
  name: string;
  badge: string;
  minStreak: number;
  maxStreak: number;
  color: string;
  gradient: string;
  description: string;
}

export const ATHLETE_RANKS: AthleteRank[] = [
  {
    name: 'ROOKIE',
    badge: '🌱',
    minStreak: 0,
    maxStreak: 7,
    color: '#9CA3AF', // Gray
    gradient: 'from-gray-400 to-slate-600',
    description: 'Building foundation and establishing daily habits.'
  },
  {
    name: 'CHALLENGER',
    badge: '⚡',
    minStreak: 8,
    maxStreak: 21,
    color: '#38BDF8', // Cyan
    gradient: 'from-cyan-400 to-blue-600',
    description: 'Developing momentum and overcoming initial friction.'
  },
  {
    name: 'ATHLETE',
    badge: '🔥',
    minStreak: 22,
    maxStreak: 45,
    color: '#10B981', // Emerald
    gradient: 'from-emerald-400 to-teal-600',
    description: 'Consistent execution and visible lifestyle transformation.'
  },
  {
    name: 'ELITE',
    badge: '🏆',
    minStreak: 46,
    maxStreak: 74,
    color: '#6366F1', // Indigo
    gradient: 'from-indigo-500 to-purple-600',
    description: 'Unshakeable discipline and peak athletic conditioning.'
  },
  {
    name: 'LEGEND',
    badge: '👑',
    minStreak: 75,
    maxStreak: 999,
    color: '#F59E0B', // Gold / Volt Accent
    gradient: 'from-amber-400 to-yellow-500',
    description: 'Mastery. Completed the program and transcended limits.'
  }
];

export const getAthleteRank = (streak: number): AthleteRank => {
  const currentStreak = Math.max(0, streak);
  return ATHLETE_RANKS.find(r => currentStreak >= r.minStreak && currentStreak <= r.maxStreak) || ATHLETE_RANKS[0];
};

export const getNextRankProgress = (streak: number): { nextRank: AthleteRank | null; progressPct: number; daysLeft: number } => {
  const currentRank = getAthleteRank(streak);
  const currentIndex = ATHLETE_RANKS.findIndex(r => r.name === currentRank.name);
  
  if (currentIndex === ATHLETE_RANKS.length - 1) {
    return { nextRank: null, progressPct: 100, daysLeft: 0 };
  }

  const nextRank = ATHLETE_RANKS[currentIndex + 1];
  const range = nextRank.minStreak - currentRank.minStreak;
  const progressInCurrentRank = streak - currentRank.minStreak;
  const progressPct = Math.min(100, Math.max(0, Math.round((progressInCurrentRank / range) * 100)));
  const daysLeft = nextRank.minStreak - streak;

  return { nextRank, progressPct, daysLeft };
};
