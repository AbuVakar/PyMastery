import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';
import { TouchButton, FloatingButton } from '../components/TouchOptimizedComponents';

const { width, height } = Dimensions.get('window');

export interface TabItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
  badge?: number | string;
  disabled?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  color?: string;
  activeColor?: string;
}

export interface BottomTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
  onTabLongPress?: (tabId: string) => void;
  backgroundColor?: string;
  activeBackgroundColor?: string;
  textColor?: string;
  activeTextColor?: string;
  iconSize?: number;
  fontSize?: number;
  height?: number;
  showLabels?: boolean;
  animated?: boolean;
  ripple?: boolean;
  haptic?: 'light' | 'medium' | 'heavy';
  style?: any;
  floating?: boolean;
  floatingPosition?: 'bottom' | 'top';
  testID?: string;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
  onTabLongPress,
  backgroundColor = '#fff',
  activeBackgroundColor = '#f0f8ff',
  textColor = '#666',
  activeTextColor = '#007AFF',
  iconSize = 24,
  fontSize = 12,
  height = 60,
  showLabels = true,
  animated = true,
  ripple = true,
  haptic = 'light',
  style,
  floating = false,
  floatingPosition = 'bottom',
  testID,
}) => {
  const { isTablet, spacing } = useResponsive();
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const [indicatorWidth, setIndicatorWidth] = useState(0);

  useEffect(() => {
    if (animated) {
      const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
      if (activeIndex !== -1) {
        Animated.spring(indicatorAnim, {
          toValue: activeIndex,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  }, [activeTab, tabs, animated]);

  const handleTabPress = (tabId: string) => {
    if (haptic) {
      // Trigger haptic feedback
      if (Platform.OS === 'ios') {
        // iOS haptic feedback would be implemented here
      } else {
        // Android vibration
      }
    }
    onTabPress(tabId);
  };

  const handleTabLongPress = (tabId: string) => {
    if (haptic) {
      // Trigger stronger haptic feedback
      if (Platform.OS === 'ios') {
        // iOS haptic feedback would be implemented here
      } else {
        // Android vibration
      }
    }
    onTabLongPress?.(tabId);
  };

  const getTabStyle = (tab: TabItem, isActive: boolean) => {
    const baseStyle = [styles.tabItem];
    
    if (isActive) {
      baseStyle.push(styles.activeTab);
    }
    
    if (tab.disabled) {
      baseStyle.push(styles.disabledTab);
    }
    
    return baseStyle;
  };

  const getIconStyle = (isActive: boolean) => [
    styles.tabIcon,
    {
      fontSize: iconSize,
      color: isActive ? tab.color || activeTextColor : textColor,
    },
  ];

  const getLabelStyle = (isActive: boolean) => [
    styles.tabLabel,
    {
      fontSize,
      color: isActive ? tab.color || activeTextColor : textColor,
    },
  ];

  const renderTab = (tab: TabItem, index: number) => {
    const isActive = tab.id === activeTab;
    const activeIcon = tab.activeIcon || tab.icon;

    return (
      <TouchButton
        key={tab.id}
        onPress={() => handleTabPress(tab.id)}
        onLongPress={() => handleTabLongPress(tab.id)}
        disabled={tab.disabled}
        style={getTabStyle(tab, isActive)}
        haptic={haptic}
        ripple={ripple}
        activeOpacity={0.7}
        testID={`${testID}-tab-${tab.id}`}
      >
        <View style={styles.tabContent}>
          <Ionicons
            name={isActive ? activeIcon : tab.icon}
            style={getIconStyle(isActive)}
          />
          {showLabels && (
            <Text style={getLabelStyle(isActive)} numberOfLines={1}>
              {tab.title}
            </Text>
          )}
          {tab.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
              </Text>
            </View>
          )}
        </View>
      </TouchButton>
    );
  };

  const renderIndicator = () => {
    if (!animated) return null;

    const tabWidth = width / tabs.length;
    const indicatorPosition = indicatorAnim.interpolate({
      inputRange: [0, tabs.length - 1],
      outputRange: [0, (tabs.length - 1) * tabWidth],
    });

    return (
      <Animated.View
        style={[
          styles.indicator,
          {
            width: indicatorWidth || tabWidth * 0.6,
            transform: [{ translateX: indicatorPosition }],
            backgroundColor: activeTextColor,
          },
        ]}
      />
    );
  };

  const containerStyle = floating
    ? [
        styles.floatingContainer,
        floatingPosition === 'top' ? styles.floatingTop : styles.floatingBottom,
        { backgroundColor },
        style,
      ]
    : [
        styles.container,
        { backgroundColor, height },
        style,
      ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={containerStyle} testID={testID}>
        {floating && renderIndicator()}
        <View style={styles.tabsContainer}>
          {tabs.map((tab, index) => renderTab(tab, index))}
        </View>
        {!floating && renderIndicator()}
      </View>
    </SafeAreaView>
  );
};

export interface FloatingActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  onLongPress?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  size?: number;
  color?: string;
  backgroundColor?: string;
  shadow?: boolean;
  haptic?: 'light' | 'medium' | 'heavy';
  badge?: number | string;
  disabled?: boolean;
  style?: any;
  testID?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onPress,
  onLongPress,
  position = 'bottom-right',
  size = 56,
  color = '#fff',
  backgroundColor = '#007AFF',
  shadow = true,
  haptic = 'medium',
  badge,
  disabled = false,
  style,
  testID,
}) => {
  const { isTablet } = useResponsive();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Animate in
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
      delay: 100,
    }).start();
  }, []);

  const getPositionStyle = () => {
    const margin = isTablet ? 40 : 20;
    const bottomMargin = Platform.OS === 'ios' ? 100 : 80; // Account for bottom tab bar
    
    switch (position) {
      case 'bottom-right':
        return { right: margin, bottom: bottomMargin };
      case 'bottom-left':
        return { left: margin, bottom: bottomMargin };
      case 'top-right':
        return { right: margin, top: margin };
      case 'top-left':
        return { left: margin, top: margin };
      case 'center':
        return { left: width / 2 - size / 2, top: height / 2 - size / 2 };
      default:
        return { right: margin, bottom: bottomMargin };
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.fabContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: disabled ? '#ccc' : backgroundColor,
          ...getPositionStyle(),
          transform: [{ scale: scaleAnim }],
        },
        shadow && styles.fabShadow,
        style,
      ]}
    >
      <TouchButton
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        haptic={haptic}
        style={styles.fabButton}
        testID={testID}
      >
        <Ionicons name={icon} size={size * 0.5} color={disabled ? '#999' : color} />
        {badge && (
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>
              {typeof badge === 'number' && badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </TouchButton>
    </Animated.View>
  );
};

export interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  color?: string;
  backgroundColor?: string;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  testID?: string;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  label,
  onPress,
  onLongPress,
  disabled = false,
  color = '#007AFF',
  backgroundColor = '#f0f8ff',
  size = 'medium',
  style,
  testID,
}) => {
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: 60, height: 60, iconSize: 20, fontSize: 10 };
      case 'large':
        return { width: 100, height: 100, iconSize: 32, fontSize: 14 };
      default:
        return { width: 80, height: 80, iconSize: 24, fontSize: 12 };
    }
  };

  const { width: itemWidth, height: itemHeight, iconSize, fontSize } = getSizeStyle();

  return (
    <TouchButton
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={[
        styles.quickAction,
        {
          width: itemWidth,
          height: itemHeight,
          backgroundColor: disabled ? '#f5f5f5' : backgroundColor,
        },
        style,
      ]}
      haptic="light"
      testID={testID}
    >
      <View style={styles.quickActionContent}>
        <Ionicons
          name={icon}
          size={iconSize}
          color={disabled ? '#ccc' : color}
          style={styles.quickActionIcon}
        />
        <Text
          style={[
            styles.quickActionLabel,
            {
              fontSize,
              color: disabled ? '#999' : color,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </TouchButton>
  );
};

export interface QuickActionBarProps {
  actions: QuickActionProps[];
  orientation?: 'horizontal' | 'vertical';
  spacing?: number;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  style?: any;
  testID?: string;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  actions,
  orientation = 'horizontal',
  spacing = 10,
  backgroundColor = '#fff',
  borderRadius = 12,
  padding = 12,
  style,
  testID,
}) => {
  const containerStyle = [
    styles.quickActionBar,
    {
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      backgroundColor,
      borderRadius,
      padding,
      gap: spacing,
    },
    style,
  ];

  return (
    <View style={containerStyle} testID={testID}>
      {actions.map((action, index) => (
        <QuickAction
          key={index}
          {...action}
          testID={`${testID}-action-${index}`}
        />
      ))}
    </View>
  );
};

export interface NavigationHeaderProps {
  title?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  onLeftPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
  height?: number;
  showShadow?: boolean;
  transparent?: boolean;
  style?: any;
  testID?: string;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  backgroundColor = '#fff',
  textColor = '#333',
  height = 56,
  showShadow = true,
  transparent = false,
  style,
  testID,
}) => {
  const headerStyle = [
    styles.header,
    {
      backgroundColor: transparent ? 'transparent' : backgroundColor,
      height,
      borderBottomWidth: transparent ? 0 : 1,
      borderBottomColor: '#e0e0e0',
    },
    showShadow && !transparent && styles.headerShadow,
    style,
  ];

  return (
    <View style={headerStyle} testID={testID}>
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerContent}>
          {leftIcon && (
            <TouchButton
              onPress={onLeftPress}
              style={styles.headerButton}
              haptic="light"
            >
              <Ionicons name={leftIcon} size={24} color={textColor} />
            </TouchButton>
          )}
          
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
          
          {rightIcon && (
            <TouchButton
              onPress={onRightPress}
              style={styles.headerButton}
              haptic="light"
            >
              <Ionicons name={rightIcon} size={24} color={textColor} />
            </TouchButton>
          )}
          
          {!rightIcon && leftIcon && <View style={styles.headerSpacer} />}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  floatingContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
  floatingTop: {
    top: 80,
  },
  floatingBottom: {
    bottom: 20,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 60,
  },
  activeTab: {
    backgroundColor: '#f0f8ff',
  },
  disabledTab: {
    opacity: 0.5,
  },
  tabContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    textAlign: 'center',
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  indicator: {
    height: 3,
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  fabContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fabShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  fabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickAction: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  quickActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    marginBottom: 4,
  },
  quickActionLabel: {
    textAlign: 'center',
    fontWeight: '500',
  },
  quickActionBar: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    position: 'relative',
    zIndex: 100,
  },
  headerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerSafeArea: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
});

export default {
  BottomTabBar,
  FloatingActionButton,
  QuickAction,
  QuickActionBar,
  NavigationHeader,
};
