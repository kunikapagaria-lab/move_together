import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

export interface Notification {
  _id: string;
  userId: string;
  type: 'failed' | 'group_invite';
  message: string;
  relatedData?: any;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  isError: boolean;
  message: string;
}

const initialState: NotificationState = {
  notifications: [],
  isLoading: false,
  isError: false,
  message: ''
};

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, thunkAPI) => {
    try {
      return await api.getNotifications();
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const markRead = createAsyncThunk(
  'notification/markRead',
  async (id: string, thunkAPI) => {
    try {
      return await api.markNotificationRead(id);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const respondToInvite = createAsyncThunk(
  'notification/respondToInvite',
  async ({ id, action }: { id: string; action: 'accept' | 'decline' }, thunkAPI) => {
    try {
      return await api.respondToGroupInvite(id, action);
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
      })
      .addCase(markRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n._id === action.payload._id);
        if (index !== -1) {
          state.notifications[index].read = true;
        }
      })
      .addCase(respondToInvite.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n._id === action.payload._id);
        if (index !== -1) {
          state.notifications[index].read = true;
        }
      });
  }
});

export default notificationSlice.reducer;
