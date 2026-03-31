import axios from 'axios';

// Social Features Configuration
const SOCIAL_BASE_URL = 'http://localhost:8000/api/v1/social';

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  members: Array<{
    user_id: string;
    name: string;
    email: string;
    role: 'admin' | 'moderator' | 'member';
    joined_at: string;
  }>;
  courses: string[];
  problems: string[];
  is_private: boolean;
  invite_code?: string;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  category: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  replies: number;
  views: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForumReply {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  upvotes: number;
  downvotes: number;
  is_solution: boolean;
  created_at: string;
  updated_at: string;
}

export interface LiveSession {
  id: string;
  title: string;
  description: string;
  host_id: string;
  host_name: string;
  participants: Array<{
    user_id: string;
    name: string;
    joined_at: string;
  }>;
  code: string;
  language: string;
  is_active: boolean;
  max_participants: number;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  requirements: string[];
  progress: number;
  max_progress: number;
  earned_at?: string;
}

class SocialService {
  private static instance: SocialService;

  static getInstance(): SocialService {
    if (!SocialService.instance) {
      SocialService.instance = new SocialService();
    }
    return SocialService.instance;
  }

  // Study Groups
  async getStudyGroups(): Promise<StudyGroup[]> {
    try {
      const response = await axios.get(`${SOCIAL_BASE_URL}/study-groups`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get study groups');
      }
    } catch (error: any) {
      console.error('Get Study Groups Error:', error);
      throw error.response?.data?.message || 'Failed to get study groups';
    }
  }

  async createStudyGroup(data: {
    name: string;
    description: string;
    is_private: boolean;
    courses?: string[];
    problems?: string[];
  }): Promise<StudyGroup> {
    try {
      const response = await axios.post(`${SOCIAL_BASE_URL}/study-groups`, data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create study group');
      }
    } catch (error: any) {
      console.error('Create Study Group Error:', error);
      throw error.response?.data?.message || 'Failed to create study group';
    }
  }

  async joinStudyGroup(groupId: string, inviteCode?: string): Promise<boolean> {
    try {
      const response = await axios.post(`${SOCIAL_BASE_URL}/study-groups/${groupId}/join`, {
        invite_code: inviteCode,
      });
      
      if (response.data.success) {
        return response.data.data.success;
      } else {
        throw new Error(response.data.message || 'Failed to join study group');
      }
    } catch (error: any) {
      console.error('Join Study Group Error:', error);
      throw error.response?.data?.message || 'Failed to join study group';
    }
  }

  async leaveStudyGroup(groupId: string): Promise<boolean> {
    try {
      const response = await axios.post(`${SOCIAL_BASE_URL}/study-groups/${groupId}/leave`);
      
      if (response.data.success) {
        return response.data.data.success;
      } else {
        throw new Error(response.data.message || 'Failed to leave study group');
      }
    } catch (error: any) {
      console.error('Leave Study Group Error:', error);
      throw error.response?.data?.message || 'Failed to leave study group';
    }
  }

  // Forum Posts
  async getForumPosts(category?: string, limit: number = 20): Promise<ForumPost[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('limit', limit.toString());

      const response = await axios.get(`${SOCIAL_BASE_URL}/forum/posts?${params}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get forum posts');
      }
    } catch (error: any) {
      console.error('Get Forum Posts Error:', error);
      throw error.response?.data?.message || 'Failed to get forum posts';
    }
  }

  async createForumPost(data: {
    title: string;
    content: string;
    category: string;
    tags?: string[];
  }): Promise<ForumPost> {
    try {
      const response = await axios.post(`${SOCIAL_BASE_URL}/forum/posts`, data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create forum post');
      }
    } catch (error: any) {
      console.error('Create Forum Post Error:', error);
      throw error.response?.data?.message || 'Failed to create forum post';
    }
  }

  async getForumReplies(postId: string): Promise<ForumReply[]> {
    try {
      const response = await axios.get(`${SOCIAL_BASE_URL}/forum/posts/${postId}/replies`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get forum replies');
      }
    } catch (error: any) {
      console.error('Get Forum Replies Error:', error);
      throw error.response?.data?.message || 'Failed to get forum replies';
    }
  }

  async createForumReply(postId: string, content: string): Promise<ForumReply> {
    try {
      const response = await axios.post(`${SOCIAL_BASE_URL}/forum/posts/${postId}/replies`, {
        content,
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create forum reply');
      }
    } catch (error: any) {
      console.error('Create Forum Reply Error:', error);
      throw error.response?.data?.message || 'Failed to create forum reply';
    }
  }

  async votePost(postId: string, type: 'upvote' | 'downvote'): Promise<boolean> {
    try {
      const response = await axios.post(`${SOCIAL_BASE_URL}/forum/posts/${postId}/vote`, {
        type,
      });
      
      if (response.data.success) {
        return response.data.data.success;
      } else {
        throw new Error(response.data.message || 'Failed to vote post');
      }
    } catch (error: any) {
      console.error('Vote Post Error:', error);
      throw error.response?.data?.message || 'Failed to vote post';
    }
  }

  // Live Sessions
  async getLiveSessions(): Promise<LiveSession[]> {
    try {
      const response = await axios.get(`${SOCIAL_BASE_URL}/live-sessions`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get live sessions');
      }
    } catch (error: any) {
      console.error('Get Live Sessions Error:', error);
      throw error.response?.data?.message || 'Failed to get live sessions';
    }
  }

  async createLiveSession(data: {
    title: string;
    description: string;
    language: string;
    max_participants?: number;
  }): Promise<LiveSession> {
    try {
      const response = await axios.post(`${SOCIAL_BASE_URL}/live-sessions`, data);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create live session');
      }
    } catch (error: any) {
      console.error('Create Live Session Error:', error);
      throw error.response?.data?.message || 'Failed to create live session';
    }
  }

  async joinLiveSession(sessionId: string): Promise<boolean> {
    try {
      const response = await axios.post(`${SOCIAL_BASE_URL}/live-sessions/${sessionId}/join`);
      
      if (response.data.success) {
        return response.data.data.success;
      } else {
        throw new Error(response.data.message || 'Failed to join live session');
      }
    } catch (error: any) {
      console.error('Join Live Session Error:', error);
      throw error.response?.data?.message || 'Failed to join live session';
    }
  }

  async leaveLiveSession(sessionId: string): Promise<boolean> {
    try {
      const response = await axios.post(`${SOCIAL_BASE_URL}/live-sessions/${sessionId}/leave`);
      
      if (response.data.success) {
        return response.data.data.success;
      } else {
        throw new Error(response.data.message || 'Failed to leave live session');
      }
    } catch (error: any) {
      console.error('Leave Live Session Error:', error);
      throw error.response?.data?.message || 'Failed to leave live session';
    }
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    try {
      const response = await axios.get(`${SOCIAL_BASE_URL}/achievements`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get achievements');
      }
    } catch (error: any) {
      console.error('Get Achievements Error:', error);
      throw error.response?.data?.message || 'Failed to get achievements';
    }
  }

  async unlockAchievement(achievementId: string): Promise<Achievement> {
    try {
      const response = await axios.post(`${SOCIAL_BASE_URL}/achievements/${achievementId}/unlock`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to unlock achievement');
      }
    } catch (error: any) {
      console.error('Unlock Achievement Error:', error);
      throw error.response?.data?.message || 'Failed to unlock achievement';
    }
  }

  // Leaderboard
  async getLeaderboard(type: 'points' | 'problems' | 'streak' = 'points', limit: number = 10): Promise<Array<{
    rank: number;
    user_id: string;
    name: string;
    avatar_url?: string;
    value: number;
    change: number;
  }>> {
    try {
      const response = await axios.get(`${SOCIAL_BASE_URL}/leaderboard?type=${type}&limit=${limit}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get leaderboard');
      }
    } catch (error: any) {
      console.error('Get Leaderboard Error:', error);
      throw error.response?.data?.message || 'Failed to get leaderboard';
    }
  }

  // User Profile
  async getUserProfile(userId?: string): Promise<{
    user_id: string;
    name: string;
    email: string;
    avatar_url?: string;
    bio?: string;
    stats: {
      points: number;
      level: number;
      problems_solved: number;
      courses_completed: number;
      study_groups: number;
      forum_posts: number;
      achievements: number;
    };
    recent_activity: Array<{
      type: string;
      description: string;
      timestamp: string;
    }>;
  }> {
    try {
      const url = userId ? `${SOCIAL_BASE_URL}/users/${userId}` : `${SOCIAL_BASE_URL}/users/profile`;
      const response = await axios.get(url);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get user profile');
      }
    } catch (error: any) {
      console.error('Get User Profile Error:', error);
      throw error.response?.data?.message || 'Failed to get user profile';
    }
  }
}

export default SocialService;
