import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  zenMode: boolean;
  challengeMode: 'solo' | 'group';
}

const initialState: SettingsState = {
  zenMode: localStorage.getItem('zenMode') === 'true',
  challengeMode: (localStorage.getItem('challengeMode') as 'solo' | 'group') || 'group',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleZenMode: (state) => {
      state.zenMode = !state.zenMode;
      localStorage.setItem('zenMode', String(state.zenMode));
    },
    setChallengeMode: (state, action: PayloadAction<'solo' | 'group'>) => {
      state.challengeMode = action.payload;
      localStorage.setItem('challengeMode', action.payload);
    }
  },
});

export const { toggleZenMode, setChallengeMode } = settingsSlice.actions;
export default settingsSlice.reducer;
