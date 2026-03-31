import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';
import {
  Container,
  Grid,
  Card,
  Row,
  Col,
  Text as ResponsiveText,
  Icon as ResponsiveIcon,
  Button as ResponsiveButton,
} from '../components/ResponsiveComponents';

const { width, height } = Dimensions.get('window');

const TabletOptimizedHomeScreen: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isTablet, container, spacing, fontSize, iconSize } = useResponsive();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Mock data loading
    setStats({
      totalCourses: 12,
      completedCourses: 8,
      totalProblems: 156,
      solvedProblems: 89,
      currentStreak: 15,
      totalPoints: 2450,
      currentLevel: 5,
    });
    
    setRecentActivity([
      {
        id: '1',
        type: 'course',
        title: 'Completed Python Basics',
        description: 'Finished the fundamentals course',
        timestamp: new Date().toISOString(),
        points: 50,
      },
      {
        id: '2',
        type: 'problem',
        title: 'Solved Array Manipulation',
        description: 'Successfully solved the array problem',
        timestamp: new Date().toISOString(),
        points: 25,
      },
      {
        id: '3',
        type: 'achievement',
        title: '7-Day Streak',
        description: 'Maintained a 7-day learning streak',
        timestamp: new Date().toISOString(),
        points: 100,
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ icon, title, value, color }: any) => (
    <Card shadow padding={spacing.md} margin={spacing.sm}>
      <View style={styles.statCard}>
        <ResponsiveIcon name={icon} size="lg" color={color} />
        <ResponsiveText variant="xl" style={styles.statValue}>
          {value}
        </ResponsiveText>
        <ResponsiveText variant="sm" style={styles.statTitle}>
          {title}
        </ResponsiveText>
      </View>
    </Card>
  );

  const ActivityItem = ({ activity }: { activity: any }) => (
    <Card shadow padding={spacing.md} margin={spacing.sm}>
      <View style={styles.activityItem}>
        <View style={styles.activityIcon}>
          <ResponsiveIcon
            name={
              activity.type === 'course'
                ? 'book-outline'
                : activity.type === 'problem'
                ? 'code-outline'
                : 'trophy-outline'
            }
            size="md"
            color="#007AFF"
          />
        </View>
        <View style={styles.activityContent}>
          <ResponsiveText variant="md" style={styles.activityTitle}>
            {activity.title}
          </ResponsiveText>
          <ResponsiveText variant="sm" style={styles.activityDescription}>
            {activity.description}
          </ResponsiveText>
          <ResponsiveText variant="xs" style={styles.activityTime}>
            {new Date(activity.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </ResponsiveText>
        </View>
        {activity.points && (
          <View style={styles.activityPoints}>
            <ResponsiveText variant="sm" style={styles.pointsText}>
              +{activity.points}
            </ResponsiveText>
          </View>
        )}
      </View>
    </Card>
  );

  // Tablet layout - 2x2 grid for stats
  if (isTablet) {
    return (
      <Container padding margin>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.tabletHeader}>
            <ResponsiveText variant="xxxl" style={styles.tabletTitle}>
              Welcome back!
            </ResponsiveText>
            <ResponsiveText variant="lg" style={styles.tabletSubtitle}>
              Continue your Python learning journey
            </ResponsiveText>
          </View>

          {/* Stats Grid - 2x2 on tablet */}
          <View style={styles.tabletStatsGrid}>
            <StatCard icon="book-outline" title="Courses" value={`${stats?.completedCourses || 0}/${stats?.totalCourses || 0}`} color="#FF6B6B" />
            <StatCard icon="code-outline" title="Problems" value={`${stats?.solvedProblems || 0}/${stats?.totalProblems || 0}`} color="#4ECDC4" />
            <StatCard icon="flame-outline" title="Streak" value={stats?.currentStreak || 0} color="#45B7D1" />
            <StatCard icon="star-outline" title="Points" value={stats?.totalPoints || 0} color="#96CEB4" />
          </View>

          {/* Progress Section */}
          <Card shadow padding={spacing.lg} margin={spacing.md}>
            <ResponsiveText variant="lg" style={styles.sectionTitle}>
              Your Progress
            </ResponsiveText>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${((stats?.completedCourses || 0) / Math.max(stats?.totalCourses || 1)) * 100}%`,
                  },
                ]}
              />
            </View>
            <ResponsiveText variant="sm" style={styles.progressText}>
              {stats?.completedCourses || 0} of {stats?.totalCourses || 0} courses completed
            </ResponsiveText>
          </Card>

          {/* Recent Activity - 2 columns on tablet */}
          <View style={styles.tabletActivitySection}>
            <ResponsiveText variant="lg" style={styles.sectionTitle}>
              Recent Activity
            </ResponsiveText>
            <View style={styles.tabletActivityGrid}>
              {recentActivity.slice(0, 4).map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </View>
          </View>

          {/* Quick Actions - 2x2 grid on tablet */}
          <Card shadow padding={spacing.lg} margin={spacing.md}>
            <ResponsiveText variant="lg" style={styles.sectionTitle}>
              Quick Actions
            </ResponsiveText>
            <View style={styles.tabletQuickActionsGrid}>
              <ResponsiveButton variant="primary" style={styles.tabletQuickAction}>
                <ResponsiveIcon name="play-circle-outline" size="lg" />
                <ResponsiveText>Continue Learning</ResponsiveText>
              </ResponsiveButton>
              <ResponsiveButton variant="secondary" style={styles.tabletQuickAction}>
                <ResponsiveIcon name="search-outline" size="lg" />
                <ResponsiveText>Explore Problems</ResponsiveText>
              </ResponsiveButton>
              <ResponsiveButton variant="outline" style={styles.tabletQuickAction}>
                <ResponsiveIcon name="people-outline" size="lg" />
                <ResponsiveText>Study Groups</ResponsiveText>
              </ResponsiveButton>
              <ResponsiveButton variant="outline" style={styles.tabletQuickAction}>
                <ResponsiveIcon name="analytics-outline" size="lg" />
                <ResponsiveText>View Analytics</ResponsiveText>
              </ResponsiveButton>
            </View>
          </Card>
        </ScrollView>
      </Container>
    );
  }

  // Phone layout - single column
  return (
    <Container padding margin>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ResponsiveText variant="xxl" style={styles.title}>
            Welcome back!
          </ResponsiveText>
          <ResponsiveText variant="md" style={styles.subtitle}>
            Continue your Python learning journey
          </ResponsiveText>
        </View>

        {/* Stats Grid - 2x2 on phone */}
        <View style={styles.statsGrid}>
          <StatCard icon="book-outline" title="Courses" value={`${stats?.completedCourses || 0}/${stats?.totalCourses || 0}`} color="#FF6B6B" />
          <StatCard icon="code-outline" title="Problems" value={`${stats?.solvedProblems || 0}/${stats?.totalProblems || 0}`} color="#4ECDC4" />
          <StatCard icon="flame-outline" title="Streak" value={stats?.currentStreak || 0} color="#45B7D1" />
          <StatCard icon="star-outline" title="Points" value={stats?.totalPoints || 0} color="#96CEB4" />
        </View>

        {/* Progress Section */}
        <Card shadow padding={spacing.md} margin={spacing.sm}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Your Progress
          </ResponsiveText>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((stats?.completedCourses || 0) / Math.max(stats?.totalCourses || 1)) * 100}%`,
                },
              ]}
            />
          </View>
          <ResponsiveText variant="sm" style={styles.progressText}>
            {stats?.completedCourses || 0} of {stats?.totalCourses || 0} courses completed
          </ResponsiveText>
        </Card>

        {/* Recent Activity */}
        <Card shadow padding={spacing.md} margin={spacing.sm}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Recent Activity
          </ResponsiveText>
          {recentActivity.slice(0, 3).map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </Card>

        {/* Quick Actions */}
        <Card shadow padding={spacing.md} margin={spacing.sm}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Quick Actions
          </ResponsiveText>
          <View style={styles.quickActions}>
            <ResponsiveButton variant="primary" style={styles.quickAction}>
              <ResponsiveIcon name="play-circle-outline" size="md" />
              <ResponsiveText>Continue Learning</ResponsiveText>
            </ResponsiveButton>
            <ResponsiveButton variant="secondary" style={styles.quickAction}>
              <ResponsiveIcon name="search-outline" size="md" />
              <ResponsiveText>Explore Problems</ResponsiveText>
            </ResponsiveButton>
          </View>
        </Card>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  // Phone styles
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    margin: 5,
    minWidth: 100,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statTitle: {
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    color: '#666',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activityDescription: {
    color: '#666',
    marginBottom: 2,
  },
  activityTime: {
    color: '#999',
  },
  activityPoints: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    margin: 5,
    alignItems: 'center',
    padding: 10,
  },

  // Tablet styles
  tabletHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  tabletTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tabletSubtitle: {
    color: '#666',
    textAlign: 'center',
  },
  tabletStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  tabletActivitySection: {
    marginBottom: 30,
  },
  tabletActivityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tabletQuickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tabletQuickAction: {
    width: '48%',
    alignItems: 'center',
    padding: 20,
    margin: 5,
  },
});

export default TabletOptimizedHomeScreen;
