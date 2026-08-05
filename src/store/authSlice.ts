import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface User {
  _id: string;
  displayName: string;
  email: string;
  avatar?: string;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  token: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  message: string;
}

// Get user from localStorage
const userStr = localStorage.getItem('user');
const user: User | null = userStr ? JSON.parse(userStr) : null;

const initialState: AuthState = {
  user: user,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    loginStart: (state) => {
      state.isLoading = true;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isError = true;
      state.message = action.payload;
      state.user = null;
    },
    logout: (state) => {
      state.user = null;
      localStorage.removeItem('user');
    },
    setAvatar: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.avatar = action.payload;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    setFitnessLevel: (state, action: PayloadAction<'beginner' | 'intermediate' | 'advanced'>) => {
      if (state.user) {
        state.user.fitnessLevel = action.payload;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    }
  },
});

export const { reset, loginStart, loginSuccess, loginFailure, logout, setAvatar, setFitnessLevel } = authSlice.actions;
export default authSlice.reducer;
