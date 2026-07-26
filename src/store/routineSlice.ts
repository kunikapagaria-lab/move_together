import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface TimetableCell {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeRow: string; // e.g. "5:00 AM", "8:00 AM", "13:00 PM", "15:00 PM", "17:00 PM", "19:00 PM", "21:00 PM"
  title: string; // e.g. "YOGA"
  subtitle?: string; // e.g. "5:00am - 7:00am"
}

interface RoutineState {
  cells: TimetableCell[];
  timeRows: string[];
}

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

const loadInitialCells = (): TimetableCell[] => {
  try {
    const saved = localStorage.getItem('move_together_timetable_cells');
    return saved ? JSON.parse(saved) : DEFAULT_CELLS;
  } catch (e) {
    return DEFAULT_CELLS;
  }
};

const loadInitialRows = (): string[] => {
  try {
    const saved = localStorage.getItem('move_together_timetable_rows');
    return saved ? JSON.parse(saved) : DEFAULT_TIME_ROWS;
  } catch (e) {
    return DEFAULT_TIME_ROWS;
  }
};

const initialState: RoutineState = {
  cells: loadInitialCells(),
  timeRows: loadInitialRows(),
};

const routineSlice = createSlice({
  name: 'routine',
  initialState,
  reducers: {
    setCell: (state, action: PayloadAction<{ day: TimetableCell['day']; timeRow: string; title: string; subtitle?: string }>) => {
      const { day, timeRow, title, subtitle } = action.payload;
      
      // If title is empty, delete cell
      if (!title.trim()) {
        state.cells = state.cells.filter(c => !(c.day === day && c.timeRow === timeRow));
      } else {
        const existingIdx = state.cells.findIndex(c => c.day === day && c.timeRow === timeRow);
        if (existingIdx !== -1) {
          state.cells[existingIdx].title = title;
          state.cells[existingIdx].subtitle = subtitle || `${timeRow.toLowerCase()} slot`;
        } else {
          state.cells.push({
            id: 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            day,
            timeRow,
            title,
            subtitle: subtitle || `${timeRow.toLowerCase()} slot`
          });
        }
      }
      localStorage.setItem('move_together_timetable_cells', JSON.stringify(state.cells));
    },

    moveCell: (state, action: PayloadAction<{ cellId: string; targetDay: TimetableCell['day']; targetTimeRow: string }>) => {
      const { cellId, targetDay, targetTimeRow } = action.payload;
      const cell = state.cells.find(c => c.id === cellId);
      if (cell) {
        // Remove any existing cell at target
        state.cells = state.cells.filter(c => !(c.day === targetDay && c.timeRow === targetTimeRow));
        cell.day = targetDay;
        cell.timeRow = targetTimeRow;
        localStorage.setItem('move_together_timetable_cells', JSON.stringify(state.cells));
      }
    },

    deleteCell: (state, action: PayloadAction<string>) => {
      state.cells = state.cells.filter(c => c.id !== action.payload);
      localStorage.setItem('move_together_timetable_cells', JSON.stringify(state.cells));
    },

    addTimeRow: (state, action: PayloadAction<string>) => {
      if (!state.timeRows.includes(action.payload)) {
        state.timeRows.push(action.payload);
        localStorage.setItem('move_together_timetable_rows', JSON.stringify(state.timeRows));
      }
    },

    removeTimeRow: (state, action: PayloadAction<string>) => {
      state.timeRows = state.timeRows.filter(r => r !== action.payload);
      state.cells = state.cells.filter(c => c.timeRow !== action.payload);
      localStorage.setItem('move_together_timetable_rows', JSON.stringify(state.timeRows));
      localStorage.setItem('move_together_timetable_cells', JSON.stringify(state.cells));
    }
  }
});

export const { setCell, moveCell, deleteCell, addTimeRow, removeTimeRow } = routineSlice.actions;
export default routineSlice.reducer;
