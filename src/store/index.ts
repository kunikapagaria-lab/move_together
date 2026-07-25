import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import settingsReducer from './settingsSlice';
import challengeReducer from './challengeSlice';
import groupReducer from './groupSlice';
import friendReducer from './friendSlice';
import historyReducer from './historySlice';
import notificationReducer from './notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    challenge: challengeReducer,
    group: groupReducer,
    friend: friendReducer,
    history: historyReducer,
    notification: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
