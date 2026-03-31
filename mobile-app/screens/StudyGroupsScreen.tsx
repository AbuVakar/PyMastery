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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SocialService, { StudyGroup } from '../services/socialService';

const { width } = Dimensions.get('window');

const StudyGroupsScreen: React.FC = () => {
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<StudyGroup[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const socialService = SocialService.getInstance();

  useEffect(() => {
    loadStudyGroups();
  }, []);

  useEffect(() => {
    filterGroups();
  }, [searchText, selectedFilter, studyGroups]);

  const loadStudyGroups = async () => {
    try {
      setLoading(true);
      const groups = await socialService.getStudyGroups();
      setStudyGroups(groups);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to load study groups');
    } finally {
      setLoading(false);
    }
  };

  const filterGroups = () => {
    let filtered = studyGroups;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchText.toLowerCase()) ||
        group.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by type
    if (selectedFilter === 'my') {
      // Filter for groups user is a member of
      filtered = filtered.filter(group => 
        group.members.some(member => member.role !== 'guest')
      );
    } else if (selectedFilter === 'public') {
      filtered = filtered.filter(group => !group.is_private);
    } else if (selectedFilter === 'private') {
      filtered = filtered.filter(group => group.is_private);
    }

    setFilteredGroups(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudyGroups();
    setRefreshing(false);
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const success = await socialService.joinStudyGroup(groupId);
      if (success) {
        Alert.alert('Success', 'You have joined the study group!');
        await loadStudyGroups();
      }
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to join study group');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this study group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await socialService.leaveStudyGroup(groupId);
              if (success) {
                Alert.alert('Success', 'You have left the study group!');
                await loadStudyGroups();
              }
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to leave study group');
            }
          },
        },
      ]
    );
  };

  const isUserMember = (group: StudyGroup) => {
    return group.members.length > 0; // Simplified check for demo
  };

  const getUserRole = (group: StudyGroup) => {
    return 'member'; // Simplified for demo
  };

  const StudyGroupCard = ({ group }: { group: StudyGroup }) => {
    const isMember = isUserMember(group);
    const userRole = getUserRole(group);

    return (
      <View style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupDescription} numberOfLines={2}>
              {group.description}
            </Text>
          </View>
          <View style={styles.groupBadges}>
            {group.is_private && (
              <View style={styles.privateBadge}>
                <Ionicons name="lock-closed" size={12} color="#fff" />
                <Text style={styles.badgeText}>Private</Text>
              </View>
            )}
            {isMember && (
              <View style={styles.memberBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                <Text style={styles.badgeText}>Member</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.groupStats}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.statText}>{group.members.length} members</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="book-outline" size={16} color="#666" />
            <Text style={styles.statText}>{group.courses.length} courses</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="code-outline" size={16} color="#666" />
            <Text style={styles.statText}>{group.problems.length} problems</Text>
          </View>
        </View>

        {group.courses.length > 0 && (
          <View style={styles.coursesContainer}>
            <Text style={styles.coursesTitle}>Courses:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {group.courses.slice(0, 3).map((course, index) => (
                <View key={index} style={styles.courseTag}>
                  <Text style={styles.courseText}>{course}</Text>
                </View>
              ))}
              {group.courses.length > 3 && (
                <Text style={styles.moreCoursesText}>+{group.courses.length - 3} more</Text>
              )}
            </ScrollView>
          </View>
        )}

        <View style={styles.groupActions}>
          <TouchableOpacity style={styles.viewButton}>
            <Ionicons name="eye-outline" size={16} color="#007AFF" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>

          {isMember ? (
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={() => handleLeaveGroup(group.id)}
            >
              <Ionicons name="exit-outline" size={16} color="#F44336" />
              <Text style={styles.leaveButtonText}>Leave</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => handleJoinGroup(group.id)}
            >
              <Ionicons name="add-circle-outline" size={16} color="#4CAF50" />
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          )}
        </View>

        {group.invite_code && (
          <View style={styles.inviteSection}>
            <Text style={styles.inviteLabel}>Invite Code:</Text>
            <Text style={styles.inviteCode}>{group.invite_code}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Groups</Text>
        <TouchableOpacity style={styles.createButton}>
          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search study groups..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'my', 'public', 'private'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterChipText,
              selectedFilter === filter && styles.filterChipTextActive,
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Study Groups List */}
      <ScrollView
        style={styles.groupsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <StudyGroupCard key={group.id} group={group} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No study groups found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchText || selectedFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create or join a study group to get started'}
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
  createButton: {
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
  groupsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  groupCard: {
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
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  groupBadges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 4,
  },
  groupStats: {
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
  coursesContainer: {
    marginBottom: 15,
  },
  coursesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  courseTag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  courseText: {
    fontSize: 12,
    color: '#007AFF',
  },
  moreCoursesText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  leaveButtonText: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 4,
    fontWeight: '500',
  },
  inviteSection: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  inviteLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  inviteCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
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

export default StudyGroupsScreen;
