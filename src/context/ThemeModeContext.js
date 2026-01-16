import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeModeContext = createContext({
  mode: 'light',
  toggleMode: () => {},
});

const THEME_STORAGE_KEY = 'theme-mode';

/**
 * Get initial theme mode from localStorage or system preference
 * This function is safe to call on the server (returns 'light' as default)
 */
const getInitialMode = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  // Check localStorage first
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  // Fallback to system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

export function ThemeModeProvider({ children }) {
  // Initialize with 'light' to avoid hydration mismatch
  // Will be updated on mount
  const [mode, setMode] = useState('light');
  const [mounted, setMounted] = useState(false);

  // Initialize mode on mount (client-side only)
  useEffect(() => {
    const initialMode = getInitialMode();
    setMode(initialMode);
    setMounted(true);
  }, []);

  // Persist to localStorage whenever mode changes
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  }, [mode, mounted]);

  // Listen for system preference changes
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const value = useMemo(
    () => ({
      mode,
      toggleMode,
    }),
    [mode]
  );

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
}
