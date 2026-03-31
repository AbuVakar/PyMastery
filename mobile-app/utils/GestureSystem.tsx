import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PanGestureHandler,
  TapGestureHandler,
  LongPressGestureHandler,
  PinchGestureHandler,
  RotationGestureHandler,
  State,
  FlatList,
  ScrollView,
  Dimensions,
  Platform,
  Vibration,
  HapticFeedback,
} from 'react-native-gesture-handler';
import { Animated, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';

const { width, height } = Dimensions.get('window');

export interface GestureConfig {
  enabled?: boolean;
  minDistance?: number;
  minPointers?: number;
  maxPointers?: number;
  minDuration?: number;
  maxDuration?: number;
  maxDeltaX?: number;
  maxDeltaY?: number;
  maxAngle?: number;
  minScale?: number;
  maxScale?: number;
  minRotation?: number;
  maxRotation?: number;
}

export interface GestureCallbacks {
  onSwipeLeft?: (event: any) => void;
  onSwipeRight?: (event: any) => void;
  onSwipeUp?: (event: any) => void;
  onSwipeDown?: (event: any) => void;
  onTap?: (event: any) => void;
  onDoubleTap?: (event: any) => void;
  onLongPress?: (event: any) => void;
  onPinch?: (scale: number, event: any) => void;
  onRotate?: (rotation: number, event: any) => void;
  onPanStart?: (event: any) => void;
  onPanMove?: (event: any) => void;
  onPanEnd?: (event: any) => void;
}

export const useGestures = (config: GestureConfig = {}, callbacks: GestureCallbacks = {}) => {
  const panGestureRef = useRef<PanGestureHandler>(null);
  const tapGestureRef = useRef<TapGestureHandler>(null);
  const longPressGestureRef = useRef<LongPressGestureHandler>(null);
  const pinchGestureRef = useRef<PinchGestureHandler>(null);
  const rotationGestureRef = useRef<RotationGestureHandler>(null);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const [gestureState, setGestureState] = useState({
    isPanning: false,
    isPinching: false,
    isRotating: false,
    isLongPressing: false,
    lastGesture: null as string | null,
  });

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'selection') => {
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
      }
    } else {
      const pattern = type === 'light' ? 10 : type === 'medium' ? 25 : type === 'heavy' ? 50 : 15;
      Vibration.vibrate(pattern);
    }
  }, []);

  const onPanGestureEvent = Animated.event(
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

  const onPanHandlerStateChange = useCallback((event: any) => {
    const { nativeEvent } = event;
    const { oldState, state, translationX, translationY } = nativeEvent;

    if (oldState === State.ACTIVE && state === State.END) {
      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);
      const threshold = config.minDistance || 50;

      setGestureState(prev => ({ ...prev, isPanning: false, lastGesture: 'pan' }));

      // Determine swipe direction
      if (absX > absY) {
        if (absX > threshold) {
          if (translationX > 0) {
            callbacks.onSwipeRight?.(event);
            triggerHaptic('light');
          } else {
            callbacks.onSwipeLeft?.(event);
            triggerHaptic('light');
          }
        }
      } else {
        if (absY > threshold) {
          if (translationY > 0) {
            callbacks.onSwipeDown?.(event);
            triggerHaptic('light');
          } else {
            callbacks.onSwipeUp?.(event);
            triggerHaptic('light');
          }
        }
      }

      // Reset position
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      callbacks.onPanEnd?.(event);
    } else if (state === State.BEGAN) {
      setGestureState(prev => ({ ...prev, isPanning: true }));
      callbacks.onPanStart?.(event);
    } else if (state === State.ACTIVE) {
      callbacks.onPanMove?.(event);
    }
  }, [callbacks, config.minDistance, triggerHaptic]);

  const onTapHandlerStateChange = useCallback((event: any) => {
    const { nativeEvent } = event;
    const { state } = nativeEvent;

    if (state === State.ACTIVE) {
      callbacks.onTap?.(event);
      triggerHaptic('selection');
      setGestureState(prev => ({ ...prev, lastGesture: 'tap' }));
    }
  }, [callbacks, triggerHaptic]);

  const onLongPressHandlerStateChange = useCallback((event: any) => {
    const { nativeEvent } = event;
    const { oldState, state } = nativeEvent;

    if (state === State.ACTIVE) {
      setGestureState(prev => ({ ...prev, isLongPressing: true }));
      callbacks.onLongPress?.(event);
      triggerHaptic('medium');
    } else if (oldState === State.ACTIVE && state === State.END) {
      setGestureState(prev => ({ ...prev, isLongPressing: false }));
    }
  }, [callbacks, triggerHaptic]);

  const onPinchGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          scale: scale,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onPinchHandlerStateChange = useCallback((event: any) => {
    const { nativeEvent } = event;
    const { oldState, state, scale: currentScale } = nativeEvent;

    if (state === State.ACTIVE) {
      setGestureState(prev => ({ ...prev, isPinching: true }));
      callbacks.onPinch?.(currentScale, event);
    } else if (oldState === State.ACTIVE && state === State.END) {
      setGestureState(prev => ({ ...prev, isPinching: false }));
      
      // Reset scale
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [callbacks]);

  const onRotationGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          rotation: rotation,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onRotationHandlerStateChange = useCallback((event: any) => {
    const { nativeEvent } = event;
    const { oldState, state, rotation: currentRotation } = nativeEvent;

    if (state === State.ACTIVE) {
      setGestureState(prev => ({ ...prev, isRotating: true }));
      callbacks.onRotate?.(currentRotation, event);
    } else if (oldState === State.ACTIVE && state === State.END) {
      setGestureState(prev => ({ ...prev, isRotating: false }));
      
      // Reset rotation
      Animated.spring(rotation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [callbacks]);

  const GestureHandler = ({ children }: { children: React.ReactNode }) => (
    <PanGestureHandler
      ref={panGestureRef}
      onGestureEvent={onPanGestureEvent}
      onHandlerStateChange={onPanHandlerStateChange}
      minDist={config.minDistance || 10}
      minPointers={config.minPointers || 1}
      maxPointers={config.maxPointers || 1}
    >
      <LongPressGestureHandler
        ref={longPressGestureRef}
        onHandlerStateChange={onLongPressHandlerStateChange}
        minDurationMs={config.minDuration || 500}
        maxDurationMs={config.maxDuration || 1000}
      >
        <TapGestureHandler
          ref={tapGestureRef}
          onHandlerStateChange={onTapHandlerStateChange}
          numberOfTaps={1}
        >
          <PinchGestureHandler
            ref={pinchGestureRef}
            onGestureEvent={onPinchGestureEvent}
            onHandlerStateChange={onPinchHandlerStateChange}
            minScale={config.minScale || 0.5}
            maxScale={config.maxScale || 2}
          >
            <RotationGestureHandler
              ref={rotationGestureRef}
              onGestureEvent={onRotationGestureEvent}
              onHandlerStateChange={onRotationHandlerStateChange}
              minRotation={config.minRotation || -Math.PI}
              maxRotation={config.maxRotation || Math.PI}
            >
              <Animated.View
                style={{
                  transform: [
                    { translateX },
                    { translateY },
                    { scale },
                    { rotation },
                  ],
                }}
              >
                {children}
              </Animated.View>
            </RotationGestureHandler>
          </PinchGestureHandler>
        </TapGestureHandler>
      </LongPressGestureHandler>
    </PanGestureHandler>
  );

  return {
    GestureHandler,
    gestureState,
    translateX,
    translateY,
    scale,
    rotation,
    panGestureRef,
    tapGestureRef,
    longPressGestureRef,
    pinchGestureRef,
    rotationGestureRef,
  };
};

export interface SwipeableListProps {
  data: any[];
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactNode;
  keyExtractor: (item: any, index: number) => string;
  onSwipeLeft?: (item: any, index: number) => void;
  onSwipeRight?: (item: any, index: number) => void;
  leftSwipeAction?: React.ReactNode;
  rightSwipeAction?: React.ReactNode;
  swipeThreshold?: number;
  enabled?: boolean;
  style?: any;
}

export const SwipeableList: React.FC<SwipeableListProps> = ({
  data,
  renderItem,
  keyExtractor,
  onSwipeLeft,
  onSwipeRight,
  leftSwipeAction,
  rightSwipeAction,
  swipeThreshold = 100,
  enabled = true,
  style,
}) => {
  const [swipedRow, setSwipedRow] = useState<number | null>(null);
  const { isTablet } = useResponsive();

  const closeRow = (index: number) => {
    if (swipedRow !== null && swipedRow !== index) {
      setSwipedRow(null);
    }
  };

  const renderSwipeableItem = ({ item, index }: { item: any; index: number }) => {
    const translateX = useRef(new Animated.Value(0)).current;

    const handleGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true }
    );

    const handleHandlerStateChange = (event: any) => {
      const { nativeEvent } = event;
      const { oldState, state, translationX } = nativeEvent;

      if (oldState === State.ACTIVE && state === State.END) {
        const absX = Math.abs(translationX);

        if (absX > swipeThreshold) {
          if (translationX > 0 && onSwipeRight) {
            onSwipeRight(item, index);
          } else if (translationX < 0 && onSwipeLeft) {
            onSwipeLeft(item, index);
          }
        }

        // Reset position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();

        setSwipedRow(null);
      } else if (state === State.ACTIVE) {
        setSwipedRow(index);
        closeRow(index);
      }
    };

    const leftActionWidth = leftSwipeAction ? 80 : 0;
    const rightActionWidth = rightSwipeAction ? 80 : 0;

    return (
      <View style={styles.swipeableRow}>
        {leftSwipeAction && (
          <View style={[styles.swipeAction, styles.leftAction, { width: leftActionWidth }]}>
            {leftSwipeAction}
          </View>
        )}
        {rightSwipeAction && (
          <View style={[styles.swipeAction, styles.rightAction, { width: rightActionWidth }]}>
            {rightSwipeAction}
          </View>
        )}
        <PanGestureHandler
          onGestureEvent={handleGestureEvent}
          onHandlerStateChange={handleHandlerStateChange}
          enabled={enabled}
        >
          <Animated.View
            style={[
              styles.swipeableContent,
              {
                transform: [{ translateX }],
                marginLeft: leftActionWidth,
                marginRight: rightActionWidth,
              },
            ]}
          >
            {renderItem({ item, index })}
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderSwipeableItem}
      keyExtractor={keyExtractor}
      style={[styles.swipeableList, style]}
      scrollEventThrottle={16}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      updateCellsBatchingPeriod={50}
    />
  );
};

export interface ZoomableViewProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  onScaleChange?: (scale: number) => void;
  onTranslateChange?: (translationX: number, translationY: number) => void;
  enabled?: boolean;
  style?: any;
}

export const ZoomableView: React.FC<ZoomableViewProps> = ({
  children,
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1,
  onScaleChange,
  onTranslateChange,
  enabled = true,
  style,
}) => {
  const scale = useRef(new Animated.Value(initialScale)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(initialScale);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale } }],
    { useNativeDriver: true }
  );

  const onPanGestureEvent = Animated.event(
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

  const onPinchHandlerStateChange = (event: any) => {
    const { nativeEvent } = event;
    const { oldState, state, scale: currentScale } = nativeEvent;

    if (state === State.END) {
      // Clamp scale
      const clampedScale = Math.max(minScale, Math.min(maxScale, currentScale));
      lastScale.current = clampedScale;
      
      // Apply clamped scale
      Animated.spring(scale, {
        toValue: clampedScale,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      onScaleChange?.(clampedScale);
    }
  };

  const onPanHandlerStateChange = (event: any) => {
    const { nativeEvent } = event;
    const { oldState, state, translationX, translationY } = nativeEvent;

    if (state === State.END) {
      lastTranslateX.current += translationX;
      lastTranslateY.current += translationY;
      
      // Reset translation values
      translateX.setValue(0);
      translateY.setValue(0);

      onTranslateChange?.(lastTranslateX.current, lastTranslateY.current);
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onPanGestureEvent}
      onHandlerStateChange={onPanHandlerStateChange}
      minPointers={1}
      maxPointers={1}
      enabled={enabled}
    >
      <PinchGestureHandler
        onGestureEvent={onPinchGestureEvent}
        onHandlerStateChange={onPinchHandlerStateChange}
        enabled={enabled}
      >
        <Animated.View
          style={[
            styles.zoomableView,
            {
              transform: [
                { scale },
                { translateX },
                { translateY },
              ],
            },
            style,
          ]}
        >
          {children}
        </Animated.View>
      </PinchGestureHandler>
    </PanGestureHandler>
  );
};

export interface GestureIndicatorProps {
  type: 'swipe' | 'tap' | 'longPress' | 'pinch' | 'rotate';
  active?: boolean;
  color?: string;
  size?: number;
  style?: any;
}

export const GestureIndicator: React.FC<GestureIndicatorProps> = ({
  type,
  active = false,
  color = '#007AFF',
  size = 24,
  style,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'swipe':
        return 'finger-print';
      case 'tap':
        return 'hand-left';
      case 'longPress':
        return 'timer';
      case 'pinch':
        return 'resize';
      case 'rotate':
        return 'refresh';
      default:
        return 'ellipse';
    }
  };

  return (
    <View
      style={[
        styles.gestureIndicator,
        {
          backgroundColor: active ? color : 'transparent',
          borderColor: color,
          width: size + 8,
          height: size + 8,
          borderRadius: (size + 8) / 2,
        },
        style,
      ]}
    >
      <Ionicons
        name={getIcon()}
        size={size * 0.6}
        color={active ? '#fff' : color}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  swipeableList: {
    flex: 1,
  },
  swipeableRow: {
    flexDirection: 'row',
    position: 'relative',
  },
  swipeableContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  swipeAction: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftAction: {
    left: 0,
  },
  rightAction: {
    right: 0,
  },
  zoomableView: {
    flex: 1,
    overflow: 'hidden',
  },
  gestureIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
});

export default {
  useGestures,
  SwipeableList,
  ZoomableView,
  GestureIndicator,
};
