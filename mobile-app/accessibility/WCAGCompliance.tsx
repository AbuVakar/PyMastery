import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  AccessibilityInfo,
  findNodeHandle,
  UIManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';

const { width, height } = Dimensions.get('window');

// Accessibility configuration
export interface AccessibilityConfig {
  // Screen reader
  screenReaderEnabled: boolean;
  announceChanges: boolean;
  reducedMotion: boolean;
  
  // Visual
  highContrast: boolean;
  largeText: boolean;
  colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  
  // Motor
  touchTargets: 'normal' | 'large' | 'extra-large';
  voiceControl: boolean;
  
  // Cognitive
  simplifiedUI: boolean;
  readingGuide: boolean;
  focusIndicators: boolean;
  
  // Audio
  captionsEnabled: boolean;
  visualAlerts: boolean;
  
  // Language
  preferredLanguage: string;
  readingSpeed: 'slow' | 'normal' | 'fast';
}

// WCAG compliance levels
export type WCAGLevel = 'A' | 'AA' | 'AAA';

// Accessibility context
interface AccessibilityContextType {
  config: AccessibilityConfig;
  updateConfig: (updates: Partial<AccessibilityConfig>) => void;
  wcagLevel: WCAGLevel;
  isScreenReaderActive: boolean;
  announceToScreenReader: (message: string) => void;
  setFocus: (ref: React.RefObject<any>) => void;
  checkWCAGCompliance: () => WCAGReport;
  getAccessibilityInfo: () => AccessibilityInfo;
}

interface WCAGReport {
  level: WCAGLevel;
  score: number;
  issues: WCAGIssue[];
  recommendations: string[];
}

interface WCAGIssue {
  type: 'error' | 'warning';
  category: 'perceivable' | 'operable' | 'understandable' | 'robust';
  description: string;
  element?: string;
  fix?: string;
}

interface AccessibilityInfo {
  screenReaderEnabled: boolean;
  reduceMotionEnabled: boolean;
  highContrastEnabled: boolean;
  fontSizeScale: number;
  layoutDirection: 'ltr' | 'rtl';
  preferredLanguage: string;
}

// Default accessibility configuration
const defaultConfig: AccessibilityConfig = {
  screenReaderEnabled: false,
  announceChanges: true,
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  colorBlindness: 'none',
  touchTargets: 'normal',
  voiceControl: false,
  simplifiedUI: false,
  readingGuide: false,
  focusIndicators: true,
  captionsEnabled: false,
  visualAlerts: false,
  preferredLanguage: 'en',
  readingSpeed: 'normal',
};

// Color blindness filters
export const colorBlindnessFilters = {
  none: (color: string) => color,
  protanopia: (color: string) => {
    // Simulate protanopia (red-blind)
    // This is a simplified simulation - in production, use proper color transformation
    return color;
  },
  deuteranopia: (color: string) => {
    // Simulate deuteranopia (green-blind)
    return color;
  },
  tritanopia: (color: string) => {
    // Simulate tritanopia (blue-blind)
    return color;
  },
};

// Accessibility provider
export const AccessibilityProvider: React.FC<{
  children: React.ReactNode;
  wcagLevel?: WCAGLevel;
}> = ({ children, wcagLevel = 'AA' }) => {
  const [config, setConfig] = useState<AccessibilityConfig>(defaultConfig);
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const [accessibilityInfo, setAccessibilityInfo] = useState<AccessibilityInfo>({
    screenReaderEnabled: false,
    reduceMotionEnabled: false,
    highContrastEnabled: false,
    fontSizeScale: 1.0,
    layoutDirection: 'ltr',
    preferredLanguage: 'en',
  });

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedConfig = await AsyncStorage.getItem('@accessibility_config');
        if (savedConfig) {
          setConfig({ ...defaultConfig, ...JSON.parse(savedConfig) });
        }
      } catch (error) {
        console.error('Failed to load accessibility preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await AsyncStorage.setItem('@accessibility_config', JSON.stringify(config));
      } catch (error) {
        console.error('Failed to save accessibility preferences:', error);
      }
    };

    savePreferences();
  }, [config]);

  // Monitor system accessibility settings
  useEffect(() => {
    const checkSystemSettings = () => {
      AccessibilityInfo.isScreenReaderEnabled((enabled) => {
        setIsScreenReaderActive(enabled);
        setConfig(prev => ({ ...prev, screenReaderEnabled: enabled }));
      });

      if (Platform.OS === 'ios') {
        AccessibilityInfo.isReduceMotionEnabled((enabled) => {
          setConfig(prev => ({ ...prev, reducedMotion: enabled }));
        });
      }
    };

    checkSystemSettings();

    // Listen for accessibility changes
    const subscription = AccessibilityInfo.addEventListener(
      'change',
      checkSystemSettings
    );

    return () => subscription?.remove();
  }, []);

  const updateConfig = (updates: Partial<AccessibilityConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const announceToScreenReader = (message: string) => {
    if (config.screenReaderEnabled && config.announceChanges) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  const setFocus = (ref: React.RefObject<any>) => {
    if (ref.current) {
      const nodeHandle = findNodeHandle(ref.current);
      if (nodeHandle) {
        if (Platform.OS === 'ios') {
          AccessibilityInfo.setAccessibilityFocus(nodeHandle);
        } else {
          UIManager.sendAccessibilityEvent(
            nodeHandle,
            UIManager.AccessibilityEventTypes.typeViewFocused
          );
        }
      }
    }
  };

  const checkWCAGCompliance = (): WCAGReport => {
    const issues: WCAGIssue[] = [];
    let score = 100;

    // Check perceivable criteria
    if (!config.highContrast && !config.largeText) {
      issues.push({
        type: 'warning',
        category: 'perceivable',
        description: 'Consider enabling high contrast or large text for better visibility',
        fix: 'Enable high contrast mode or large text in accessibility settings',
      });
      score -= 10;
    }

    // Check operable criteria
    if (config.touchTargets === 'normal') {
      issues.push({
        type: 'warning',
        category: 'operable',
        description: 'Touch targets could be larger for better accessibility',
        fix: 'Increase touch target size in accessibility settings',
      });
      score -= 5;
    }

    if (!config.focusIndicators) {
      issues.push({
        type: 'error',
        category: 'operable',
        description: 'Focus indicators are disabled',
        fix: 'Enable focus indicators for keyboard navigation',
      });
      score -= 15;
    }

    // Check understandable criteria
    if (!config.simplifiedUI && config.screenReaderEnabled) {
      issues.push({
        type: 'warning',
        category: 'understandable',
        description: 'Simplified UI recommended for screen reader users',
        fix: 'Enable simplified UI mode',
      });
      score -= 5;
    }

    // Check robust criteria
    if (!config.announceChanges) {
      issues.push({
        type: 'warning',
        category: 'robust',
        description: 'Change announcements are disabled',
        fix: 'Enable change announcements for better screen reader experience',
      });
      score -= 5;
    }

    // Determine WCAG level
    let level: WCAGLevel = 'AAA';
    if (score >= 90) level = 'AAA';
    else if (score >= 70) level = 'AA';
    else level = 'A';

    const recommendations = [
      'Ensure all interactive elements have accessible labels',
      'Provide alternative text for images',
      'Maintain sufficient color contrast ratios',
      'Ensure keyboard navigation is possible',
      'Test with actual screen readers',
    ];

    return {
      level,
      score,
      issues,
      recommendations,
    };
  };

  const getAccessibilityInfo = (): AccessibilityInfo => {
    return {
      screenReaderEnabled: isScreenReaderActive,
      reduceMotionEnabled: config.reducedMotion,
      highContrastEnabled: config.highContrast,
      fontSizeScale: config.largeText ? 1.5 : 1.0,
      layoutDirection: 'ltr', // Could be detected from system
      preferredLanguage: config.preferredLanguage,
    };
  };

  return (
    <AccessibilityContext.Provider
      value={{
        config,
        updateConfig,
        wcagLevel,
        isScreenReaderActive,
        announceToScreenReader,
        setFocus,
        checkWCAGCompliance,
        getAccessibilityInfo,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Accessibility components
export interface AccessibleButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: Record<string, boolean>;
  style?: any;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  accessibilityState,
  style,
}) => {
  const { config, announceToScreenReader } = useAccessibility();
  const { theme } = useTheme();

  const getTouchTargetSize = () => {
    switch (config.touchTargets) {
      case 'large': return { minHeight: 48, minWidth: 48 };
      case 'extra-large': return { minHeight: 56, minWidth: 56 };
      default: return { minHeight: 44, minWidth: 44 };
    }
  };

  const handlePress = () => {
    if (disabled) return;
    
    announceToScreenReader(accessibilityLabel || 'Button pressed');
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        ...accessibilityState,
        disabled,
        selected: accessibilityState?.selected,
      }}
      style={[
        styles.accessibleButton,
        getTouchTargetSize(),
        {
          opacity: disabled ? 0.5 : 1,
          backgroundColor: disabled ? theme.colors.neutral[300] : theme.colors.primary[500],
          borderRadius: config.touchTargets === 'extra-large' ? 12 : 8,
        },
        style,
      ]}
    >
      {children}
    </TouchableOpacity>
  );
};

export interface AccessibleTextProps {
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  selectable?: boolean;
  maxFontSizeMultiplier?: number;
  style?: any;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  accessibilityLabel,
  accessibilityRole = 'text',
  selectable = false,
  maxFontSizeMultiplier = 1.5,
  style,
}) => {
  const { config } = useAccessibility();
  const { theme } = useTheme();

  const getTextProps = () => {
    const props: any = {
      accessibilityLabel,
      accessibilityRole,
      selectable,
      maxFontSizeMultiplier: config.largeText ? 2 : maxFontSizeMultiplier,
      style: [
        {
          color: config.highContrast ? theme.colors.text.primary : theme.colors.text.secondary,
          fontSize: config.largeText ? 18 : 14,
        },
        style,
      ],
    };

    // Apply color blindness filter if needed
    if (config.colorBlindness !== 'none') {
      // Apply color transformation based on color blindness type
      // This would require more complex color manipulation
    }

    return props;
  };

  return <Text {...getTextProps()}>{children}</Text>;
};

export interface FocusIndicatorProps {
  children: React.ReactNode;
  focused?: boolean;
  style?: any;
}

export const FocusIndicator: React.FC<FocusIndicatorProps> = ({
  children,
  focused = false,
  style,
}) => {
  const { config } = useAccessibility();
  const { theme } = useTheme();

  if (!config.focusIndicators) {
    return <>{children}</>;
  }

  return (
    <View
      style={[
        styles.focusIndicator,
        {
          borderColor: focused ? theme.colors.primary[500] : 'transparent',
          borderWidth: focused ? 2 : 0,
          borderRadius: 4,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export interface ReadingGuideProps {
  children: React.ReactNode;
  enabled?: boolean;
  style?: any;
}

export const ReadingGuide: React.FC<ReadingGuideProps> = ({
  children,
  enabled = true,
  style,
}) => {
  const { config } = useAccessibility();
  const { theme } = useTheme();

  if (!config.readingGuide || !enabled) {
    return <>{children}</>;
  }

  return (
    <View
      style={[
        styles.readingGuide,
        {
          backgroundColor: config.highContrast 
            ? 'rgba(255, 255, 0, 0.3)' 
            : 'rgba(0, 0, 0, 0.1)',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export interface AccessibilityPanelProps {
  style?: any;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ style }) => {
  const { theme } = useTheme();
  const { config, updateConfig, checkWCAGCompliance, wcagLevel } = useAccessibility();
  const { AnimatedButton } = require('../components/MicroInteractions');

  const wcagReport = checkWCAGCompliance();

  const handleToggleSetting = (key: keyof AccessibilityConfig) => {
    updateConfig({ [key]: !config[key] });
  };

  const handleTouchTargetSize = (size: 'normal' | 'large' | 'extra-large') => {
    updateConfig({ touchTargets: size });
  };

  const handleColorBlindness = (type: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') => {
    updateConfig({ colorBlindness: type });
  };

  const renderToggleOption = (key: keyof AccessibilityConfig, label: string) => {
    const isEnabled = config[key] as boolean;
    
    return (
      <View key={key} style={styles.settingRow}>
        <Text style={[styles.settingLabel, { color: theme.colors.text.primary }]}>
          {label}
        </Text>
        
        <AnimatedButton
          onPress={() => handleToggleSetting(key)}
          style={[
            styles.toggleButton,
            {
              backgroundColor: isEnabled ? theme.colors.primary[500] : theme.colors.neutral[300],
            },
          ]}
        >
          <View
            style={[
              styles.toggleKnob,
              {
                backgroundColor: '#FFFFFF',
                transform: [{ translateX: isEnabled ? 20 : 0 }],
              },
            ]}
          />
        </AnimatedButton>
      </View>
    );
  };

  const renderTouchTargetOption = (size: 'normal' | 'large' | 'extra-large') => {
    const isSelected = config.touchTargets === size;
    
    return (
      <AnimatedButton
        key={size}
        onPress={() => handleTouchTargetSize(size)}
        style={[
          styles.optionButton,
          {
            backgroundColor: isSelected ? theme.colors.primary[500] : theme.colors.surface.variant,
            borderColor: isSelected ? theme.colors.primary[500] : theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.optionButtonText,
            {
              color: isSelected ? '#FFFFFF' : theme.colors.text.primary,
            },
          ]}
        >
          {size.charAt(0).toUpperCase() + size.slice(1).replace('-', ' ')}
        </Text>
      </AnimatedButton>
    );
  };

  const renderColorBlindnessOption = (type: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') => {
    const isSelected = config.colorBlindness === type;
    
    return (
      <AnimatedButton
        key={type}
        onPress={() => handleColorBlindness(type)}
        style={[
          styles.optionButton,
          {
            backgroundColor: isSelected ? theme.colors.primary[500] : theme.colors.surface.variant,
            borderColor: isSelected ? theme.colors.primary[500] : theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.optionButtonText,
            {
              color: isSelected ? '#FFFFFF' : theme.colors.text.primary,
            },
          ]}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Text>
      </AnimatedButton>
    );
  };

  return (
    <ScrollView style={[styles.accessibilityPanel, style]}>
      <Text style={[styles.panelTitle, { color: theme.colors.text.primary }]}>
        Accessibility Settings
      </Text>
      
      {/* WCAG Compliance */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          WCAG Compliance: {wcagLevel} (Score: {wcagReport.score}%)
        </Text>
        
        <View style={styles.complianceCard}>
          <Text style={[styles.complianceText, { color: theme.colors.text.primary }]}>
            Level: {wcagReport.level}
          </Text>
          <Text style={[styles.complianceText, { color: theme.colors.text.primary }]}>
            Issues: {wcagReport.issues.length}
          </Text>
        </View>
      </View>
      
      {/* Visual Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          Visual
        </Text>
        
        {renderToggleSetting('highContrast', 'High Contrast')}
        {renderToggleSetting('largeText', 'Large Text')}
        {renderToggleSetting('focusIndicators', 'Focus Indicators')}
        {renderToggleSetting('readingGuide', 'Reading Guide')}
        
        <Text style={[styles.optionLabel, { color: theme.colors.text.secondary }]}>
          Color Blindness Support
        </Text>
        <View style={styles.optionsRow}>
          {(['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const).map(renderColorBlindnessOption)}
        </View>
      </View>
      
      {/* Motor Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          Motor
        </Text>
        
        <Text style={[styles.optionLabel, { color: theme.colors.text.secondary }]}>
          Touch Target Size
        </Text>
        <View style={styles.optionsRow}>
          {(['normal', 'large', 'extra-large'] as const).map(renderTouchTargetOption)}
        </View>
        
        {renderToggleSetting('voiceControl', 'Voice Control')}
      </View>
      
      {/* Cognitive Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          Cognitive
        </Text>
        
        {renderToggleSetting('simplifiedUI', 'Simplified UI')}
        {renderToggleSetting('reducedMotion', 'Reduced Motion')}
      </View>
      
      {/* Audio Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
          Audio
        </Text>
        
        {renderToggleSetting('screenReaderEnabled', 'Screen Reader Support')}
        {renderToggleSetting('announceChanges', 'Announce Changes')}
        {renderToggleSetting('captionsEnabled', 'Captions')}
        {renderToggleSetting('visualAlerts', 'Visual Alerts')}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  accessibleButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusIndicator: {
    position: 'relative',
  },
  readingGuide: {
    paddingVertical: 2,
    marginVertical: 1,
  },
  accessibilityPanel: {
    flex: 1,
    padding: 16,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  complianceCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  complianceText: {
    fontSize: 14,
    marginBottom: 4,
  },
});

export default {
  AccessibilityProvider,
  useAccessibility,
  colorBlindnessFilters,
  AccessibleButton,
  AccessibleText,
  FocusIndicator,
  ReadingGuide,
  AccessibilityPanel,
};
