import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

export interface GroupMember {
  userId: {
    _id: string;
    displayName: string;
    email: string;
  };
  joinedAt: string;
  streak: number;
  todayCompleted: number;
  totalTasks?: number;
  taskDetails?: any[];
}

export interface Group {
  _id: string;
  name: string;
  members: GroupMember[];
}

interface GroupState {
  myGroups: Group[];
  isLoading: boolean;
  isError: boolean;
  message: string;
}

const initialState: GroupState = {
  myGroups: [],
  isLoading: false,
  isError: false,
  message: ''
};

export const fetchMyGroups = createAsyncThunk(
  'group/fetchMyGroups',
  async (_, thunkAPI) => {
    try {
      return await api.getMyGroups();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const createGroup = createAsyncThunk(
  'group/createGroup',
  async ({ name, challengeTemplateId }: { name: string, challengeTemplateId: string }, thunkAPI) => {
    try {
      const group = await api.createGroup(name, challengeTemplateId);
      return group;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const joinGroup = createAsyncThunk(
  'group/joinGroup',
  async (joinCode: string, thunkAPI) => {
    try {
      const group = await api.joinGroup(joinCode);
      return group;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyGroups.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyGroups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myGroups = action.payload;
      })
      .addCase(fetchMyGroups.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.myGroups.push(action.payload);
      })
      .addCase(joinGroup.fulfilled, (state, action) => {
        state.myGroups.push(action.payload);
      });
  }
});

export default groupSlice.reducer;
