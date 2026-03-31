import { Platform, Dimensions } from 'react-native';
import { useResponsive } from '../utils/responsive';

// Cross-platform configuration
export const crossPlatformConfig = {
  // Platform-specific settings
  platform: {
    ios: {
      statusBarStyle: 'light-content',
      navigationBarColor: '#007AFF',
      tabBarColor: '#ffffff',
      headerTintColor: '#ffffff',
      animationDuration: 300,
      defaultFontFamily: 'System',
    },
    android: {
      statusBarStyle: 'light-content',
      navigationBarColor: '#007AFF',
      tabBarColor: '#ffffff',
      headerTintColor: '#ffffff',
      animationDuration: 200,
      defaultFontFamily: 'Roboto',
    },
    web: {
      statusBarStyle: 'default',
      navigationBarColor: '#007AFF',
      tabBarColor: '#ffffff',
      headerTintColor: '#ffffff',
      animationDuration: 150,
      defaultFontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
  },

  // Device-specific optimizations
  device: {
    phone: {
      maxContainerWidth: '100%',
      gridColumns: 1,
      cardPadding: 16,
      spacing: 16,
      fontSize: {
        small: 12,
        medium: 14,
        large: 16,
        xlarge: 18,
        xxlarge: 20,
        xxxlarge: 24,
      },
    },
    tablet: {
      maxContainerWidth: 768,
      gridColumns: 2,
      cardPadding: 24,
      spacing: 24,
      fontSize: {
        small: 14,
        medium: 16,
        large: 18,
        xlarge: 20,
        xxlarge: 24,
        xxxlarge: 28,
      },
    },
    largeTablet: {
      maxContainerWidth: 1024,
      gridColumns: 3,
      cardPadding: 32,
      spacing: 32,
      fontSize: {
        small: 16,
        medium: 18,
        large: 20,
        xlarge: 24,
        xxlarge: 28,
        xxxlarge: 32,
      },
    },
    desktop: {
      maxContainerWidth: 1200,
      gridColumns: 4,
      cardPadding: 32,
      spacing: 32,
      fontSize: {
        small: 16,
        medium: 18,
        large: 20,
        xlarge: 24,
        xxlarge: 28,
        xxxlarge: 32,
      },
    },
  },

  // Orientation-specific settings
  orientation: {
    portrait: {
      maxContainerWidth: '100%',
      gridColumns: 1,
      cardPadding: 16,
      spacing: 16,
    },
    landscape: {
      maxContainerWidth: '100%',
      gridColumns: 2,
      cardPadding: 20,
      spacing: 20,
    },
  },

  // Platform-specific components
  components: {
    // Navigation
    navigation: {
      ios: {
        headerStyle: {
          backgroundColor: '#007AFF',
          borderBottomWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        },
        headerTitleStyle: {
          color: '#ffffff',
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        },
      },
      android: {
        headerStyle: {
          backgroundColor: '#007AFF',
          elevation: 5,
        },
        headerTitleStyle: {
          color: '#ffffff',
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          elevation: 5,
        },
      },
      web: {
        headerStyle: {
          backgroundColor: '#007AFF',
          borderBottomWidth: '1px',
          borderBottomColor: '#e0e0e0',
        },
        headerTitleStyle: {
          color: '#ffffff',
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: '1px',
          borderTopColor: '#e0e0e0',
        },
      },
    },

    // Cards
    card: {
      ios: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      },
      android: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        elevation: 5,
      },
      web: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.1)',
      },
    },

    // Buttons
    button: {
      ios: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      },
      android: {
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        elevation: 5,
      },
      web: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
      },
    },

    // Inputs
    input: {
      ios: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
      android: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingVertical: 12,
        paddingHorizontal: 16,
        elevation: 2,
      },
      web: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingVertical: 12,
        paddingHorizontal: 16,
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        outline: 'none',
        transition: 'all 0.2s ease-in-out',
      },
    },
  },

  // Performance optimizations
  performance: {
    ios: {
      enableAnimations: true,
      enableGestures: true,
      enableHardwareAcceleration: true,
      animationDuration: 300,
      gestureDelay: 0,
    },
    android: {
      enableAnimations: true,
      enableGestures: true,
      enableHardwareAcceleration: true,
      animationDuration: 200,
      gestureDelay: 100,
    },
    web: {
      enableAnimations: true,
      enableGestures: false,
      enableHardwareAcceleration: true,
      animationDuration: 150,
      gestureDelay: 0,
    },
  },

  // Accessibility settings
  accessibility: {
    ios: {
      enableVoiceOver: true,
      enableDynamicType: true,
      enableReduceMotion: true,
      enableHighContrast: true,
    },
    android: {
      enableTalkBack: true,
      enableFontScaling: true,
      enableReduceMotion: true,
      enableHighContrast: true,
    },
    web: {
      enableScreenReader: true,
      enableFontScaling: true,
      enableReduceMotion: true,
      enableHighContrast: true,
    },
  },
};

// Get platform-specific configuration
export const getPlatformConfig = (platform: string = Platform.OS) => {
  return crossPlatformConfig.platform[platform as keyof typeof crossPlatformConfig.platform] || crossPlatformConfig.platform.ios;
};

// Get device-specific configuration
export const getDeviceConfig = (deviceType: 'phone' | 'tablet' | 'largeTablet' | 'desktop') => {
  return crossPlatformConfig.device[deviceType] || crossPlatformConfig.device.phone;
};

// Get orientation-specific configuration
export const getOrientationConfig = (orientation: 'portrait' | 'landscape') => {
  return crossPlatformConfig.orientation[orientation] || crossPlatformConfig.orientation.portrait;
};

// Get component configuration
export const getComponentConfig = (component: string, platform: string = Platform.OS) => {
  return crossPlatformConfig.components[component as keyof typeof crossPlatformConfig.components]?.[platform as keyof typeof crossPlatformConfig.platform] || {};
};

// Get performance configuration
export const getPerformanceConfig = (platform: string = Platform.OS) => {
  return crossPlatformConfig.performance[platform as keyof typeof crossPlatformConfig.performance] || crossPlatformConfig.performance.ios;
};

// Get accessibility configuration
export const getAccessibilityConfig = (platform: string = Platform.OS) => {
  return crossPlatformConfig.accessibility[platform as keyof typeof crossPlatformConfig.accessibility] || crossPlatformConfig.accessibility.ios;
};

// Cross-platform hooks
export const useCrossPlatform = () => {
  const { isTablet, isPhone, isLargePhone, screenWidth, screenHeight } = useResponsive();
  
  // Determine device type
  const deviceType = isTablet ? (screenWidth >= 1024 ? 'largeTablet' : 'tablet') : 'phone';
  
  // Determine orientation
  const isLandscape = screenWidth > screenHeight;
  const orientation = isLandscape ? 'landscape' : 'portrait';
  
  return {
    platform: Platform.OS,
    deviceType,
    orientation,
    isLandscape,
    config: {
      platform: getPlatformConfig(Platform.OS),
      device: getDeviceConfig(deviceType),
      orientation: getOrientationConfig(orientation),
      component: {
        navigation: getComponentConfig('navigation', Platform.OS),
        card: getComponentConfig('card', Platform.OS),
        button: getComponentConfig('button', Platform.OS),
        input: getComponentConfig('input', Platform.OS),
      },
      performance: getPerformanceConfig(Platform.OS),
      accessibility: getAccessibilityConfig(Platform.OS),
    },
  };
};

// Cross-platform utilities
export const crossPlatformUtils = {
  // Platform-specific styling
  getStyle: (baseStyle: any, platformStyle?: any) => {
    const platform = Platform.OS;
    return [
      baseStyle,
      platformStyle?.[platform],
    ];
  },

  // Platform-specific props
  getProps: (baseProps: any, platformProps?: any) => {
    const platform = Platform.OS;
    return {
      ...baseProps,
      ...platformProps?.[platform],
    };
  },

  // Platform-specific behavior
  getBehavior: (baseBehavior: any, platformBehavior?: any) => {
    const platform = Platform.OS;
    return {
      ...baseBehavior,
      ...platformBehavior?.[platform],
    };
  },

  // Platform-specific animations
  getAnimation: (baseAnimation: any, platformAnimation?: any) => {
    const platform = Platform.OS;
    const config = getPerformanceConfig(platform);
    return {
      ...baseAnimation,
      duration: config.animationDuration,
      ...platformAnimation?.[platform],
    };
  },

  // Platform-specific accessibility
  getAccessibility: (baseAccessibility: any, platformAccessibility?: any) => {
    const platform = Platform.OS;
    const config = getAccessibilityConfig(platform);
    return {
      ...baseAccessibility,
      ...platformAccessibility?.[platform],
      accessible: true,
      accessibilityRole: 'button',
      ...config,
    };
  },
};

export default {
  crossPlatformConfig,
  getPlatformConfig,
  getDeviceConfig,
  getOrientationConfig,
  getComponentConfig,
  getPerformanceConfig,
  getAccessibilityConfig,
  useCrossPlatform,
  crossPlatformUtils,
};
