import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { width } = Dimensions.get('window');

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  enrollment_count: number;
  rating: number;
  instructor: string;
  topics: string[];
  is_enrolled: boolean;
  progress?: number;
}

const CoursesScreen: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [searchText, selectedDifficulty, courses]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/courses');
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchText.toLowerCase()) ||
        course.description.toLowerCase().includes(searchText.toLowerCase()) ||
        course.topics.some(topic => topic.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty === selectedDifficulty);
    }

    setFilteredCourses(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const handleEnrollment = async (courseId: string) => {
    try {
      await axios.post(`/api/v1/courses/${courseId}/enroll`);
      await loadCourses(); // Refresh courses to update enrollment status
    } catch (error: any) {
      console.error('Enrollment failed:', error);
      alert(error.response?.data?.message || 'Enrollment failed');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FF9800';
      case 'advanced':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const CourseCard = ({ course }: { course: Course }) => (
    <TouchableOpacity style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseInstructor}>by {course.instructor}</Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(course.difficulty) }]}>
          <Text style={styles.difficultyText}>{course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}</Text>
        </View>
      </View>

      <Text style={styles.courseDescription} numberOfLines={2}>
        {course.description}
      </Text>

      <View style={styles.courseStats}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.statText}>{course.duration} weeks</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.statText}>{course.enrollment_count} enrolled</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.statText}>{course.rating.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.topicsContainer}>
        {course.topics.slice(0, 3).map((topic, index) => (
          <View key={index} style={styles.topicTag}>
            <Text style={styles.topicText}>{topic}</Text>
          </View>
        ))}
        {course.topics.length > 3 && (
          <Text style={styles.moreTopicsText}>+{course.topics.length - 3} more</Text>
        )}
      </View>

      {course.is_enrolled && course.progress !== undefined && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Progress: {course.progress}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.enrollButton,
          course.is_enrolled && styles.continueButton,
        ]}
        onPress={() => handleEnrollment(course.id)}
      >
        <Text style={[
          styles.enrollButtonText,
          course.is_enrolled && styles.continueButtonText,
        ]}>
          {course.is_enrolled ? 'Continue Learning' : 'Enroll Now'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Courses</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Difficulty Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {['all', 'beginner', 'intermediate', 'advanced'].map((difficulty) => (
          <TouchableOpacity
            key={difficulty}
            style={[
              styles.filterChip,
              selectedDifficulty === difficulty && styles.filterChipActive,
            ]}
            onPress={() => setSelectedDifficulty(difficulty)}
          >
            <Text style={[
              styles.filterChipText,
              selectedDifficulty === difficulty && styles.filterChipTextActive,
            ]}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Courses List */}
      <ScrollView
        style={styles.coursesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No courses found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        )}
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterContent: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  coursesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  courseCard: {
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
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#666',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  topicTag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  topicText: {
    fontSize: 12,
    color: '#007AFF',
  },
  moreTopicsText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  enrollButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
  },
  enrollButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButtonText: {
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default CoursesScreen;
