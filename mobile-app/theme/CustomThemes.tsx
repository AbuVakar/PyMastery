import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, ThemeProvider as BaseThemeProvider } from '../theme/DesignSystem';
import { useDarkMode } from '../theme/DarkMode';

const { width, height } = Dimensions.get('window');

// Custom theme configuration
export interface CustomThemeConfig {
  name: string;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: {
      small: number;
      medium: number;
      large: number;
      xlarge: number;
    };
    fontWeight?: {
      normal: string;
      medium: string;
      bold: string;
    };
  };
  spacing?: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  borderRadius?: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
}

// Predefined custom themes
export const predefinedThemes: CustomThemeConfig[] = [
  {
    name: 'ocean',
    displayName: 'Ocean Breeze',
    colors: {
      primary: '#006BA6',
      secondary: '#0496FF',
      accent: '#3A86FF',
      background: '#F0F8FF',
      surface: '#FFFFFF',
      text: '#023047',
      textSecondary: '#219EBC',
      border: '#8ECAE6',
      shadow: 'rgba(0, 107, 166, 0.1)',
    },
  },
  {
    name: 'sunset',
    displayName: 'Sunset Glow',
    colors: {
      primary: '#FF6B35',
      secondary: '#F77F00',
      accent: '#FCBF49',
      background: '#FFF8E1',
      surface: '#FFFFFF',
      text: '#003049',
      textSecondary: '#D62828',
      border: '#EAE2B7',
      shadow: 'rgba(255, 107, 53, 0.1)',
    },
  },
  {
    name: 'forest',
    displayName: 'Forest Green',
    colors: {
      primary: '#2D6A4F',
      secondary: '#52B788',
      accent: '#95D5B2',
      background: '#F1FAEE',
      surface: '#FFFFFF',
      text: '#1B263B',
      textSecondary: '#40916C',
      border: '#B7E4C7',
      shadow: 'rgba(45, 106, 79, 0.1)',
    },
  },
  {
    name: 'lavender',
    displayName: 'Lavender Dream',
    colors: {
      primary: '#7209B7',
      secondary: '#A663CC',
      accent: '#C77DFF',
      background: '#F7EFFF',
      surface: '#FFFFFF',
      text: '#240046',
      textSecondary: '#5A189A',
      border: '#E0AAFF',
      shadow: 'rgba(114, 9, 183, 0.1)',
    },
  },
  {
    name: 'midnight',
    displayName: 'Midnight Blue',
    colors: {
      primary: '#03045E',
      secondary: '#023E8A',
      accent: '#0077B6',
      background: '#CAF0F8',
      surface: '#FFFFFF',
      text: '#03045E',
      textSecondary: '#03045E',
      border: '#90E0EF',
      shadow: 'rgba(3, 4, 94, 0.1)',
    },
  },
  {
    name: 'coral',
    displayName: 'Coral Reef',
    colors: {
      primary: '#E63946',
      secondary: '#F77F00',
      accent: '#FCBF49',
      background: '#FFF1E6',
      surface: '#FFFFFF',
      text: '#1D3557',
      textSecondary: '#E63946',
      border: '#FFDAB9',
      shadow: 'rgba(230, 57, 70, 0.1)',
    },
  },
];

// Personalization settings
export interface PersonalizationSettings {
  customTheme: CustomThemeConfig | null;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'default' | 'serif' | 'monospace';
  borderRadius: 'sharp' | 'rounded' | 'circular';
  animations: boolean;
  haptics: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

// Theme customizer context
interface ThemeCustomizerContextType {
  customTheme: CustomThemeConfig | null;
  setCustomTheme: (theme: CustomThemeConfig | null) => void;
  personalization: PersonalizationSettings;
  updatePersonalization: (settings: Partial<PersonalizationSettings>) => void;
  resetToDefaults: () => void;
  exportTheme: () => string;
  importTheme: (themeJson: string) => boolean;
  availableThemes: CustomThemeConfig[];
  createCustomTheme: (baseTheme: string, customizations: Partial<CustomThemeConfig>) => CustomThemeConfig;
}

const ThemeCustomizerContext = createContext<ThemeCustomizerContextType | null>(null);

// Default personalization settings
const defaultPersonalization: PersonalizationSettings = {
  customTheme: null,
  fontSize: 'medium',
  fontFamily: 'default',
  borderRadius: 'rounded',
  animations: true,
  haptics: true,
  reducedMotion: false,
  highContrast: false,
};

// Theme customizer provider
export const ThemeCustomizerProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [customTheme, setCustomTheme] = useState<CustomThemeConfig | null>(null);
  const [personalization, setPersonalization] = useState<PersonalizationSettings>(defaultPersonalization);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedCustomTheme = await AsyncStorage.getItem('@custom_theme');
        const savedPersonalization = await AsyncStorage.getItem('@personalization_settings');
        
        if (savedCustomTheme) {
          setCustomTheme(JSON.parse(savedCustomTheme));
        }
        
        if (savedPersonalization) {
          setPersonalization({ ...defaultPersonalization, ...JSON.parse(savedPersonalization) });
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load personalization preferences:', error);
        setIsLoaded(true);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    if (isLoaded) {
      const savePreferences = async () => {
        try {
          if (customTheme) {
            await AsyncStorage.setItem('@custom_theme', JSON.stringify(customTheme));
          } else {
            await AsyncStorage.removeItem('@custom_theme');
          }
          
          await AsyncStorage.setItem('@personalization_settings', JSON.stringify(personalization));
        } catch (error) {
          console.error('Failed to save personalization preferences:', error);
        }
      };

      savePreferences();
    }
  }, [customTheme, personalization, isLoaded]);

  const updatePersonalization = (settings: Partial<PersonalizationSettings>) => {
    setPersonalization(prev => ({ ...prev, ...settings }));
  };

  const resetToDefaults = () => {
    setCustomTheme(null);
    setPersonalization(defaultPersonalization);
  };

  const exportTheme = (): string => {
    const exportData = {
      customTheme,
      personalization,
      version: '1.0',
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importTheme = (themeJson: string): boolean => {
    try {
      const importData = JSON.parse(themeJson);
      
      if (importData.customTheme) {
        setCustomTheme(importData.customTheme);
      }
      
      if (importData.personalization) {
        setPersonalization({ ...defaultPersonalization, ...importData.personalization });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return false;
    }
  };

  const createCustomTheme = (
    baseTheme: string,
    customizations: Partial<CustomThemeConfig>
  ): CustomThemeConfig => {
    const base = predefinedThemes.find(t => t.name === baseTheme) || predefinedThemes[0];
    return {
      ...base,
      name: `${base.name}_custom`,
      displayName: `${base.displayName} (Custom)`,
      ...customizations,
      colors: { ...base.colors, ...customizations.colors },
    };
  };

  return (
    <ThemeCustomizerContext.Provider
      value={{
        customTheme,
        setCustomTheme,
        personalization,
        updatePersonalization,
        resetToDefaults,
        exportTheme,
        importTheme,
        availableThemes: predefinedThemes,
        createCustomTheme,
      }}
    >
      {children}
    </ThemeCustomizerContext.Provider>
  );
};

export const useThemeCustomizer = (): ThemeCustomizerContextType => {
  const context = useContext(ThemeCustomizerContext);
  if (!context) {
    throw new Error('useThemeCustomizer must be used within a ThemeCustomizerProvider');
  }
  return context;
};

// Personalization components
export interface ThemeSelectorProps {
  style?: any;
  onThemeSelect?: (theme: CustomThemeConfig) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  style,
  onThemeSelect,
}) => {
  const { theme } = useTheme();
  const { customTheme, setCustomTheme, availableThemes } = useThemeCustomizer();
  const { AnimatedButton } = require('../components/MicroInteractions');

  const handleThemeSelect = (selectedTheme: CustomThemeConfig) => {
    setCustomTheme(selectedTheme);
    onThemeSelect?.(selectedTheme);
  };

  const renderThemeCard = (themeConfig: CustomThemeConfig) => {
    const isSelected = customTheme?.name === themeConfig.name;
    
    return (
      <AnimatedButton
        key={themeConfig.name}
        onPress={() => handleThemeSelect(themeConfig)}
        style={[
          styles.themeCard,
          {
            backgroundColor: themeConfig.colors.surface,
            borderColor: isSelected ? themeConfig.colors.primary : themeConfig.colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        <View style={styles.themePreview}>
          <View
            style={[
              styles.previewColor,
              { backgroundColor: themeConfig.colors.primary },
            ]}
          />
          <View
            style={[
              styles.previewColor,
              { backgroundColor: themeConfig.colors.secondary },
            ]}
          />
          <View
            style={[
              styles.previewColor,
              { backgroundColor: themeConfig.colors.accent },
            ]}
          />
        </View>
        
        <Text
          style={[
            styles.themeName,
            { color: themeConfig.colors.text },
          ]}
        >
          {themeConfig.displayName}
        </Text>
        
        {isSelected && (
          <View
            style={[
              styles.selectedIndicator,
              { backgroundColor: themeConfig.colors.primary },
            ]}
          >
            <Text style={styles.selectedIndicatorText}>✓</Text>
          </View>
        )}
      </AnimatedButton>
    );
  };

  return (
    <ScrollView style={[styles.themeSelector, style]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        Choose Theme
      </Text>
      
      <View style={styles.themeGrid}>
        {availableThemes.map(renderThemeCard)}
      </View>
      
      <AnimatedButton
        onPress={() => setCustomTheme(null)}
        style={[
          styles.resetButton,
          {
            backgroundColor: theme.colors.surface.variant,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.resetButtonText, { color: theme.colors.text.secondary }]}>
          Use Default Theme
        </Text>
      </AnimatedButton>
    </ScrollView>
  );
};

export interface PersonalizationPanelProps {
  style?: any;
  onSettingsChange?: (settings: PersonalizationSettings) => void;
}

export const PersonalizationPanel: React.FC<PersonalizationPanelProps> = ({
  style,
  onSettingsChange,
}) => {
  const { theme } = useTheme();
  const { personalization, updatePersonalization } = useThemeCustomizer();
  const { AnimatedButton } = require('../components/MicroInteractions');

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    updatePersonalization({ fontSize: size });
    onSettingsChange?.({ ...personalization, fontSize: size });
  };

  const handleFontFamilyChange = (family: 'default' | 'serif' | 'monospace') => {
    updatePersonalization({ fontFamily: family });
    onSettingsChange?.({ ...personalization, fontFamily: family });
  };

  const handleBorderRadiusChange = (radius: 'sharp' | 'rounded' | 'circular') => {
    updatePersonalization({ borderRadius: radius });
    onSettingsChange?.({ ...personalization, borderRadius: radius });
  };

  const handleToggleSetting = (setting: keyof PersonalizationSettings) => {
    updatePersonalization({ [setting]: !personalization[setting] });
    onSettingsChange?.({ ...personalization, [setting]: !personalization[setting] });
  };

  const renderFontSizeOption = (size: 'small' | 'medium' | 'large') => {
    const isSelected = personalization.fontSize === size;
    const getSampleText = () => {
      switch (size) {
        case 'small': return 'Aa Small';
        case 'medium': return 'Aa Medium';
        case 'large': return 'Aa Large';
        default: return 'Aa Medium';
      }
    };

    return (
      <AnimatedButton
        key={size}
        onPress={() => handleFontSizeChange(size)}
        style={[
          styles.optionCard,
          {
            backgroundColor: isSelected ? theme.colors.primary[500] : theme.colors.surface.variant,
            borderColor: isSelected ? theme.colors.primary[500] : theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.optionText,
            {
              color: isSelected ? '#FFFFFF' : theme.colors.text.primary,
              fontSize: size === 'small' ? 12 : size === 'large' ? 18 : 14,
            },
          ]}
        >
          {getSampleText()}
        </Text>
      </AnimatedButton>
    );
  };

  const renderFontFamilyOption = (family: 'default' | 'serif' | 'monospace') => {
    const isSelected = personalization.fontFamily === family;
    const getFontFamily = () => {
      switch (family) {
        case 'serif': return Platform.OS === 'ios' ? 'Georgia' : 'serif';
        case 'monospace': return Platform.OS === 'ios' ? 'Menlo' : 'monospace';
        default: return Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto';
      }
    };

    return (
      <AnimatedButton
        key={family}
        onPress={() => handleFontFamilyChange(family)}
        style={[
          styles.optionCard,
          {
            backgroundColor: isSelected ? theme.colors.primary[500] : theme.colors.surface.variant,
            borderColor: isSelected ? theme.colors.primary[500] : theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.optionText,
            {
              color: isSelected ? '#FFFFFF' : theme.colors.text.primary,
              fontFamily: getFontFamily(),
            },
          ]}
        >
          {family.charAt(0).toUpperCase() + family.slice(1)}
        </Text>
      </AnimatedButton>
    );
  };

  const renderBorderRadiusOption = (radius: 'sharp' | 'rounded' | 'circular') => {
    const isSelected = personalization.borderRadius === radius;
    const getRadius = () => {
      switch (radius) {
        case 'sharp': return 0;
        case 'rounded': return 8;
        case 'circular': return 50;
        default: return 8;
      }
    };

    return (
      <AnimatedButton
        key={radius}
        onPress={() => handleBorderRadiusChange(radius)}
        style={[
          styles.optionCard,
          {
            backgroundColor: isSelected ? theme.colors.primary[500] : theme.colors.surface.variant,
            borderColor: isSelected ? theme.colors.primary[500] : theme.colors.border,
            borderRadius: getRadius(),
          },
        ]}
      >
        <Text
          style={[
            styles.optionText,
            {
              color: isSelected ? '#FFFFFF' : theme.colors.text.primary,
            },
          ]}
        >
          {radius.charAt(0).toUpperCase() + radius.slice(1)}
        </Text>
      </AnimatedButton>
    );
  };

  const renderToggleOption = (key: keyof PersonalizationSettings, label: string) => {
    const isEnabled = personalization[key] as boolean;
    
    return (
      <View key={key} style={styles.toggleOption}>
        <Text style={[styles.toggleLabel, { color: theme.colors.text.primary }]}>
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

  return (
    <ScrollView style={[styles.personalizationPanel, style]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        Personalization
      </Text>
      
      {/* Font Size */}
      <View style={styles.section}>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
          Font Size
        </Text>
        <View style={styles.optionsRow}>
          {(['small', 'medium', 'large'] as const).map(renderFontSizeOption)}
        </View>
      </View>
      
      {/* Font Family */}
      <View style={styles.section}>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
          Font Family
        </Text>
        <View style={styles.optionsRow}>
          {(['default', 'serif', 'monospace'] as const).map(renderFontFamilyOption)}
        </View>
      </View>
      
      {/* Border Radius */}
      <View style={styles.section}>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
          Border Style
        </Text>
        <View style={styles.optionsRow}>
          {(['sharp', 'rounded', 'circular'] as const).map(renderBorderRadiusOption)}
        </View>
      </View>
      
      {/* Toggle Options */}
      <View style={styles.section}>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>
          Features
        </Text>
        {renderToggleOption('animations', 'Animations')}
        {renderToggleOption('haptics', 'Haptic Feedback')}
        {renderToggleOption('reducedMotion', 'Reduced Motion')}
        {renderToggleOption('highContrast', 'High Contrast')}
      </View>
    </ScrollView>
  );
};

export interface ThemeExportImportProps {
  style?: any;
}

export const ThemeExportImport: React.FC<ThemeExportImportProps> = ({ style }) => {
  const { theme } = useTheme();
  const { exportTheme, importTheme, resetToDefaults } = useThemeCustomizer();
  const { AnimatedButton } = require('../components/MicroInteractions');

  const handleExport = () => {
    const themeJson = exportTheme();
    Alert.alert(
      'Export Theme',
      'Theme configuration copied to clipboard. You can share this with others.',
      [
        { text: 'OK', onPress: () => console.log('Theme exported:', themeJson) },
      ]
    );
  };

  const handleImport = () => {
    Alert.prompt(
      'Import Theme',
      'Paste your theme configuration:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Import',
          onPress: (themeJson) => {
            if (themeJson && importTheme(themeJson)) {
              Alert.alert('Success', 'Theme imported successfully!');
            } else {
              Alert.alert('Error', 'Failed to import theme. Please check the format.');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <View style={[styles.exportImportContainer, style]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
        Import/Export
      </Text>
      
      <AnimatedButton
        onPress={handleExport}
        style={[
          styles.actionButton,
          {
            backgroundColor: theme.colors.primary[500],
          },
        ]}
      >
        <Text style={styles.actionButtonText}>Export Theme</Text>
      </AnimatedButton>
      
      <AnimatedButton
        onPress={handleImport}
        style={[
          styles.actionButton,
          {
            backgroundColor: theme.colors.secondary[500],
          },
        ]}
      >
        <Text style={styles.actionButtonText}>Import Theme</Text>
      </AnimatedButton>
      
      <AnimatedButton
        onPress={resetToDefaults}
        style={[
          styles.actionButton,
          {
            backgroundColor: theme.colors.error[500],
          },
        ]}
      >
        <Text style={styles.actionButtonText}>Reset to Defaults</Text>
      </AnimatedButton>
    </View>
  );
};

const styles = StyleSheet.create({
  themeSelector: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  themeCard: {
    width: width / 2 - 24,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
  },
  themePreview: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 4,
  },
  previewColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  themeName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resetButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  personalizationPanel: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
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
  exportImportContainer: {
    padding: 16,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default {
  ThemeCustomizerProvider,
  useThemeCustomizer,
  predefinedThemes,
  ThemeSelector,
  PersonalizationPanel,
  ThemeExportImport,
};
