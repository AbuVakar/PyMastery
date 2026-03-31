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

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  category: string;
  tags: string[];
  solved_count: number;
  submission_count: number;
  is_solved: boolean;
  attempts: number;
  best_score?: number;
}

const ProblemsScreen: React.FC = () => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProblems();
  }, []);

  useEffect(() => {
    filterProblems();
  }, [searchText, selectedDifficulty, selectedCategory, problems]);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/problems');
      if (response.data.success) {
        setProblems(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProblems = () => {
    let filtered = problems;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(problem =>
        problem.title.toLowerCase().includes(searchText.toLowerCase()) ||
        problem.description.toLowerCase().includes(searchText.toLowerCase()) ||
        problem.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(problem => problem.difficulty === selectedDifficulty);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(problem => problem.category === selectedCategory);
    }

    setFilteredProblems(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProblems();
    setRefreshing(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getSuccessRate = (problem: Problem) => {
    if (problem.submission_count === 0) return 0;
    return ((problem.solved_count / problem.submission_count) * 100).toFixed(1);
  };

  const ProblemCard = ({ problem }: { problem: Problem }) => (
    <TouchableOpacity style={styles.problemCard}>
      <View style={styles.problemHeader}>
        <View style={styles.problemInfo}>
          <Text style={styles.problemTitle}>{problem.title}</Text>
          <Text style={styles.problemCategory}>{problem.category}</Text>
        </View>
        <View style={styles.problemBadges}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(problem.difficulty) }]}>
            <Text style={styles.difficultyText}>{problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>{problem.points} pts</Text>
          </View>
        </View>
      </View>

      <Text style={styles.problemDescription} numberOfLines={3}>
        {problem.description}
      </Text>

      <View style={styles.problemStats}>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
          <Text style={styles.statText}>{problem.solved_count} solved</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.statText}>{problem.submission_count} attempts</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="analytics-outline" size={16} color="#007AFF" />
          <Text style={styles.statText}>{getSuccessRate(problem)}% success</Text>
        </View>
      </View>

      <View style={styles.tagsContainer}>
        {problem.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {problem.tags.length > 3 && (
          <Text style={styles.moreTagsText}>+{problem.tags.length - 3} more</Text>
        )}
      </View>

      {problem.is_solved && (
        <View style={styles.solvedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="white" />
          <Text style={styles.solvedText}>Solved</Text>
        </View>
      )}

      {problem.attempts > 0 && !problem.is_solved && (
        <View style={styles.attemptsContainer}>
          <Text style={styles.attemptsText}>
            {problem.attempts} attempt{problem.attempts > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.solveButton}>
        <Text style={styles.solveButtonText}>
          {problem.is_solved ? 'View Solution' : 'Solve Problem'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const categories = ['all', ...Array.from(new Set(problems.map(p => p.category)))];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Problems</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search problems..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Difficulty:</Text>
          {['all', 'easy', 'medium', 'hard'].map((difficulty) => (
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
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Category:</Text>
          {categories.slice(0, 5).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.filterChipText,
                selectedCategory === category && styles.filterChipTextActive,
              ]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Problems List */}
      <ScrollView
        style={styles.problemsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredProblems.length > 0 ? (
          filteredProblems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="code-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No problems found</Text>
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
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterGroup: {
    marginRight: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'white',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  problemsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  problemCard: {
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
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  problemInfo: {
    flex: 1,
  },
  problemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  problemCategory: {
    fontSize: 14,
    color: '#666',
  },
  problemBadges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  pointsBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  problemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  problemStats: {
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  tag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#007AFF',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  solvedBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  solvedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  attemptsContainer: {
    marginBottom: 15,
  },
  attemptsText: {
    fontSize: 14,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  solveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  solveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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

export default ProblemsScreen;
