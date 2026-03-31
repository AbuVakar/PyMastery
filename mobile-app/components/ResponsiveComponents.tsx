import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useResponsive } from '../utils/responsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
  margin?: boolean;
  maxWidth?: number;
  center?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  padding = true,
  margin = true,
  maxWidth,
  center = false,
}) => {
  const { container } = useResponsive();
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    ...(padding && { padding: container.padding }),
    ...(margin && { margin: container.margin }),
    ...(center && { alignItems: 'center', justifyContent: 'center' }),
    ...(maxWidth && { maxWidth }),
    ...style,
  };

  return (
    <View style={[containerStyle, { paddingTop: insets.top }]}>
      {children}
    </View>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number;
  spacing?: number;
  style?: ViewStyle;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns,
  spacing,
  style,
}) => {
  const { gridColumns, spacing: defaultSpacing } = useResponsive();
  const numColumns = columns || gridColumns;
  const itemSpacing = spacing || defaultSpacing.md;

  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -itemSpacing / 2,
    ...style,
  };

  return (
    <View style={gridStyle}>
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            width: `${100 / numColumns}%`,
            paddingHorizontal: itemSpacing / 2,
            marginBottom: itemSpacing,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

interface ResponsiveRowProps {
  children: React.ReactNode;
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  style?: ViewStyle;
}

export const ResponsiveRow: React.FC<ResponsiveRowProps> = ({
  children,
  spacing,
  align = 'center',
  justify = 'start',
  style,
}) => {
  const { spacing: defaultSpacing } = useResponsive();
  const rowSpacing = spacing || defaultSpacing.md;

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: align,
    justifyContent: justify,
    marginHorizontal: -rowSpacing / 2,
    ...style,
  };

  return (
    <View style={rowStyle}>
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            paddingHorizontal: rowSpacing / 2,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

interface ResponsiveColProps {
  children: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  style?: ViewStyle;
}

export const ResponsiveCol: React.FC<ResponsiveColProps> = ({
  children,
  xs,
  sm,
  md,
  lg,
  xl,
  style,
}) => {
  const { screenWidth, breakpoints } = useResponsive();

  // Determine column width based on breakpoints
  let colWidth = 12; // Default to full width

  if (xl && screenWidth >= breakpoints.largeTablet) {
    colWidth = xl;
  } else if (lg && screenWidth >= breakpoints.tablet) {
    colWidth = lg;
  } else if (md && screenWidth >= breakpoints.largePhone) {
    colWidth = md;
  } else if (sm && screenWidth >= breakpoints.phone) {
    colWidth = sm;
  } else if (xs && screenWidth >= breakpoints.smallPhone) {
    colWidth = xs;
  }

  const colStyle: ViewStyle = {
    flex: colWidth,
    ...style,
  };

  return (
    <View style={colStyle}>
      {children}
    </View>
  );
};

interface ResponsiveCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: boolean;
  padding?: number;
  margin?: number;
  borderRadius?: number;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  style,
  shadow = true,
  padding,
  margin,
  borderRadius,
}) => {
  const { spacing, deviceStyles } = useResponsive();
  const cardPadding = padding || spacing.md;
  const cardMargin = margin || spacing.md;
  const cardRadius = borderRadius || deviceStyles.borderRadius;

  const cardStyle: ViewStyle = {
    backgroundColor: 'white',
    borderRadius: cardRadius,
    padding: cardPadding,
    margin: cardMargin,
    ...(shadow && deviceStyles.shadow),
    ...style,
  };

  return <View style={cardStyle}>{children}</View>;
};

interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  style?: ViewStyle;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = 'column',
  spacing,
  align = 'center',
  justify = 'start',
  wrap = false,
  style,
}) => {
  const { spacing: defaultSpacing } = useResponsive();
  const stackSpacing = spacing || defaultSpacing.md;

  const stackStyle: ViewStyle = {
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    marginHorizontal: direction === 'row' ? -stackSpacing / 2 : 0,
    marginVertical: direction === 'column' ? -stackSpacing / 2 : 0,
    ...style,
  };

  return (
    <View style={stackStyle}>
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            marginHorizontal: direction === 'row' ? stackSpacing / 2 : 0,
            marginVertical: direction === 'column' ? stackSpacing / 2 : 0,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

interface ResponsiveTextProps {
  children: React.ReactNode;
  variant?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'huge';
  color?: string;
  weight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  numberOfLines?: number;
  style?: any;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  variant = 'md',
  color,
  weight = 'normal',
  align = 'auto',
  numberOfLines,
  style,
}) => {
  const { fontSize, deviceStyles } = useResponsive();

  const textStyle = {
    fontSize: fontSize[variant],
    fontFamily: deviceStyles.fontFamily,
    color: color || '#333',
    fontWeight: weight,
    textAlign: align,
    ...style,
  };

  return (
    <Text style={textStyle} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
};

interface ResponsiveIconProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  color?: string;
  style?: any;
}

export const ResponsiveIcon: React.FC<ResponsiveIconProps> = ({
  name,
  size = 'md',
  color,
  style,
}) => {
  const { iconSize } = useResponsive();

  return (
    <Ionicons
      name={name as any}
      size={iconSize[size]}
      color={color || '#666'}
      style={style}
    />
  );
};

interface ResponsiveButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: any;
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onPress,
  style,
  textStyle,
}) => {
  const { spacing, fontSize, deviceStyles } = useResponsive();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = {
      borderRadius: deviceStyles.borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: '#007AFF',
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: '#4CAF50',
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#007AFF',
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
        };
      default:
        return baseStyle;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
        };
      case 'lg':
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        };
      default:
        return {};
    }
  };

  const getButtonTextStyle = () => {
    const baseTextStyle = {
      fontSize: size === 'lg' ? fontSize.lg : fontSize.md,
      fontFamily: deviceStyles.fontFamily,
      fontWeight: '600',
    };

    switch (variant) {
      case 'primary':
        return { ...baseTextStyle, color: 'white' };
      case 'secondary':
        return { ...baseTextStyle, color: 'white' };
      case 'outline':
        return { ...baseTextStyle, color: '#007AFF' };
      case 'ghost':
        return { ...baseTextStyle, color: '#007AFF' };
      default:
        return baseTextStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        getSizeStyle(),
        disabled && { opacity: 0.5 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <ResponsiveText style={[getButtonTextStyle(), textStyle]}>
        {children}
      </ResponsiveText>
    </TouchableOpacity>
  );
};

// Export all responsive components
export {
  ResponsiveContainer as Container,
  ResponsiveGrid as Grid,
  ResponsiveRow as Row,
  ResponsiveCol as Col,
  ResponsiveCard as Card,
  ResponsiveStack as Stack,
  ResponsiveText as Text,
  ResponsiveIcon as Icon,
  ResponsiveButton as Button,
};
