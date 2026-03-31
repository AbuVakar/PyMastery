import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Appearance,
} from 'react-native';
import { useResponsive } from '../utils/responsive';

const { width, height } = Dimensions.get('window');

// Base design tokens following Material Design 3 and iOS Human Interface Guidelines
export const DesignTokens = {
  // Colors - Modern 2024 color palette
  colors: {
    // Primary colors - Blue gradient system
    primary: {
      50: '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#2196F3', // Primary blue
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',
      900: '#0D47A1',
    },
    
    // Secondary colors - Purple accent
    secondary: {
      50: '#F3E5F5',
      100: '#E1BEE7',
      200: '#CE93D8',
      300: '#BA68C8',
      400: '#AB47BC',
      500: '#9C27B0', // Secondary purple
      600: '#8E24AA',
      700: '#7B1FA2',
      800: '#6A1B9A',
      900: '#4A148C',
    },
    
    // Semantic colors
    success: {
      50: '#E8F5E8',
      100: '#C8E6C9',
      200: '#A5D6A7',
      300: '#81C784',
      400: '#66BB6A',
      500: '#4CAF50', // Success green
      600: '#43A047',
      700: '#388E3C',
      800: '#2E7D32',
      900: '#1B5E20',
    },
    
    warning: {
      50: '#FFF3E0',
      100: '#FFE0B2',
      200: '#FFCC80',
      300: '#FFB74D',
      400: '#FFA726',
      500: '#FF9800', // Warning orange
      600: '#FB8C00',
      700: '#F57C00',
      800: '#EF6C00',
      900: '#E65100',
    },
    
    error: {
      50: '#FFEBEE',
      100: '#FFCDD2',
      200: '#EF9A9A',
      300: '#E57373',
      400: '#EF5350',
      500: '#F44336', // Error red
      600: '#E53935',
      700: '#D32F2F',
      800: '#C62828',
      900: '#B71C1C',
    },
    
    // Neutral colors - Modern gray scale
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    
    // Surface colors
    surface: {
      default: '#FFFFFF',
      variant: '#F8F9FA',
      elevated: '#FFFFFF',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    
    // Text colors
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD',
      hint: '#9E9E9E',
      inverse: '#FFFFFF',
    },
    
    // Brand colors
    brand: {
      gradient: {
        start: '#2196F3',
        end: '#9C27B0',
      },
      accent: '#FF6B6B',
      highlight: '#4ECDC4',
    },
  },
  
  // Typography - Modern font system
  typography: {
    // Font families
    fontFamily: {
      primary: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
      secondary: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
      mono: Platform.OS === 'ios' ? 'SF Mono' : 'JetBrains Mono',
    },
    
    // Font sizes - Responsive type scale
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
    },
    
    // Font weights
    fontWeight: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    
    // Line heights
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 1.8,
    },
    
    // Letter spacing
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
      wider: 1,
      widest: 2,
    },
  },
  
  // Spacing - 8pt grid system
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
    32: 128,
  },
  
  // Border radius - Modern rounded corners
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  
  // Shadows - Modern elevation system
  shadows: {
    none: 'none',
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 15,
    },
    '2xl': {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.3,
      shadowRadius: 32,
      elevation: 20,
    },
  },
  
  // Animation durations
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
      slower: 700,
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'spring',
    },
  },
  
  // Breakpoints - Responsive design
  breakpoints: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    '2xl': 1400,
  },
  
  // Z-index layers
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
};

// Theme configuration
export interface ThemeConfig {
  name: string;
  colors: typeof DesignTokens.colors;
  typography: typeof DesignTokens.typography;
  spacing: typeof DesignTokens.spacing;
  borderRadius: typeof DesignTokens.borderRadius;
  shadows: typeof DesignTokens.shadows;
  animation: typeof DesignTokens.animation;
}

// Light theme
export const LightTheme: ThemeConfig = {
  name: 'light',
  colors: {
    ...DesignTokens.colors,
    surface: {
      default: '#FFFFFF',
      variant: '#F8F9FA',
      elevated: '#FFFFFF',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD',
      hint: '#9E9E9E',
      inverse: '#FFFFFF',
    },
  },
  typography: DesignTokens.typography,
  spacing: DesignTokens.spacing,
  borderRadius: DesignTokens.borderRadius,
  shadows: DesignTokens.shadows,
  animation: DesignTokens.animation,
};

// Dark theme
export const DarkTheme: ThemeConfig = {
  name: 'dark',
  colors: {
    ...DesignTokens.colors,
    primary: {
      50: '#0D47A1',
      100: '#1565C0',
      200: '#1976D2',
      300: '#1E88E5',
      400: '#2196F3',
      500: '#42A5F5',
      600: '#64B5F6',
      700: '#90CAF9',
      800: '#BBDEFB',
      900: '#E3F2FD',
    },
    surface: {
      default: '#121212',
      variant: '#1E1E1E',
      elevated: '#2D2D2D',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
      disabled: '#666666',
      hint: '#888888',
      inverse: '#000000',
    },
  },
  typography: DesignTokens.typography,
  spacing: DesignTokens.spacing,
  borderRadius: DesignTokens.borderRadius,
  shadows: {
    none: 'none',
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 6,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
      elevation: 10,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.7,
      shadowRadius: 24,
      elevation: 15,
    },
    '2xl': {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.8,
      shadowRadius: 32,
      elevation: 20,
    },
  },
  animation: DesignTokens.animation,
};

// Custom themes
export const CustomThemes = {
  ocean: {
    name: 'ocean',
    colors: {
      ...DesignTokens.colors,
      primary: {
        50: '#E0F7FA',
        100: '#B2EBF2',
        200: '#80DEEA',
        300: '#4DD0E1',
        400: '#26C6DA',
        500: '#00BCD4',
        600: '#00ACC1',
        700: '#0097A7',
        800: '#00838F',
        900: '#006064',
      },
      surface: {
        default: '#F0F8FF',
        variant: '#E6F3FF',
        elevated: '#FFFFFF',
        overlay: 'rgba(0, 188, 212, 0.2)',
      },
    },
  },
  sunset: {
    name: 'sunset',
    colors: {
      ...DesignTokens.colors,
      primary: {
        50: '#FFF3E0',
        100: '#FFE0B2',
        200: '#FFCC80',
        300: '#FFB74D',
        400: '#FFA726',
        500: '#FF9800',
        600: '#FB8C00',
        700: '#F57C00',
        800: '#EF6C00',
        900: '#E65100',
      },
      surface: {
        default: '#FFF8E1',
        variant: '#FFECB3',
        elevated: '#FFFFFF',
        overlay: 'rgba(255, 152, 0, 0.2)',
      },
    },
  },
  forest: {
    name: 'forest',
    colors: {
      ...DesignTokens.colors,
      primary: {
        50: '#E8F5E8',
        100: '#C8E6C9',
        200: '#A5D6A7',
        300: '#81C784',
        400: '#66BB6A',
        500: '#4CAF50',
        600: '#43A047',
        700: '#388E3C',
        800: '#2E7D32',
        900: '#1B5E20',
      },
      surface: {
        default: '#F1F8E9',
        variant: '#DCEDC8',
        elevated: '#FFFFFF',
        overlay: 'rgba(76, 175, 80, 0.2)',
      },
    },
  },
};

// Theme context
interface ThemeContextType {
  theme: ThemeConfig;
  themeMode: 'light' | 'dark' | 'custom';
  setThemeMode: (mode: 'light' | 'dark' | 'custom') => void;
  setCustomTheme: (themeName: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark';
}> = ({ children, defaultTheme = 'light' }) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'custom'>('light');
  const [customThemeName, setCustomThemeName] = useState<string>('ocean');
  const [theme, setTheme] = useState<ThemeConfig>(LightTheme);

  useEffect(() => {
    // Set initial theme based on system preference
    const systemTheme = Appearance.getColorScheme();
    if (systemTheme && defaultTheme === systemTheme) {
      setThemeMode(systemTheme as 'light' | 'dark');
    }
  }, [defaultTheme]);

  useEffect(() => {
    // Update theme based on theme mode
    if (themeMode === 'dark') {
      setTheme(DarkTheme);
    } else if (themeMode === 'light') {
      setTheme(LightTheme);
    } else if (themeMode === 'custom' && CustomThemes[customThemeName as keyof typeof CustomThemes]) {
      const customTheme = CustomThemes[customThemeName as keyof typeof CustomThemes];
      setTheme({
        ...LightTheme,
        name: customTheme.name,
        colors: {
          ...LightTheme.colors,
          ...customTheme.colors,
        },
      });
    }
  }, [themeMode, customThemeName]);

  const toggleTheme = () => {
    setThemeMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const setCustomTheme = (themeName: string) => {
    setCustomThemeName(themeName);
    setThemeMode('custom');
  };

  const isDarkMode = themeMode === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode,
        setCustomTheme,
        isDarkMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility functions for theme access
export const useColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

export const useTypography = () => {
  const { theme } = useTheme();
  return theme.typography;
};

export const useSpacing = () => {
  const { theme } = useTheme();
  return theme.spacing;
};

export const useBorderRadius = () => {
  const { theme } = useTheme();
  return theme.borderRadius;
};

export const useShadows = () => {
  const { theme } = useTheme();
  return theme.shadows;
};

// Style utilities
export const createStyleSheet = (theme: ThemeConfig) => {
  return StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface.default,
    },
    
    surface: {
      backgroundColor: theme.colors.surface.default,
      borderRadius: theme.borderRadius.md,
      ...theme.shadows.base,
    },
    
    surfaceVariant: {
      backgroundColor: theme.colors.surface.variant,
      borderRadius: theme.borderRadius.md,
    },
    
    // Typography styles
    heading1: {
      fontSize: theme.typography.fontSize['3xl'],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      lineHeight: theme.typography.lineHeight.tight,
    },
    
    heading2: {
      fontSize: theme.typography.fontSize['2xl'],
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      lineHeight: theme.typography.lineHeight.tight,
    },
    
    heading3: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.primary,
      lineHeight: theme.typography.lineHeight.normal,
    },
    
    body1: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.normal,
      color: theme.colors.text.primary,
      lineHeight: theme.typography.lineHeight.normal,
    },
    
    body2: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.normal,
      color: theme.colors.text.secondary,
      lineHeight: theme.typography.lineHeight.normal,
    },
    
    caption: {
      fontSize: theme.typography.fontSize.xs,
      fontWeight: theme.typography.fontWeight.normal,
      color: theme.colors.text.hint,
      lineHeight: theme.typography.lineHeight.tight,
    },
    
    // Button styles
    buttonPrimary: {
      backgroundColor: theme.colors.primary[500],
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing[3],
      paddingHorizontal: theme.spacing[6],
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.sm,
    },
    
    buttonPrimaryText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: '#FFFFFF',
    },
    
    buttonSecondary: {
      backgroundColor: 'transparent',
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing[3],
      paddingHorizontal: theme.spacing[6],
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.primary[500],
    },
    
    buttonSecondaryText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.primary[500],
    },
    
    // Input styles
    input: {
      backgroundColor: theme.colors.surface.variant,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.neutral[300],
      paddingVertical: theme.spacing[3],
      paddingHorizontal: theme.spacing[4],
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
    },
    
    inputFocused: {
      borderColor: theme.colors.primary[500],
      ...theme.shadows.sm,
    },
    
    // Card styles
    card: {
      backgroundColor: theme.colors.surface.default,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing[4],
      ...theme.shadows.md,
    },
    
    // Status styles
    success: {
      backgroundColor: theme.colors.success[500],
    },
    
    warning: {
      backgroundColor: theme.colors.warning[500],
    },
    
    error: {
      backgroundColor: theme.colors.error[500],
    },
    
    info: {
      backgroundColor: theme.colors.primary[500],
    },
  });
};

export default {
  DesignTokens,
  LightTheme,
  DarkTheme,
  CustomThemes,
  ThemeProvider,
  useTheme,
  useColors,
  useTypography,
  useSpacing,
  useBorderRadius,
  useShadows,
  createStyleSheet,
};
