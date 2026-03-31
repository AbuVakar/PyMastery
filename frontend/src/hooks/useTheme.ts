/**
 * Theme hook for PyMastery
 * Manages theme switching, persistence, and system preference detection
 */

import { useState, useEffect, useCallback } from 'react';
import { Theme, ThemeMode, getThemeForMode, getStoredTheme, storeTheme, getSystemTheme, ThemeContextType } from '../styles/theme';

export const useTheme = (): ThemeContextType => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getStoredTheme());
  const [theme, setTheme] = useState<Theme>(getThemeForMode(themeMode));
  const [isDark, setIsDark] = useState<boolean>(false);

  // Apply theme to DOM
  useEffect(() => {
    const applyTheme = () => {
      const currentTheme = getThemeForMode(themeMode);
      setTheme(currentTheme);
      setIsDark(currentTheme.mode === 'dark' || (currentTheme.mode === 'system' && getSystemTheme() === 'dark'));
      
      // Apply CSS variables
      const root = document.documentElement;
      const colors = currentTheme.colors;
      
      root.style.setProperty('--color-primary', colors.primary);
      root.style.setProperty('--color-primary-hover', colors.primaryHover);
      root.style.setProperty('--color-primary-active', colors.primaryActive);
      root.style.setProperty('--color-primary-light', colors.primaryLight);
      root.style.setProperty('--color-primary-dark', colors.primaryDark);
      
      root.style.setProperty('--color-secondary', colors.secondary);
      root.style.setProperty('--color-secondary-hover', colors.secondaryHover);
      root.style.setProperty('--color-secondary-active', colors.secondaryActive);
      
      root.style.setProperty('--color-background', colors.background);
      root.style.setProperty('--color-background-secondary', colors.backgroundSecondary);
      root.style.setProperty('--color-background-tertiary', colors.backgroundTertiary);
      root.style.setProperty('--color-surface', colors.surface);
      root.style.setProperty('--color-surface-hover', colors.surfaceHover);
      
      root.style.setProperty('--color-text-primary', colors.textPrimary);
      root.style.setProperty('--color-text-secondary', colors.textSecondary);
      root.style.setProperty('--color-text-tertiary', colors.textTertiary);
      root.style.setProperty('--color-text-inverse', colors.textInverse);
      root.style.setProperty('--color-text-disabled', colors.textDisabled);
      
      root.style.setProperty('--color-border', colors.border);
      root.style.setProperty('--color-border-light', colors.borderLight);
      root.style.setProperty('--color-border-dark', colors.borderDark);
      
      root.style.setProperty('--color-success', colors.success);
      root.style.setProperty('--color-success-hover', colors.successHover);
      root.style.setProperty('--color-success-light', colors.successLight);
      
      root.style.setProperty('--color-warning', colors.warning);
      root.style.setProperty('--color-warning-hover', colors.warningHover);
      root.style.setProperty('--color-warning-light', colors.warningLight);
      
      root.style.setProperty('--color-error', colors.error);
      root.style.setProperty('--color-error-hover', colors.errorHover);
      root.style.setProperty('--color-error-light', colors.errorLight);
      
      root.style.setProperty('--color-info', colors.info);
      root.style.setProperty('--color-info-hover', colors.infoHover);
      root.style.setProperty('--color-info-light', colors.infoLight);
      
      root.style.setProperty('--color-shadow', colors.shadow);
      root.style.setProperty('--color-overlay', colors.overlay);
      root.style.setProperty('--color-accent', colors.accent);
      
      // Set data attribute for CSS targeting
      root.setAttribute('data-theme', currentTheme.mode);
      root.setAttribute('data-color-scheme', isDark ? 'dark' : 'light');
    };

    applyTheme();
  }, [themeMode, isDark]);

  // Listen for system theme changes
  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        const systemTheme = getSystemTheme();
        setIsDark(systemTheme === 'dark');
        document.documentElement.setAttribute('data-color-scheme', systemTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // Set theme mode with persistence
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    storeTheme(mode);
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = useCallback(() => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  }, [setThemeMode, themeMode]);

  return {
    theme,
    themeMode,
    setThemeMode,
    toggleTheme,
    isDark
  };
};

export default useTheme;
