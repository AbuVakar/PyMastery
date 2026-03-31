import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  level: number;
  login_streak: number;
  created_at: string;
  profile: {
    bio?: string;
    avatar_url?: string;
    github_username?: string;
    linkedin_url?: string;
    location?: string;
    website?: string;
  };
  stats: {
    courses_completed: number;
    courses_enrolled: number;
    problems_solved: number;
    problems_attempted: number;
    total_submissions: number;
    success_rate: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earned_at: string;
  }>;
  certificates: Array<{
    id: string;
    course_title: string;
    completion_date: string;
    certificate_url: string;
  }>;
}

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/users/profile');
      if (response.data.success) {
        setProfile(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const getLevelColor = (level: number) => {
    if (level <= 10) return '#4CAF50';
    if (level <= 25) return '#FF9800';
    if (level <= 50) return '#F44336';
    return '#9C27B0';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#F44336';
      case 'instructor':
        return '#FF9800';
      case 'student':
        return '#007AFF';
      default:
        return '#666';
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              {profile.profile.avatar_url ? (
                <Image source={{ uri: profile.profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: getRoleColor(profile.role) }]}>
                  <Text style={styles.avatarText}>
                    {profile.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile.name}</Text>
              <Text style={styles.userEmail}>{profile.email}</Text>
              <View style={styles.userBadges}>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(profile.role) }]}>
                  <Text style={styles.roleText}>{profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</Text>
                </View>
                <View style={[styles.levelBadge, { backgroundColor: getLevelColor(profile.level) }]}>
                  <Text style={styles.levelText}>Level {profile.level}</Text>
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="star-outline" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{profile.points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame-outline" size={24} color="#FF6B6B" />
            <Text style={styles.statValue}>{profile.login_streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy-outline" size={24} color="#4ECDC4" />
            <Text style={styles.statValue}>{profile.stats.problems_solved}</Text>
            <Text style={styles.statLabel}>Problems</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="book-outline" size={24} color="#45B7D1" />
            <Text style={styles.statValue}>{profile.stats.courses_completed}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
        </View>

        {/* Bio Section */}
        {profile.profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.bioCard}>
              <Text style={styles.bioText}>{profile.profile.bio}</Text>
            </View>
          </View>
        )}

        {/* Learning Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>{profile.stats.courses_enrolled}</Text>
              <Text style={styles.statItemLabel}>Courses Enrolled</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>{profile.stats.courses_completed}</Text>
              <Text style={styles.statItemLabel}>Courses Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>{profile.stats.problems_attempted}</Text>
              <Text style={styles.statItemLabel}>Problems Attempted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemValue}>{profile.stats.success_rate}%</Text>
              <Text style={styles.statItemLabel}>Success Rate</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        {profile.achievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Achievements</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {profile.achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementCard}>
                  <View style={styles.achievementIcon}>
                    <Ionicons name={achievement.icon as any} size={32} color="#FFD700" />
                  </View>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  <Text style={styles.achievementDescription} numberOfLines={2}>
                    {achievement.description}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Certificates */}
        {profile.certificates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certificates</Text>
            {profile.certificates.map((certificate) => (
              <View key={certificate.id} style={styles.certificateCard}>
                <View style={styles.certificateInfo}>
                  <Text style={styles.certificateTitle}>{certificate.course_title}</Text>
                  <Text style={styles.certificateDate}>
                    Completed on {new Date(certificate.completion_date).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.certificateButton}>
                  <Ionicons name="download-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Social Links */}
        {(profile.profile.github_username || profile.profile.linkedin_url || profile.profile.website) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect</Text>
            <View style={styles.socialLinks}>
              {profile.profile.github_username && (
                <TouchableOpacity style={styles.socialLink}>
                  <Ionicons name="logo-github" size={24} color="#333" />
                  <Text style={styles.socialLinkText}>GitHub</Text>
                </TouchableOpacity>
              )}
              {profile.profile.linkedin_url && (
                <TouchableOpacity style={styles.socialLink}>
                  <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
                  <Text style={styles.socialLinkText}>LinkedIn</Text>
                </TouchableOpacity>
              )}
              {profile.profile.website && (
                <TouchableOpacity style={styles.socialLink}>
                  <Ionicons name="globe-outline" size={24} color="#666" />
                  <Text style={styles.socialLinkText}>Website</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="person-outline" size={20} color="#666" />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="notifications-outline" size={20} color="#666" />
            <Text style={styles.actionButtonText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="shield-outline" size={20} color="#666" />
            <Text style={styles.actionButtonText}>Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Logout</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userBadges: {
    flexDirection: 'row',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    padding: 20,
    marginTop: 10,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  bioCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  statItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statItemLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  achievementCard: {
    width: 150,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    alignItems: 'center',
  },
  achievementIcon: {
    marginBottom: 10,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  certificateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  certificateInfo: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  certificateDate: {
    fontSize: 14,
    color: '#666',
  },
  certificateButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  socialLink: {
    alignItems: 'center',
    padding: 15,
  },
  socialLinkText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 15,
  },
  logoutButton: {
    backgroundColor: '#ffebee',
  },
  logoutButtonText: {
    color: '#F44336',
  },
});

export default ProfileScreen;
