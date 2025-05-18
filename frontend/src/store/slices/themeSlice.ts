import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
}

// Always use dark theme for first-time users
const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  
  const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
  if (savedTheme) return savedTheme;
  
  // Default to dark theme for first-time users instead of checking system preference
  return 'dark';
};

const initialState: ThemeState = {
  mode: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      // Save to localStorage when theme changes
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
      }
    },
  },
});

export const { setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;
