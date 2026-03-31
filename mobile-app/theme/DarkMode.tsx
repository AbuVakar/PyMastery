import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
  Appearance,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, ThemeProvider as BaseThemeProvider } from '../theme/DesignSystem';

const { width, height } = Dimensions.get('window');

// Dark mode configuration
export interface DarkModeConfig {
  enableSystemMode?: boolean;
  followSystemTheme?: boolean;
  autoSwitch?: boolean;
  schedule?: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
  };
  transitions?: {
    enabled: boolean;
    duration: number;
    easing: string;
  };
}

// Theme mode types
export type ThemeMode = 'light' | 'dark' | 'system' | 'auto';

// Dark mode context
interface DarkModeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  isSystemDarkMode: boolean;
  toggleDarkMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  config: DarkModeConfig;
  updateConfig: (config: Partial<DarkModeConfig>) => void;
  isAutoMode: boolean;
  isScheduled: boolean;
}

const DarkModeContext = createContext<DarkModeContextType | null>(null);

// Default dark mode configuration
const defaultConfig: DarkModeConfig = {
  enableSystemMode: true,
  followSystemTheme: true,
  autoSwitch: false,
  schedule: {
    enabled: false,
    startTime: '20:00',
    endTime: '06:00',
  },
  transitions: {
    enabled: true,
    duration: 300,
    easing: 'ease-in-out',
  },
};

// Utility functions
export const isTimeInRange = (
  currentTime: Date,
  startTime: string,
  endTime: string
): boolean => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  if (startMinutes <= endMinutes) {
    // Same day range (e.g., 06:00 to 20:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight range (e.g., 20:00 to 06:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
};

export const getSystemTheme = (): 'light' | 'dark' => {
  return Appearance.getColorScheme() || 'light';
};

export const shouldUseDarkMode = (
  themeMode: ThemeMode,
  systemTheme: 'light' | 'dark',
  config: DarkModeConfig
): boolean => {
  switch (themeMode) {
    case 'dark':
      return true;
    case 'light':
      return false;
    case 'system':
      return config.followSystemTheme ? systemTheme === 'dark' : false;
    case 'auto':
      if (config.schedule.enabled) {
        const now = new Date();
        return isTimeInRange(now, config.schedule.startTime, config.schedule.endTime);
      }
      return systemTheme === 'dark';
    default:
      return false;
  }
};

// Dark mode provider
export const DarkModeProvider: React.FC<{
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  config?: Partial<DarkModeConfig>;
}> = ({ children, defaultMode = 'system', config: userConfig = {} }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(defaultMode);
  const [config, setConfig] = useState<DarkModeConfig>({ ...defaultConfig, ...userConfig });
  const [isSystemDarkMode, setIsSystemDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('@theme_mode');
        const savedConfig = await AsyncStorage.getItem('@dark_mode_config');
        
        if (savedMode) {
          setThemeMode(savedMode as ThemeMode);
        }
        
        if (savedConfig) {
          setConfig({ ...defaultConfig, ...JSON.parse(savedConfig), ...userConfig });
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load theme preferences:', error);
        setIsLoaded(true);
      }
    };

    loadPreferences();
  }, [userConfig]);

  // Save preferences when they change
  useEffect(() => {
    if (isLoaded) {
      const savePreferences = async () => {
        try {
          await AsyncStorage.setItem('@theme_mode', themeMode);
          await AsyncStorage.setItem('@dark_mode_config', JSON.stringify(config));
        } catch (error) {
          console.error('Failed to save theme preferences:', error);
        }
      };

      savePreferences();
    }
  }, [themeMode, config, isLoaded]);

  // Listen for system theme changes
  useEffect(() => {
    if (!config.enableSystemMode) return;

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsSystemDarkMode(colorScheme === 'dark');
    });

    // Set initial system theme
    setIsSystemDarkMode(getSystemTheme() === 'dark');

    return () => subscription.remove();
  }, [config.enableSystemMode]);

  // Auto-switch based on schedule
  useEffect(() => {
    if (!config.autoSwitch || !config.schedule.enabled) return;

    const checkSchedule = () => {
      const now = new Date();
      const shouldBeDark = isTimeInRange(
        now,
        config.schedule.startTime,
        config.schedule.endTime
      );

      if (shouldBeDark && themeMode !== 'dark') {
        setThemeMode('dark');
      } else if (!shouldBeDark && themeMode !== 'light') {
        setThemeMode('light');
      }
    };

    const interval = setInterval(checkSchedule, 60000); // Check every minute
    checkSchedule(); // Check immediately

    return () => clearInterval(interval);
  }, [config.autoSwitch, config.schedule, themeMode]);

  const toggleDarkMode = () => {
    setThemeMode(prevMode => (prevMode === 'dark' ? 'light' : 'dark'));
  };

  const updateConfig = (newConfig: Partial<DarkModeConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const isDarkMode = shouldUseDarkMode(themeMode, isSystemDarkMode, config);
  const isAutoMode = themeMode === 'auto';
  const isScheduled = config.schedule.enabled && config.autoSwitch;

  return (
    <DarkModeContext.Provider
      value={{
        themeMode,
        isDarkMode,
        isSystemDarkMode,
        toggleDarkMode,
        setThemeMode,
        config,
        updateConfig,
        isAutoMode,
        isScheduled,
      }}
    >
      <BaseThemeProvider defaultTheme={isDarkMode ? 'dark' : 'light'}>
        {children}
      </BaseThemeProvider>
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = (): DarkModeContextType => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

// Dark mode utilities
export const useStatusBarStyle = () => {
  const { isDarkMode } = useDarkMode();
  
  useEffect(() => {
    StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
  }, [isDarkMode]);
  
  return isDarkMode ? 'light-content' : 'dark-content';
};

export const useStatusBarBackground = () => {
  const { isDarkMode } = useDarkMode();
  
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(isDarkMode ? '#121212' : '#FFFFFF', true);
    }
  }, [isDarkMode]);
  
  return isDarkMode ? '#121212' : '#FFFFFF';
};

// Dark mode components
export interface DarkModeToggleProps {
  style?: any;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  style,
  showLabel = false,
  size = 'medium',
}) => {
  const { theme, themeMode, isDarkMode, toggleDarkMode, setThemeMode } = useDarkMode();
  const { AnimatedButton } = require('../components/MicroInteractions');

  const getSize = () => {
    switch (size) {
      case 'small': return { width: 40, height: 20, circle: 16 };
      case 'medium': return { width: 50, height: 26, circle: 22 };
      case 'large': return { width: 60, height: 32, circle: 28 };
      default: return { width: 50, height: 26, circle: 22 };
    }
  };

  const { width: toggleWidth, height: toggleHeight, circle } = getSize();

  const handleThemeChange = (mode: 'light' | 'dark' | 'system' | 'auto') => {
    setThemeMode(mode);
  };

  return (
    <View style={[styles.toggleContainer, style]}>
      {showLabel && (
        <Text style={[styles.toggleLabel, { color: theme.colors.text.secondary }]}>
          Theme
        </Text>
      )}
      
      <View style={styles.themeOptions}>
        <AnimatedButton
          onPress={() => handleThemeChange('light')}
          style={[
            styles.themeOption,
            {
              backgroundColor: themeMode === 'light' ? theme.colors.primary[500] : theme.colors.surface.variant,
              borderColor: themeMode === 'light' ? theme.colors.primary[500] : theme.colors.neutral[300],
            },
          ]}
        >
          <Text
            style={[
              styles.themeOptionText,
              {
                color: themeMode === 'light' ? '#FFFFFF' : theme.colors.text.secondary,
              },
            ]}
          >
            Light
          </Text>
        </AnimatedButton>
        
        <AnimatedButton
          onPress={() => handleThemeChange('dark')}
          style={[
            styles.themeOption,
            {
              backgroundColor: themeMode === 'dark' ? theme.colors.primary[500] : theme.colors.surface.variant,
              borderColor: themeMode === 'dark' ? theme.colors.primary[500] : theme.colors.neutral[300],
            },
          ]}
        >
          <Text
            style={[
              styles.themeOptionText,
              {
                color: themeMode === 'dark' ? '#FFFFFF' : theme.colors.text.secondary,
              },
            ]}
          >
            Dark
          </Text>
        </AnimatedButton>
        
        <AnimatedButton
          onPress={() => handleThemeChange('system')}
          style={[
            styles.themeOption,
            {
              backgroundColor: themeMode === 'system' ? theme.colors.primary[500] : theme.colors.surface.variant,
              borderColor: themeMode === 'system' ? theme.colors.primary[500] : theme.colors.neutral[300],
            },
          ]}
        >
          <Text
            style={[
              styles.themeOptionText,
              {
                color: themeMode === 'system' ? '#FFFFFF' : theme.colors.text.secondary,
              },
            ]}
          >
            System
          </Text>
        </AnimatedButton>
        
        <AnimatedButton
          onPress={() => handleThemeChange('auto')}
          style={[
            styles.themeOption,
            {
              backgroundColor: themeMode === 'auto' ? theme.colors.primary[500] : theme.colors.surface.variant,
              borderColor: themeMode === 'auto' ? theme.colors.primary[500] : theme.colors.neutral[300],
            },
          ]}
        >
          <Text
            style={[
              styles.themeOptionText,
              {
                color: themeMode === 'auto' ? '#FFFFFF' : theme.colors.text.secondary,
              },
            ]}
          >
            Auto
          </Text>
        </AnimatedButton>
      </View>
    </View>
  );
};

export interface DarkModeInfoProps {
  style?: any;
}

export const DarkModeInfo: React.FC<DarkModeInfoProps> = ({ style }) => {
  const { theme, themeMode, isDarkMode, isSystemDarkMode, isAutoMode, isScheduled, config } = useDarkMode();

  const getThemeModeText = () => {
    switch (themeMode) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      case 'system': return `System (${isSystemDarkMode ? 'Dark' : 'Light'})`;
      case 'auto': return isScheduled ? 'Auto (Scheduled)' : 'Auto (System)';
      default: return 'Unknown';
    }
  };

  const getScheduleText = () => {
    if (!config.schedule.enabled) return 'Schedule disabled';
    return `${config.schedule.startTime} - ${config.schedule.endTime}`;
  };

  return (
    <View style={[styles.infoContainer, style]}>
      <Text style={[styles.infoTitle, { color: theme.colors.text.primary }]}>
        Theme Information
      </Text>
      
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
          Current Mode:
        </Text>
        <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
          {getThemeModeText()}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
          Active Theme:
        </Text>
        <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
          {isDarkMode ? 'Dark' : 'Light'}
        </Text>
      </View>
      
      {isAutoMode && (
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
            Schedule:
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
            {getScheduleText()}
          </Text>
        </View>
      )}
      
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
          System Theme:
        </Text>
        <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
          {isSystemDarkMode ? 'Dark' : 'Light'}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
          Follow System:
        </Text>
        <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
          {config.followSystemTheme ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );
};

// Dark mode transition animations
export const useDarkModeTransition = (duration: number = 300) => {
  const { isDarkMode } = useDarkMode();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), duration);
    return () => clearTimeout(timer);
  }, [isDarkMode, duration]);

  return isTransitioning;
};

// Dark mode utilities for components
export const getAdaptiveColor = (
  lightColor: string,
  darkColor: string,
  isDarkMode: boolean
): string => {
  return isDarkMode ? darkColor : lightColor;
};

export const getAdaptiveStyle = (
  lightStyle: any,
  darkStyle: any,
  isDarkMode: boolean
): any => {
  return isDarkMode ? darkStyle : lightStyle;
};

const styles = StyleSheet.create({
  toggleContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  themeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default {
  DarkModeProvider,
  useDarkMode,
  useStatusBarStyle,
  useStatusBarBackground,
  DarkModeToggle,
  DarkModeInfo,
  useDarkModeTransition,
  getAdaptiveColor,
  getAdaptiveStyle,
  isTimeInRange,
  getSystemTheme,
  shouldUseDarkMode,
};
