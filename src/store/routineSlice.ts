import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface RoutineSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  time: string; // e.g. "06:30 AM"
  title: string;
  taskId?: string; // Optional link to task (e.g. 't1')
  note?: string;
}

interface RoutineState {
  slots: RoutineSlot[];
}

const DEFAULT_ROUTINE: RoutineSlot[] = [
  // Monday
  { id: 'r1', day: 'Monday', time: '06:30 AM', title: 'Outdoor Workout / Walk', taskId: 't2', note: '45 mins outdoor cardio' },
  { id: 'r2', day: 'Monday', time: '08:00 AM', title: 'Protein & Fibre Breakfast', taskId: 't3', note: 'Clean nutrition prep' },
  { id: 'r3', day: 'Monday', time: '01:00 PM', title: 'Hydration & Water Goal', taskId: 't7', note: 'Drink 2L water' },
  { id: 'r4', day: 'Monday', time: '05:30 PM', title: 'Weight Training / Gym', taskId: 't1', note: '45 mins gym session' },
  { id: 'r5', day: 'Monday', time: '09:30 PM', title: 'Read 10-15 Pages & Journal', taskId: 't5', note: 'Mindset & reflection' },
  
  // Tuesday
  { id: 'r6', day: 'Tuesday', time: '06:30 AM', title: 'Outdoor Workout / Walk', taskId: 't2' },
  { id: 'r7', day: 'Tuesday', time: '05:30 PM', title: 'Strength Workout', taskId: 't1' },
  { id: 'r8', day: 'Tuesday', time: '09:30 PM', title: 'Read & Log Progress Photo', taskId: 't8' },

  // Wednesday
  { id: 'r9', day: 'Wednesday', time: '06:30 AM', title: 'Morning Cardio', taskId: 't2' },
  { id: 'r10', day: 'Wednesday', time: '05:30 PM', title: 'Gym Session', taskId: 't1' },
  { id: 'r11', day: 'Wednesday', time: '09:30 PM', title: 'Reading & Wind Down', taskId: 't5' },

  // Thursday
  { id: 'r12', day: 'Thursday', time: '06:30 AM', title: 'Outdoor Walk', taskId: 't2' },
  { id: 'r13', day: 'Thursday', time: '05:30 PM', title: 'Weight Training', taskId: 't1' },

  // Friday
  { id: 'r14', day: 'Friday', time: '06:30 AM', title: 'Morning Run / Walk', taskId: 't2' },
  { id: 'r15', day: 'Friday', time: '05:30 PM', title: 'Gym Session', taskId: 't1' },

  // Saturday
  { id: 'r16', day: 'Saturday', time: '07:30 AM', title: 'Weekend Outdoor Hike / Run', taskId: 't2' },
  { id: 'r17', day: 'Saturday', time: '04:00 PM', title: 'Home Workout / Gym', taskId: 't1' },

  // Sunday
  { id: 'r18', day: 'Sunday', time: '08:00 AM', title: 'Active Recovery Walk', taskId: 't2' },
  { id: 'r19', day: 'Sunday', time: '05:00 PM', title: 'Weekly Prep & Stretch', taskId: 't6' },
];

const loadInitialRoutine = (): RoutineSlot[] => {
  try {
    const saved = localStorage.getItem('move_together_routine');
    return saved ? JSON.parse(saved) : DEFAULT_ROUTINE;
  } catch (e) {
    return DEFAULT_ROUTINE;
  }
};

const initialState: RoutineState = {
  slots: loadInitialRoutine(),
};

const routineSlice = createSlice({
  name: 'routine',
  initialState,
  reducers: {
    addSlot: (state, action: PayloadAction<Omit<RoutineSlot, 'id'>>) => {
      const newSlot: RoutineSlot = {
        ...action.payload,
        id: 'r_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      };
      state.slots.push(newSlot);
      localStorage.setItem('move_together_routine', JSON.stringify(state.slots));
    },
    updateSlot: (state, action: PayloadAction<RoutineSlot>) => {
      const idx = state.slots.findIndex(s => s.id === action.payload.id);
      if (idx !== -1) {
        state.slots[idx] = action.payload;
        localStorage.setItem('move_together_routine', JSON.stringify(state.slots));
      }
    },
    deleteSlot: (state, action: PayloadAction<string>) => {
      state.slots = state.slots.filter(s => s.id !== action.payload);
      localStorage.setItem('move_together_routine', JSON.stringify(state.slots));
    },
    applyPreset: (state, action: PayloadAction<'early' | 'standard' | 'night'>) => {
      let presetSlots: RoutineSlot[] = [];
      const days: RoutineSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      if (action.payload === 'early') {
        days.forEach((day, idx) => {
          presetSlots.push(
            { id: `preset_e1_${idx}`, day, time: '05:30 AM', title: 'Outdoor Workout / Run', taskId: 't2', note: 'Fresh morning cardio' },
            { id: `preset_e2_${idx}`, day, time: '07:00 AM', title: 'Protein Meal & Water', taskId: 't3', note: 'Nutrition & 1L water' },
            { id: `preset_e3_${idx}`, day, time: '05:30 PM', title: 'Gym / Weight Training', taskId: 't1', note: 'Evening lift' },
            { id: `preset_e4_${idx}`, day, time: '09:00 PM', title: 'Read 15 Pages & Sleep', taskId: 't5', note: 'Early wind down' }
          );
        });
      } else if (action.payload === 'night') {
        days.forEach((day, idx) => {
          presetSlots.push(
            { id: `preset_n1_${idx}`, day, time: '09:00 AM', title: 'Morning Walk & Hydrate', taskId: 't2' },
            { id: `preset_n2_${idx}`, day, time: '07:30 PM', title: 'Weight Training / Gym', taskId: 't1' },
            { id: `preset_n3_${idx}`, day, time: '10:30 PM', title: 'Late Night Read & Photo', taskId: 't8' }
          );
        });
      } else {
        days.forEach((day, idx) => {
          presetSlots.push(
            { id: `preset_s1_${idx}`, day, time: '06:45 AM', title: 'Morning Workout', taskId: 't2' },
            { id: `preset_s2_${idx}`, day, time: '01:00 PM', title: 'Water Intake Check', taskId: 't7' },
            { id: `preset_s3_${idx}`, day, time: '06:00 PM', title: 'Evening Gym Session', taskId: 't1' },
            { id: `preset_s4_${idx}`, day, time: '10:00 PM', title: 'Book Reading & Reflect', taskId: 't5' }
          );
        });
      }

      state.slots = presetSlots;
      localStorage.setItem('move_together_routine', JSON.stringify(state.slots));
    }
  }
});

export const { addSlot, updateSlot, deleteSlot, applyPreset } = routineSlice.actions;
export default routineSlice.reducer;
