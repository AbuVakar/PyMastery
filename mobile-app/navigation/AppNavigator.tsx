import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

// Import Screens
import HomeScreen from '../screens/HomeScreen';
import CoursesScreen from '../screens/CoursesScreen';
import ProblemsScreen from '../screens/ProblemsScreen';
import AIChatScreen from '../screens/AIChatScreen';
import StudyGroupsScreen from '../screens/StudyGroupsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import NativeFeaturesScreen from '../screens/NativeFeaturesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import ProblemDetailScreen from '../screens/ProblemDetailScreen';
import CodeEditorScreen from '../screens/CodeEditorScreen';
import AdvancedAIMentorScreen from '../screens/AdvancedAIMentorScreen';
import AILearningAnalyticsScreen from '../screens/AILearningAnalyticsScreen';
import AIRecommendationsScreen from '../screens/AIRecommendationsScreen';
import InteractiveAITutorScreen from '../screens/InteractiveAITutorScreen';
import CodeExplanationAIScreen from '../screens/CodeExplanationAIScreen';
import AdvancedLearningAnalyticsScreen from '../screens/AdvancedLearningAnalyticsScreen';
import AdvancedLanguageSupportScreen from '../screens/AdvancedLanguageSupportScreen';
import RealTimeCollaborationScreen from '../screens/RealTimeCollaborationScreen';
import CodeSharingScreen from '../screens/CodeSharingScreen';
import AdvancedDebuggingScreen from '../screens/AdvancedDebuggingScreen';
import CodePlaygroundScreen from '../screens/CodePlaygroundScreen';
import LiveCodingSessionScreen from '../screens/LiveCodingSessionScreen';
import MultiUserSupportScreen from '../screens/MultiUserSupportScreen';
import LiveChatScreen from '../screens/LiveChatScreen';
import ScreenSharingScreen from '../screens/ScreenSharingScreen';

// Import Auth Context
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Main App Tabs
const AppTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Courses') {
          iconName = focused ? 'book' : 'book-outline';
        } else if (route.name === 'Problems') {
          iconName = focused ? 'code' : 'code-outline';
        } else if (route.name === 'AI') {
          iconName = focused ? 'chatbox' : 'chatbox-outline';
        } else if (route.name === 'Social') {
          iconName = focused ? 'people' : 'people-outline';
        } else if (route.name === 'Analytics') {
          iconName = focused ? 'analytics' : 'analytics-outline';
        } else if (route.name === 'Native') {
          iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
        } else if (route.name === 'Code') {
          iconName = focused ? 'code-slash' : 'code-slash-outline';
        } else if (route.name === 'RealTime') {
          iconName = focused ? 'wifi' : 'wifi-outline';
        } else if (route.name === 'Chat') {
          iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        } else if (route.name === 'ScreenShare') {
          iconName = focused ? 'videocam' : 'videocam-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else {
          iconName = 'help-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
      headerShown: true,
      headerStyle: {
        backgroundColor: '#007AFF',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'PyMastery' }} />
    <Tab.Screen name="Courses" component={CoursesScreen} options={{ title: 'Courses' }} />
    <Tab.Screen name="Problems" component={ProblemsScreen} options={{ title: 'Problems' }} />
    <Tab.Screen name="AI" component={AIChatScreen} options={{ title: 'AI Mentor' }} />
    <Tab.Screen name="Social" component={StudyGroupsScreen} options={{ title: 'Social' }} />
    <Tab.Screen name="Analytics" component={AILearningAnalyticsScreen} options={{ title: 'AI Analytics' }} />
    <Tab.Screen name="Native" component={NativeFeaturesScreen} options={{ title: 'Native' }} />
    <Tab.Screen name="Code" component={AdvancedLanguageSupportScreen} options={{ title: 'Code' }} />
    <Tab.Screen name="RealTime" component={LiveCodingSessionScreen} options={{ title: 'Real-Time' }} />
    <Tab.Screen name="Chat" component={LiveChatScreen} options={{ title: 'Chat' }} />
    <Tab.Screen name="ScreenShare" component={ScreenSharingScreen} options={{ title: 'Screen Share' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);

// Main Stack Navigation
const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AppTabs" component={AppTabs} options={{ headerShown: false }} />
    <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: 'Course Details' }} />
    <Stack.Screen name="ProblemDetail" component={ProblemDetailScreen} options={{ title: 'Problem Details' }} />
    <Stack.Screen name="CodeEditor" component={CodeEditorScreen} options={{ title: 'Code Editor' }} />
    <Stack.Screen name="AdvancedAIMentor" component={AdvancedAIMentorScreen} options={{ title: 'AI Mentor Pro' }} />
    <Stack.Screen name="AIRecommendations" component={AIRecommendationsScreen} options={{ title: 'AI Recommendations' }} />
    <Stack.Screen name="InteractiveAITutor" component={InteractiveAITutorScreen} options={{ title: 'AI Tutor' }} />
    <Stack.Screen name="CodeExplanationAI" component={CodeExplanationAIScreen} options={{ title: 'Code Explanation AI' }} />
    <Stack.Screen name="AdvancedLearningAnalytics" component={AdvancedLearningAnalyticsScreen} options={{ title: 'Learning Analytics' }} />
    <Stack.Screen name="AdvancedLanguageSupport" component={AdvancedLanguageSupportScreen} options={{ title: 'Advanced Language Support' }} />
    <Stack.Screen name="RealTimeCollaboration" component={RealTimeCollaborationScreen} options={{ title: 'Real-time Collaboration' }} />
    <Stack.Screen name="CodeSharing" component={CodeSharingScreen} options={{ title: 'Code Sharing' }} />
    <Stack.Screen name="AdvancedDebugging" component={AdvancedDebuggingScreen} options={{ title: 'Advanced Debugging' }} />
    <Stack.Screen name="CodePlayground" component={CodePlaygroundScreen} options={{ title: 'Code Playground' }} />
    <Stack.Screen name="LiveCodingSession" component={LiveCodingSessionScreen} options={{ title: 'Live Coding Session' }} />
    <Stack.Screen name="MultiUserSupport" component={MultiUserSupportScreen} options={{ title: 'Multi-User Support' }} />
    <Stack.Screen name="LiveChat" component={LiveChatScreen} options={{ title: 'Live Chat' }} />
    <Stack.Screen name="ScreenSharing" component={ScreenSharingScreen} options={{ title: 'Screen Sharing' }} />
  </Stack.Navigator>
);

// Root Navigator
const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You can return a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
};

export default App;
