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
import SocialService, { ForumPost, ForumReply } from '../services/socialService';

const { width } = Dimensions.get('window');

const ForumScreen: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<ForumPost[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const socialService = SocialService.getInstance();

  useEffect(() => {
    loadForumPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [searchText, selectedCategory, posts]);

  const loadForumPosts = async () => {
    try {
      setLoading(true);
      const forumPosts = await socialService.getForumPosts();
      setPosts(forumPosts);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to load forum posts');
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchText.toLowerCase()) ||
        post.content.toLowerCase().includes(searchText.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    setFilteredPosts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadForumPosts();
    setRefreshing(false);
  };

  const handleVotePost = async (postId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const success = await socialService.votePost(postId, voteType);
      if (success) {
        await loadForumPosts();
      }
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to vote on post');
    }
  };

  const handleViewReplies = async (post: ForumPost) => {
    try {
      const postReplies = await socialService.getForumReplies(post.id);
      setReplies(postReplies);
      setSelectedPost(post);
      setShowReplies(true);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to load replies');
    }
  };

  const categories = ['all', 'general', 'help', 'discussion', 'announcements', 'resources'];

  const ForumPostCard = ({ post }: { post: ForumPost }) => (
    <TouchableOpacity style={styles.postCard} onPress={() => handleViewReplies(post)}>
      <View style={styles.postHeader}>
        <View style={styles.postInfo}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postAuthor}>by {post.author_name}</Text>
        </View>
        <View style={styles.postBadges}>
          {post.is_pinned && (
            <View style={styles.pinnedBadge}>
              <Ionicons name="pin" size={12} color="#fff" />
              <Text style={styles.badgeText}>Pinned</Text>
            </View>
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.badgeText}>{post.category}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.postContent} numberOfLines={3}>
        {post.content}
      </Text>

      {post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {post.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{post.tags.length - 3} more</Text>
          )}
        </View>
      )}

      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <TouchableOpacity
            style={styles.voteButton}
            onPress={() => handleVotePost(post.id, 'upvote')}
          >
            <Ionicons name="arrow-up" size={16} color="#4CAF50" />
            <Text style={styles.statText}>{post.upvotes}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statItem}>
          <TouchableOpacity
            style={styles.voteButton}
            onPress={() => handleVotePost(post.id, 'downvote')}
          >
            <Ionicons name="arrow-down" size={16} color="#F44336" />
            <Text style={styles.statText}>{post.downvotes}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.statText}>{post.replies}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="eye-outline" size={16} color="#666" />
          <Text style={styles.statText}>{post.views}</Text>
        </View>
        <View style={styles.timeItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.timeText}>
            {new Date(post.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ForumReplyCard = ({ reply }: { reply: ForumReply }) => (
    <View style={styles.replyCard}>
      <View style={styles.replyHeader}>
        <Text style={styles.replyAuthor}>{reply.author_name}</Text>
        <View style={styles.replyTime}>
          <Ionicons name="time-outline" size={12} color="#666" />
          <Text style={styles.replyTimeText}>
            {new Date(reply.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text style={styles.replyContent}>{reply.content}</Text>
      <View style={styles.replyStats}>
        <View style={styles.replyVoteItem}>
          <Ionicons name="arrow-up" size={14} color="#4CAF50" />
          <Text style={styles.replyStatText}>{reply.upvotes}</Text>
        </View>
        <View style={styles.replyVoteItem}>
          <Ionicons name="arrow-down" size={14} color="#F44336" />
          <Text style={styles.replyStatText}>{reply.downvotes}</Text>
        </View>
        {reply.is_solution && (
          <View style={styles.solutionBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
            <Text style={styles.solutionText}>Solution</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (showReplies && selectedPost) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.repliesHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setShowReplies(false)}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.repliesTitle}>{selectedPost.title}</Text>
        </View>

        <ScrollView style={styles.repliesContainer}>
          <View style={styles.originalPost}>
            <View style={styles.postHeader}>
              <View style={styles.postInfo}>
                <Text style={styles.postTitle}>{selectedPost.title}</Text>
                <Text style={styles.postAuthor}>by {selectedPost.author_name}</Text>
              </View>
              <View style={styles.postBadges}>
                {selectedPost.is_pinned && (
                  <View style={styles.pinnedBadge}>
                    <Ionicons name="pin" size={12} color="#fff" />
                    <Text style={styles.badgeText}>Pinned</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.postContent}>{selectedPost.content}</Text>
            <View style={styles.postStats}>
              <View style={styles.statItem}>
                <Ionicons name="arrow-up" size={16} color="#4CAF50" />
                <Text style={styles.statText}>{selectedPost.upvotes}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="arrow-down" size={16} color="#F44336" />
                <Text style={styles.statText}>{selectedPost.downvotes}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="chatbubble-outline" size={16} color="#666" />
                <Text style={styles.statText}>{selectedPost.replies}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={16} color="#666" />
                <Text style={styles.statText}>{selectedPost.views}</Text>
              </View>
            </View>
          </View>

          <View style={styles.repliesSection}>
            <Text style={styles.repliesSectionTitle}>
              Replies ({replies.length})
            </Text>
            {replies.map((reply) => (
              <ForumReplyCard key={reply.id} reply={reply} />
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.replyButton}>
          <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.replyButtonText}>Add Reply</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forum</Text>
        <TouchableOpacity style={styles.createButton}>
          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search forum posts..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category && styles.categoryChipTextActive,
            ]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Forum Posts List */}
      <ScrollView
        style={styles.postsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <ForumPostCard key={post.id} post={post} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No forum posts found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchText || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Be the first to start a discussion!'}
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
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  postsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  postCard: {
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
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  postInfo: {
    flex: 1,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  postAuthor: {
    fontSize: 14,
    color: '#666',
  },
  postBadges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#007AFF',
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
  postContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
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
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  repliesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  repliesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  repliesContainer: {
    flex: 1,
  },
  originalPost: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  repliesSection: {
    margin: 20,
  },
  repliesSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  replyCard: {
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
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  replyAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  replyTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyTimeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  replyContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  replyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  replyVoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  solutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  solutionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 4,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  replyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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

export default ForumScreen;
