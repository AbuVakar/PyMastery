import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useResponsive } from '../utils/responsive';
import { useCrossPlatform } from '../utils/crossPlatform';
import { Container, Grid, Card, Row, Col } from '../components/ResponsiveComponents';

// Mock Platform
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
}));

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock SafeAreaContext
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  })),
}));

describe('Cross-Platform Capabilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Responsive Utilities', () => {
    test('should detect tablet devices correctly', () => {
      // Mock tablet dimensions
      require('react-native/Libraries/Utilities/Dimensions').get.mockReturnValue({
        width: 768,
        height: 1024,
      });

      const TestComponent = () => {
        const { isTablet, isPhone } = useResponsive();
        return (
          <Container>
            <Text testID="device-type">
              {isTablet() ? 'tablet' : isPhone() ? 'phone' : 'unknown'}
            </Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('device-type').props.children).toBe('tablet');
    });

    test('should detect phone devices correctly', () => {
      // Mock phone dimensions
      require('react-native/Libraries/Utilities/Dimensions').get.mockReturnValue({
        width: 375,
        height: 812,
      });

      const TestComponent = () => {
        const { isTablet, isPhone } = useResponsive();
        return (
          <Container>
            <Text testID="device-type">
              {isTablet() ? 'tablet' : isPhone() ? 'phone' : 'unknown'}
            </Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('device-type').props.children).toBe('phone');
    });

    test('should scale fonts appropriately for different screen sizes', () => {
      const TestComponent = () => {
        const { fontSize } = useResponsive();
        return (
          <Container>
            <Text testID="font-size">{fontSize.md}</Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      const fontSize = getByTestId('font-size').props.style.fontSize;
      expect(fontSize).toBeGreaterThan(0);
    });
  });

  describe('Cross-Platform Configuration', () => {
    test('should provide correct platform configuration', () => {
      const TestComponent = () => {
        const { platform, config } = useCrossPlatform();
        return (
          <Container>
            <Text testID="platform">{platform}</Text>
            <Text testID="config">{JSON.stringify(config)}</Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('platform').props.children).toBe('ios');
      expect(getByTestId('config').props.children).toBeDefined();
    });

    test('should provide device-specific configuration', () => {
      // Mock tablet dimensions
      require('react-native/Libraries/Utilities/Dimensions').get.mockReturnValue({
        width: 768,
        height: 1024,
      });

      const TestComponent = () => {
        const { deviceType, config } = useCrossPlatform();
        return (
          <Container>
            <Text testID="device-type">{deviceType}</Text>
            <Text testID="device-config">{JSON.stringify(config.device)}</Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('device-type').props.children).toBe('tablet');
      expect(getByTestId('device-config').props.children).toBeDefined();
    });
  });

  describe('Responsive Components', () => {
    test('Container should adapt to different screen sizes', () => {
      const TestComponent = () => {
        return (
          <Container>
            <Text testID="container-content">Test Content</Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('container-content')).toBeTruthy();
    });

    test('Grid should render correctly with different column counts', () => {
      const TestComponent = () => {
        return (
          <Grid columns={2}>
            <Card testID="card-1">
              <Text>Card 1</Text>
            </Card>
            <Card testID="card-2">
              <Text>Card 2</Text>
            </Card>
          </Grid>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('card-1')).toBeTruthy();
      expect(getByTestId('card-2')).toBeTruthy();
    });

    test('Row and Col should work together', () => {
      const TestComponent = () => {
        return (
          <Row>
            <Col xs={6}>
              <Card testID="col-1">
                <Text>Column 1</Text>
              </Card>
            </Col>
            <Col xs={6}>
              <Card testID="col-2">
                <Text>Column 2</Text>
              </Card>
            </Col>
          </Row>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('col-1')).toBeTruthy();
      expect(getByTestId('col-2')).toBeTruthy();
    });
  });

  describe('iOS Specific Features', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    test('should use iOS-specific styling', () => {
      const TestComponent = () => {
        const { config } = useCrossPlatform();
        return (
          <Container>
            <Card testID="ios-card" style={config.component.card}>
              <Text>iOS Card</Text>
            </Card>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      const card = getByTestId('ios-card');
      expect(card.props.style).toBeDefined();
    });

    test('should handle iOS-specific permissions', async () => {
      // Mock iOS permissions
      const mockRequestPermission = jest.fn();
      jest.doMock('expo-camera', () => ({
        requestCameraPermissionsAsync: mockRequestPermission,
      }));

      const TestComponent = () => {
        const [permission, setPermission] = React.useState(null);
        
        React.useEffect(() => {
          const requestPermission = async () => {
            const result = await mockRequestPermission();
            setPermission(result.status);
          };
          requestPermission();
        }, []);

        return (
          <Container>
            <Text testID="permission">{permission}</Text>
          </Container>
        );
      };

      mockRequestPermission.mockResolvedValue({ status: 'granted' });
      
      const { getByTestId } = render(<TestComponent />);
      await waitFor(() => {
        expect(getByTestId('permission').props.children).toBe('granted');
      });
    });
  });

  describe('Android Specific Features', () => {
    beforeEach(() => {
      Platform.OS = 'android';
      Platform.select = jest.fn((obj) => obj.android);
    });

    test('should use Android-specific styling', () => {
      const TestComponent = () => {
        const { config } = useCrossPlatform();
        return (
          <Container>
            <Card testID="android-card" style={config.component.card}>
              <Text>Android Card</Text>
            </Card>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      const card = getByTestId('android-card');
      expect(card.props.style).toBeDefined();
    });

    test('should handle Android-specific permissions', async () => {
      // Mock Android permissions
      const mockRequestPermission = jest.fn();
      jest.doMock('expo-camera', () => ({
        requestCameraPermissionsAsync: mockRequestPermission,
      }));

      const TestComponent = () => {
        const [permission, setPermission] = React.useState(null);
        
        React.useEffect(() => {
          const requestPermission = async () => {
            const result = await mockRequestPermission();
            setPermission(result.status);
          };
          requestPermission();
        }, []);

        return (
          <Container>
            <Text testID="permission">{permission}</Text>
          </Container>
        );
      };

      mockRequestPermission.mockResolvedValue({ status: 'granted' });
      
      const { getByTestId } = render(<TestComponent />);
      await waitFor(() => {
        expect(getByTestId('permission').props.children).toBe('granted');
      });
    });
  });

  describe('Web Specific Features', () => {
    beforeEach(() => {
      Platform.OS = 'web';
      Platform.select = jest.fn((obj) => obj.web);
    });

    test('should use web-specific styling', () => {
      const TestComponent = () => {
        const { config } = useCrossPlatform();
        return (
          <Container>
            <Card testID="web-card" style={config.component.card}>
              <Text>Web Card</Text>
            </Card>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      const card = getByTestId('web-card');
      expect(card.props.style).toBeDefined();
    });

    test('should handle web-specific features', () => {
      const TestComponent = () => {
        const { config } = useCrossPlatform();
        return (
          <Container>
            <Text testID="web-features">
              {JSON.stringify(config.performance)}
            </Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      const features = getByTestId('web-features').props.children;
      expect(features).toContain('web');
    });
  });

  describe('Orientation Handling', () => {
    test('should detect portrait orientation', () => {
      // Mock portrait dimensions
      require('react-native/Libraries/Utilities/Dimensions').get.mockReturnValue({
        width: 375,
        height: 812,
      });

      const TestComponent = () => {
        const { orientation } = useCrossPlatform();
        return (
          <Container>
            <Text testID="orientation">{orientation}</Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('orientation').props.children).toBe('portrait');
    });

    test('should detect landscape orientation', () => {
      // Mock landscape dimensions
      require('react-native/Libraries/Utilities/Dimensions').get.mockReturnValue({
        width: 812,
        height: 375,
      });

      const TestComponent = () => {
        const { orientation } = useCrossPlatform();
        return (
          <Container>
            <Text testID="orientation">{orientation}</Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('orientation').props.children).toBe('landscape');
    });
  });

  describe('Performance Optimizations', () => {
    test('should use platform-specific animation durations', () => {
      const TestComponent = () => {
        const { config } = useCrossPlatform();
        return (
          <Container>
            <Text testID="animation-duration">
              {config.performance.animationDuration}
            </Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      const duration = getByTestId('animation-duration').props.children;
      expect(duration).toBeGreaterThan(0);
    });

    test('should enable hardware acceleration on supported platforms', () => {
      const TestComponent = () => {
        const { config } = useCrossPlatform();
        return (
          <Container>
            <Text testID="hardware-acceleration">
              {config.performance.enableHardwareAcceleration ? 'enabled' : 'disabled'}
            </Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      const hardwareAcceleration = getByTestId('hardware-acceleration').props.children;
      expect(hardwareAcceleration).toBe('enabled');
    });
  });

  describe('Accessibility Features', () => {
    test('should enable platform-specific accessibility features', () => {
      const TestComponent = () => {
        const { config } = useCrossPlatform();
        return (
          <Container>
            <Text testID="accessibility">
              {JSON.stringify(config.accessibility)}
            </Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      const accessibility = getByTestId('accessibility').props.children;
      expect(accessibility).toBeDefined();
    });

    test('should support screen readers', () => {
      const TestComponent = () => {
        const { config } = useCrossPlatform();
        return (
          <Container>
            <Text testID="screen-reader">
              {config.accessibility.enableVoiceOver || config.accessibility.enableScreenReader ? 'enabled' : 'disabled'}
            </Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      const screenReader = getByTestId('screen-reader').props.children;
      expect(screenReader).toBe('enabled');
    });
  });
});

// Integration tests
describe('Cross-Platform Integration', () => {
  test('should work seamlessly across all platforms', () => {
    const platforms = ['ios', 'android', 'web'];
    
    platforms.forEach(platform => {
      Platform.OS = platform;
      Platform.select = jest.fn((obj) => obj[platform]);
      
      const TestComponent = () => {
        const { platform: currentPlatform, config } = useCrossPlatform();
        return (
          <Container>
            <Text testID="platform">{currentPlatform}</Text>
            <Text testID="config">{JSON.stringify(config)}</Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId('platform').props.children).toBe(platform);
      expect(getByTestId('config').props.children).toBeDefined();
    });
  });

  test('should handle responsive design across different screen sizes', () => {
    const screenSizes = [
      { width: 320, height: 568 },  // iPhone SE
      { width: 375, height: 812 },  // iPhone 11 Pro
      { width: 414, height: 896 },  // iPhone 11 Pro Max
      { width: 768, height: 1024 }, // iPad
      { width: 1024, height: 1366 }, // iPad Pro
    ];

    screenSizes.forEach(size => {
      require('react-native/Libraries/Utilities/Dimensions').get.mockReturnValue(size);
      
      const TestComponent = () => {
        const { isTablet, isPhone, fontSize } = useResponsive();
        return (
          <Container>
            <Text testID="device-type">
              {isTablet() ? 'tablet' : isPhone() ? 'phone' : 'unknown'}
            </Text>
            <Text testID="font-size">{fontSize.md}</Text>
          </Container>
        );
      };

      const { getByTestId } = render(<TestComponent />);
      const deviceType = getByTestId('device-type').props.children;
      const fontSize = getByTestId('font-size').props.style.fontSize;
      
      expect(['tablet', 'phone']).toContain(deviceType);
      expect(fontSize).toBeGreaterThan(0);
    });
  });
});
