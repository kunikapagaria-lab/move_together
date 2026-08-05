import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../services/api';

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type FocusTag = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full_body' | 'cardio' | 'rest' | null;

export interface TimetableCell {
  id: string;
  day: Day;
  timeRow: string; // e.g. "5:00 AM", "8:00 AM", "13:00 PM", "15:00 PM", "17:00 PM", "19:00 PM", "21:00 PM"
  title: string; // e.g. "YOGA"
  subtitle?: string; // e.g. "5:00am - 7:00am"
}

export interface SplitExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  primaryMuscles: string[];
  sets: number;
  reps: string; // string to allow "8-12", "30s", "AMRAP", etc.
}

export interface WorkoutSplitDay {
  day: Day;
  focus: FocusTag;
  exercises: SplitExercise[];
}

interface RoutineState {
  cells: TimetableCell[];
  timeRows: string[];
  workoutSplit: WorkoutSplitDay[];
  isLoading: boolean;
  isSaving: boolean;
  hasLoadedOnce: boolean;
}

export const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_TIME_ROWS = [
  '5:00 AM',
  '8:00 AM',
  '11:00 AM',
  '13:00 PM',
  '15:00 PM',
  '17:00 PM',
  '19:00 PM',
  '21:00 PM'
];

const DEFAULT_CELLS: TimetableCell[] = [
  { id: 'c1', day: 'Monday', timeRow: '5:00 AM', title: 'YOGA', subtitle: '5:00am - 7:00am' },
  { id: 'c2', day: 'Wednesday', timeRow: '5:00 AM', title: 'CYCLING', subtitle: '5:00am - 7:00am' },
  { id: 'c3', day: 'Thursday', timeRow: '5:00 AM', title: 'RUNNING', subtitle: '5:00am - 7:00am' },
  { id: 'c4', day: 'Saturday', timeRow: '5:00 AM', title: 'MARTIAL ARTS', subtitle: '5:00am - 7:00am' },

  { id: 'c5', day: 'Tuesday', timeRow: '8:00 AM', title: 'GYM', subtitle: '8:00am - 10:00am' },
  { id: 'c6', day: 'Thursday', timeRow: '8:00 AM', title: 'YOGA', subtitle: '8:00am - 10:00am' },
  { id: 'c7', day: 'Sunday', timeRow: '8:00 AM', title: 'RUNNING', subtitle: '8:00am - 10:00am' },

  { id: 'c8', day: 'Monday', timeRow: '13:00 PM', title: 'BODY BUILDING', subtitle: '13:00pm - 15:00pm' },
  { id: 'c9', day: 'Wednesday', timeRow: '13:00 PM', title: 'MARTIAL ARTS', subtitle: '13:00pm - 15:00pm' },
  { id: 'c10', day: 'Saturday', timeRow: '13:00 PM', title: 'CYCLING', subtitle: '13:00pm - 15:00pm' },

  { id: 'c11', day: 'Friday', timeRow: '15:00 PM', title: 'YOGA', subtitle: '15:00pm - 17:00pm' },

  { id: 'c12', day: 'Tuesday', timeRow: '17:00 PM', title: 'YOGA', subtitle: '17:00pm - 19:00pm' },
  { id: 'c13', day: 'Saturday', timeRow: '17:00 PM', title: 'BODY BUILDING', subtitle: '17:00pm - 19:00pm' },
];

const emptyWorkoutSplit = (): WorkoutSplitDay[] => DAYS.map(day => ({ day, focus: null, exercises: [] }));

const initialState: RoutineState = {
  cells: [],
  timeRows: DEFAULT_TIME_ROWS,
  workoutSplit: emptyWorkoutSplit(),
  isLoading: false,
  isSaving: false,
  hasLoadedOnce: false,
};

// Loads the routine from the backend. If the server has never had anything saved
// for this account (cells and workoutSplit both empty), runs a one-time migration
// of this browser's localStorage Schedule data (or seeds fresh defaults for a
// genuinely new user) and pushes it up, so nobody's existing routine disappears
// when this ships.
export const bootstrapRoutine = createAsyncThunk(
  'routine/bootstrap',
  async (userId: string, thunkAPI) => {
    try {
      const server = await api.getRoutine();
      const serverIsEmpty = (server.cells?.length || 0) === 0 && (server.workoutSplit?.length || 0) === 0;

      if (!serverIsEmpty) {
        return {
          cells: server.cells,
          timeRows: server.timeRows?.length ? server.timeRows : DEFAULT_TIME_ROWS,
          workoutSplit: server.workoutSplit?.length ? server.workoutSplit : emptyWorkoutSplit(),
        };
      }

      const migratedKey = `movetribe_routine_migrated_${userId}`;
      let cells: TimetableCell[];
      let timeRows: string[];
      const workoutSplit = emptyWorkoutSplit();

      if (localStorage.getItem(migratedKey) === '1') {
        // Already handled before (e.g. a prior save attempt failed) - don't
        // re-read localStorage again, just get the account into a working state.
        cells = DEFAULT_CELLS;
        timeRows = DEFAULT_TIME_ROWS;
      } else {
        try {
          const localCellsRaw = localStorage.getItem('movetribe_timetable_cells');
          const localCells = localCellsRaw ? JSON.parse(localCellsRaw) : [];
          if (Array.isArray(localCells) && localCells.length > 0) {
            cells = localCells;
            const localRowsRaw = localStorage.getItem('movetribe_timetable_rows');
            const localRows = localRowsRaw ? JSON.parse(localRowsRaw) : null;
            timeRows = Array.isArray(localRows) && localRows.length ? localRows : DEFAULT_TIME_ROWS;
          } else {
            cells = DEFAULT_CELLS;
            timeRows = DEFAULT_TIME_ROWS;
          }
        } catch {
          cells = DEFAULT_CELLS;
          timeRows = DEFAULT_TIME_ROWS;
        }
        localStorage.setItem(migratedKey, '1');
      }

      await api.updateRoutine(cells, timeRows, workoutSplit);
      return { cells, timeRows, workoutSplit };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const saveRoutine = createAsyncThunk(
  'routine/save',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState() as { routine: RoutineState };
      return await api.updateRoutine(state.routine.cells, state.routine.timeRows, state.routine.workoutSplit);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const routineSlice = createSlice({
  name: 'routine',
  initialState,
  reducers: {
    setCell: (state, action: PayloadAction<{ cellId?: string; day: Day; timeRow: string; title: string; subtitle?: string }>) => {
      const { cellId, day, timeRow, title, subtitle } = action.payload;

      if (cellId) {
        // Editing one specific, already-known cell in place.
        if (!title.trim()) {
          state.cells = state.cells.filter(c => c.id !== cellId);
        } else {
          const existing = state.cells.find(c => c.id === cellId);
          if (existing) {
            existing.title = title;
            existing.subtitle = subtitle || `${timeRow.toLowerCase()} slot`;
          }
        }
      } else if (title.trim()) {
        // Adding a brand new task - always create a new card rather than upserting
        // by (day, timeRow), which used to silently overwrite another card that
        // happened to share the same (often generic "Custom") time-row label.
        state.cells.push({
          id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          day,
          timeRow,
          title,
          subtitle: subtitle || `${timeRow.toLowerCase()} slot`
        });
      }
    },

    moveCell: (state, action: PayloadAction<{ cellId: string; targetDay: Day; targetTimeRow: string }>) => {
      const { cellId, targetDay, targetTimeRow } = action.payload;
      const cell = state.cells.find(c => c.id === cellId);
      if (cell) {
        // Just move it onto the target day - don't evict whatever else is already
        // there. `timeRow` isn't shown in the UI at all; it used to double as a
        // "slot" key that silently deleted any existing card sharing the same
        // (day, timeRow) pair, which is why dropping a card onto a day with
        // existing cards was replacing them instead of just adding to the list.
        cell.day = targetDay;
        cell.timeRow = targetTimeRow;
      }
    },

    deleteCell: (state, action: PayloadAction<string>) => {
      state.cells = state.cells.filter(c => c.id !== action.payload);
    },

    addTimeRow: (state, action: PayloadAction<string>) => {
      if (!state.timeRows.includes(action.payload)) {
        state.timeRows.push(action.payload);
      }
    },

    removeTimeRow: (state, action: PayloadAction<string>) => {
      state.timeRows = state.timeRows.filter(r => r !== action.payload);
      state.cells = state.cells.filter(c => c.timeRow !== action.payload);
    },

    setDayFocus: (state, action: PayloadAction<{ day: Day; focus: FocusTag }>) => {
      const entry = state.workoutSplit.find(d => d.day === action.payload.day);
      if (entry) entry.focus = action.payload.focus;
    },

    addSplitExercise: (state, action: PayloadAction<{ day: Day; exerciseId: string; exerciseName: string; primaryMuscles: string[] }>) => {
      const { day, exerciseId, exerciseName, primaryMuscles } = action.payload;
      const entry = state.workoutSplit.find(d => d.day === day);
      if (entry) {
        entry.exercises.push({
          id: 'ex_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          exerciseId,
          exerciseName,
          primaryMuscles,
          sets: 3,
          reps: '8-12'
        });
      }
    },

    updateSplitExercise: (state, action: PayloadAction<{ day: Day; exerciseCellId: string; sets?: number; reps?: string }>) => {
      const { day, exerciseCellId, sets, reps } = action.payload;
      const entry = state.workoutSplit.find(d => d.day === day);
      const ex = entry?.exercises.find(e => e.id === exerciseCellId);
      if (ex) {
        if (sets !== undefined) ex.sets = sets;
        if (reps !== undefined) ex.reps = reps;
      }
    },

    removeSplitExercise: (state, action: PayloadAction<{ day: Day; exerciseCellId: string }>) => {
      const entry = state.workoutSplit.find(d => d.day === action.payload.day);
      if (entry) entry.exercises = entry.exercises.filter(e => e.id !== action.payload.exerciseCellId);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapRoutine.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(bootstrapRoutine.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasLoadedOnce = true;
        state.cells = action.payload.cells;
        state.timeRows = action.payload.timeRows;
        state.workoutSplit = action.payload.workoutSplit;
      })
      .addCase(bootstrapRoutine.rejected, (state) => {
        state.isLoading = false;
        // Still mark as loaded so the autosave effect can take over from here -
        // an empty local board is better than one stuck permanently read-only.
        state.hasLoadedOnce = true;
      })
      .addCase(saveRoutine.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(saveRoutine.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(saveRoutine.rejected, (state) => {
        state.isSaving = false;
      });
  }
});

export const {
  setCell,
  moveCell,
  deleteCell,
  addTimeRow,
  removeTimeRow,
  setDayFocus,
  addSplitExercise,
  updateSplitExercise,
  removeSplitExercise
} = routineSlice.actions;
export default routineSlice.reducer;
