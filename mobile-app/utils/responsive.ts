import { Dimensions, Platform, PixelRatio } from 'react-native';

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro as reference)
const baseWidth = 375;
const baseHeight = 812;

// Device type detection
export const deviceType = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isWeb: Platform.OS === 'web',
};

// Screen size detection
export const screenSize = {
  width: screenWidth,
  height: screenHeight,
};

// Tablet detection
export const isTablet = () => {
  const aspectRatio = screenHeight / screenWidth;
  return (
    (Platform.OS === 'ios' && Platform.isPad) ||
    (Platform.OS === 'android' && (aspectRatio < 1.6 || aspectRatio > 2.1)) ||
    (screenWidth >= 768 && screenHeight >= 1024)
  );
};

// Phone detection
export const isPhone = () => {
  return !isTablet();
};

// Small phone detection (iPhone SE, etc.)
export const isSmallPhone = () => {
  return isPhone() && screenWidth <= 320;
};

// Large phone detection (iPhone Plus/Max, etc.)
export const isLargePhone = () => {
  return isPhone() && screenWidth >= 414;
};

// Responsive scaling functions
export const scale = (size: number) => {
  const widthScale = screenWidth / baseWidth;
  const newSize = size * widthScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Vertical scaling
export const verticalScale = (size: number) => {
  const heightScale = screenHeight / baseHeight;
  const newSize = size * heightScale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Moderate scaling (average of horizontal and vertical)
export const moderateScale = (size: number, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Font scaling
export const fontScale = (size: number) => {
  const baseFontScale = Platform.select({
    ios: screenWidth / baseWidth,
    android: screenWidth / baseWidth,
    web: 1,
  });
  
  const scaledSize = size * baseFontScale;
  
  // Limit font scaling for readability
  const maxScale = isTablet() ? 1.2 : 1.5;
  const minScale = isSmallPhone() ? 0.8 : 0.9;
  
  return Math.max(
    size * minScale,
    Math.min(scaledSize, size * maxScale)
  );
};

// Responsive breakpoints
export const breakpoints = {
  smallPhone: 320,
  phone: 375,
  largePhone: 414,
  tablet: 768,
  largeTablet: 1024,
  desktop: 1200,
};

// Device-specific styles
export const deviceStyles = {
  // Shadow styles
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    android: {
      elevation: 5,
    },
    web: {
      boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.1)',
    },
  }),

  // Border radius
  borderRadius: Platform.select({
    ios: 12,
    android: 8,
    web: 12,
  }),

  // Font family
  fontFamily: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  }),
};

// Responsive container styles
export const responsiveContainer = {
  // Phone containers
  phone: {
    padding: moderateScale(16),
    margin: moderateScale(8),
  },

  // Tablet containers
  tablet: {
    padding: moderateScale(24),
    margin: moderateScale(16),
    maxWidth: 768,
    alignSelf: 'center' as const,
  },

  // Large tablet containers
  largeTablet: {
    padding: moderateScale(32),
    margin: moderateScale(24),
    maxWidth: 1024,
    alignSelf: 'center' as const,
  },
};

// Responsive grid system
export const gridColumns = {
  phone: 1,
  largePhone: 2,
  tablet: 3,
  largeTablet: 4,
};

// Get responsive container based on device
export const getResponsiveContainer = () => {
  if (isTablet()) {
    if (screenWidth >= 1024) {
      return responsiveContainer.largeTablet;
    }
    return responsiveContainer.tablet;
  }
  return responsiveContainer.phone;
};

// Get grid columns based on device
export const getGridColumns = () => {
  if (isTablet()) {
    if (screenWidth >= 1024) {
      return gridColumns.largeTablet;
    }
    return gridColumns.tablet;
  }
  if (isLargePhone()) {
    return gridColumns.largePhone;
  }
  return gridColumns.phone;
};

// Responsive spacing
export const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48),
};

// Responsive font sizes
export const fontSize = {
  xs: fontScale(12),
  sm: fontScale(14),
  md: fontScale(16),
  lg: fontScale(18),
  xl: fontScale(20),
  xxl: fontScale(24),
  xxxl: fontScale(28),
  huge: fontScale(32),
};

// Responsive icon sizes
export const iconSize = {
  xs: moderateScale(16),
  sm: moderateScale(20),
  md: moderateScale(24),
  lg: moderateScale(28),
  xl: moderateScale(32),
  xxl: moderateScale(36),
};

// Device-specific utilities
export const deviceUtils = {
  // Get device pixel ratio
  getPixelRatio: () => PixelRatio.get(),

  // Get device font scale
  getFontScale: () => PixelRatio.getFontScale(),

  // Check if device has notch
  hasNotch: () => {
    if (Platform.OS === 'ios') {
      return (
        screenHeight === 812 || // iPhone X, XS
        screenHeight === 844 || // iPhone 11 Pro, 12 Pro
        screenHeight === 896 || // iPhone XR, 11, 11 Pro Max, 12 Pro Max
        screenHeight === 926 || // iPhone 12 Pro Max, 13 Pro Max
        screenHeight === 932    // iPhone 14 Pro Max, 15 Pro Max
      );
    }
    return false;
  },

  // Get safe area insets
  getSafeAreaInsets: () => {
    if (Platform.OS === 'ios') {
      const hasNotch = deviceUtils.hasNotch();
      return {
        top: hasNotch ? 44 : 20,
        bottom: 34,
        left: 0,
        right: 0,
      };
    }
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };
  },
};

// Orientation utilities
export const orientation = {
  isPortrait: () => screenHeight > screenWidth,
  isLandscape: () => screenWidth > screenHeight,
};

// Platform-specific optimizations
export const platformOptimizations = {
  // iOS optimizations
  ios: {
    blurRadius: Platform.OS === 'ios' ? 10 : 0,
    animationDuration: Platform.OS === 'ios' ? 300 : 200,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
  },

  // Android optimizations
  android: {
    elevation: Platform.OS === 'android' ? 5 : 0,
    rippleColor: Platform.OS === 'android' ? 'rgba(0,0,0,0.1)' : 'transparent',
  },

  // Web optimizations
  web: {
    transition: Platform.OS === 'web' ? 'all 0.2s ease-in-out' : 'none',
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
};

// Responsive hook (for React components)
export const useResponsive = () => {
  return {
    isTablet: isTablet(),
    isPhone: isPhone(),
    isSmallPhone: isSmallPhone(),
    isLargePhone: isLargePhone(),
    screenWidth,
    screenHeight,
    container: getResponsiveContainer(),
    gridColumns: getGridColumns(),
    spacing,
    fontSize,
    iconSize,
    scale,
    verticalScale,
    moderateScale,
    fontScale,
    deviceType,
    deviceStyles,
    orientation,
    platformOptimizations,
  };
};

// Export default responsive utilities
export default {
  deviceType,
  screenSize,
  isTablet,
  isPhone,
  isSmallPhone,
  isLargePhone,
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  breakpoints,
  deviceStyles,
  responsiveContainer,
  gridColumns,
  getResponsiveContainer,
  getGridColumns,
  spacing,
  fontSize,
  iconSize,
  deviceUtils,
  orientation,
  platformOptimizations,
  useResponsive,
};
