import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';
import type { Challenge } from './challengeSlice';

interface HistoryState {
  challenges: Challenge[];
  selectedChallengeLogs: any[]; // We can type this as DailyLog later
  isLoading: boolean;
  isError: boolean;
  message: string;
}

const initialState: HistoryState = {
  challenges: [],
  selectedChallengeLogs: [],
  isLoading: false,
  isError: false,
  message: ''
};

export const fetchAllChallenges = createAsyncThunk(
  'history/fetchAllChallenges',
  async (_, thunkAPI) => {
    try {
      return await api.getAllChallenges();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchChallengeLogs = createAsyncThunk(
  'history/fetchChallengeLogs',
  async (challengeId: string, thunkAPI) => {
    try {
      return await api.getChallengeLogs(challengeId);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    clearSelectedLogs: (state) => {
      state.selectedChallengeLogs = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllChallenges.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllChallenges.fulfilled, (state, action) => {
        state.isLoading = false;
        state.challenges = action.payload;
      })
      .addCase(fetchAllChallenges.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(fetchChallengeLogs.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchChallengeLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedChallengeLogs = action.payload;
      })
      .addCase(fetchChallengeLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      });
  }
});

export const { clearSelectedLogs } = historySlice.actions;
export default historySlice.reducer;
