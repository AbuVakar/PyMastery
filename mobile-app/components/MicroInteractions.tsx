import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanGestureHandler,
  State,
  Easing,
  LayoutAnimation,
  UIManager,
  Platform,
  Dimensions,
} from 'react-native';
import { useTheme } from '../theme/DesignSystem';

const { width, height } = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Animation presets following Material Design 3
export const AnimationPresets = {
  // Easing functions
  easing: {
    standard: Easing.bezier(0.4, 0.0, 0.2, 1),
    standardDecelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
    standardAccelerate: Easing.bezier(0.4, 0.0, 1, 1),
    emphasized: Easing.bezier(0.2, 0.0, 0.0, 1.0),
    emphasizedDecelerate: Easing.bezier(0.05, 0.7, 0.1, 1.0),
    emphasizedAccelerate: Easing.bezier(0.3, 0.0, 0.8, 0.15),
    legacy: Easing.bezier(0.4, 0.0, 0.2, 1),
    legacyDecelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
    legacyAccelerate: Easing.bezier(0.4, 0.0, 1, 1),
  },
  
  // Duration presets
  duration: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 700,
  },
  
  // Spring configurations
  spring: {
    gentle: {
      tension: 100,
      friction: 8,
    },
    bouncy: {
      tension: 150,
      friction: 4,
    },
    stiff: {
      tension: 200,
      friction: 10,
    },
    wobbly: {
      tension: 80,
      friction: 2,
    },
  },
};

// Micro-interaction hooks
export const useScaleAnimation = (
  toValue: number = 0.95,
  duration: number = 150
) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const animateIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: toValue,
      duration,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [toValue, duration]);
  
  const animateOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [duration]);
  
  const animate = useCallback((pressed: boolean) => {
    if (pressed) {
      animateIn();
    } else {
      animateOut();
    }
  }, [animateIn, animateOut]);
  
  return { scaleAnim, animate };
};

export const useOpacityAnimation = (
  toValue: number = 0.7,
  duration: number = 150
) => {
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  const animateIn = useCallback(() => {
    Animated.timing(opacityAnim, {
      toValue: toValue,
      duration,
      useNativeDriver: true,
      easing: AnimationPresets.easing.standard,
    }).start();
  }, [toValue, duration]);
  
  const animateOut = useCallback(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
      easing: AnimationPresets.easing.standard,
    }).start();
  }, [duration]);
  
  const animate = useCallback((pressed: boolean) => {
    if (pressed) {
      animateIn();
    } else {
      animateOut();
    }
  }, [animateIn, animateOut]);
  
  return { opacityAnim, animate };
};

export const useSlideAnimation = (
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance: number = 10,
  duration: number = 200
) => {
  const getInitialValue = () => {
    switch (direction) {
      case 'up': return { x: 0, y: distance };
      case 'down': return { x: 0, y: -distance };
      case 'left': return { x: distance, y: 0 };
      case 'right': return { x: -distance, y: 0 };
      default: return { x: 0, y: distance };
    }
  };
  
  const translateX = useRef(new Animated.Value(getInitialValue().x)).current;
  const translateY = useRef(new Animated.Value(getInitialValue().y)).current;
  
  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration,
        useNativeDriver: true,
        easing: AnimationPresets.easing.standardDecelerate,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        useNativeDriver: true,
        easing: AnimationPresets.easing.standardDecelerate,
      }),
    ]).start();
  }, [duration]);
  
  const animateOut = useCallback(() => {
    const finalValue = getInitialValue();
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: finalValue.x,
        duration,
        useNativeDriver: true,
        easing: AnimationPresets.easing.standardAccelerate,
      }),
      Animated.timing(translateY, {
        toValue: finalValue.y,
        duration,
        useNativeDriver: true,
        easing: AnimationPresets.easing.standardAccelerate,
      }),
    ]).start();
  }, [duration]);
  
  return { translateX, translateY, animateIn, animateOut };
};

export const useRotationAnimation = (
  toValue: number = 180,
  duration: number = 300
) => {
  const rotationAnim = useRef(new Animated.Value(0)).current;
  
  const animate = useCallback(() => {
    Animated.timing(rotationAnim, {
      toValue: toValue,
      duration,
      useNativeDriver: true,
      easing: AnimationPresets.easing.standard,
    }).start();
  }, [toValue, duration]);
  
  const reset = useCallback(() => {
    Animated.timing(rotationAnim, {
      toValue: 0,
      duration,
      useNativeDriver: true,
      easing: AnimationPresets.easing.standard,
    }).start();
  }, [duration]);
  
  const toggle = useCallback(() => {
    Animated.timing(rotationAnim, {
      toValue: rotationAnim._value === 0 ? toValue : 0,
      duration,
      useNativeDriver: true,
      easing: AnimationPresets.easing.standard,
    }).start();
  }, [toValue, duration]);
  
  return { rotationAnim, animate, reset, toggle };
};

export const usePulseAnimation = (
  scale: number = 1.1,
  duration: number = 1000
) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  
  const start = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    const pulse = Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: scale,
        duration: duration / 2,
        useNativeDriver: true,
        easing: AnimationPresets.easing.standard,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: duration / 2,
        useNativeDriver: true,
        easing: AnimationPresets.easing.standard,
      }),
    ]);
    
    Animated.loop(pulse).start();
  }, [scale, duration, isAnimating]);
  
  const stop = useCallback(() => {
    scaleAnim.stopAnimation();
    setIsAnimating(false);
    scaleAnim.setValue(1);
  }, []);
  
  return { scaleAnim, start, stop, isAnimating };
};

export const useShakeAnimation = (
  intensity: number = 10,
  duration: number = 500
) => {
  const translateX = useRef(new Animated.Value(0)).current;
  
  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: intensity,
        duration: duration / 8,
        useNativeDriver: true,
        easing: AnimationPresets.easing.standard,
      }),
      Animated.timing(translateX, {
        toValue: -intensity,
        duration: duration / 8,
        useNativeDriver: true,
        easing: AnimationPresets.easing.standard,
      }),
      Animated.timing(translateX, {
        toValue: intensity,
        duration: duration / 8,
        useNativeDriver: true,
        easing: AnimationPresets.easing.standard,
      }),
      Animated.timing(translateX, {
        toValue: -intensity,
        duration: duration / 8,
        useNativeDriver: true,
        easing: AnimationPresets.easing.standard,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: duration / 2,
        useNativeDriver: true,
        easing: AnimationPresets.easing.standardDecelerate,
      }),
    ]).start();
  }, [intensity, duration]);
  
  return { translateX, shake };
};

// Micro-interaction components
export interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  animationType?: 'scale' | 'opacity' | 'slide' | 'bounce';
  animationConfig?: {
    scale?: number;
    opacity?: number;
    distance?: number;
    duration?: number;
  };
  style?: any;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onPress,
  onLongPress,
  disabled = false,
  animationType = 'scale',
  animationConfig = {},
  style,
}) => {
  const theme = useTheme();
  const { scaleAnim, animate } = useScaleAnimation(
    animationConfig.scale || 0.95,
    animationConfig.duration || 150
  );
  const { opacityAnim, animate: animateOpacity } = useOpacityAnimation(
    animationConfig.opacity || 0.7,
    animationConfig.duration || 150
  );
  const { translateX, translateY, animateIn, animateOut } = useSlideAnimation(
    'up',
    animationConfig.distance || 5,
    animationConfig.duration || 200
  );

  const handlePressIn = () => {
    switch (animationType) {
      case 'scale':
        animate(true);
        break;
      case 'opacity':
        animateOpacity(true);
        break;
      case 'slide':
        animateIn();
        break;
      case 'bounce':
        animate(true);
        break;
    }
  };

  const handlePressOut = () => {
    switch (animationType) {
      case 'scale':
        animate(false);
        break;
      case 'opacity':
        animateOpacity(false);
        break;
      case 'slide':
        animateOut();
        break;
      case 'bounce':
        animate(false);
        break;
    }
  };

  const getAnimatedStyle = () => {
    const baseStyle = {
      opacity: disabled ? 0.5 : 1,
    };

    switch (animationType) {
      case 'scale':
        return {
          ...baseStyle,
          transform: [{ scale: scaleAnim }],
        };
      case 'opacity':
        return {
          ...baseStyle,
          opacity: disabled ? 0.5 : opacityAnim,
        };
      case 'slide':
        return {
          ...baseStyle,
          transform: [{ translateX }, { translateY }],
        };
      case 'bounce':
        return {
          ...baseStyle,
          transform: [{ scale: scaleAnim }],
        };
      default:
        return baseStyle;
    }
  };

  return (
    <Animated.View style={[styles.animatedButton, getAnimatedStyle(), style]}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={styles.touchableArea}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export interface FloatingCardProps {
  children: React.ReactNode;
  animationType?: 'fade' | 'slide' | 'scale' | 'bounce';
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  style?: any;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({
  children,
  animationType = 'fade',
  direction = 'up',
  delay = 0,
  duration = 500,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const getInitialValues = () => {
      switch (direction) {
        case 'up':
          return { translateY: 50 };
        case 'down':
          return { translateY: -50 };
        case 'left':
          return { translateX: 50 };
        case 'right':
          return { translateX: -50 };
        default:
          return { translateY: 50 };
      }
    };

    const initialValues = getInitialValues();
    translateY.setValue(initialValues.translateY || 0);
    translateX.setValue(initialValues.translateX || 0);

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
          easing: AnimationPresets.easing.standardDecelerate,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
          easing: AnimationPresets.easing.standardDecelerate,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          useNativeDriver: true,
          easing: AnimationPresets.easing.standardDecelerate,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration,
          useNativeDriver: true,
          easing: AnimationPresets.easing.standardDecelerate,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [direction, delay, duration]);

  const getAnimatedStyle = () => {
    const baseStyle = {
      opacity: opacityAnim,
      transform: [
        { scale: scaleAnim },
        { translateX },
        { translateY },
      ],
    };

    switch (animationType) {
      case 'fade':
        return { opacity: opacityAnim };
      case 'slide':
        return {
          opacity: opacityAnim,
          transform: [{ translateX }, { translateY }],
        };
      case 'scale':
        return {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        };
      case 'bounce':
        return {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        };
      default:
        return baseStyle;
    }
  };

  return (
    <Animated.View style={[styles.floatingCard, getAnimatedStyle(), style]}>
      {children}
    </Animated.View>
  );
};

export interface RippleEffectProps {
  children: React.ReactNode;
  color?: string;
  radius?: number;
  duration?: number;
  style?: any;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  color = 'rgba(255, 255, 255, 0.3)',
  radius = 50,
  duration = 600,
  style,
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rippleId = useRef(0);

  const handlePress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const newRipple = {
      id: rippleId.current++,
      x: locationX,
      y: locationY,
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, duration);
  };

  return (
    <View style={[styles.rippleContainer, style]}>
      {ripples.map(ripple => (
        <Animated.View
          key={ripple.id}
          style={[
            styles.ripple,
            {
              backgroundColor: color,
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              left: ripple.x - radius,
              top: ripple.y - radius,
            },
          ]}
        />
      ))}
      <TouchableOpacity onPress={handlePress} style={styles.rippleTouchable}>
        {children}
      </TouchableOpacity>
    </View>
  );
};

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  duration?: number;
  style?: any;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = '#2196F3',
  duration = 1000,
  style,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
        easing: AnimationPresets.easing.linear,
      })
    ).start();
  }, [duration]);

  const getSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'medium': return 32;
      case 'large': return 48;
      default: return 32;
    }
  };

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.spinner,
        {
          width: getSize(),
          height: getSize(),
          borderTopColor: color,
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent',
          transform: [{ rotate }],
        },
        style,
      ]}
    />
  );
};

export interface ProgressIndicatorProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  borderRadius?: number;
  animated?: boolean;
  style?: any;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  color = '#2196F3',
  backgroundColor = '#E0E0E0',
  height = 4,
  borderRadius = 2,
  animated = true,
  style,
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(widthAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
        easing: AnimationPresets.easing.standard,
      }).start();
    } else {
      widthAnim.setValue(progress);
    }
  }, [progress, animated]);

  return (
    <View
      style={[
        styles.progressContainer,
        {
          height,
          backgroundColor,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: color,
            borderRadius,
            width: animated ? widthAnim : `${progress * 100}%`,
          },
        ]}
      />
    </View>
  );
};

export interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  animationType?: 'fade' | 'slide' | 'scale';
  direction?: 'up' | 'down' | 'left' | 'right';
  style?: any;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  staggerDelay = 100,
  animationType = 'fade',
  direction = 'up',
  style,
}) => {
  return (
    <View style={style}>
      {React.Children.map(children, (child, index) => (
        <FloatingCard
          key={index}
          animationType={animationType}
          direction={direction}
          delay={index * staggerDelay}
        >
          {child}
        </FloatingCard>
      ))}
    </View>
  );
};

// Layout animation utilities
export const animateLayoutChange = (
  type: 'spring' | 'linear' | 'easeInEaseOut' = 'spring',
  duration: number = 300
) => {
  LayoutAnimation.configureNext({
    duration,
    create: {
      type: LayoutAnimation.Types[type],
      property: LayoutAnimation.Properties.opacity,
    },
    update: {
      type: LayoutAnimation.Types[type],
      property: LayoutAnimation.Properties.opacity,
    },
    delete: {
      type: LayoutAnimation.Types[type],
      property: LayoutAnimation.Properties.opacity,
    },
  });
};

export const animateLayoutSpring = (
  tension: number = 100,
  friction: number = 8
) => {
  LayoutAnimation.configureNext({
    duration: 300,
    create: {
      type: LayoutAnimation.Types.spring,
      property: LayoutAnimation.Properties.scaleXY,
      spring: { tension, friction },
    },
    update: {
      type: LayoutAnimation.Types.spring,
      property: LayoutAnimation.Properties.scaleXY,
      spring: { tension, friction },
    },
  });
};

const styles = StyleSheet.create({
  animatedButton: {
    alignSelf: 'flex-start',
  },
  touchableArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCard: {
    alignSelf: 'flex-start',
  },
  rippleContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  rippleTouchable: {
    flex: 1,
  },
  ripple: {
    position: 'absolute',
    opacity: 0.6,
  },
  spinner: {
    borderWidth: 2,
    borderRadius: 9999,
  },
  progressContainer: {
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
});

export default {
  AnimationPresets,
  useScaleAnimation,
  useOpacityAnimation,
  useSlideAnimation,
  useRotationAnimation,
  usePulseAnimation,
  useShakeAnimation,
  AnimatedButton,
  FloatingCard,
  RippleEffect,
  LoadingSpinner,
  ProgressIndicator,
  StaggeredList,
  animateLayoutChange,
  animateLayoutSpring,
};
