import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';
import {
  Container,
  Card,
  Grid,
  Row,
  Col,
  Text as ResponsiveText,
  Icon as ResponsiveIcon,
  Button as ResponsiveButton,
} from '../components/ResponsiveComponents';
import EnhancedAIService, {
  LearningPathEnhanced,
  ProblemRecommendationEnhanced,
} from '../services/enhancedAIService';

const { width } = Dimensions.get('window');

const AIRecommendationsScreen: React.FC = () => {
  const [recommendations, setRecommendations] = useState<{
    learningPaths: LearningPathEnhanced[];
    problems: ProblemRecommendationEnhanced[];
    courses: any[];
    resources: any[];
  }>({
    learningPaths: [],
    problems: [],
    courses: [],
    resources: [],
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'learning' | 'problems' | 'courses' | 'resources'>('all');
  const [userProfile, setUserProfile] = useState<any>(null);
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    loadUserProfile();
    loadRecommendations();
  }, [selectedCategory]);

  const loadUserProfile = async () => {
    // Mock user profile - in real app, this would come from backend
    setUserProfile({
      currentSkills: ['python', 'javascript', 'html', 'css'],
      desiredSkills: ['machine learning', 'react', 'node.js', 'typescript'],
      skillLevel: 'intermediate',
      learningStyle: 'visual',
      interests: ['web development', 'data science', 'ai', 'mobile development'],
      timeAvailable: 15, // hours per week
      goals: ['career advancement', 'skill improvement', 'personal projects'],
      completedCourses: ['Python Basics', 'JavaScript Fundamentals'],
      solvedProblems: 45,
      currentStreak: 12,
      weakAreas: ['algorithms', 'data structures', 'system design'],
      strongAreas: ['frontend development', 'python basics'],
      recentActivity: ['completed Python course', 'solved 5 problems yesterday'],
    });
  });

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const [learningPaths, problems] = await Promise.all([
        generateLearningPaths(),
        generateProblemRecommendations(),
      ]);

      setRecommendations({
        learningPaths,
        problems,
        courses: generateCourseRecommendations(),
        resources: generateResourceRecommendations(),
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const generateLearningPaths = async (): Promise<LearningPathEnhanced[]> => {
    if (!userProfile) return [];

    try {
      const paths = await EnhancedAIService.getInstance().generateLearningPath(userProfile);
      return Array.isArray(paths) ? paths : [paths];
    } catch (error) {
      // Fallback mock data
      return [
        {
          id: '1',
          title: 'Full Stack Web Development',
          description: 'Complete path to become a full stack developer',
          difficulty: 'intermediate',
          estimatedDuration: { minimum: 120, average: 180, maximum: 240 },
          prerequisites: [
            { skill: 'HTML/CSS', level: 'beginner', required: true },
            { skill: 'JavaScript', level: 'beginner', required: true },
          ],
          modules: [
            {
              id: '1',
              title: 'Frontend Fundamentals',
              description: 'Master HTML, CSS, and JavaScript',
              type: 'lesson',
              duration: 30,
              order: 1,
              content: {
                topics: ['HTML5', 'CSS3', 'JavaScript ES6+'],
                skills: ['web development', 'frontend'],
                objectives: ['Build responsive websites', 'Understand DOM manipulation'],
              },
              resources: [],
              assessment: { type: 'quiz', questions: 20, passScore: 80 },
            },
          ],
          outcomes: [
            { skill: 'Frontend Development', level: 'advanced', confidence: 0.9 },
            { skill: 'Backend Development', level: 'intermediate', confidence: 0.8 },
          ],
          personalization: {
            adaptedToUser: true,
            adaptationReasons: ['Matches your interests', 'Builds on existing skills'],
            userLevel: 'intermediate',
            learningStyle: 'visual',
          },
          progress: {
            completedModules: 0,
            totalModules: 12,
            averageScore: 0,
            timeSpent: 0,
            lastAccessed: new Date().toISOString(),
          },
        },
      ];
    }
  };

  const generateProblemRecommendations = async (): Promise<ProblemRecommendationEnhanced[]> => {
    if (!userProfile) return [];

    try {
      const problems = await EnhancedAIService.getInstance().getProblemRecommendations(userProfile);
      return problems;
    } catch (error) {
      // Fallback mock data
      return [
        {
          id: '1',
          title: 'Two Sum Problem',
          description: 'Find two numbers that add up to a target sum',
          difficulty: 'easy',
          category: 'arrays',
          tags: ['arrays', 'hashing', 'two-pointers'],
          estimatedTime: 15,
          successRate: 85,
          averageAttempts: 2,
          reasoning: {
            whyRecommended: 'Good practice for array manipulation',
            skillMatch: 0.8,
            difficultyMatch: 0.9,
            interestMatch: 0.7,
            prerequisites: ['arrays', 'loops'],
            learningObjectives: ['Hash tables', 'Two pointers technique'],
          },
          personalization: {
            adaptedToUser: true,
            userSkillLevel: 'intermediate',
            userInterests: ['algorithms'],
            userWeaknesses: ['arrays'],
            adaptationFactors: [
              { factor: 'skill_level', weight: 0.3, impact: 'Appropriate difficulty' },
              { factor: 'weaknesses', weight: 0.4, impact: 'Targets weak areas' },
            ],
          },
          hints: [
            { level: 1, content: 'Use a hash map for O(n) solution', type: 'general', cost: 5 },
            { level: 2, content: 'Consider using two pointers approach', type: 'specific', cost: 10 },
          ],
          solution: {
            code: 'def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []',
            explanation: 'Use hash map to store seen numbers and their indices',
            complexity: 'O(n)',
            alternatives: [
              {
                approach: 'Brute Force',
                code: 'def twoSum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []',
                pros: ['Simple to understand'],
                cons: ['O(n²) time complexity'],
              },
            ],
          },
        },
      ];
    }
  };

  const generateCourseRecommendations = () => {
    if (!userProfile) return [];

    return [
      {
        id: '1',
        title: 'React.js Complete Guide',
        description: 'Master React from basics to advanced concepts',
        provider: 'Udemy',
        duration: 40,
        level: 'intermediate',
        rating: 4.8,
        students: 15000,
        price: 89.99,
        topics: ['React', 'JavaScript', 'Frontend'],
        matchReason: 'Builds on your JavaScript skills',
        matchScore: 0.85,
      },
      {
        id: '2',
        title: 'Machine Learning A-Z',
        description: 'Comprehensive ML course with hands-on projects',
        provider: 'Coursera',
        duration: 60,
        level: 'beginner',
        rating: 4.6,
        students: 25000,
        price: 79.99,
        topics: ['Machine Learning', 'Python', 'Data Science'],
        matchReason: 'Matches your interest in AI/ML',
        matchScore: 0.92,
      },
    ];
  };

  const generateResourceRecommendations = () => {
    if (!userProfile) return [];

    return [
      {
        id: '1',
        title: 'JavaScript: The Good Parts',
        type: 'book',
        author: 'Douglas Crockford',
        description: 'Essential guide to JavaScript best practices',
        rating: 4.5,
        pages: 176,
        price: 29.99,
        topics: ['JavaScript', 'Programming', 'Best Practices'],
        matchReason: 'Improves your JavaScript foundation',
        matchScore: 0.78,
      },
      {
        id: '2',
        title: 'Clean Code',
        type: 'book',
        author: 'Robert C. Martin',
        description: 'Write clean, maintainable code',
        rating: 4.7,
        pages: 464,
        price: 39.99,
        topics: ['Programming', 'Software Engineering', 'Best Practices'],
        matchReason: 'Essential for professional development',
        matchScore: 0.88,
      },
    ];
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };

  const RecommendationCard = ({ item, type, onPress }: any) => {
    const getIcon = () => {
      switch (type) {
        case 'learning':
          return 'map-outline';
        case 'problems':
          return 'extension-puzzle-outline';
        case 'courses':
          return 'book-outline';
        case 'resources':
          return 'library-outline';
        default:
          return 'star-outline';
      }
    };

    const getColor = () => {
      switch (type) {
        case 'learning':
          return '#FF9800';
        case 'problems':
          return '#4CAF50';
        case 'courses':
          return '#007AFF';
        case 'resources':
          return '#9C27B0';
        default:
          return '#666';
      }
    };

    return (
      <TouchableOpacity style={styles.recommendationCard} onPress={onPress}>
        <View style={styles.recommendationHeader}>
          <View style={styles.recommendationIcon}>
            <ResponsiveIcon name={getIcon()} size="lg" color={getColor()} />
          </View>
          <View style={styles.recommendationInfo}>
            <ResponsiveText variant="md" style={styles.recommendationTitle}>
              {item.title}
            </ResponsiveText>
            <ResponsiveText variant="sm" style={styles.recommendationDescription}>
              {item.description}
            </ResponsiveText>
          </View>
          <View style={styles.recommendationMeta}>
            {type === 'learning' && (
              <ResponsiveText variant="sm" style={styles.recommendationMetaText}>
                {item.difficulty}
              </ResponsiveText>
            )}
            {type === 'problems' && (
              <ResponsiveText variant="sm" style={styles.recommendationMetaText}>
                {item.difficulty}
              </ResponsiveText>
            )}
            {type === 'courses' && (
              <ResponsiveText variant="sm" style={styles.recommendationMetaText}>
                {item.level}
              </ResponsiveText>
            )}
            {type === 'resources' && (
              <ResponsiveText variant="sm" style={styles.recommendationMetaText}>
                {item.type}
              </ResponsiveText>
            )}
          </View>
        </View>

        <View style={styles.recommendationDetails}>
          {type === 'learning' && (
            <>
              <ResponsiveText variant="sm" style={styles.recommendationDetail}>
                Duration: {item.estimatedDuration?.average || 0} hours
              </ResponsiveText>
              <ResponsiveText variant="sm" style={styles.recommendationDetail}>
                Modules: {item.modules?.length || 0}
              </ResponsiveText>
            </>
          )}
          {type === 'problems' && (
            <>
              <ResponsiveText variant="sm" style={styles.recommendationDetail}>
                Success Rate: {item.successRate}%
              </ResponsiveText>
              <ResponsiveText variant="sm" style={styles.recommendationDetail}>
                Time: {item.estimatedTime} min
              </ResponsiveText>
            </>
          )}
          {type === 'courses' && (
            <>
              <ResponsiveText variant="sm" style={styles.recommendationDetail}>
                Rating: {item.rating} ⭐
              </ResponsiveText>
              <ResponsiveText variant="sm" style={styles.recommendationDetail}>
                Duration: {item.duration} hours
              </ResponsiveText>
            </>
          )}
          {type === 'resources' && (
            <>
              <ResponsiveText variant="sm" style={styles.recommendationDetail}>
                Rating: {item.rating} ⭐
              </ResponsiveText>
              <ResponsiveText variant="sm" style={styles.recommendationDetail}>
                {item.pages} pages
              </ResponsiveText>
            </>
          )}
        </View>

        {item.reasoning?.whyRecommended && (
          <View style={styles.recommendationReason}>
            <ResponsiveIcon name="bulb-outline" size="sm" color="#FF9800" />
            <ResponsiveText variant="sm" style={styles.recommendationReasonText}>
              {item.reasoning.whyRecommended}
            </ResponsiveText>
          </View>
        )}

        {item.matchReason && (
          <View style={styles.recommendationReason}>
            <ResponsiveIcon name="bulb-outline" size="sm" color="#FF9800" />
            <ResponsiveText variant="sm" style={styles.recommendationReasonText}>
              {item.matchReason}
            </ResponsiveText>
          </View>
        )}

        <View style={styles.recommendationActions}>
          <ResponsiveButton variant="outline" style={styles.recommendationButton}>
            <ResponsiveIcon name="eye-outline" size="sm" />
            <ResponsiveText variant="sm">View</ResponsiveText>
          </ResponsiveButton>
          <ResponsiveButton variant="primary" style={styles.recommendationButton}>
            <ResponsiveIcon name="play-outline" size="sm" />
            <ResponsiveText variant="sm">Start</ResponsiveText>
          </ResponsiveButton>
        </View>
      </TouchableOpacity>
    );
  };

  const CategoryTab = ({ category, label, icon, count }: any) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        selectedCategory === category && styles.categoryTabActive,
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <ResponsiveIcon
        name={icon}
        size="md"
        color={selectedCategory === category ? '#fff' : '#666'}
      />
      <ResponsiveText
        variant="sm"
        style={[
          styles.categoryTabText,
          selectedCategory === category && styles.categoryTabTextActive,
        ]}
      >
        {label}
      </ResponsiveText>
      {count > 0 && (
        <View style={styles.categoryBadge}>
          <ResponsiveText variant="xs" style={styles.categoryBadgeText}>
            {count}
          </ResponsiveText>
        </View>
      )}
    </TouchableOpacity>
  );

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
            AI Recommendations
          </ResponsiveText>
          <ResponsiveText variant="md" style={styles.subtitle}>
            Personalized recommendations based on your learning profile
          </ResponsiveText>
        </View>

        {/* User Profile Summary */}
        {userProfile && (
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <ResponsiveText variant="lg" style={styles.sectionTitle}>
              Your Learning Profile
            </ResponsiveText>
            <View style={styles.profileGrid}>
              <View style={styles.profileItem}>
                <ResponsiveIcon name="school-outline" size="md" color="#007AFF" />
                <ResponsiveText variant="sm">Level: {userProfile.skillLevel}</ResponsiveText>
              </View>
              <View style={styles.profileItem}>
                <ResponsiveIcon name="time-outline" size="md" color="#4CAF50" />
                <ResponsiveText variant="sm">{userProfile.timeAvailable}h/week</ResponsiveText>
              </View>
              <View style={styles.profileItem}>
                <ResponsiveIcon name="flame-outline" size="md" color="#FF9800" />
                <ResponsiveText variant="sm">{userProfile.currentStreak} day streak</ResponsiveText>
              </View>
              <View style={styles.profileItem}>
                <ResponsiveIcon name="code-outline" size="md" color="#9C27B0" />
                <ResponsiveText variant="sm">{userProfile.solvedProblems} problems solved</ResponsiveText>
              </View>
            </View>
          </Card>
        )}

        {/* Category Tabs */}
        <View style={styles.categoryTabs}>
          <CategoryTab
            category="all"
            label="All"
            icon="grid-outline"
            count={recommendations.learningPaths.length + recommendations.problems.length + recommendations.courses.length + recommendations.resources.length}
          />
          <CategoryTab
            category="learning"
            label="Learning"
            icon="map-outline"
            count={recommendations.learningPaths.length}
          />
          <CategoryTab
            category="problems"
            label="Problems"
            icon="extension-puzzle-outline"
            count={recommendations.problems.length}
          />
          <CategoryTab
            category="courses"
            label="Courses"
            icon="book-outline"
            count={recommendations.courses.length}
          />
          <CategoryTab
            category="resources"
            label="Resources"
            icon="library-outline"
            count={recommendations.resources.length}
          />
        </View>

        {/* Recommendations */}
        <View style={styles.recommendations}>
          {selectedCategory === 'all' && (
            <>
              {recommendations.learningPaths.length > 0 && (
                <View style={styles.recommendationSection}>
                  <ResponsiveText variant="lg" style={styles.sectionTitle}>
                    Learning Paths
                  </ResponsiveText>
                  {recommendations.learningPaths.slice(0, 2).map((item) => (
                    <RecommendationCard
                      key={item.id}
                      item={item}
                      type="learning"
                      onPress={() => console.log('Navigate to learning path:', item.id)}
                    />
                  ))}
                </View>
              )}

              {recommendations.problems.length > 0 && (
                <View style={styles.recommendationSection}>
                  <ResponsiveText variant="lg" style={styles.sectionTitle}>
                    Problem Recommendations
                  </ResponsiveText>
                  {recommendations.problems.slice(0, 2).map((item) => (
                    <RecommendationCard
                      key={item.id}
                      item={item}
                      type="problems"
                      onPress={() => console.log('Navigate to problem:', item.id)}
                    />
                  ))}
                </View>
              )}

              {recommendations.courses.length > 0 && (
                <View style={styles.recommendationSection}>
                  <ResponsiveText variant="lg" style={styles.sectionTitle}>
                    Course Recommendations
                  </ResponsiveText>
                  {recommendations.courses.slice(0, 2).map((item) => (
                    <RecommendationCard
                      key={item.id}
                      item={item}
                      type="courses"
                      onPress={() => console.log('Navigate to course:', item.id)}
                    />
                  ))}
                </View>
              )}

              {recommendations.resources.length > 0 && (
                <View style={styles.recommendationSection}>
                  <ResponsiveText variant="lg" style={styles.sectionTitle}>
                    Resource Recommendations
                  </ResponsiveText>
                  {recommendations.resources.slice(0, 2).map((item) => (
                    <RecommendationCard
                      key={item.id}
                      item={item}
                      type="resources"
                      onPress={() => console.log('Navigate to resource:', item.id)}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {selectedCategory === 'learning' && (
            <View style={styles.recommendationSection}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Learning Paths
              </ResponsiveText>
              {recommendations.learningPaths.map((item) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                  type="learning"
                  onPress={() => console.log('Navigate to learning path:', item.id)}
                />
              ))}
            </View>
          )}

          {selectedCategory === 'problems' && (
            <View style={styles.recommendationSection}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Problem Recommendations
              </ResponsiveText>
              {recommendations.problems.map((item) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                  type="problems"
                  onPress={() => console.log('Navigate to problem:', item.id)}
                />
              ))}
            </View>
          )}

          {selectedCategory === 'courses' && (
            <View style={styles.recommendationSection}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Course Recommendations
              </ResponsiveText>
              {recommendations.courses.map((item) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                  type="courses"
                  onPress={() => console.log('Navigate to course:', item.id)}
                />
              ))}
            </View>
          )}

          {selectedCategory === 'resources' && (
            <View style={styles.recommendationSection}>
              <ResponsiveText variant="lg" style={styles.sectionTitle}>
                Resource Recommendations
              </ResponsiveText>
              {recommendations.resources.map((item) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                  type="resources"
                  onPress={() => console.log('Navigate to resource:', item.id)}
                />
              ))}
            </View>
          )}
        </View>
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
    marginBottom: 5,
  },
  subtitle: {
    color: '#666',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  categoryTabs: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    padding: 5,
    marginBottom: 20,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 5,
    position: 'relative',
  },
  categoryTabActive: {
    backgroundColor: '#007AFF',
  },
  categoryTabText: {
    color: '#666',
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  categoryBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  recommendations: {
    marginBottom: 20,
  },
  recommendationSection: {
    marginBottom: 20,
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  recommendationDescription: {
    color: '#666',
    marginBottom: 5,
  },
  recommendationMeta: {
    alignItems: 'flex-end',
  },
  recommendationMetaText: {
    color: '#666',
    fontStyle: 'italic',
  },
  recommendationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recommendationDetail: {
    color: '#666',
  },
  recommendationReason: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  recommendationReasonText: {
    color: '#666',
    marginLeft: 5,
    flex: 1,
  },
  recommendationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recommendationButton: {
    flex: 1,
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
});

export default AIRecommendationsScreen;
