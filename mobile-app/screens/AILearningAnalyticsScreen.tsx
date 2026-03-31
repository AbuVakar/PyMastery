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
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
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
import EnhancedAIService from '../services/enhancedAIService';

const { width: screenWidth } = Dimensions.get('window');

const AILearningAnalyticsScreen: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [selectedChart, setSelectedChart] = useState<'usage' | 'performance' | 'learning'>('usage');
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      const [usage, analytics] = await Promise.all([
        EnhancedAIService.getInstance().getUsageStats(selectedPeriod),
        loadDetailedAnalytics(),
      ]);
      
      setUsageStats(usage);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  };

  const loadDetailedAnalytics = async () => {
    // Mock detailed analytics data
    return {
      learningProgress: {
        dailyProgress: [
          { day: 'Mon', progress: 65 },
          { day: 'Tue', progress: 72 },
          { day: 'Wed', progress: 68 },
          { day: 'Thu', progress: 75 },
          { day: 'Fri', progress: 82 },
          { day: 'Sat', progress: 78 },
          { day: 'Sun', progress: 85 },
        ],
        skillBreakdown: [
          { skill: 'Python', value: 85, color: '#007AFF' },
          { skill: 'JavaScript', value: 72, color: '#4CAF50' },
          { skill: 'Data Structures', value: 68, color: '#FF9800' },
          { skill: 'Algorithms', value: 45, color: '#F44336' },
          { skill: 'Machine Learning', value: 30, color: '#9C27B0' },
        ],
        topicMastery: [
          { topic: 'Variables', mastery: 95 },
          { topic: 'Functions', mastery: 88 },
          { topic: 'Classes', mastery: 75 },
          { topic: 'Decorators', mastery: 60 },
          { topic: 'Generators', mastery: 45 },
          { topic: 'Async', mastery: 35 },
        ],
      },
      aiPerformance: {
        responseTime: [
          { time: '00:00', responseTime: 1.2 },
          { time: '04:00', responseTime: 1.5 },
          { time: '08:00', responseTime: 2.1 },
          { time: '12:00', responseTime: 1.8 },
          { time: '16:00', responseTime: 1.6 },
          { time: '20:00', responseTime: 1.4 },
        ],
        accuracy: [
          { provider: 'OpenAI', accuracy: 94 },
          { provider: 'Groq', accuracy: 89 },
          { provider: 'Gemini', accuracy: 91 },
        ],
        costEfficiency: [
          { model: 'GPT-4', cost: 0.12, accuracy: 94 },
          { model: 'GPT-3.5', cost: 0.03, accuracy: 87 },
          { model: 'Gemini Pro', cost: 0.02, accuracy: 91 },
          { model: 'Llama 2', cost: 0.01, accuracy: 85 },
        ],
      },
      learningPatterns: {
        studyTime: [
          { hour: '6AM', minutes: 15 },
          { hour: '9AM', minutes: 45 },
          { hour: '12PM', minutes: 30 },
          { hour: '3PM', minutes: 60 },
          { hour: '6PM', minutes: 90 },
          { hour: '9PM', minutes: 75 },
        ],
        problemDifficulty: [
          { difficulty: 'Easy', completed: 45, attempted: 48 },
          { difficulty: 'Medium', completed: 32, attempted: 45 },
          { difficulty: 'Hard', completed: 15, attempted: 30 },
          { difficulty: 'Expert', completed: 3, attempted: 12 },
        ],
        learningStyle: {
          visual: 65,
          auditory: 20,
          kinesthetic: 15,
        },
      },
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend }: any) => (
    <Card shadow padding={spacing.md} margin={spacing.sm}>
      <View style={styles.statCard}>
        <View style={styles.statIcon}>
          <ResponsiveIcon name={icon} size="lg" color={color} />
        </View>
        <View style={styles.statContent}>
          <ResponsiveText variant="xxxl" style={styles.statValue}>
            {value}
          </ResponsiveText>
          <ResponsiveText variant="md" style={styles.statTitle}>
            {title}
          </ResponsiveText>
          <ResponsiveText variant="sm" style={styles.statSubtitle}>
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

  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card shadow padding={spacing.md} margin={spacing.sm}>
      <ResponsiveText variant="lg" style={styles.chartTitle}>
        {title}
      </ResponsiveText>
      {children}
    </Card>
  );

  const renderUsageChart = () => {
    if (!usageStats) return null;

    const chartData = {
      labels: Object.keys(usageStats.byProvider),
      datasets: [
        {
          data: Object.values(usageStats.byProvider).map((p: any) => p.tokens),
        },
      ],
    };

    return (
      <ChartCard title="Token Usage by Provider">
        <BarChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
        />
      </ChartCard>
    );
  };

  const renderLearningProgressChart = () => {
    if (!analyticsData?.learningProgress) return null;

    const chartData = {
      labels: analyticsData.learningProgress.dailyProgress.map((p: any) => p.day),
      datasets: [
        {
          data: analyticsData.learningProgress.dailyProgress.map((p: any) => p.progress),
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <ChartCard title="Daily Learning Progress">
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </ChartCard>
    );
  };

  const renderSkillBreakdownChart = () => {
    if (!analyticsData?.learningProgress) return null;

    const chartData = analyticsData.learningProgress.skillBreakdown.map((skill: any) => skill.value);

    return (
      <ChartCard title="Skill Breakdown">
        <PieChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1, index) => {
              const colors = ['#007AFF', '#4CAF50', '#FF9800', '#F44336', '#9C27B0'];
              return colors[index % colors.length];
            },
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          style={styles.chart}
        />
        <View style={styles.skillLegend}>
          {analyticsData.learningProgress.skillBreakdown.map((skill: any, index: number) => (
            <View key={index} style={styles.skillLegendItem}>
              <View style={[styles.skillLegendColor, { backgroundColor: skill.color }]} />
              <ResponsiveText variant="sm">{skill.skill}: {skill.value}%</ResponsiveText>
            </View>
          ))}
        </View>
      </ChartCard>
    );
  };

  const renderPerformanceChart = () => {
    if (!analyticsData?.aiPerformance) return null;

    const chartData = {
      labels: analyticsData.aiPerformance.responseTime.map((p: any) => p.time),
      datasets: [
        {
          data: analyticsData.aiPerformance.responseTime.map((p: any) => p.responseTime),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <ChartCard title="AI Response Time (seconds)">
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </ChartCard>
    );
  };

  const renderAccuracyChart = () => {
    if (!analyticsData?.aiPerformance) return null;

    const chartData = {
      labels: analyticsData.aiPerformance.accuracy.map((p: any) => p.provider),
      datasets: [
        {
          data: analyticsData.aiPerformance.accuracy.map((p: any) => p.accuracy),
        },
      ],
    };

    return (
      <ChartCard title="AI Provider Accuracy">
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
      </ChartCard>
    );
  };

  const renderLearningPatternsChart = () => {
    if (!analyticsData?.learningPatterns) return null;

    const chartData = {
      labels: analyticsData.learningPatterns.studyTime.map((p: any) => p.hour),
      datasets: [
        {
          data: analyticsData.learningPatterns.studyTime.map((p: any) => p.minutes),
          color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <ChartCard title="Study Time by Hour">
        <LineChart
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
          bezier
          style={styles.chart}
        />
      </ChartCard>
    );
  };

  return (
    <Container padding margin>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ResponsiveText variant="xxxl" style={styles.title}>
            AI Learning Analytics
          </ResponsiveText>
          <View style={styles.periodSelector}>
            {[
              { key: 'day', label: 'Day' },
              { key: 'week', label: 'Week' },
              { key: 'month', label: 'Month' },
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
        </View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Tokens"
            value={usageStats?.totalTokens || 0}
            subtitle="This period"
            icon="analytics-outline"
            color="#007AFF"
            trend={12}
          />
          <StatCard
            title="Total Cost"
            value={`$${(usageStats?.totalCost || 0).toFixed(2)}`}
            subtitle="This period"
            icon="cash-outline"
            color="#4CAF50"
            trend={-5}
          />
          <StatCard
            title="Requests"
            value={usageStats?.requests || 0}
            subtitle="This period"
            icon="chatbubble-outline"
            color="#FF9800"
            trend={8}
          />
          <StatCard
            title="Avg Response"
            value={`${(usageStats?.averageResponseTime || 0).toFixed(1)}s`}
            subtitle="Response time"
            icon="speedometer-outline"
            color="#9C27B0"
            trend={-3}
          />
        </View>

        {/* Chart Type Selector */}
        <View style={styles.chartTypeSelector}>
          {[
            { key: 'usage', label: 'Usage', icon: 'analytics-outline' },
            { key: 'performance', label: 'Performance', icon: 'speedometer-outline' },
            { key: 'learning', label: 'Learning', icon: 'school-outline' },
          ].map((chart) => (
            <TouchableOpacity
              key={chart.key}
              style={[
                styles.chartTypeButton,
                selectedChart === chart.key && styles.chartTypeButtonActive,
              ]}
              onPress={() => setSelectedChart(chart.key as any)}
            >
              <ResponsiveIcon
                name={chart.icon as any}
                size="md"
                color={selectedChart === chart.key ? '#fff' : '#666'}
              />
              <ResponsiveText
                variant="sm"
                style={[
                  styles.chartTypeButtonText,
                  selectedChart === chart.key && styles.chartTypeButtonTextActive,
                ]}
              >
                {chart.label}
              </ResponsiveText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Charts */}
        {selectedChart === 'usage' && (
          <>
            {renderUsageChart()}
            {renderSkillBreakdownChart()}
          </>
        )}

        {selectedChart === 'performance' && (
          <>
            {renderPerformanceChart()}
            {renderAccuracyChart()}
          </>
        )}

        {selectedChart === 'learning' && (
          <>
            {renderLearningProgressChart()}
            {renderLearningPatternsChart()}
          </>
        )}

        {/* Topic Mastery */}
        {analyticsData?.learningProgress?.topicMastery && (
          <ChartCard title="Topic Mastery">
            {analyticsData.learningProgress.topicMastery.map((topic: any, index: number) => (
              <View key={index} style={styles.topicItem}>
                <View style={styles.topicHeader}>
                  <ResponsiveText variant="md" style={styles.topicName}>
                    {topic.topic}
                  </ResponsiveText>
                  <ResponsiveText variant="sm" style={styles.topicMastery}>
                    {topic.mastery}%
                  </ResponsiveText>
                </View>
                <View style={styles.topicProgressBar}>
                  <View
                    style={[
                      styles.topicProgressFill,
                      { width: `${topic.mastery}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </ChartCard>
        )}

        {/* Problem Difficulty Distribution */}
        {analyticsData?.learningPatterns?.problemDifficulty && (
          <ChartCard title="Problem Difficulty Distribution">
            {analyticsData.learningPatterns.problemDifficulty.map((problem: any, index: number) => (
              <View key={index} style={styles.problemItem}>
                <View style={styles.problemHeader}>
                  <ResponsiveText variant="md" style={styles.problemDifficulty}>
                    {problem.difficulty}
                  </ResponsiveText>
                  <ResponsiveText variant="sm" style={styles.problemStats}>
                    {problem.completed}/{problem.attempted}
                  </ResponsiveText>
                </View>
                <View style={styles.problemProgressBar}>
                  <View
                    style={[
                      styles.problemProgressFill,
                      {
                        width: `${(problem.completed / problem.attempted) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </ChartCard>
        )}
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    padding: 5,
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
  statsGrid: {
    marginBottom: 20,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  statSubtitle: {
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
  chartTypeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    padding: 5,
    marginBottom: 20,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 5,
  },
  chartTypeButtonActive: {
    backgroundColor: '#007AFF',
  },
  chartTypeButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  chartTypeButtonTextActive: {
    color: '#fff',
  },
  chartTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  skillLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  skillLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  skillLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  topicItem: {
    marginBottom: 15,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  topicName: {
    fontWeight: '600',
    color: '#333',
  },
  topicMastery: {
    color: '#666',
  },
  topicProgressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  topicProgressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  problemItem: {
    marginBottom: 15,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  problemDifficulty: {
    fontWeight: '600',
    color: '#333',
  },
  problemStats: {
    color: '#666',
  },
  problemProgressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  problemProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
});

export default AILearningAnalyticsScreen;
