import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

export interface Challenge {
  _id: string;
  durationDays: number;
  startDate: string;
  tasks: any[];
  status: 'active' | 'completed' | 'failed' | 'cancelled';
}

interface ChallengeState {
  activeChallenge: Challenge | any | null;
  todayLog: any | null;
  history: any[];
  streak: number;
  isLoading: boolean;
  isError: boolean;
  message: string;
}

const initialState: ChallengeState = {
  activeChallenge: null,
  todayLog: null,
  history: [],
  streak: 0,
  isLoading: false,
  isError: false,
  message: ''
};

export const fetchChallengeData = createAsyncThunk(
  'challenge/fetchData',
  async (_, thunkAPI) => {
    try {
      const challenge = await api.getActiveChallenge();
      if (!challenge) {
        return { challenge: null, log: null, streak: 0, history: [] };
      }
      let log = null;
      let streak = 0;
      let history: any[] = [];
      try { log = await api.getTodayLog(challenge._id); } catch (e) { console.error('Error fetching today log:', e); }
      try { const s = await api.getStreak(challenge._id); streak = s?.streak || 0; } catch (e) { console.error('Error fetching streak:', e); }
      try { history = await api.getHistory(challenge._id); } catch (e) { console.error('Error fetching history:', e); }
      return { challenge, log, streak, history };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const startChallenge = createAsyncThunk(
  'challenge/startChallenge',
  async ({ durationDays, tasks, invitedFriendIds }: { durationDays: number, tasks: any[], invitedFriendIds?: string[] }, thunkAPI) => {
    try {
      const res = await api.startChallenge(durationDays, tasks, invitedFriendIds);
      const challenge = res.challenge || res;
      const log = await api.getTodayLog(challenge._id);
      const streakData = await api.getStreak(challenge._id);
      return { challenge, log, streak: streakData?.streak || 0, history: [] };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const cancelChallenge = createAsyncThunk(
  'challenge/cancel',
  async (_, thunkAPI) => {
    try {
      await api.cancelChallenge();
      return null;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const toggleTask = createAsyncThunk(
  'challenge/toggleTask',
  async ({ taskId, isCompleted }: { taskId: string, isCompleted: boolean }, thunkAPI) => {
    try {
      const state: any = thunkAPI.getState();
      const challengeId = state.challenge.activeChallenge?._id || 'default';
      const log = await api.toggleTask(challengeId, taskId, isCompleted);
      const streakData = await api.getStreak(challengeId);
      return { log, streak: streakData?.streak || 0 };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const updateJournal = createAsyncThunk(
  'challenge/updateJournal',
  async (journalEntry: string, thunkAPI) => {
    try {
      const state: any = thunkAPI.getState();
      const challengeId = state.challenge.activeChallenge?._id || 'default';
      return await api.updateJournal(challengeId, journalEntry);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const challengeSlice = createSlice({
  name: 'challenge',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Data
      .addCase(fetchChallengeData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchChallengeData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeChallenge = action.payload.challenge;
        state.todayLog = action.payload.log;
        state.streak = action.payload.streak;
        state.history = action.payload.history;
      })
      .addCase(fetchChallengeData.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      // Toggle Task (Instant Optimistic UI Toggle)
      .addCase(toggleTask.pending, (state, action) => {
        const { taskId, isCompleted } = action.meta.arg;
        if (!state.todayLog) {
          state.todayLog = {
            completedTaskIds: [],
            journalEntry: '',
            date: new Date().toISOString().split('T')[0]
          };
        }
        if (!state.todayLog.completedTaskIds) {
          state.todayLog.completedTaskIds = [];
        }
        if (isCompleted) {
          if (!state.todayLog.completedTaskIds.includes(taskId)) {
            state.todayLog.completedTaskIds.push(taskId);
          }
        } else {
          state.todayLog.completedTaskIds = state.todayLog.completedTaskIds.filter((id: string) => id !== taskId);
        }
      })
      .addCase(toggleTask.fulfilled, (state, action) => {
        if (action.payload.log) {
          state.todayLog = action.payload.log;
        }
        if (typeof action.payload.streak === 'number') {
          state.streak = action.payload.streak;
        }
      })
      // Update Journal
      .addCase(updateJournal.fulfilled, (state, action) => {
        state.todayLog = action.payload;
      })
      .addCase(startChallenge.fulfilled, (state, action) => {
        state.activeChallenge = action.payload.challenge;
        state.todayLog = action.payload.log;
        state.streak = action.payload.streak;
        state.history = action.payload.history;
      })
      .addCase(cancelChallenge.fulfilled, (state) => {
        state.activeChallenge = null;
        state.todayLog = null;
        state.history = [];
        state.streak = 0;
      });
  }
});

export default challengeSlice.reducer;
