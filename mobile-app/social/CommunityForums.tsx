import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';

// Community forums types
export interface CommunityForums {
  forums: Forum[];
  categories: ForumCategory[];
  posts: ForumPost[];
  topics: ForumTopic[];
  replies: ForumReply[];
  tags: ForumTag[];
  users: ForumUser[];
  moderation: ForumModeration;
  settings: ForumSettings;
  notifications: ForumNotification[];
  metrics: ForumMetrics;
}

export interface Forum {
  forumId: string;
  name: string;
  description: string;
  category: ForumCategory;
  type: 'general' | 'technical' | 'support' | 'announcement' | 'showcase' | 'discussion';
  visibility: 'public' | 'private' | 'restricted';
  status: 'active' | 'inactive' | 'archived' | 'locked';
  moderators: string[];
  members: ForumMember[];
  rules: ForumRule[];
  settings: ForumSettings;
  topics: ForumTopic[];
  posts: ForumPost[];
  stats: ForumStats;
  createdDate: string;
  createdBy: string;
  lastActivity: string;
}

export interface ForumCategory {
  categoryId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  parentCategoryId?: string;
  subcategories: ForumCategory[];
  forums: Forum[];
  permissions: CategoryPermissions;
  settings: CategorySettings;
}

export interface CategoryPermissions {
  canView: string[];
  canPost: string[];
  canModerate: string[];
  canManage: string[];
}

export interface CategorySettings {
  allowAnonPosts: boolean;
  requireApproval: boolean;
  autoModeration: boolean;
  maxPostsPerDay: number;
  maxAttachments: number;
  allowedFileTypes: string[];
}

export interface ForumMember {
  userId: string;
  username: string;
  avatar?: string;
  role: 'owner' | 'moderator' | 'member' | 'guest';
  joinedDate: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'banned' | 'suspended';
  permissions: MemberPermissions;
  reputation: MemberReputation;
  activity: MemberActivity;
  notifications: MemberNotifications;
}

export interface MemberPermissions {
  canPost: boolean;
  canComment: boolean;
  canUpload: boolean;
  canModerate: boolean;
  canManage: boolean;
  canPin: boolean;
  canLock: boolean;
  canMove: boolean;
  canDelete: boolean;
}

export interface MemberReputation {
  score: number;
  level: 'newcomer' | 'member' | 'regular' | 'senior' | 'expert' | 'master';
  badges: ReputationBadge[];
  achievements: ForumAchievement[];
  endorsements: Endorsement[];
  history: ReputationHistory[];
}

export interface ReputationBadge {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  category: 'posting' | 'helping' | 'leadership' | 'quality' | 'engagement';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedDate: string;
  points: number;
}

export interface ForumAchievement {
  achievementId: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  points: number;
  unlockedDate: string;
  progress: AchievementProgress[];
}

export interface AchievementProgress {
  metric: string;
  current: number;
  target: number;
  unlocked: boolean;
}

export interface Endorsement {
  endorsementId: string;
  endorser: string;
  skill: string;
  comment: string;
  rating: number; // 1-5
  timestamp: string;
  helpful: number;
}

export interface ReputationHistory {
  historyId: string;
  type: 'post' | 'comment' | 'like' | 'endorsement' | 'achievement' | 'penalty';
  points: number;
  reason: string;
  timestamp: string;
}

export interface MemberActivity {
  posts: number;
  comments: number;
  likes: number;
  shares: number;
  views: number;
  lastPost: string;
  lastComment: string;
  streakDays: number;
  favoriteTopics: string[];
  expertise: string[];
}

export interface MemberNotifications {
  mentions: boolean;
  replies: boolean;
  likes: boolean;
  follows: boolean;
  announcements: boolean;
  moderation: boolean;
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  channels: NotificationChannel[];
}

export interface NotificationChannel {
  channel: 'in_app' | 'email' | 'push' | 'sms';
  enabled: boolean;
  settings: ChannelSettings;
}

export interface ChannelSettings {
  quietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  frequency: string;
  categories: string[];
}

export interface ForumRule {
  ruleId: string;
  title: string;
  description: string;
  type: 'posting' | 'behavior' | 'content' | 'interaction';
  category: 'required' | 'recommended' | 'prohibited';
  severity: 'info' | 'warning' | 'error';
  enforcement: RuleEnforcement;
  examples: RuleExample[];
}

export interface RuleEnforcement {
  method: 'warning' | 'post_removal' | 'temporary_ban' | 'permanent_ban';
  autoEnforce: boolean;
  moderatorReview: boolean;
  appealProcess: boolean;
}

export interface RuleExample {
  exampleId: string;
  title: string;
  description: string;
  type: 'allowed' | 'prohibited';
  content: string;
}

export interface ForumSettings {
  general: GeneralSettings;
  posting: PostingSettings;
  moderation: ModerationSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  rewards: RewardSettings;
}

export interface GeneralSettings {
  allowAnonymous: boolean;
  allowGuests: boolean;
  requireEmailVerification: boolean;
  defaultView: 'list' | 'grid' | 'card';
  postsPerPage: number;
  enableSearch: boolean;
  enableTags: boolean;
  enablePolls: boolean;
}

export interface PostingSettings {
  minTitleLength: number;
  maxTitleLength: number;
  minContentLength: number;
  maxContentLength: number;
  allowHtml: boolean;
  allowMarkdown: boolean;
  allowAttachments: boolean;
  maxAttachments: number;
  allowedFileTypes: string[];
  requireApproval: boolean;
  autoModeration: boolean;
}

export interface ModerationSettings {
  enableAutoModeration: boolean;
  moderationQueue: boolean;
  moderatorActions: ModeratorAction[];
  reporting: ReportingSettings;
  penalties: PenaltySettings;
}

export interface ModeratorAction {
  actionId: string;
  moderator: string;
  action: 'warning' | 'remove_post' | 'suspend_user' | 'ban_user';
  target: string;
  reason: string;
  timestamp: string;
  duration?: number;
}

export interface ReportingSettings {
  allowReporting: boolean;
  reportTypes: ReportType[];
  autoReview: boolean;
  reviewThreshold: number;
}

export interface ReportType {
  typeId: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoAction: string;
}

export interface PenaltySettings {
  warningThreshold: number;
  suspensionThreshold: number;
  banThreshold: number;
  pointDeductions: PointDeduction[];
  durations: PenaltyDuration[];
}

export interface PointDeduction {
  offense: string;
  points: number;
  description: string;
}

export interface PenaltyDuration {
  offense: string;
  duration: number;
  unit: 'hours' | 'days' | 'weeks' | 'months';
}

export interface NotificationSettings {
  enableNotifications: boolean;
  defaultFrequency: string;
  allowEmail: boolean;
  allowPush: boolean;
  allowSMS: boolean;
  quietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface PrivacySettings {
  publicProfiles: boolean;
  showOnlineStatus: boolean;
  showActivity: boolean;
  allowDirectMessages: boolean;
  allowFollowers: boolean;
  dataRetention: number;
}

export interface RewardSettings {
  enablePoints: boolean;
  enableBadges: boolean;
  enableAchievements: boolean;
  enableLeaderboards: boolean;
  pointsPerPost: number;
  pointsPerComment: number;
  pointsPerLike: number;
  pointMultipliers: PointMultiplier[];
}

export interface PointMultiplier {
  action: string;
  multiplier: number;
  conditions: string[];
}

export interface ForumStats {
  topics: number;
  posts: number;
  replies: number;
  members: number;
  activeMembers: number;
  onlineMembers: number;
  postsToday: number;
  repliesToday: number;
  newMembersToday: number;
  topTopics: TopicStats[];
  topMembers: MemberStats[];
}

export interface TopicStats {
  topicId: string;
  title: string;
  posts: number;
  replies: number;
  views: number;
  likes: number;
  lastActivity: string;
}

export interface MemberStats {
  userId: string;
  username: string;
  posts: number;
  replies: number;
  likes: number;
  reputation: number;
  lastActivity: string;
}

export interface ForumTopic {
  topicId: string;
  title: string;
  description: string;
  forumId: string;
  forumName: string;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  status: 'active' | 'locked' | 'pinned' | 'archived';
  type: 'discussion' | 'question' | 'announcement' | 'poll' | 'showcase';
  priority: 'low' | 'medium' | 'high';
  sticky: boolean;
  locked: boolean;
  views: number;
  replies: number;
  likes: number;
  dislikes: number;
  shares: number;
  tags: string[];
  attachments: TopicAttachment[];
  poll?: TopicPoll;
  createdDate: string;
  lastActivity: string;
  lastReply: string;
  participants: string[];
  followers: string[];
  moderators: string[];
  reports: TopicReport[];
  activity: TopicActivity;
}

export interface TopicAttachment {
  attachmentId: string;
  type: 'image' | 'video' | 'document' | 'code' | 'link' | 'file';
  name: string;
  url?: string;
  content?: string;
  size?: number;
  format?: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
  downloads: number;
  preview?: string;
}

export interface TopicPoll {
  pollId: string;
  question: string;
  type: 'single' | 'multiple';
  options: PollOption[];
  votes: PollVote[];
  endDate?: string;
  anonymous: boolean;
  publicResults: boolean;
  allowChangeVote: boolean;
}

export interface PollOption {
  optionId: string;
  text: string;
  votes: number;
  percentage: number;
}

export interface PollVote {
  voteId: string;
  userId: string;
  optionId: string;
  timestamp: string;
}

export interface TopicReport {
  reportId: string;
  reporterId: string;
  reason: string;
  description: string;
  type: ReportType['typeId'];
  severity: ReportType['severity'];
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  timestamp: string;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
}

export interface TopicActivity {
  posts: number;
  replies: number;
  views: number;
  likes: number;
  engagement: number; // 0-100
  velocity: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  participants: number;
  activeTime: number;
}

export interface ForumPost {
  postId: string;
  topicId: string;
  topicTitle: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  contentType: 'text' | 'markdown' | 'html';
  status: 'active' | 'hidden' | 'deleted' | 'flagged';
  priority: 'low' | 'medium' | 'high';
  likes: number;
  dislikes: number;
  replies: number;
  views: number;
  shares: number;
  attachments: PostAttachment[];
  mentions: string[];
  hashtags: string[];
  links: PostLink[];
  edits: PostEdit[];
  reports: PostReport[];
  createdDate: string;
  lastEdited?: string;
  lastActivity: string;
  isOriginalPost: boolean;
  parentPostId?: string;
  repliesList: ForumReply[];
}

export interface PostAttachment {
  attachmentId: string;
  type: 'image' | 'video' | 'document' | 'code' | 'link' | 'file';
  name: string;
  url?: string;
  content?: string;
  size?: number;
  format?: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
  downloads: number;
  preview?: string;
}

export interface PostLink {
  linkId: string;
  url: string;
  title: string;
  description: string;
  image?: string;
  domain: string;
  type: 'article' | 'video' | 'image' | 'tool' | 'documentation';
}

export interface PostEdit {
  editId: string;
  editorId: string;
  reason: string;
  timestamp: string;
  changes: EditChange[];
}

export interface EditChange {
  type: 'content' | 'attachment' | 'tag' | 'status';
  from: string;
  to: string;
  timestamp: string;
}

export interface PostReport {
  reportId: string;
  reporterId: string;
  reason: string;
  description: string;
  type: ReportType['typeId'];
  severity: ReportType['severity'];
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  timestamp: string;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
}

export interface ForumReply {
  replyId: string;
  postId: string;
  topicId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  contentType: 'text' | 'markdown' | 'html';
  status: 'active' | 'hidden' | 'deleted' | 'flagged';
  likes: number;
  dislikes: number;
  replies: number;
  attachments: ReplyAttachment[];
  mentions: string[];
  hashtags: string[];
  links: ReplyLink[];
  edits: ReplyEdit[];
  reports: ReplyReport[];
  createdDate: string;
  lastEdited?: string;
  lastActivity: string;
  parentReplyId?: string;
  repliesList: ForumReply[];
}

export interface ReplyAttachment {
  attachmentId: string;
  type: 'image' | 'video' | 'document' | 'code' | 'link' | 'file';
  name: string;
  url?: string;
  content?: string;
  size?: number;
  format?: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
  downloads: number;
  preview?: string;
}

export interface ReplyLink {
  linkId: string;
  url: string;
  title: string;
  description: string;
  image?: string;
  domain: string;
  type: 'article' | 'video' | 'image' | 'tool' | 'documentation';
}

export interface ReplyEdit {
  editId: string;
  editorId: string;
  reason: string;
  timestamp: string;
  changes: EditChange[];
}

export interface ReplyReport {
  reportId: string;
  reporterId: string;
  reason: string;
  description: string;
  type: ReportType['typeId'];
  severity: ReportType['severity'];
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  timestamp: string;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
}

export interface ForumTag {
  tagId: string;
  name: string;
  description: string;
  category: string;
  color: string;
  icon?: string;
  usage: number;
  createdDate: string;
  createdBy: string;
  topics: string[];
  posts: string[];
}

export interface ForumUser {
  userId: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks: SocialLink[];
  expertise: ExpertiseArea[];
  interests: string[];
  joinDate: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'banned' | 'suspended';
  role: 'user' | 'moderator' | 'admin';
  permissions: UserPermissions;
  reputation: UserReputation;
  activity: UserActivity;
  preferences: UserPreferences;
  notifications: UserNotificationSettings;
  statistics: UserStatistics;
}

export interface SocialLink {
  platform: string;
  url: string;
  username: string;
}

export interface ExpertiseArea {
  area: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  endorsements: number;
  projects: number;
  articles: number;
}

export interface UserPermissions {
  canPost: boolean;
  canComment: boolean;
  canUpload: boolean;
  canModerate: boolean;
  canManage: boolean;
  canPin: boolean;
  canLock: boolean;
  canMove: boolean;
  canDelete: boolean;
  canBan: boolean;
}

export interface UserReputation {
  score: number;
  level: 'newcomer' | 'member' | 'regular' | 'senior' | 'expert' | 'master';
  badges: UserBadge[];
  achievements: UserAchievement[];
  endorsements: UserEndorsement[];
  history: ReputationHistory[];
}

export interface UserBadge {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  category: 'posting' | 'helping' | 'leadership' | 'quality' | 'engagement';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedDate: string;
  points: number;
}

export interface UserAchievement {
  achievementId: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  points: number;
  unlockedDate: string;
  progress: AchievementProgress[];
}

export interface UserEndorsement {
  endorsementId: string;
  endorser: string;
  skill: string;
  comment: string;
  rating: number; // 1-5
  timestamp: string;
  helpful: number;
}

export interface UserActivity {
  posts: number;
  comments: number;
  likes: number;
  shares: number;
  views: number;
  lastPost: string;
  lastComment: string;
  streakDays: number;
  favoriteTopics: string[];
  expertise: string[];
  timeSpent: number;
  engagementRate: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  emailNotifications: boolean;
  pushNotifications: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  allowFollowers: boolean;
  publicProfile: boolean;
}

export interface UserNotificationSettings {
  mentions: boolean;
  replies: boolean;
  likes: boolean;
  follows: boolean;
  announcements: boolean;
  moderation: boolean;
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  channels: NotificationChannel[];
}

export interface UserStatistics {
  totalPosts: number;
  totalReplies: number;
  totalLikes: number;
  totalShares: number;
  totalViews: number;
  averagePostLength: number;
  averageReplyLength: number;
  mostActiveDay: string;
  mostActiveTime: string;
  favoriteCategories: string[];
  topTags: string[];
}

export interface ForumModeration {
  queue: ModerationQueue;
  actions: ModerationAction[];
  reports: ModerationReport[];
  warnings: ModerationWarning[];
  penalties: ModerationPenalty[];
  appeals: ModerationAppeal[];
}

export interface ModerationQueue {
  queueId: string;
  type: 'post' | 'reply' | 'user' | 'topic';
  itemId: string;
  itemType: string;
  reason: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  reportedBy: string;
  reportedAt: string;
  assignedTo?: string;
  assignedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
}

export interface ModerationAction {
  actionId: string;
  moderatorId: string;
  targetId: string;
  targetType: 'post' | 'reply' | 'user' | 'topic';
  action: 'warn' | 'remove' | 'hide' | 'lock' | 'suspend' | 'ban';
  reason: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
  timestamp: string;
  evidence: ModerationEvidence[];
}

export interface ModerationEvidence {
  evidenceId: string;
  type: 'screenshot' | 'log' | 'report' | 'content';
  description: string;
  url?: string;
  content?: string;
  timestamp: string;
}

export interface ModerationReport {
  reportId: string;
  reporterId: string;
  targetId: string;
  targetType: 'post' | 'reply' | 'user' | 'topic';
  reason: string;
  description: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  timestamp: string;
  reviewedBy?: string;
  reviewedAt?: string;
  resolution?: string;
}

export interface ModerationWarning {
  warningId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
  points: number;
  expiresAt?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  timestamp: string;
}

export interface ModerationPenalty {
  penaltyId: string;
  userId: string;
  moderatorId: string;
  type: 'warning' | 'suspension' | 'ban';
  reason: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number;
  unit: 'hours' | 'days' | 'weeks' | 'months' | 'permanent';
  points: number;
  startsAt: string;
  endsAt?: string;
  active: boolean;
  timestamp: string;
}

export interface ModerationAppeal {
  appealId: string;
  userId: string;
  penaltyId: string;
  reason: string;
  description: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  timestamp: string;
  reviewedBy?: string;
  reviewedAt?: string;
  decision?: string;
}

export interface ForumNotification {
  notificationId: string;
  type: 'mention' | 'reply' | 'like' | 'follow' | 'announcement' | 'moderation' | 'achievement';
  from: string;
  to: string;
  title: string;
  message: string;
  data: NotificationData;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  expiresAt?: string;
}

export interface NotificationData {
  postId?: string;
  replyId?: string;
  topicId?: string;
  userId?: string;
  forumId?: string;
  categoryId?: string;
  achievementId?: string;
  penaltyId?: string;
}

export interface ForumMetrics {
  overall: OverallMetrics;
  engagement: EngagementMetrics;
  content: ContentMetrics;
  user: UserMetrics;
  moderation: ModerationMetrics;
  growth: GrowthMetrics;
  quality: QualityMetrics;
}

export interface OverallMetrics {
  totalForums: number;
  totalTopics: number;
  totalPosts: number;
  totalReplies: number;
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  postsPerDay: number;
  repliesPerDay: number;
  newUsersPerDay: number;
}

export interface EngagementMetrics {
  pageViews: number;
  uniqueVisitors: number;
  averageSessionDuration: number;
  bounceRate: number;
  returnVisitors: number;
  engagementRate: number;
  timeOnSite: number;
  pagesPerSession: number;
}

export interface ContentMetrics {
  postsCreated: number;
  repliesCreated: number;
  likesGiven: number;
  sharesCount: number;
  averagePostLength: number;
  averageReplyLength: number;
  postsWithAttachments: number;
  postsWithPolls: number;
}

export interface UserMetrics {
  newUsers: number;
  activeUsers: number;
  returningUsers: number;
  userRetention: number;
  userLifetime: number;
  userSatisfaction: number;
  userEngagement: number;
  userActivity: number;
}

export interface ModerationMetrics {
  reportsFiled: number;
  reportsResolved: number;
  averageResolutionTime: number;
  warningsIssued: number;
  suspensionsIssued: number;
  bansIssued: number;
  appealsFiled: number;
  appealsApproved: number;
}

export interface GrowthMetrics {
  forumGrowth: number;
  userGrowth: number;
  contentGrowth: number;
  engagementGrowth: number;
  monthlyGrowth: MonthlyGrowth[];
  yearlyGrowth: YearlyGrowth[];
}

export interface MonthlyGrowth {
  month: string;
  forums: number;
  users: number;
  posts: number;
  engagement: number;
}

export interface YearlyGrowth {
  year: number;
  forums: number;
  users: number;
  posts: number;
  engagement: number;
}

export interface QualityMetrics {
  postQuality: number;
  replyQuality: number;
  contentAccuracy: number;
  userSatisfaction: number;
  moderatorEffectiveness: number;
  communityHealth: number;
}

// Community forums context
interface CommunityForumsContextType {
  forums: CommunityForums;
  loading: boolean;
  error: string | null;
  createForum: (forum: Omit<Forum, 'forumId' | 'createdDate' | 'lastActivity'>) => Promise<Forum>;
  updateForum: (forumId: string, updates: Partial<Forum>) => Promise<void>;
  deleteForum: (forumId: string) => Promise<void>;
  getForum: (forumId: string) => Forum | null;
  getForums: (filters?: ForumFilters) => Forum[];
  createTopic: (topic: Omit<ForumTopic, 'topicId' | 'createdDate' | 'lastActivity' | 'lastReply'>) => Promise<ForumTopic>;
  updateTopic: (topicId: string, updates: Partial<ForumTopic>) => Promise<void>;
  deleteTopic: (topicId: string) => Promise<void>;
  getTopic: (topicId: string) => ForumTopic | null;
  getTopics: (forumId: string, filters?: TopicFilters) => ForumTopic[];
  createPost: (post: Omit<ForumPost, 'postId' | 'createdDate' | 'lastActivity'>) => Promise<ForumPost>;
  updatePost: (postId: string, updates: Partial<ForumPost>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  getPost: (postId: string) => ForumPost | null;
  getPosts: (topicId: string, filters?: PostFilters) => ForumPost[];
  createReply: (reply: Omit<ForumReply, 'replyId' | 'createdDate' | 'lastActivity'>) => Promise<ForumReply>;
  updateReply: (replyId: string, updates: Partial<ForumReply>) => Promise<void>;
  deleteReply: (replyId: string) => Promise<void>;
  getReply: (replyId: string) => ForumReply | null;
  getReplies: (postId: string, filters?: ReplyFilters) => ForumReply[];
  likePost: (postId: string, userId: string) => Promise<void>;
  unlikePost: (postId: string, userId: string) => Promise<void>;
  likeReply: (replyId: string, userId: string) => Promise<void>;
  unlikeReply: (replyId: string, userId: string) => Promise<void>;
  followTopic: (topicId: string, userId: string) => Promise<void>;
  unfollowTopic: (topicId: string, userId: string) => Promise<void>;
  reportPost: (postId: string, userId: string, reason: string, description: string) => Promise<void>;
  reportReply: (replyId: string, userId: string, reason: string, description: string) => Promise<void>;
  reportTopic: (topicId: string, userId: string, reason: string, description: string) => Promise<void>;
  searchTopics: (query: string, filters?: SearchFilters) => ForumTopic[];
  searchPosts: (query: string, filters?: SearchFilters) => ForumPost[];
  searchUsers: (query: string, filters?: UserSearchFilters) => ForumUser[];
  getForumMetrics: (forumId?: string) => ForumMetrics;
  getUserStats: (userId: string) => UserStatistics;
  getRecommendations: (userId: string) => ForumTopic[];
  exportForumData: (type: 'forums' | 'topics' | 'posts' | 'users' | 'metrics', format: 'json' | 'csv') => Promise<string>;
}

export interface ForumFilters {
  category?: string;
  type?: Forum['type'];
  visibility?: Forum['visibility'];
  status?: Forum['status'];
  tags?: string[];
}

export interface TopicFilters {
  status?: ForumTopic['status'];
  type?: ForumTopic['type'];
  priority?: ForumTopic['priority'];
  authorId?: string;
  tags?: string[];
  dateRange?: { start: string; end: string };
  sticky?: boolean;
  locked?: boolean;
}

export interface PostFilters {
  status?: ForumPost['status'];
  priority?: ForumPost['priority'];
  authorId?: string;
  tags?: string[];
  dateRange?: { start: string; end: string };
  hasAttachments?: boolean;
  hasLinks?: boolean;
  isOriginalPost?: boolean;
}

export interface ReplyFilters {
  status?: ForumReply['status'];
  authorId?: string;
  tags?: string[];
  dateRange?: { start: string; end: string };
  hasAttachments?: boolean;
  hasLinks?: boolean;
}

export interface SearchFilters {
  query: string;
  category?: string;
  type?: string;
  tags?: string[];
  author?: string;
  dateRange?: { start: string; end: string };
  sortBy?: 'relevance' | 'date' | 'popularity' | 'engagement';
  sortOrder?: 'asc' | 'desc';
}

export interface UserSearchFilters {
  expertise?: string;
  location?: string;
  role?: ForumUser['role'];
  status?: ForumUser['status'];
  joinDateRange?: { start: string; end: string };
  lastActiveRange?: { start: string; end: string };
}

// Community forums engine
class CommunityForumsEngine {
  static async createForum(forumData: Omit<Forum, 'forumId' | 'createdDate' | 'lastActivity'>): Promise<Forum> {
    const forumId = `forum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdDate = new Date().toISOString();
    const lastActivity = createdDate;

    const forum: Forum = {
      ...forumData,
      forumId,
      createdDate,
      lastActivity,
      topics: [],
      posts: [],
      stats: {
        topics: 0,
        posts: 0,
        replies: 0,
        members: forumData.members.length,
        activeMembers: forumData.members.filter(m => m.status === 'active').length,
        onlineMembers: 0,
        postsToday: 0,
        repliesToday: 0,
        newMembersToday: 0,
        topTopics: [],
        topMembers: [],
      },
    };

    return forum;
  }

  static async createTopic(topicData: Omit<ForumTopic, 'topicId' | 'createdDate' | 'lastActivity' | 'lastReply'>): Promise<ForumTopic> {
    const topicId = `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdDate = new Date().toISOString();
    const lastActivity = createdDate;

    const topic: ForumTopic = {
      ...topicData,
      topicId,
      createdDate,
      lastActivity,
      lastReply: '',
      participants: [topicData.authorId],
      followers: [],
      moderators: [],
      reports: [],
      activity: {
        posts: 1,
        replies: 0,
        views: 0,
        likes: 0,
        engagement: 0,
        velocity: 0,
        trend: 'stable',
        participants: 1,
        activeTime: 0,
      },
    };

    return topic;
  }

  static async createPost(postData: Omit<ForumPost, 'postId' | 'createdDate' | 'lastActivity'>): Promise<ForumPost> {
    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdDate = new Date().toISOString();
    const lastActivity = createdDate;

    const post: ForumPost = {
      ...postData,
      postId,
      createdDate,
      lastActivity,
      isOriginalPost: postData.parentPostId === undefined,
      repliesList: [],
    };

    return post;
  }

  static async createReply(replyData: Omit<ForumReply, 'replyId' | 'createdDate' | 'lastActivity'>): Promise<ForumReply> {
    const replyId = `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdDate = new Date().toISOString();
    const lastActivity = createdDate;

    const reply: ForumReply = {
      ...replyData,
      replyId,
      createdDate,
      lastActivity,
      repliesList: [],
    };

    return reply;
  }

  static async likePost(postId: string, userId: string): Promise<void> {
    // Implementation for liking a post
    console.log(`User ${userId} liking post ${postId}`);
  }

  static async unlikePost(postId: string, userId: string): Promise<void> {
    // Implementation for unliking a post
    console.log(`User ${userId} unliking post ${postId}`);
  }

  static async followTopic(topicId: string, userId: string): Promise<void> {
    // Implementation for following a topic
    console.log(`User ${userId} following topic ${topicId}`);
  }

  static async reportPost(postId: string, userId: string, reason: string, description: string): Promise<void> {
    // Implementation for reporting a post
    console.log(`User ${userId} reporting post ${postId}: ${reason} - ${description}`);
  }

  static async getForumMetrics(forumId?: string): Promise<ForumMetrics> {
    // Mock implementation - would calculate actual metrics
    return {
      overall: {
        totalForums: 10,
        totalTopics: 100,
        totalPosts: 500,
        totalReplies: 1500,
        totalUsers: 1000,
        activeUsers: 300,
        onlineUsers: 50,
        postsPerDay: 25,
        repliesPerDay: 75,
        newUsersPerDay: 5,
      },
      engagement: {
        pageViews: 10000,
        uniqueVisitors: 2000,
        averageSessionDuration: 300,
        bounceRate: 35,
        returnVisitors: 800,
        engagementRate: 45,
        timeOnSite: 600,
        pagesPerSession: 3,
      },
      content: {
        postsCreated: 500,
        repliesCreated: 1500,
        likesGiven: 2500,
        sharesCount: 100,
        averagePostLength: 150,
        averageReplyLength: 75,
        postsWithAttachments: 50,
        postsWithPolls: 10,
      },
      user: {
        newUsers: 100,
        activeUsers: 300,
        returningUsers: 500,
        userRetention: 75,
        userLifetime: 180,
        userSatisfaction: 4.2,
        userEngagement: 65,
        userActivity: 70,
      },
      moderation: {
        reportsFiled: 25,
        reportsResolved: 20,
        averageResolutionTime: 120,
        warningsIssued: 10,
        suspensionsIssued: 3,
        bansIssued: 1,
        appealsFiled: 2,
        appealsApproved: 1,
      },
      growth: {
        forumGrowth: 15,
        userGrowth: 25,
        contentGrowth: 30,
        engagementGrowth: 20,
        monthlyGrowth: [],
        yearlyGrowth: [],
      },
      quality: {
        postQuality: 75,
        replyQuality: 80,
        contentAccuracy: 85,
        userSatisfaction: 4.2,
        moderatorEffectiveness: 80,
        communityHealth: 78,
      },
    };
  }

  static async getUserStats(userId: string): Promise<UserStatistics> {
    // Mock implementation - would calculate actual user stats
    return {
      totalPosts: 25,
      totalReplies: 75,
      totalLikes: 150,
      totalShares: 10,
      totalViews: 500,
      averagePostLength: 150,
      averageReplyLength: 75,
      mostActiveDay: 'Monday',
      mostActiveTime: '14:00',
      favoriteCategories: ['programming', 'algorithms'],
      topTags: ['javascript', 'python', 'react'],
    };
  }

  static async getRecommendations(userId: string): Promise<ForumTopic[]> {
    // Mock implementation - would use ML to recommend topics
    return [];
  }

  static async searchTopics(query: string, filters?: SearchFilters): Promise<ForumTopic[]> {
    // Mock implementation - would search actual topics
    return [];
  }

  static async exportForumData(type: string, format: 'json' | 'csv'): Promise<string> {
    // Mock implementation - would export actual forum data
    const exportData = {
      type,
      exportedAt: new Date().toISOString(),
      format,
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Community forums provider
export const CommunityForumsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [forums, setForums] = useState<CommunityForums>({
    forums: [],
    categories: [],
    posts: [],
    topics: [],
    replies: [],
    tags: [],
    users: [],
    moderation: {
      queue: [],
      actions: [],
      reports: [],
      warnings: [],
      penalties: [],
      appeals: [],
    },
    settings: {
      general: {
        allowAnonymous: false,
        allowGuests: false,
        requireEmailVerification: true,
        defaultView: 'list',
        postsPerPage: 20,
        enableSearch: true,
        enableTags: true,
        enablePolls: true,
      },
      posting: {
        minTitleLength: 5,
        maxTitleLength: 100,
        minContentLength: 10,
        maxContentLength: 10000,
        allowHtml: false,
        allowMarkdown: true,
        allowAttachments: true,
        maxAttachments: 5,
        allowedFileTypes: ['jpg', 'png', 'gif', 'pdf', 'doc', 'docx'],
        requireApproval: false,
        autoModeration: true,
      },
      moderation: {
        enableAutoModeration: true,
        moderationQueue: true,
        moderatorActions: [],
        reporting: {
          allowReporting: true,
          reportTypes: [],
          autoReview: true,
          reviewThreshold: 3,
        },
        penalties: {
          warningThreshold: 3,
          suspensionThreshold: 5,
          banThreshold: 10,
          pointDeductions: [],
          durations: [],
        },
      },
      notifications: {
        enableNotifications: true,
        defaultFrequency: 'real_time',
        allowEmail: true,
        allowPush: true,
        allowSMS: false,
        quietHours: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      },
      privacy: {
        publicProfiles: true,
        showOnlineStatus: true,
        showActivity: true,
        allowDirectMessages: true,
        allowFollowers: true,
        dataRetention: 365,
      },
      rewards: {
        enablePoints: true,
        enableBadges: true,
        enableAchievements: true,
        enableLeaderboards: true,
        pointsPerPost: 10,
        pointsPerComment: 5,
        pointsPerLike: 1,
        pointMultipliers: [],
      },
    },
    notifications: [],
    metrics: {
      overall: {
        totalForums: 0,
        totalTopics: 0,
        totalPosts: 0,
        totalReplies: 0,
        totalUsers: 0,
        activeUsers: 0,
        onlineUsers: 0,
        postsPerDay: 0,
        repliesPerDay: 0,
        newUsersPerDay: 0,
      },
      engagement: {
        pageViews: 0,
        uniqueVisitors: 0,
        averageSessionDuration: 0,
        bounceRate: 0,
        returnVisitors: 0,
        engagementRate: 0,
        timeOnSite: 0,
        pagesPerSession: 0,
      },
      content: {
        postsCreated: 0,
        repliesCreated: 0,
        likesGiven: 0,
        sharesCount: 0,
        averagePostLength: 0,
        averageReplyLength: 0,
        postsWithAttachments: 0,
        postsWithPolls: 0,
      },
      user: {
        newUsers: 0,
        activeUsers: 0,
        returningUsers: 0,
        userRetention: 0,
        userLifetime: 0,
        userSatisfaction: 0,
        userEngagement: 0,
        userActivity: 0,
      },
      moderation: {
        reportsFiled: 0,
        reportsResolved: 0,
        averageResolutionTime: 0,
        warningsIssued: 0,
        suspensionsIssued: 0,
        bansIssued: 0,
        appealsFiled: 0,
        appealsApproved: 0,
      },
      growth: {
        forumGrowth: 0,
        userGrowth: 0,
        contentGrowth: 0,
        engagementGrowth: 0,
        monthlyGrowth: [],
        yearlyGrowth: [],
      },
      quality: {
        postQuality: 0,
        replyQuality: 0,
        contentAccuracy: 0,
        userSatisfaction: 0,
        moderatorEffectiveness: 0,
        communityHealth: 0,
      },
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved forums data
  useEffect(() => {
    const loadForums = async () => {
      try {
        setLoading(true);
        const savedForums = await AsyncStorage.getItem('@community_forums');
        
        if (savedForums) {
          setForums(JSON.parse(savedForums));
        }
      } catch (err) {
        setError('Failed to load community forums');
        console.error('Forums loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadForums();
  }, []);

  const createForum = useCallback(async (forumData: Omit<Forum, 'forumId' | 'createdDate' | 'lastActivity'>): Promise<Forum> => {
    try {
      const newForum = await CommunityForumsEngine.createForum(forumData);
      
      const updatedForums = { ...forums, forums: [...forums.forums, newForum] };
      setForums(updatedForums);
      await AsyncStorage.setItem('@community_forums', JSON.stringify(updatedForums));

      return newForum;
    } catch (err) {
      setError('Failed to create forum');
      console.error('Forum creation error:', err);
      throw err;
    }
  }, [forums]);

  const updateForum = useCallback(async (forumId: string, updates: Partial<Forum>): Promise<void> => {
    try {
      const forumIndex = forums.forums.findIndex(f => f.forumId === forumId);
      if (forumIndex === -1) throw new Error('Forum not found');

      const updatedForums = { ...forums };
      updatedForums.forums[forumIndex] = { ...updatedForums.forums[forumIndex], ...updates };
      
      setForums(updatedForums);
      await AsyncStorage.setItem('@community_forums', JSON.stringify(updatedForums));
    } catch (err) {
      setError('Failed to update forum');
      console.error('Forum update error:', err);
      throw err;
    }
  }, [forums]);

  const deleteForum = useCallback(async (forumId: string): Promise<void> => {
    try {
      const updatedForums = { ...forums, forums: forums.forums.filter(f => f.forumId !== forumId) };
      setForums(updatedForums);
      await AsyncStorage.setItem('@community_forums', JSON.stringify(updatedForums));
    } catch (err) {
      setError('Failed to delete forum');
      console.error('Forum deletion error:', err);
      throw err;
    }
  }, [forums]);

  const getForum = useCallback((forumId: string): Forum | null => {
    return forums.forums.find(f => f.forumId === forumId) || null;
  }, [forums.forums]);

  const getForums = useCallback((filters?: ForumFilters): Forum[] => {
    let forumList = forums.forums;
    
    if (filters) {
      if (filters.category) {
        forumList = forumList.filter(f => f.category.categoryId === filters.category);
      }
      if (filters.type) {
        forumList = forumList.filter(f => f.type === filters.type);
      }
      if (filters.visibility) {
        forumList = forumList.filter(f => f.visibility === filters.visibility);
      }
      if (filters.status) {
        forumList = forumList.filter(f => f.status === filters.status);
      }
      if (filters.tags && filters.tags.length > 0) {
        forumList = forumList.filter(f => filters.tags.some(tag => f.tags.includes(tag)));
      }
    }
    
    return forumList.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [forums.forums]);

  const createTopic = useCallback(async (topicData: Omit<ForumTopic, 'topicId' | 'createdDate' | 'lastActivity' | 'lastReply'>): Promise<ForumTopic> => {
    try {
      const newTopic = await CommunityForumsEngine.createTopic(topicData);
      
      const updatedForums = { ...forums, topics: [...forums.topics, newTopic] };
      setForums(updatedForums);
      await AsyncStorage.setItem('@community_forums', JSON.stringify(updatedForums));

      return newTopic;
    } catch (err) {
      setError('Failed to create topic');
      console.error('Topic creation error:', err);
      throw err;
    }
  }, [forums]);

  const updateTopic = useCallback(async (topicId: string, updates: Partial<ForumTopic>): Promise<void> => {
    try {
      const topicIndex = forums.topics.findIndex(t => t.topicId === topicId);
      if (topicIndex === -1) throw new Error('Topic not found');

      const updatedForums = { ...forums };
      updatedForums.topics[topicIndex] = { ...updatedForums.topics[topicIndex], ...updates };
      
      setForums(updatedForums);
      await AsyncStorage.setItem('@community_forums', JSON.stringify(updatedForums));
    } catch (err) {
      setError('Failed to update topic');
      console.error('Topic update error:', err);
      throw err;
    }
  }, [forums]);

  const deleteTopic = useCallback(async (topicId: string): Promise<void> => {
    try {
      const updatedForums = { ...forums, topics: forums.topics.filter(t => t.topicId !== topicId) };
      setForums(updatedForums);
      await AsyncStorage.setItem('@community_forums', JSON.stringify(updatedForums));
    } catch (err) {
      setError('Failed to delete topic');
      console.error('Topic deletion error:', err);
      throw err;
    }
  }, [forums]);

  const getTopic = useCallback((topicId: string): ForumTopic | null => {
    return forums.topics.find(t => t.topicId === topicId) || null;
  }, [forums.topics]);

  const getTopics = useCallback((forumId: string, filters?: TopicFilters): ForumTopic[] => {
    let topics = forums.topics.filter(t => t.forumId === forumId);
    
    if (filters) {
      if (filters.status) {
        topics = topics.filter(t => t.status === filters.status);
      }
      if (filters.type) {
        topics = topics.filter(t => t.type === filters.type);
      }
      if (filters.priority) {
        topics = topics.filter(t => t.priority === filters.priority);
      }
      if (filters.authorId) {
        topics = topics.filter(t => t.authorId === filters.authorId);
      }
      if (filters.tags && filters.tags.length > 0) {
        topics = topics.filter(t => filters.tags.some(tag => t.tags.includes(tag)));
      }
      if (filters.dateRange) {
        topics = topics.filter(t => {
          const topicDate = new Date(t.createdDate);
          return topicDate >= new Date(filters.dateRange.start) && topicDate <= new Date(filters.dateRange.end);
        });
      }
      if (filters.sticky !== undefined) {
        topics = topics.filter(t => t.sticky === filters.sticky);
      }
      if (filters.locked !== undefined) {
        topics = topics.filter(t => t.locked === filters.locked);
      }
    }
    
    return topics.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }, [forums.topics]);

  const createPost = useCallback(async (postData: Omit<ForumPost, 'postId' | 'createdDate' | 'lastActivity'>): Promise<ForumPost> => {
    try {
      const newPost = await CommunityForumsEngine.createPost(postData);
      
      const updatedForums = { ...forums, posts: [...forums.posts, newPost] };
      setForums(updatedForums);
      await AsyncStorage.setItem('@community_forums', JSON.stringify(updatedForums));

      return newPost;
    } catch (err) {
      setError('Failed to create post');
      console.error('Post creation error:', err);
      throw err;
    }
  }, [forums]);

  const updatePost = useCallback(async (postId: string, updates: Partial<ForumPost>): Promise<void> => {
    try {
      const postIndex = forums.posts.findIndex(p => p.postId === postId);
      if (postIndex === -1) throw new Error('Post not found');

      const updatedForums = { ...forums };
      updatedForums.posts[postIndex] = { ...updatedForums.posts[postIndex], ...updates };
      
      setForums(updatedForums);
      await AsyncStorage.setItem('@community_forums', JSON.stringify(updatedForums));
    } catch (err) {
      setError('Failed to update post');
      console.error('Post update error:', err);
      throw err;
    }
  }, [forums]);

  const deletePost = useCallback(async (postId: string): Promise<void> => {
    try {
      const updatedForums = { ...forums, posts: forums.posts.filter(p => p.postId !== postId) };
      setForums(updatedForums);
      await AsyncStorage.setItem('@community_forums', JSON.stringify(updatedForums));
    } catch (err) {
      setError('Failed to delete post');
      console.error('Post deletion error:', err);
      throw err;
    }
  }, [forums]);

  const getPost = useCallback((postId: string): ForumPost | null => {
    return forums.posts.find(p => p.postId === postId) || null;
  }, [forums.posts]);

  const getPosts = useCallback((topicId: string, filters?: PostFilters): ForumPost[] => {
    let posts = forums.posts.filter(p => p.topicId === topicId);
    
    if (filters) {
      if (filters.status) {
        posts = posts.filter(p => p.status === filters.status);
      }
      if (filters.priority) {
        posts = posts.filter(p => p.priority === filters.priority);
      }
      if (filters.authorId) {
        posts = posts.filter(p => p.authorId === filters.authorId);
      }
      if (filters.tags && filters.tags.length > 0) {
        posts = posts.filter(p => filters.tags.some(tag => p.tags.includes(tag)));
      }
      if (filters.dateRange) {
        posts = posts.filter(p => {
          const postDate = new Date(p.createdDate);
          return postDate >= new Date(filters.dateRange.start) && postDate <= new Date(filters.dateRange.end);
        });
      }
      if (filters.hasAttachments !== undefined) {
        posts = posts.filter(p => p.attachments.length > 0 === filters.hasAttachments);
      }
      if (filters.hasLinks !== undefined) {
        posts = posts.filter(p => p.links.length > 0 === filters.hasLinks);
      }
      if (filters.isOriginalPost !== undefined) {
        posts = posts.filter(p => p.isOriginalPost === filters.isOriginalPost);
      }
    }
    
    return posts.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }, [forums.posts]);

  const createReply = useCallback(async (replyData: Omit<ForumReply, 'replyId' | 'createdDate' | 'lastActivity'>): Promise<ForumReply> => {
    try {
      const newReply = await CommunityForumsEngine.createReply(replyData);
      
      const updatedForums = { ...forums, replies: [...forums.replies, newReply] };
      setForums(updatedForums);
      await AsyncStorage.setItem('@community_forums', JSON.stringify(updatedForums));

      return newReply;
    } catch (err) {
      setError('Failed to create reply');
      console.error('Reply creation error:', err);
      throw err;
    }
  }, [forums]);

  const updateReply = useCallback(async (replyId: string, updates: Partial<ForumReply>): Promise<void> => {
    try {
      const replyIndex = forums.replies.findIndex(r => r.replyId === replyId);
      if (replyIndex === -1) throw new Error('Reply not found');

      const updatedForums = { ...forums };
      updatedForums.replies[replyIndex] = { ...updatedForums.replies[replyIndex], ...updates };
      
      setForums(updatedForums);
      await AsyncStorage.setItem('@community_forums', JSON.stringify(updatedForums));
    } catch (err) {
      setError('Failed to update reply');
      console.error('Reply update error:', err);
      throw err;
    }
  }, [forums]);

  const deleteReply = useCallback(async (replyId: string): Promise<void> => {
    try {
      const updatedForums = { ...forums, replies: forums.replies.filter(r => r.replyId !== replyId) };
      setForums(updatedForums);
      await AsyncStorage.setItem('@community_forums', JSON.stringify(updatedForums));
    } catch (err) {
      setError('Failed to delete reply');
      console.error('Reply deletion error:', err);
      throw err;
    }
  }, [forums]);

  const getReply = useCallback((replyId: string): ForumReply | null => {
    return forums.replies.find(r => r.replyId === replyId) || null;
  }, [forums.replies]);

  const getReplies = useCallback((postId: string, filters?: ReplyFilters): ForumReply[] => {
    let replies = forums.replies.filter(r => r.postId === postId);
    
    if (filters) {
      if (filters.status) {
        replies = replies.filter(r => r.status === filters.status);
      }
      if (filters.authorId) {
        replies = replies.filter(r => r.authorId === filters.authorId);
      }
      if (filters.tags && filters.tags.length > 0) {
        replies = replies.filter(r => filters.tags.some(tag => r.tags.includes(tag)));
      }
      if (filters.dateRange) {
        replies = replies.filter(r => {
          const replyDate = new Date(r.createdDate);
          return replyDate >= new Date(filters.dateRange.start) && replyDate <= new Date(filters.dateRange.end);
        });
      }
      if (filters.hasAttachments !== undefined) {
        replies = replies.filter(r => r.attachments.length > 0 === filters.hasAttachments);
      }
      if (filters.hasLinks !== undefined) {
        replies = replies.filter(r => r.links.length > 0 === filters.hasLinks);
      }
    }
    
    return replies.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }, [forums.replies]);

  const likePost = useCallback(async (postId: string, userId: string): Promise<void> => {
    try {
      await CommunityForumsEngine.likePost(postId, userId);
      
      // Update local state
      const post = getPost(postId);
      if (post) {
        await updatePost(postId, {
          likes: post.likes + 1,
        });
      }
    } catch (err) {
      setError('Failed to like post');
      console.error('Post like error:', err);
      throw err;
    }
  }, [getPost, updatePost]);

  const unlikePost = useCallback(async (postId: string, userId: string): Promise<void> => {
    try {
      await CommunityForumsEngine.unlikePost(postId, userId);
      
      // Update local state
      const post = getPost(postId);
      if (post) {
        await updatePost(postId, {
          likes: Math.max(0, post.likes - 1),
        });
      }
    } catch (err) {
      setError('Failed to unlike post');
      console.error('Post unlike error:', err);
      throw err;
    }
  }, [getPost, updatePost]);

  const likeReply = useCallback(async (replyId: string, userId: string): Promise<void> => {
    try {
      // Implementation for liking a reply
      console.log(`User ${userId} liking reply ${replyId}`);
    } catch (err) {
      setError('Failed to like reply');
      console.error('Reply like error:', err);
      throw err;
    }
  }, []);

  const unlikeReply = useCallback(async (replyId: string, userId: string): Promise<void> => {
    try {
      // Implementation for unliking a reply
      console.log(`User ${userId} unliking reply ${replyId}`);
    } catch (err) {
      setError('Failed to unlike reply');
      console.error('Reply unlike error:', err);
      throw err;
    }
  }, []);

  const followTopic = useCallback(async (topicId: string, userId: string): Promise<void> => {
    try {
      await CommunityForumsEngine.followTopic(topicId, userId);
      
      // Update local state
      const topic = getTopic(topicId);
      if (topic) {
        await updateTopic(topicId, {
          followers: [...topic.followers, userId],
        });
      }
    } catch (err) {
      setError('Failed to follow topic');
      console.error('Topic follow error:', err);
      throw err;
    }
  }, [getTopic, updateTopic]);

  const unfollowTopic = useCallback(async (topicId: string, userId: string): Promise<void> => {
    try {
      // Update local state
      const topic = getTopic(topicId);
      if (topic) {
        await updateTopic(topicId, {
          followers: topic.followers.filter(id => id !== userId),
        });
      }
    } catch (err) {
      setError('Failed to unfollow topic');
      console.error('Topic unfollow error:', err);
      throw err;
    }
  }, [getTopic, updateTopic]);

  const reportPost = useCallback(async (postId: string, userId: string, reason: string, description: string): Promise<void> => {
    try {
      await CommunityForumsEngine.reportPost(postId, userId, reason, description);
    } catch (err) {
      setError('Failed to report post');
      console.error('Post report error:', err);
      throw err;
    }
  }, []);

  const reportReply = useCallback(async (replyId: string, userId: string, reason: string, description: string): Promise<void> => {
    try {
      // Implementation for reporting a reply
      console.log(`User ${userId} reporting reply ${replyId}: ${reason} - ${description}`);
    } catch (err) {
      setError('Failed to report reply');
      console.error('Reply report error:', err);
      throw err;
    }
  }, []);

  const reportTopic = useCallback(async (topicId: string, userId: string, reason: string, description: string): Promise<void> => {
    try {
      await CommunityForumsEngine.reportTopic(topicId, userId, reason, description);
    } catch (err) {
      setError('Failed to report topic');
      console.error('Topic report error:', err);
      throw err;
    }
  }, []);

  const searchTopics = useCallback(async (query: string, filters?: SearchFilters): Promise<ForumTopic[]> => {
    try {
      return await CommunityForumsEngine.searchTopics(query, filters);
    } catch (err) {
      setError('Failed to search topics');
      console.error('Topic search error:', err);
      throw err;
    }
  }, []);

  const searchPosts = useCallback(async (query: string, filters?: SearchFilters): Promise<ForumPost[]> => {
    try {
      // Mock implementation - would search actual posts
      return [];
    } catch (err) {
      setError('Failed to search posts');
      console.error('Post search error:', err);
      throw err;
    }
  }, []);

  const searchUsers = useCallback(async (query: string, filters?: UserSearchFilters): Promise<ForumUser[]> => {
    try {
      // Mock implementation - would search actual users
      return [];
    } catch (err) {
      setError('Failed to search users');
      console.error('User search error:', err);
      throw err;
    }
  }, []);

  const getForumMetrics = useCallback(async (forumId?: string): Promise<ForumMetrics> => {
    try {
      return await CommunityForumsEngine.getForumMetrics(forumId);
    } catch (err) {
      setError('Failed to get forum metrics');
      console.error('Forum metrics error:', err);
      throw err;
    }
  }, []);

  const getUserStats = useCallback(async (userId: string): Promise<UserStatistics> => {
    try {
      return await CommunityForumsEngine.getUserStats(userId);
    } catch (err) {
      setError('Failed to get user stats');
      console.error('User stats error:', err);
      throw err;
    }
  }, []);

  const getRecommendations = useCallback(async (userId: string): Promise<ForumTopic[]> => {
    try {
      return await CommunityForumsEngine.getRecommendations(userId);
    } catch (err) {
      setError('Failed to get recommendations');
      console.error('Recommendations error:', err);
      throw err;
    }
  }, []);

  const exportForumData = useCallback(async (type: string, format: 'json' | 'csv'): Promise<string> => {
    try {
      return await CommunityForumsEngine.exportForumData(type, format);
    } catch (err) {
      setError('Failed to export forum data');
      console.error('Forum data export error:', err);
      throw err;
    }
  }, []);

  return (
    <CommunityForumsContext.Provider
      value={{
        forums,
        loading,
        error,
        createForum,
        updateForum,
        deleteForum,
        getForum,
        getForums,
        createTopic,
        updateTopic,
        deleteTopic,
        getTopic,
        getTopics,
        createPost,
        updatePost,
        deletePost,
        getPost,
        getPosts,
        createReply,
        updateReply,
        deleteReply,
        getReply,
        getReplies,
        likePost,
        unlikePost,
        likeReply,
        unlikeReply,
        followTopic,
        unfollowTopic,
        reportPost,
        reportReply,
        reportTopic,
        searchTopics,
        searchPosts,
        searchUsers,
        getForumMetrics,
        getUserStats,
        getRecommendations,
        exportForumData,
      }}
    >
      {children}
    </CommunityForumsContext.Provider>
  );
};

export const useCommunityForums = (): CommunityForumsContextType => {
  const context = useContext(CommunityForumsContext);
  if (!context) {
    throw new Error('useCommunityForums must be used within a CommunityForumsProvider');
  }
  return context;
};

export default {
  CommunityForumsProvider,
  useCommunityForums,
  CommunityForumsEngine,
};
