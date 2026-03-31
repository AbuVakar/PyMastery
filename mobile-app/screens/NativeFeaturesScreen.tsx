import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import NativeFeaturesService from '../services/nativeFeaturesService';

const NativeFeaturesScreen: React.FC = () => {
  const [permissions, setPermissions] = useState({
    camera: false,
    location: false,
    notifications: false,
    biometrics: false,
  });
  const [location, setLocation] = useState<any>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [cameraRef, setCameraRef] = useState<Camera | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const nativeService = NativeFeaturesService.getInstance();

  useEffect(() => {
    loadPermissions();
    loadDeviceInfo();
  }, []);

  const loadPermissions = async () => {
    try {
      const perms = await nativeService.checkAllPermissions();
      setPermissions(perms);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const loadDeviceInfo = async () => {
    try {
      const info = nativeService.getDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error('Failed to load device info:', error);
    }
  };

  const handleCameraPermission = async () => {
    try {
      const granted = await nativeService.requestCameraPermission();
      setPermissions(prev => ({ ...prev, camera: granted }));
      if (!granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to use camera features.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request camera permission');
    }
  };

  const handleTakePicture = async () => {
    try {
      if (!cameraRef) {
        Alert.alert('Error', 'Camera not ready');
        return;
      }

      const result = await nativeService.takePicture();
      if (result) {
        setPhoto(result.uri);
        await nativeService.triggerHaptic('success');
        Alert.alert('Success', 'Photo captured successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await nativeService.pickImageFromGallery();
      if (result) {
        setPhoto(result.uri);
        await nativeService.triggerHaptic('success');
        Alert.alert('Success', 'Image selected successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleLocationPermission = async () => {
    try {
      const granted = await nativeService.requestLocationPermission();
      setPermissions(prev => ({ ...prev, location: granted }));
      if (!granted) {
        Alert.alert('Permission Required', 'Location permission is needed to use location features.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request location permission');
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      const currentLocation = await nativeService.getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
        await nativeService.triggerHaptic('success');
        Alert.alert('Location Found', `Lat: ${currentLocation.latitude.toFixed(6)}, Lng: ${currentLocation.longitude.toFixed(6)}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const handleNotificationPermission = async () => {
    try {
      const granted = await nativeService.requestNotificationPermission();
      setPermissions(prev => ({ ...prev, notifications: granted }));
      if (!granted) {
        Alert.alert('Permission Required', 'Notification permission is needed to send notifications.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request notification permission');
    }
  };

  const handleTestNotification = async () => {
    try {
      await nativeService.sendImmediateNotification({
        title: 'Test Notification',
        body: 'This is a test notification from PyMastery!',
        data: { type: 'test' },
      });
      await nativeService.triggerHaptic('notification');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const available = await nativeService.isBiometricAvailable();
      if (!available) {
        Alert.alert('Not Available', 'Biometric authentication is not available on this device');
        return;
      }

      const success = await nativeService.authenticateWithBiometrics('Authenticate to access PyMastery');
      if (success) {
        await nativeService.triggerHaptic('success');
        Alert.alert('Success', 'Biometric authentication successful!');
      } else {
        await nativeService.triggerHaptic('error');
        Alert.alert('Failed', 'Biometric authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to authenticate with biometrics');
    }
  };

  const handleHapticTest = async (type: 'light' | 'medium' | 'heavy') => {
    try {
      await nativeService.triggerImpact(type);
    } catch (error) {
      console.error('Haptic test failed:', error);
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  const FeatureCard = ({ title, description, icon, status, onPress, children }: any) => (
    <View style={styles.featureCard}>
      <View style={styles.featureHeader}>
        <View style={styles.featureInfo}>
          <Ionicons name={icon} size={24} color="#007AFF" />
          <Text style={styles.featureTitle}>{title}</Text>
        </View>
        <View style={styles.featureStatus}>
          <Text style={[styles.statusText, status ? styles.statusActive : styles.statusInactive]}>
            {status ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
      </View>
      <Text style={styles.featureDescription}>{description}</Text>
      <View style={styles.featureActions}>
        {children}
        <TouchableOpacity style={styles.featureButton} onPress={onPress}>
          <Text style={styles.featureButtonText}>Test</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Native Features</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={handleOpenSettings}>
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Device Information */}
        {deviceInfo && (
          <View style={styles.deviceInfoCard}>
            <Text style={styles.deviceInfoTitle}>Device Information</Text>
            <View style={styles.deviceInfoGrid}>
              <View style={styles.deviceInfoItem}>
                <Text style={styles.deviceInfoLabel}>Brand</Text>
                <Text style={styles.deviceInfoValue}>{deviceInfo.brand}</Text>
              </View>
              <View style={styles.deviceInfoItem}>
                <Text style={styles.deviceInfoLabel}>Model</Text>
                <Text style={styles.deviceInfoValue}>{deviceInfo.model}</Text>
              </View>
              <View style={styles.deviceInfoItem}>
                <Text style={styles.deviceInfoLabel}>OS Version</Text>
                <Text style={styles.deviceInfoValue}>{deviceInfo.osVersion}</Text>
              </View>
              <View style={styles.deviceInfoItem}>
                <Text style={styles.deviceInfoLabel}>Platform</Text>
                <Text style={styles.deviceInfoValue}>{deviceInfo.platform}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Camera Features */}
        <FeatureCard
          title="Camera"
          description="Access device camera for photo capture and image selection"
          icon="camera-outline"
          status={permissions.camera}
          onPress={handleCameraPermission}
        >
          <Switch
            value={permissions.camera}
            onValueChange={handleCameraPermission}
            trackColor={{ false: '#ccc', true: '#007AFF' }}
          />
        </FeatureCard>

        {permissions.camera && (
          <View style={styles.cameraContainer}>
            {photo ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.clearPhotoButton}
                  onPress={() => setPhoto(null)}
                >
                  <Text style={styles.clearPhotoText}>Clear Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cameraView}>
                <Camera
                  style={styles.camera}
                  type={Camera.Constants.Type.back}
                  flashMode={isFlashOn ? Camera.Constants.FlashMode.on : Camera.Constants.FlashMode.off}
                  onCameraReady={() => setIsCameraReady(true)}
                  ref={(ref) => {
                    setCameraRef(ref);
                    nativeService.setCameraRef(ref!);
                  }}
                />
                <View style={styles.cameraControls}>
                  <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={() => setIsFlashOn(!isFlashOn)}
                  >
                    <Ionicons
                      name={isFlashOn ? 'flash' : 'flash-off'}
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cameraButton, styles.captureButton]}
                    onPress={handleTakePicture}
                    disabled={!isCameraReady}
                  >
                    <Ionicons name="camera" size={32} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={handlePickImage}
                  >
                    <Ionicons name="image-outline" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Location Features */}
        <FeatureCard
          title="Location"
          description="Access device location for location-based features"
          icon="location-outline"
          status={permissions.location}
          onPress={handleLocationPermission}
        >
          <Switch
            value={permissions.location}
            onValueChange={handleLocationPermission}
            trackColor={{ false: '#ccc', true: '#007AFF' }}
          />
        </FeatureCard>

        {permissions.location && (
          <View style={styles.locationContainer}>
            <TouchableOpacity style={styles.locationButton} onPress={handleGetCurrentLocation}>
              <Ionicons name="locate-outline" size={24} color="#007AFF" />
              <Text style={styles.locationButtonText}>Get Current Location</Text>
            </TouchableOpacity>
            {location && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  Latitude: {location.latitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Longitude: {location.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Accuracy: {location.accuracy?.toFixed(2)}m
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Notification Features */}
        <FeatureCard
          title="Notifications"
          description="Send push notifications for important updates"
          icon="notifications-outline"
          status={permissions.notifications}
          onPress={handleNotificationPermission}
        >
          <Switch
            value={permissions.notifications}
            onValueChange={handleNotificationPermission}
            trackColor={{ false: '#ccc', true: '#007AFF' }}
          />
        </FeatureCard>

        {permissions.notifications && (
          <View style={styles.notificationContainer}>
            <TouchableOpacity style={styles.notificationButton} onPress={handleTestNotification}>
              <Ionicons name="notifications-outline" size={24} color="#007AFF" />
              <Text style={styles.notificationButtonText}>Test Notification</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Biometric Authentication */}
        <FeatureCard
          title="Biometric Authentication"
          description="Use fingerprint or face recognition for secure authentication"
          icon="finger-print-outline"
          status={permissions.biometrics}
          onPress={handleBiometricAuth}
        >
          <View style={styles.biometricStatus}>
            <Text style={styles.biometricText}>
              {permissions.biometrics ? 'Available' : 'Not Available'}
            </Text>
          </View>
        </FeatureCard>

        {/* Haptic Feedback */}
        <View style={styles.hapticContainer}>
          <Text style={styles.hapticTitle}>Haptic Feedback</Text>
          <Text style={styles.hapticDescription}>Test different types of haptic feedback</Text>
          <View style={styles.hapticButtons}>
            <TouchableOpacity
              style={styles.hapticButton}
              onPress={() => handleHapticTest('light')}
            >
              <Text style={styles.hapticButtonText}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.hapticButton}
              onPress={() => handleHapticTest('medium')}
            >
              <Text style={styles.hapticButtonText}>Medium</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.hapticButton}
              onPress={() => handleHapticTest('heavy')}
            >
              <Text style={styles.hapticButtonText}>Heavy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  deviceInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deviceInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  deviceInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  deviceInfoItem: {
    width: '48%',
    marginBottom: 10,
  },
  deviceInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  deviceInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  featureStatus: {},
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#e8f5e8',
    color: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#ffebee',
    color: '#F44336',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  featureActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  featureButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  cameraContainer: {
    marginBottom: 20,
  },
  cameraView: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
  },
  photoPreview: {
    alignItems: 'center',
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  clearPhotoButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearPhotoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  locationContainer: {
    marginBottom: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  locationInfo: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  notificationContainer: {
    marginBottom: 20,
  },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
  },
  notificationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  biometricStatus: {
    alignItems: 'center',
  },
  biometricText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  hapticContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hapticTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  hapticDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  hapticButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hapticButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  hapticButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NativeFeaturesScreen;
