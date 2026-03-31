import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';
import {
  Container,
  Card,
  Row,
  Col,
  Text as ResponsiveText,
  Icon as ResponsiveIcon,
} from '../components/ResponsiveComponents';
import AdaptiveLearningService, {
  LearningInsights,
  LearningProfile,
} from '../services/adaptiveLearningService';
import EnhancedAIService from '../services/enhancedAIService';

const { width: screenWidth } = Dimensions.get('window');

const AdvancedLearningAnalyticsScreen: React.FC = () => {
  const [learningInsights, setLearningInsights] = useState<LearningInsights | null>(null);
  const [userProfile, setUserProfile] = useState<LearningProfile | null>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [selectedView, setSelectedView] = useState<'overview' | 'patterns' | 'progress' | 'predictions'>('overview');
  const [animatedValues, setAnimatedValues] = useState({
    velocity: new Animated.Value(0),
    retention: new Animated.Value(0),
    engagement: new Animated.Value(0),
    performance: new Animated.Value(0),
  });
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  const adaptiveService = AdaptiveLearningService.getInstance();
  const aiService = EnhancedAIService.getInstance();
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  useEffect(() => {
    animateValues();
  }, [learningInsights]);

  const loadAnalyticsData = async () => {
    try {
      const [insights, profile, usage] = await Promise.all([
        adaptiveService.getLearningInsights('demo-user'),
        adaptiveService.getUserProfile('demo-user'),
        aiService.getUsageStats(selectedPeriod),
      ]);
      
      setLearningInsights(insights);
      setUserProfile(profile);
      setUsageStats(usage);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  };

  const animateValues = () => {
    if (!learningInsights) return;

    Animated.parallel([
      Animated.timing(animatedValues.velocity, {
        toValue: learningInsights.learning_velocity || 0,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.retention, {
        toValue: (learningInsights.retention_rate || 0) * 100,
        duration: 1200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.engagement, {
        toValue: 85, // Mock engagement score
        duration: 1400,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.performance, {
        toValue: (learningInsights.performance_trends.accuracy_trend === 'improving' ? 90 : 70),
        duration: 1600,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const MetricCard = ({ title, value, subtitle, icon, color, trend, animatedValue }: any) => (
    <Card shadow padding={spacing.md} margin={spacing.sm}>
      <View style={styles.metricCard}>
        <View style={styles.metricIcon}>
          <ResponsiveIcon name={icon} size="lg" color={color} />
        </View>
        <View style={styles.metricContent}>
          <Animated.Text style={[styles.metricValue, { opacity: animatedValue }]}>
            {typeof value === 'number' ? value.toFixed(1) : value}
          </Animated.Text>
          <ResponsiveText variant="md" style={styles.metricTitle}>
            {title}
          </ResponsiveText>
          <ResponsiveText variant="sm" style={styles.metricSubtitle}>
            {subtitle}
          </ResponsiveText>
        </View>
        {trend && (
          <View style={[styles.trendBadge, trend > 0 ? styles.trendUp : styles.trendDown]}>
            <ResponsiveIcon
              name={trend > 0 ? 'trending-up' : 'trending-down'}
              size="sm"
              color={trend > 0 ? '#4CAF50' : '#F44336'}
            />
            <ResponsiveText variant="xs" style={[styles.trendText, trend > 0 ? styles.trendUpText : styles.trendDownText]}>
              {Math.abs(trend)}%
            </ResponsiveText>
          </View>
        )}
      </View>
    </Card>
  );

  const LearningVelocityChart = () => {
    if (!learningInsights) return null;

    const chartData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          data: [2.1, 2.5, 1.8, 3.2, 2.8, 3.5, 2.9],
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <Card shadow padding={spacing.md} margin={spacing.sm}>
        <ResponsiveText variant="lg" style={styles.sectionTitle}>
          Learning Velocity (Skills per Week)
        </ResponsiveText>
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
        <View style={styles.chartLegend}>
          <ResponsiveText variant="sm" style={styles.legendText}>
            Current: {learningInsights.learning_velocity?.toFixed(1) || 0} skills/week
          </ResponsiveText>
          <ResponsiveText variant="sm" style={styles.legendText}>
            Target: 3.0 skills/week
          </ResponsiveText>
        </View>
      </Card>
    );
  };

  const RetentionRateChart = () => {
    if (!learningInsights) return null;

    const chartData = {
      labels: ['Day 1', 'Day 7', 'Day 14', 'Day 30', 'Day 60', 'Day 90'],
      datasets: [
        {
          data: [100, 85, 75, 65, 55, 45],
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <Card shadow padding={spacing.md} margin={spacing.sm}>
        <ResponsiveText variant="lg" style={styles.sectionTitle}>
          Knowledge Retention Rate
        </ResponsiveText>
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
        <View style={styles.chartLegend}>
          <ResponsiveText variant="sm" style={styles.legendText}>
            Current Retention: {(learningInsights.retention_rate || 0).toFixed(1)}%
          </ResponsiveText>
          <ResponsiveText variant="sm" style={styles.legendText}>
            Industry Average: 40%
          </ResponsiveText>
        </View>
      </Card>
    );
  };

  const LearningPatternsChart = () => {
    if (!learningInsights) return null;

    const chartData = {
      labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
      datasets: [
        {
          data: [15, 45, 30, 60, 90, 75],
          color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <Card shadow padding={spacing.md} margin={spacing.sm}>
        <ResponsiveText variant="lg" style={styles.sectionTitle}>
          Study Time by Hour
        </ResponsiveText>
        <BarChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
        />
        <View style={styles.chartLegend}>
          <ResponsiveText variant="sm" style={styles.legendText}>
            Best Time: {learningInsights.learning_patterns?.best_time_of_day || '6PM'}
          </ResponsiveText>
          <ResponsiveText variant="sm" style={styles.legendText}>
            Avg Session: {userProfile?.average_session_time || 20} min
          </ResponsiveText>
        </View>
      </Card>
    );
  };

  const SkillMasteryChart = () => {
    const chartData = {
      labels: ['Python', 'JS', 'Algorithms', 'Data Structures', 'React', 'Node.js'],
      datasets: [
        {
          data: [85, 72, 45, 38, 68, 55],
          color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
        },
      ],
    };

    return (
      <Card shadow padding={spacing.md} margin={spacing.sm}>
        <ResponsiveText variant="lg" style={styles.sectionTitle}>
          Skill Mastery Levels
        </ResponsiveText>
        <BarChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
        />
        <View style={styles.chartLegend}>
          <ResponsiveText variant="sm" style={styles.legendText}>
            Strongest: Python (85%)
          </ResponsiveText>
          <ResponsiveText variant="sm" style={styles.legendText}>
            Needs Improvement: Data Structures (38%)
          </ResponsiveText>
        </View>
      </Card>
    );
  };

  const PerformanceTrendsChart = () => {
    const chartData = {
      labels: ['Accuracy', 'Speed', 'Consistency'],
      datasets: [
        {
          data: [85, 72, 78],
          color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
        },
      ],
    };

    return (
      <Card shadow padding={spacing.md} margin={spacing.sm}>
        <ResponsiveText variant="lg" style={styles.sectionTitle}>
          Performance Trends
        </ResponsiveText>
        <BarChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
        />
        <View style={styles.chartLegend}>
          <ResponsiveText variant="sm" style={styles.legendText}>
            Accuracy: {learningInsights?.performance_trends?.accuracy_trend || 'stable'}
          </ResponsiveText>
          <ResponsiveText variant="sm" style={styles.legendText}>
            Speed: {learningInsights?.performance_trends?.speed_trend || 'stable'}
          </ResponsiveText>
        </View>
      </Card>
    );
  };

  const RecommendationsCard = () => {
    if (!learningInsights) return null;

    const recommendations = learningInsights.recommendations;

    return (
      <Card shadow padding={spacing.md} margin={spacing.sm}>
        <ResponsiveText variant="lg" style={styles.sectionTitle}>
          Personalized Recommendations
        </ResponsiveText>
        
        <View style={styles.recommendationsList}>
          {recommendations.should_increase_difficulty && (
            <View style={styles.recommendationItem}>
              <ResponsiveIcon name="trending-up" size="md" color="#4CAF50" />
              <ResponsiveText variant="sm" style={styles.recommendationText}>
                Increase difficulty level - You're ready for more challenging content
              </ResponsiveText>
            </View>
          )}
          
          {recommendations.should_change_pace && (
            <View style={styles.recommendationItem}>
              <ResponsiveIcon name="speedometer" size="md" color="#FF9800" />
              <ResponsiveText variant="sm" style={styles.recommendationText}>
                Adjust learning pace - Consider shorter, more frequent sessions
              </ResponsiveText>
            </View>
          )}
          
          {recommendations.should_try_new_content_type && (
            <View style={styles.recommendationItem}>
              <ResponsiveIcon name="grid-outline" size="md" color="#007AFF" />
              <ResponsiveText variant="sm" style={styles.recommendationText}>
                Try new content type - Explore interactive exercises and projects
              </ResponsiveText>
            </View>
          )}
          
          {recommendations.should_review_prerequisites && (
            <View style={styles.recommendationItem}>
              <ResponsiveIcon name="refresh-outline" size="md" color="#9C27B0" />
              <ResponsiveText variant="sm" style={styles.recommendationText}>
                Review prerequisites - Strengthen foundation concepts
              </ResponsiveText>
            </View>
          )}
        </View>
      </Card>
    );
  };

  const LearningInsightsCard = () => {
    if (!learningInsights || !userProfile) return null;

    return (
      <Card shadow padding={spacing.md} margin={spacing.sm}>
        <ResponsiveText variant="lg" style={styles.sectionTitle}>
          Learning Insights
        </ResponsiveText>
        
        <View style={styles.insightsGrid}>
          <View style={styles.insightItem}>
            <ResponsiveIcon name="time-outline" size="md" color="#007AFF" />
            <ResponsiveText variant="sm" style={styles.insightLabel}>
              Optimal Session
            </ResponsiveText>
            <ResponsiveText variant="md" style={styles.insightValue}>
              {learningInsights.optimal_session_length} min
            </ResponsiveText>
          </View>
          
          <View style={styles.insightItem}>
            <ResponsiveIcon name="target-outline" size="md" color="#4CAF50" />
            <ResponsiveText variant="sm" style={styles.insightLabel}>
              Optimal Difficulty
            </ResponsiveText>
            <ResponsiveText variant="md" style={styles.insightValue}>
              {learningInsights.optimal_difficulty}/100
            </ResponsiveText>
          </View>
          
          <View style={styles.insightItem}>
            <ResponsiveIcon name="calendar-outline" size="md" color="#FF9800" />
            <ResponsiveText variant="sm" style={styles.insightLabel}>
              Learning Style
            </ResponsiveText>
            <ResponsiveText variant="md" style={styles.insightValue}>
              {userProfile.learning_style}
            </ResponsiveText>
          </View>
          
          <View style={styles.insightItem}>
            <ResponsiveIcon name="flame-outline" size="md" color="#F44336" />
            <ResponsiveText variant="sm" style={styles.insightLabel}>
              Streak Days
            </ResponsiveText>
            <ResponsiveText variant="md" style={styles.insightValue}>
              {userProfile.streak_days}
            </ResponsiveText>
          </View>
        </View>
      </Card>
    );
  };

  const ViewSelector = () => (
    <View style={styles.viewSelector}>
      {[
        { key: 'overview', label: 'Overview', icon: 'grid-outline' },
        { key: 'patterns', label: 'Patterns', icon: 'analytics-outline' },
        { key: 'progress', label: 'Progress', icon: 'trending-up-outline' },
        { key: 'predictions', label: 'Predictions', icon: 'sparkles-outline' },
      ].map((view) => (
        <TouchableOpacity
          key={view.key}
          style={[
            styles.viewButton,
            selectedView === view.key && styles.viewButtonActive,
          ]}
          onPress={() => setSelectedView(view.key as any)}
        >
          <ResponsiveIcon
            name={view.icon as any}
            size="md"
            color={selectedView === view.key ? '#fff' : '#666'}
          />
          <ResponsiveText
            variant="sm"
            style={[
              styles.viewButtonText,
              selectedView === view.key && styles.viewButtonTextActive,
            ]}
          >
            {view.label}
          </ResponsiveText>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Container padding margin>
      <ScrollView
        ref={scrollViewRef}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ResponsiveText variant="xxxl" style={styles.title}>
            Learning Analytics
          </ResponsiveText>
          <ResponsiveText variant="md" style={styles.subtitle}>
            Advanced learning pattern analysis and insights
          </ResponsiveText>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {[
            { key: 'day', label: 'Day' },
            { key: 'week', label: 'Week' },
            { key: 'month', label: 'Month' },
            { key: 'year', label: 'Year' },
          ].map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key as any)}
            >
              <ResponsiveText
                variant="sm"
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </ResponsiveText>
            </TouchableOpacity>
          ))}
        </View>

        {/* View Selector */}
        <ViewSelector />

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Learning Velocity"
            value={learningInsights?.learning_velocity || 0}
            subtitle="Skills per week"
            icon="speedometer-outline"
            color="#007AFF"
            trend={12}
            animatedValue={animatedValues.velocity}
          />
          <MetricCard
            title="Retention Rate"
            value={`${(learningInsights?.retention_rate || 0).toFixed(1)}%`}
            subtitle="Knowledge retention"
            icon="brain-outline"
            color="#4CAF50"
            trend={5}
            animatedValue={animatedValues.retention}
          />
          <MetricCard
            title="Engagement Score"
            value="85%"
            subtitle="Session engagement"
            icon="heart-outline"
            color="#FF9800"
            trend={8}
            animatedValue={animatedValues.engagement}
          />
          <MetricCard
            title="Performance"
            value="88%"
            subtitle="Overall performance"
            icon="analytics-outline"
            color="#9C27B0"
            trend={-2}
            animatedValue={animatedValues.performance}
          />
        </View>

        {/* Charts based on selected view */}
        {selectedView === 'overview' && (
          <>
            <LearningVelocityChart />
            <RetentionRateChart />
            <LearningInsightsCard />
          </>
        )}

        {selectedView === 'patterns' && (
          <>
            <LearningPatternsChart />
            <SkillMasteryChart />
            <RecommendationsCard />
          </>
        )}

        {selectedView === 'progress' && (
          <>
            <PerformanceTrendsChart />
            <RetentionRateChart />
            <LearningVelocityChart />
          </>
        )}

        {selectedView === 'predictions' && (
          <>
            <RecommendationsCard />
            <LearningInsightsCard />
            <SkillMasteryChart />
          </>
        )}

        {/* Usage Stats */}
        {usageStats && (
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <ResponsiveText variant="lg" style={styles.sectionTitle}>
              AI Usage Statistics
            </ResponsiveText>
            <View style={styles.usageStats}>
              <ResponsiveText variant="sm">
                Total Tokens: {usageStats.totalTokens?.toLocaleString() || 0}
              </ResponsiveText>
              <ResponsiveText variant="sm">
                Total Cost: ${(usageStats.totalCost || 0).toFixed(2)}
              </ResponsiveText>
              <ResponsiveText variant="sm">
                Requests: {usageStats.requests || 0}
              </ResponsiveText>
              <ResponsiveText variant="sm">
                Avg Response Time: {(usageStats.averageResponseTime || 0).toFixed(1)}s
              </ResponsiveText>
            </View>
          </Card>
        )}
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    color: '#666',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    padding: 5,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    padding: 5,
    marginBottom: 20,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 5,
  },
  viewButtonActive: {
    backgroundColor: '#007AFF',
  },
  viewButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  viewButtonTextActive: {
    color: '#fff',
  },
  metricsGrid: {
    marginBottom: 20,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  metricTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  metricSubtitle: {
    color: '#666',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
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
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  legendText: {
    color: '#666',
  },
  recommendationsList: {
    gap: 10,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  recommendationText: {
    flex: 1,
    color: '#333',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightItem: {
    width: '48%',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  insightLabel: {
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  insightValue: {
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  usageStats: {
    gap: 5,
  },
});

export default AdvancedLearningAnalyticsScreen;
