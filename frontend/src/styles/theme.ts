/**
 * Theme system for PyMastery
 * Supports light, dark, and system themes with customizable colors
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary colors
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceHover: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  textDisabled: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;
  
  // Status colors
  success: string;
  successHover: string;
  successLight: string;
  warning: string;
  warningHover: string;
  warningLight: string;
  error: string;
  errorHover: string;
  errorLight: string;
  info: string;
  infoHover: string;
  infoLight: string;
  
  // Special colors
  shadow: string;
  overlay: string;
  accent: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
      xxxl: string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  breakpoints: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

// Light theme colors
const lightColors: ThemeColors = {
  // Primary colors
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryActive: '#1D4ED8',
  primaryLight: '#93C5FD',
  primaryDark: '#1E40AF',
  
  // Secondary colors
  secondary: '#6B7280',
  secondaryHover: '#4B5563',
  secondaryActive: '#374151',
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceHover: '#F9FAFB',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#6B7280',
  textInverse: '#FFFFFF',
  textDisabled: '#9CA3AF',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
  
  // Status colors
  success: '#10B981',
  successHover: '#059669',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningHover: '#D97706',
  warningLight: '#FCD34D',
  error: '#EF4444',
  errorHover: '#DC2626',
  errorLight: '#F87171',
  info: '#3B82F6',
  infoHover: '#2563EB',
  infoLight: '#60A5FA',
  
  // Special colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  accent: '#8B5CF6'
};

// Dark theme colors
const darkColors: ThemeColors = {
  // Primary colors
  primary: '#60A5FA',
  primaryHover: '#3B82F6',
  primaryActive: '#2563EB',
  primaryLight: '#93C5FD',
  primaryDark: '#1E40AF',
  
  // Secondary colors
  secondary: '#9CA3AF',
  secondaryHover: '#6B7280',
  secondaryActive: '#4B5563',
  
  // Background colors
  background: '#111827',
  backgroundSecondary: '#1F2937',
  backgroundTertiary: '#374151',
  surface: '#1F2937',
  surfaceHover: '#374151',
  
  // Text colors
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textInverse: '#111827',
  textDisabled: '#6B7280',
  
  // Border colors
  border: '#374151',
  borderLight: '#4B5563',
  borderDark: '#1F2937',
  
  // Status colors
  success: '#34D399',
  successHover: '#10B981',
  successLight: '#6EE7B7',
  warning: '#FCD34D',
  warningHover: '#F59E0B',
  warningLight: '#FDE68A',
  error: '#F87171',
  errorHover: '#EF4444',
  errorLight: '#FCA5A5',
  info: '#60A5FA',
  infoHover: '#3B82F6',
  infoLight: '#93C5FD',
  
  // Special colors
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  accent: '#A78BFA'
};

// Base theme configuration
const baseTheme: Omit<Theme, 'mode' | 'colors'> = {
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem',
      xxxl: '2rem'
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xxl: '1536px'
  },
  transitions: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms'
  }
};

// Theme configurations
export const themes: Record<ThemeMode, Theme> = {
  light: {
    mode: 'light',
    colors: lightColors,
    ...baseTheme
  },
  dark: {
    mode: 'dark',
    colors: darkColors,
    ...baseTheme
  },
  system: {
    mode: 'system',
    colors: lightColors, // Will be determined by system preference
    ...baseTheme
  }
};

// Custom theme hooks and utilities
export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const getThemeForMode = (mode: ThemeMode): Theme => {
  if (mode === 'system') {
    const systemTheme = getSystemTheme();
    return themes[systemTheme];
  }
  return themes[mode];
};

// CSS custom properties for dynamic theming
export const generateCSSVariables = (theme: Theme): string => {
  const { colors } = theme;
  
  return `
    :root {
      --color-primary: ${colors.primary};
      --color-primary-hover: ${colors.primaryHover};
      --color-primary-active: ${colors.primaryActive};
      --color-primary-light: ${colors.primaryLight};
      --color-primary-dark: ${colors.primaryDark};
      
      --color-secondary: ${colors.secondary};
      --color-secondary-hover: ${colors.secondaryHover};
      --color-secondary-active: ${colors.secondaryActive};
      
      --color-background: ${colors.background};
      --color-background-secondary: ${colors.backgroundSecondary};
      --color-background-tertiary: ${colors.backgroundTertiary};
      --color-surface: ${colors.surface};
      --color-surface-hover: ${colors.surfaceHover};
      
      --color-text-primary: ${colors.textPrimary};
      --color-text-secondary: ${colors.textSecondary};
      --color-text-tertiary: ${colors.textTertiary};
      --color-text-inverse: ${colors.textInverse};
      --color-text-disabled: ${colors.textDisabled};
      
      --color-border: ${colors.border};
      --color-border-light: ${colors.borderLight};
      --color-border-dark: ${colors.borderDark};
      
      --color-success: ${colors.success};
      --color-success-hover: ${colors.successHover};
      --color-success-light: ${colors.successLight};
      
      --color-warning: ${colors.warning};
      --color-warning-hover: ${colors.warningHover};
      --color-warning-light: ${colors.warningLight};
      
      --color-error: ${colors.error};
      --color-error-hover: ${colors.errorHover};
      --color-error-light: ${colors.errorLight};
      
      --color-info: ${colors.info};
      --color-info-hover: ${colors.infoHover};
      --color-info-light: ${colors.infoLight};
      
      --color-shadow: ${colors.shadow};
      --color-overlay: ${colors.overlay};
      --color-accent: ${colors.accent};
    }
  `;
};

// Theme utilities
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getContrastColor = (backgroundColor: string): 'light' | 'dark' => {
  const { r, g, b } = hexToRgb(backgroundColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'dark' : 'light';
};

// Theme type guards
export const isValidThemeMode = (mode: string): mode is ThemeMode => {
  return ['light', 'dark', 'system'].includes(mode);
};

export const isDarkTheme = (theme: Theme): boolean => {
  return theme.mode === 'dark' || (theme.mode === 'system' && getSystemTheme() === 'dark');
};

// Theme persistence
export const THEME_STORAGE_KEY = 'pymastery-theme';

export const getStoredTheme = (): ThemeMode => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isValidThemeMode(stored)) {
      return stored as ThemeMode;
    }
  }
  return 'system';
};

export const storeTheme = (mode: ThemeMode): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
};

// Default theme export
export const defaultTheme = getThemeForMode(getStoredTheme());

// Theme context type
export interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}
