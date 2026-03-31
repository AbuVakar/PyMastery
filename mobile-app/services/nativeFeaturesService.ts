import * as Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import * as Sensors from 'expo-sensors';

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | boolean;
  priority?: Notifications.AndroidNotificationPriority;
}

export interface CameraCapture {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

export interface DeviceInfo {
  brand: string;
  model: string;
  osVersion: string;
  isDevice: boolean;
  platform: string;
}

class NativeFeaturesService {
  private static instance: NativeFeaturesService;
  private cameraPermission: Camera.PermissionStatus | null = null;
  private locationPermission: Location.PermissionStatus | null = null;
  private notificationPermission: Notifications.PermissionStatus | null = null;
  private cameraRef: Camera.Camera | null = null;

  static getInstance(): NativeFeaturesService {
    if (!NativeFeaturesService.instance) {
      NativeFeaturesService.instance = new NativeFeaturesService();
    }
    return NativeFeaturesService.instance;
  }

  // Camera Features
  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      this.cameraPermission = status;
      return status === Camera.PermissionStatus.GRANTED;
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  }

  async takePicture(): Promise<CameraCapture | null> {
    try {
      if (this.cameraPermission !== Camera.PermissionStatus.GRANTED) {
        const granted = await this.requestCameraPermission();
        if (!granted) return null;
      }

      if (!this.cameraRef) {
        throw new Error('Camera not initialized');
      }

      const photo = await this.cameraRef.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
      });

      return {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        base64: photo.base64,
      };
    } catch (error) {
      console.error('Take picture error:', error);
      return null;
    }
  }

  async pickImageFromGallery(): Promise<CameraCapture | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          base64: asset.base64,
        };
      }

      return null;
    } catch (error) {
      console.error('Pick image error:', error);
      return null;
    }
  }

  async saveImageToStorage(uri: string, filename: string): Promise<string | null> {
    try {
      const documentDirectory = FileSystem.documentDirectory;
      if (!documentDirectory) return null;

      const fileUri = `${documentDirectory}${filename}`;
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri,
      });

      return fileUri;
    } catch (error) {
      console.error('Save image error:', error);
      return null;
    }
  }

  // Location Features
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.locationPermission = status;
      return status === Location.PermissionStatus.GRANTED;
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      if (this.locationPermission !== Location.PermissionStatus.GRANTED) {
        const granted = await this.requestLocationPermission();
        if (!granted) return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  }

  async watchLocation(callback: (location: LocationData) => void): Promise<Location.LocationSubscription | null> {
    try {
      if (this.locationPermission !== Location.PermissionStatus.GRANTED) {
        const granted = await this.requestLocationPermission();
        if (!granted) return null;
      }

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: location.timestamp,
          });
        }
      );
    } catch (error) {
      console.error('Watch location error:', error);
      return null;
    }
  }

  // Notification Features
  async requestNotificationPermission(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      this.notificationPermission = status;
      return status === Notifications.PermissionStatus.GRANTED;
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }

  async scheduleNotification(notification: NotificationData, trigger?: Notifications.NotificationTriggerInput): Promise<string | null> {
    try {
      if (this.notificationPermission !== Notifications.PermissionStatus.GRANTED) {
        const granted = await this.requestNotificationPermission();
        if (!granted) return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: notification.sound || 'default',
        },
        trigger: trigger || null,
      });

      return notificationId;
    } catch (error) {
      console.error('Schedule notification error:', error);
      return null;
    }
  }

  async sendImmediateNotification(notification: NotificationData): Promise<boolean> {
    try {
      if (this.notificationPermission !== Notifications.PermissionStatus.GRANTED) {
        const granted = await this.requestNotificationPermission();
        if (!granted) return false;
      }

      await Notifications.presentNotificationAsync({
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: notification.sound || 'default',
      });

      return true;
    } catch (error) {
      console.error('Send notification error:', error);
      return false;
    }
  }

  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (error) {
      console.error('Cancel notification error:', error);
      return false;
    }
  }

  // Biometric Authentication
  async authenticateWithBiometrics(reason: string): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  async isBiometricAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('Check biometric availability error:', error);
      return false;
    }
  }

  // Haptic Feedback
  async triggerHaptic(type: 'notification' | 'warning' | 'error' | 'success'): Promise<void> {
    try {
      switch (type) {
        case 'notification':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }

  async triggerImpact(type: 'light' | 'medium' | 'heavy'): Promise<void> {
    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      console.error('Impact haptic error:', error);
    }
  }

  // Device Information
  getDeviceInfo(): DeviceInfo {
    return {
      brand: Device.brand || 'Unknown',
      model: Device.modelName || 'Unknown',
      osVersion: Device.osVersion || 'Unknown',
      isDevice: Device.isDevice,
      platform: Device.platform || 'Unknown',
    };
  }

  // Sensor Features
  startAccelerometer(callback: (data: Sensors.AccelerometerMeasurement) => void): void {
    Sensors.Accelerometer.setUpdateInterval(100);
    const subscription = Sensors.Accelerometer.subscribe(callback);
  }

  startGyroscope(callback: (data: Sensors.GyroscopeMeasurement) => void): void {
    Sensors.Gyroscope.setUpdateInterval(100);
    const subscription = Sensors.Gyroscope.subscribe(callback);
  }

  startMagnetometer(callback: (data: Sensors.MagnetometerMeasurement) => void): void {
    Sensors.Magnetometer.setUpdateInterval(100);
    const subscription = Sensors.Magnetometer.subscribe(callback);
  }

  // Camera Reference Management
  setCameraRef(camera: Camera.Camera): void {
    this.cameraRef = camera;
  }

  clearCameraRef(): void {
    this.cameraRef = null;
  }

  // Permission Status
  getPermissionStatus(): {
    camera: Camera.PermissionStatus | null;
    location: Location.PermissionStatus | null;
    notifications: Notifications.PermissionStatus | null;
  } {
    return {
      camera: this.cameraPermission,
      location: this.locationPermission,
      notifications: this.notificationPermission,
    };
  }

  // Utility Methods
  async checkAllPermissions(): Promise<{
    camera: boolean;
    location: boolean;
    notifications: boolean;
    biometrics: boolean;
  }> {
    const cameraGranted = this.cameraPermission === Camera.PermissionStatus.GRANTED || 
                           (await this.requestCameraPermission());
    
    const locationGranted = this.locationPermission === Location.PermissionStatus.GRANTED || 
                           (await this.requestLocationPermission());
    
    const notificationGranted = this.notificationPermission === Notifications.PermissionStatus.GRANTED || 
                               (await this.requestNotificationPermission());
    
    const biometricAvailable = await this.isBiometricAvailable();

    return {
      camera: cameraGranted,
      location: locationGranted,
      notifications: notificationGranted,
      biometrics: biometricAvailable,
    };
  }

  // Cleanup
  cleanup(): void {
    this.clearCameraRef();
    // Stop any active subscriptions if needed
  }
}

export default NativeFeaturesService;
