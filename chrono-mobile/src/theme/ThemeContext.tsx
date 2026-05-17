import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, radius, shadow } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  colors: typeof colors.light;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadow;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('chrono_theme');
        if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
          setThemeModeState(storedTheme as ThemeMode);
        }
      } catch (e) {
        console.error('Failed to load theme', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem('chrono_theme', mode);
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  };

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';
  const currentColors = isDark ? colors.dark : colors.light;

  if (!isLoaded) {
    return null; // or a loading placeholder
  }

  return (
    <ThemeContext.Provider
      value={{
        colors: currentColors,
        typography,
        spacing,
        radius,
        shadow,
        isDark,
        themeMode,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
