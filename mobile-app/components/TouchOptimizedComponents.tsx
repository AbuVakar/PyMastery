import React, { useState, useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  PanGestureHandler,
  TapGestureHandler,
  State,
  Dimensions,
  Platform,
  Vibration,
  HapticFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';

const { width, height } = Dimensions.get('window');

interface TouchButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  style?: any;
  activeOpacity?: number;
  underlayColor?: string;
  ripple?: boolean;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'impact' | 'notification';
  scale?: number;
  feedback?: boolean;
  delayLongPress?: number;
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number };
  testID?: string;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled = false,
  style,
  activeOpacity = 0.7,
  underlayColor = '#007AFF',
  ripple = false,
  haptic,
  scale = 1,
  feedback = true,
  delayLongPress = 500,
  hitSlop,
  testID,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    
    // Haptic feedback
    if (haptic && feedback) {
      triggerHaptic(haptic);
    }
    
    // Scale animation
    if (scale !== 1) {
      Animated.spring(scaleAnim, {
        toValue: scale * 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
    
    // Opacity animation
    Animated.timing(opacityAnim, {
      toValue: activeOpacity,
      duration: 150,
      useNativeDriver: true,
    }).start();
    
    onPressIn?.();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    
    // Reset scale
    if (scale !== 1) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
    
    // Reset opacity
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
    
    onPressOut?.();
  };

  const triggerHaptic = (type: string) => {
    if (Platform.OS === 'ios') {
      switch (type) {
        case 'light':
          HapticFeedback.triggerHapticFeedback(HapticFeedback.FeedbackType.Light);
          break;
        case 'medium':
          HapticFeedback.triggerHapticFeedback(HapticFeedback.FeedbackType.Medium);
          break;
        case 'heavy':
          HapticFeedback.triggerHapticFeedback(HapticFeedback.FeedbackType.Heavy);
          break;
        case 'selection':
          HapticFeedback.triggerHapticFeedback(HapticFeedback.FeedbackType.Selection);
          break;
        case 'impact':
          HapticFeedback.triggerHapticFeedback(HapticFeedback.FeedbackType.ImpactLight);
          break;
        case 'notification':
          HapticFeedback.triggerHapticFeedback(HapticFeedback.FeedbackType.NotificationSuccess);
          break;
      }
    } else {
      // Android vibration
      const pattern = type === 'light' ? 10 : type === 'medium' ? 25 : type === 'heavy' ? 50 : 15;
      Vibration.vibrate(pattern);
    }
  };

  const TouchableComponent = ripple ? TouchableHighlight : TouchableOpacity;

  return (
    <Animated.View
      style={[
        styles.touchButtonContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      <TouchableComponent
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        underlayColor={underlayColor}
        delayLongPress={delayLongPress}
        hitSlop={hitSlop}
        testID={testID}
        style={[styles.touchButton, disabled && styles.disabled]}
      >
        {children}
      </TouchableComponent>
    </Animated.View>
  );
};

interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  swipeThreshold?: number;
  disabled?: boolean;
  style?: any;
  bounce?: boolean;
  testID?: string;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  swipeThreshold = 50,
  disabled = false,
  style,
  bounce = true,
  testID,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef({ x: 0, y: 0 });

  const handleGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const handleHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX, translationY } = event.nativeEvent;
      
      // Check swipe directions
      if (Math.abs(translationX) > Math.abs(translationY)) {
        // Horizontal swipe
        if (translationX > swipeThreshold && onSwipeRight) {
          onSwipeRight();
        } else if (translationX < -swipeThreshold && onSwipeLeft) {
          onSwipeLeft();
        } else {
          // Reset position with bounce
          if (bounce) {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }).start();
          } else {
            translateX.setValue(0);
          }
        }
      } else {
        // Vertical swipe
        if (translationY > swipeThreshold && onSwipeDown) {
          onSwipeDown();
        } else if (translationY < -swipeThreshold && onSwipeUp) {
          onSwipeUp();
        } else {
          // Reset position with bounce
          if (bounce) {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }).start();
          } else {
            translateY.setValue(0);
          }
        }
      }
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleHandlerStateChange}
      enabled={!disabled}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.swipeCard,
          {
            transform: [
              { translateX },
              { translateY },
            ],
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => void;
  refreshing?: boolean;
  colors?: string[];
  tintColor?: string;
  size?: number;
  enabled?: boolean;
  style?: any;
  testID?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshing = false,
  colors = ['#007AFF'],
  tintColor = '#007AFF',
  size = 25,
  enabled = true,
  style,
  testID,
}) => {
  const pullY = useRef(new Animated.Value(0)).current;
  const [isPulling, setIsPulling] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);

  const handleGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationY: pullY,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const handleHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY } = event.nativeEvent;
      
      if (translationY > 100 && canRefresh && !refreshing) {
        onRefresh();
      }
      
      // Reset position
      Animated.spring(pullY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      
      setIsPulling(false);
      setCanRefresh(false);
    }
  };

  const refreshIndicatorTransform = pullY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const refreshIndicatorOpacity = pullY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleHandlerStateChange}
      enabled={enabled}
      testID={testID}
    >
      <Animated.View style={[styles.pullToRefreshContainer, style]}>
        <Animated.View
          style={[
            styles.refreshIndicator,
            {
              opacity: refreshIndicatorOpacity,
              transform: [{ scale: refreshIndicatorTransform }],
            },
          ]}
        >
          <Ionicons
            name="refresh"
            size={size}
            color={tintColor}
            style={[
              refreshing && styles.refreshingIcon,
            ]}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.contentContainer,
            {
              transform: [{ translateY: pullY }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};

interface FloatingButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  onLongPress?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: number;
  color?: string;
  backgroundColor?: string;
  shadow?: boolean;
  haptic?: 'light' | 'medium' | 'heavy';
  style?: any;
  testID?: string;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  icon,
  onPress,
  onLongPress,
  position = 'bottom-right',
  size = 56,
  color = '#fff',
  backgroundColor = '#007AFF',
  shadow = true,
  haptic = 'medium',
  style,
  testID,
}) => {
  const { isTablet } = useResponsive();
  const scaleAnim = useRef(new Animated.Value(0)).current;

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
    const margin = 20;
    const tabletMargin = isTablet ? 40 : 20;
    
    switch (position) {
      case 'bottom-right':
        return { right: margin, bottom: margin };
      case 'bottom-left':
        return { left: margin, bottom: margin };
      case 'top-right':
        return { right: margin, top: margin };
      case 'top-left':
        return { left: margin, top: margin };
      default:
        return { right: margin, bottom: margin };
    }
  };

  return (
    <Animated.View
      style={[
        styles.floatingButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          ...getPositionStyle(),
          transform: [{ scale: scaleAnim }],
        },
        shadow && styles.floatingButtonShadow,
        style,
      ]}
    >
      <TouchButton
        onPress={onPress}
        onLongPress={onLongPress}
        haptic={haptic}
        style={styles.floatingButtonTouch}
        testID={testID}
      >
        <Ionicons name={icon} size={size * 0.5} color={color} />
      </TouchButton>
    </Animated.View>
  );
};

interface TouchableCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: any;
  activeOpacity?: number;
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number };
  testID?: string;
}

export const TouchableCard: React.FC<TouchableCardProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  style,
  activeOpacity = 0.9,
  hitSlop,
  testID,
}) => {
  return (
    <TouchButton
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={[styles.touchableCard, style]}
      activeOpacity={activeOpacity}
      hitSlop={hitSlop}
      testID={testID}
    >
      {children}
    </TouchButton>
  );
};

interface TouchableListItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  showArrow?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  style?: any;
  testID?: string;
}

export const TouchableListItem: React.FC<TouchableListItemProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  selected = false,
  showArrow = false,
  leftIcon,
  rightIcon,
  iconColor = '#007AFF',
  style,
  testID,
}) => {
  return (
    <TouchableCard
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={[
        styles.touchableListItem,
        selected && styles.selectedItem,
        style,
      ]}
      testID={testID}
    >
      <View style={styles.listItemContent}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={24}
            color={iconColor}
            style={styles.listItemIcon}
          />
        )}
        <View style={styles.listItemText}>{children}</View>
        {(rightIcon || showArrow) && (
          <Ionicons
            name={rightIcon || 'chevron-forward'}
            size={24}
            color={iconColor}
            style={styles.listItemRightIcon}
          />
        )}
      </View>
    </TouchableCard>
  );
};

const styles = StyleSheet.create({
  touchButtonContainer: {
    alignSelf: 'flex-start',
  },
  touchButton: {
    alignSelf: 'flex-start',
  },
  disabled: {
    opacity: 0.5,
  },
  swipeCard: {
    alignSelf: 'stretch',
  },
  pullToRefreshContainer: {
    flex: 1,
    position: 'relative',
  },
  refreshIndicator: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  refreshingIcon: {
    transform: [{ rotate: '180deg' }],
  },
  contentContainer: {
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  floatingButtonShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonTouch: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  touchableListItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 56,
    justifyContent: 'center',
  },
  selectedItem: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemIcon: {
    marginRight: 16,
  },
  listItemText: {
    flex: 1,
  },
  listItemRightIcon: {
    marginLeft: 16,
  },
});

export default {
  TouchButton,
  SwipeCard,
  PullToRefresh,
  FloatingButton,
  TouchableCard,
  TouchableListItem,
};
