import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";
import { useDispatch, useSelector } from "react-redux";
import { setThemeMode } from "../store/slices/themeSlice";
import type { RootState } from "../store";

// Export useTheme for use in components
export const useTheme = useNextTheme;

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: string;
  attribute?: string;
  enableSystem?: boolean;
};

export function ThemeProvider({ 
  children, 
  defaultTheme = "dark",
  attribute = "class",
  enableSystem = false, // Disable system theme by default
  ...props 
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute as "class"}
      defaultTheme={defaultTheme}
      enableSystem={false} // Force disable system theme
      forcedTheme={typeof window !== 'undefined' && !localStorage.getItem('theme') ? 'dark' : undefined}
      {...props}
    >
      <ThemeSynchronizer>{children}</ThemeSynchronizer>
    </NextThemesProvider>
  );
}

// Component to sync theme between next-themes and Redux
function ThemeSynchronizer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const { resolvedTheme: theme, setTheme, theme: activeTheme } = useNextTheme();
  
  // Sync theme between next-themes and Redux
  useEffect(() => {
    // Skip if we don't have the theme from next-themes yet
    if (!theme) return;
    
    // If Redux theme is not set or different from next-themes, update Redux
    if (!themeMode || theme !== themeMode) {
      dispatch(setThemeMode(theme as 'light' | 'dark'));
    }
  }, [theme, themeMode, dispatch]);
  
  // Apply theme changes from Redux to next-themes
  useEffect(() => {
    if (themeMode && themeMode !== theme) {
      setTheme(themeMode);
    }
  }, [themeMode, theme, setTheme]);
  
  // Set initial theme to dark if not set and force dark theme when localStorage is cleared
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if theme is stored in localStorage
      const storedTheme = localStorage.getItem('theme');
      
      // Force dark theme when localStorage is cleared or for first-time users
      if (!storedTheme) {
        const defaultTheme = 'dark';
        setTheme(defaultTheme);
        dispatch(setThemeMode(defaultTheme));
        // Explicitly set in localStorage to prevent system theme
        localStorage.setItem('theme', defaultTheme);
      }
    }
  }, [setTheme, dispatch]);
  
  // Additional check to catch any case where theme might be 'system'
  useEffect(() => {
    if (activeTheme === 'system' && typeof window !== 'undefined') {
      const defaultTheme = 'dark';
      setTheme(defaultTheme);
      dispatch(setThemeMode(defaultTheme));
      localStorage.setItem('theme', defaultTheme);
    }
  }, [activeTheme, setTheme, dispatch]);
  
  return <>{children}</>;
}
