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
import AnalyticsService, { UserMetrics, SystemMetrics } from '../services/analyticsService';

const { width } = Dimensions.get('window');

const AnalyticsScreen: React.FC = () => {
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([]);
  const [leaderboard, setLeaderboard] = useState<Array<{
    rank: number;
    user_id: string;
    name: string;
    value: number;
    change: number;
  }>>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'leaderboard'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const analyticsService = AnalyticsService.getInstance();

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTab]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      switch (selectedTab) {
        case 'overview':
          await loadUserMetrics();
          await loadSystemMetrics();
          break;
        case 'performance':
          await loadUserMetrics();
          break;
        case 'leaderboard':
          await loadLeaderboard();
          break;
      }
    } catch (error: any) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserMetrics = async () => {
    try {
      const metrics = await analyticsService.getUserMetrics();
      setUserMetrics(metrics);
    } catch (error) {
      console.error('Failed to load user metrics:', error);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const metrics = await analyticsService.getSystemMetrics('24h');
      setSystemMetrics(metrics);
    } catch (error) {
      console.error('Failed to load system metrics:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const leaderboardData = await analyticsService.getLeaderboard('points', 10);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const MetricCard = ({ title, value, subtitle, icon, color, trend }: any) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      {trend && (
        <View style={[styles.trendBadge, trend > 0 ? styles.trendUp : styles.trendDown]}>
          <Ionicons
            name={trend > 0 ? 'trending-up' : 'trending-down'}
            size={12}
            color={trend > 0 ? '#4CAF50' : '#F44336'}
          />
          <Text style={[styles.trendText, trend > 0 ? styles.trendUpText : styles.trendDownText]}>
            {Math.abs(trend)}%
          </Text>
        </View>
      )}
    </View>
  );

  const LeaderboardItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, index < 3 && styles.rankTop]}>{item.rank}</Text>
        {index === 0 && <Ionicons name="trophy" size={16} color="#FFD700" />}
        {index === 1 && <Ionicons name="medal" size={16} color="#C0C0C0" />}
        {index === 2 && <Ionicons name="medal" size={16} color="#CD7F32" />}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userValue}>{item.value} points</Text>
      </View>
      <View style={[styles.changeContainer, item.change >= 0 ? styles.changeUp : styles.changeDown]}>
        <Ionicons
          name={item.change >= 0 ? 'arrow-up' : 'arrow-down'}
          size={12}
          color={item.change >= 0 ? '#4CAF50' : '#F44336'}
        />
        <Text style={[styles.changeText, item.change >= 0 ? styles.changeUpText : styles.changeDownText]}>
          {Math.abs(item.change)}
        </Text>
      </View>
    </View>
  );

  const SystemHealthCard = ({ metric }: { metric: SystemMetrics }) => (
    <View style={styles.healthCard}>
      <Text style={styles.healthTime}>
        {new Date(metric.timestamp).toLocaleTimeString()}
      </Text>
      <View style={styles.healthMetrics}>
        <View style={styles.healthMetric}>
          <Text style={styles.healthLabel}>Active Users</Text>
          <Text style={styles.healthValue}>{metric.active_users}</Text>
        </View>
        <View style={styles.healthMetric}>
          <Text style={styles.healthLabel}>Response Time</Text>
          <Text style={styles.healthValue}>{metric.server_response_time}ms</Text>
        </View>
        <View style={styles.healthMetric}>
          <Text style={styles.healthLabel}>Error Rate</Text>
          <Text style={styles.healthValue}>{(metric.error_rate * 100).toFixed(2)}%</Text>
        </View>
        <View style={styles.healthMetric}>
          <Text style={styles.healthLabel}>Memory</Text>
          <Text style={styles.healthValue}>{(metric.memory_usage / 1024).toFixed(1)}MB</Text>
        </View>
      </View>
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {userMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Performance</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Courses Completed"
              value={userMetrics.courses_completed}
              icon="book-outline"
              color="#007AFF"
            />
            <MetricCard
              title="Problems Solved"
              value={userMetrics.problems_solved}
              icon="code-outline"
              color="#4CAF50"
            />
            <MetricCard
              title="Current Streak"
              value={`${userMetrics.current_streak} days`}
              icon="flame-outline"
              color="#FF9800"
            />
            <MetricCard
              title="Engagement Score"
              value={userMetrics.engagement_score.toFixed(0)}
              subtitle="/ 100"
              icon="analytics-outline"
              color="#9C27B0"
            />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Health</Text>
        {systemMetrics.slice(0, 3).map((metric, index) => (
          <SystemHealthCard key={index} metric={metric} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.statText}>
              {userMetrics ? `${Math.floor(userMetrics.total_time_spent / 3600)}h total` : 'Loading...'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="speedometer-outline" size={20} color="#666" />
            <Text style={styles.statText}>
              {userMetrics ? `Velocity: ${userMetrics.learning_velocity.toFixed(1)}` : 'Loading...'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.statText}>
              {userMetrics ? `Last: ${new Date(userMetrics.last_active).toLocaleDateString()}` : 'Loading...'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderPerformanceTab = () => (
    <ScrollView style={styles.tabContent}>
      {userMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          
          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>Learning Progress</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(userMetrics.engagement_score, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Engagement Score: {userMetrics.engagement_score.toFixed(0)}/100
            </Text>
          </View>

          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>Activity Summary</Text>
            <View style={styles.activityGrid}>
              <View style={styles.activityItem}>
                <Text style={styles.activityValue}>{userMetrics.total_sessions}</Text>
                <Text style={styles.activityLabel}>Total Sessions</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityValue}>{userMetrics.courses_completed}</Text>
                <Text style={styles.activityLabel}>Courses Completed</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityValue}>{userMetrics.problems_solved}</Text>
                <Text style={styles.activityLabel}>Problems Solved</Text>
              </View>
              <View style={styles.activityItem}>
                <Text style={styles.activityValue}>{userMetrics.current_streak}</Text>
                <Text style={styles.activityLabel}>Day Streak</Text>
              </View>
            </View>
          </View>

          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>Time Analysis</Text>
            <View style={styles.timeAnalysis}>
              <View style={styles.timeItem}>
                <Text style={styles.timeValue}>
                  {Math.floor(userMetrics.total_time_spent / 3600)}h {Math.floor((userMetrics.total_time_spent % 3600) / 60)}m
                </Text>
                <Text style={styles.timeLabel}>Total Learning Time</Text>
              </View>
              <View style={styles.timeItem}>
                <Text style={styles.timeValue}>
                  {Math.floor(userMetrics.total_time_spent / userMetrics.total_sessions / 60)}m
                </Text>
                <Text style={styles.timeLabel}>Average Session</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderLeaderboardTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Performers</Text>
        {leaderboard.map((item, index) => (
          <LeaderboardItem key={item.user_id} item={item} index={index} />
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview', icon: 'grid-outline' },
          { key: 'performance', label: 'Performance', icon: 'analytics-outline' },
          { key: 'leaderboard', label: 'Leaderboard', icon: 'trophy-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={selectedTab === tab.key ? '#007AFF' : '#666'}
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.activeTabText,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'performance' && renderPerformanceTab()}
        {selectedTab === 'leaderboard' && renderLeaderboardTab()}
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
  exportButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f0f8ff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  trendUp: {
    backgroundColor: '#e8f5e8',
  },
  trendDown: {
    backgroundColor: '#ffebee',
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  trendUpText: {
    color: '#4CAF50',
  },
  trendDownText: {
    color: '#F44336',
  },
  healthCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  healthTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  healthMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthMetric: {
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 5,
  },
  rankTop: {
    color: '#007AFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userValue: {
    fontSize: 14,
    color: '#666',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeUp: {
    backgroundColor: '#e8f5e8',
  },
  changeDown: {
    backgroundColor: '#ffebee',
  },
  changeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  changeUpText: {
    color: '#4CAF50',
  },
  changeDownText: {
    color: '#F44336',
  },
  performanceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  activityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  timeAnalysis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default AnalyticsScreen;
