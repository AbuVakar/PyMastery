import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';

// Leaderboards types
export interface LeaderboardSystem {
  leaderboards: Leaderboard[];
  competitions: Competition[];
  achievements: LeaderboardAchievement[];
  rankings: UserRanking[];
  rewards: LeaderboardReward[];
  settings: LeaderboardSettings;
  notifications: LeaderboardNotification[];
  metrics: LeaderboardMetrics;
}

export interface Leaderboard {
  leaderboardId: string;
  name: string;
  description: string;
  type: 'points' | 'streak' | 'speed' | 'accuracy' | 'completion' | 'engagement' | 'social';
  category: 'overall' | 'weekly' | 'monthly' | 'yearly' | 'all_time' | 'custom';
  scope: 'global' | 'community' | 'study_group' | 'course' | 'challenge' | 'skill';
  status: 'active' | 'inactive' | 'archived';
  visibility: 'public' | 'private' | 'restricted';
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  period: LeaderboardPeriod;
  scoring: ScoringSystem;
  rules: LeaderboardRule[];
  participants: LeaderboardParticipant[];
  rankings: LeaderboardRanking[];
  history: LeaderboardHistory[];
  settings: LeaderboardSettings;
  stats: LeaderboardStats;
  badges: LeaderboardBadge[];
  rewards: LeaderboardReward[];
}

export interface LeaderboardPeriod {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: string;
  endDate: string;
  timezone: string;
  currentPeriod: number;
  totalPeriods: number;
  resetSchedule: ResetSchedule[];
}

export interface ResetSchedule {
  scheduleId: string;
  name: string;
  frequency: string;
  nextReset: string;
  timezone: string;
  action: 'reset' | 'archive' | 'freeze';
}

export interface ScoringSystem {
  algorithm: 'points' | 'weighted' | 'exponential' | 'custom';
  weights: ScoringWeight[];
  multipliers: ScoringMultiplier[];
  bonuses: ScoringBonus[];
  penalties: ScoringPenalty[];
  decay: ScoringDecay;
  caps: ScoringCap[];
}

export interface ScoringWeight {
  activity: string;
  weight: number; // 0-1
  description: string;
}

export interface ScoringMultiplier {
  multiplierId: string;
  name: string;
  condition: string;
  value: number;
  duration: string;
  stackable: boolean;
  description: string;
}

export interface ScoringBonus {
  bonusId: string;
  name: string;
  type: 'streak' | 'milestone' | 'achievement' | 'special';
  condition: string;
  points: number;
  description: string;
}

export interface ScoringPenalty {
  penaltyId: string;
  name: string;
  type: 'inactivity' | 'violation' | 'decline';
  condition: string;
  points: number;
  description: string;
}

export interface ScoringDecay {
  enabled: boolean;
  rate: number; // percentage per period
  minScore: number;
  period: string;
  description: string;
}

export interface ScoringCap {
  capId: string;
  type: 'daily' | 'weekly' | 'monthly' | 'total';
  maxPoints: number;
  period: string;
  description: string;
}

export interface LeaderboardRule {
  ruleId: string;
  name: string;
  description: string;
  type: 'eligibility' | 'participation' | 'scoring' | 'conduct';
  category: 'required' | 'recommended' | 'prohibited';
  condition: string;
  action: RuleAction;
  priority: 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
}

export interface RuleAction {
  type: 'allow' | 'deny' | 'warn' | 'penalize' | 'disqualify';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface LeaderboardParticipant {
  userId: string;
  username: string;
  avatar?: string;
  joinedDate: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'suspended' | 'disqualified';
  eligibility: ParticipantEligibility;
  permissions: ParticipantPermissions;
  preferences: ParticipantPreferences;
  stats: ParticipantStats;
  history: ParticipantHistory[];
}

export interface ParticipantEligibility {
  eligible: boolean;
  requirements: EligibilityRequirement[];
  restrictions: EligibilityRestriction[];
  waivers: EligibilityWaiver[];
}

export interface EligibilityRequirement {
  requirementId: string;
  name: string;
  description: string;
  type: 'skill' | 'level' | 'activity' | 'time' | 'custom';
  value: any;
  met: boolean;
  lastChecked: string;
}

export interface EligibilityRestriction {
  restrictionId: string;
  name: string;
  description: string;
  type: 'temporary' | 'permanent' | 'conditional';
  condition: string;
  active: boolean;
  expires?: string;
}

export interface EligibilityWaiver {
  waiverId: string;
  requirementId: string;
  grantedBy: string;
  reason: string;
  grantedDate: string;
  expires?: string;
}

export interface ParticipantPermissions {
  canView: boolean;
  canParticipate: boolean;
  canCompete: boolean;
  canInvite: boolean;
  canModerate: boolean;
  canManage: boolean;
  canReport: boolean;
  canAppeal: boolean;
}

export interface ParticipantPreferences {
  visibility: 'public' | 'friends' | 'private';
  notifications: boolean;
  comparison: boolean;
  sharing: boolean;
  anonymity: boolean;
}

export interface ParticipantStats {
  totalScore: number;
  currentScore: number;
  rank: number;
  previousRank: number;
  rankChange: number;
  participation: ParticipationStats;
  performance: PerformanceStats;
  achievements: AchievementStats[];
  streaks: StreakStats[];
  history: StatsHistory[];
}

export interface ParticipationStats {
  joined: string;
  lastActive: string;
  totalSessions: number;
  totalTime: number;
  averageSessionTime: number;
  completionRate: number;
  consistency: number; // 0-100
}

export interface PerformanceStats {
  averageScore: number;
  bestScore: number;
  worstScore: number;
  improvement: number;
  consistency: number; // 0-100
  potential: number; // 0-100
  trends: PerformanceTrend[];
}

export interface PerformanceTrend {
  period: string;
  score: number;
  rank: number;
  change: number;
  factors: string[];
}

export interface AchievementStats {
  achievementId: string;
  name: string;
  earnedDate: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
}

export interface StreakStats {
  streakId: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  current: number;
  best: number;
  startDate: string;
  lastDate: string;
  active: boolean;
}

export interface StatsHistory {
  historyId: string;
  date: string;
  score: number;
  rank: number;
  position: LeaderboardPosition;
  activities: ActivityRecord[];
}

export interface LeaderboardPosition {
  rank: number;
  percentile: number;
  tier: LeaderboardTier;
  badge: string;
}

export interface LeaderboardTier {
  tier: string;
  name: string;
  description: string;
  minRank: number;
  maxRank: number;
  color: string;
  icon: string;
  benefits: string[];
}

export interface ActivityRecord {
  activityId: string;
  type: string;
  points: number;
  timestamp: string;
  details: ActivityDetails;
}

export interface ActivityDetails {
  category: string;
  difficulty: string;
  duration: number;
  accuracy: number;
  completion: boolean;
}

export interface ParticipantHistory {
  historyId: string;
  date: string;
  action: 'joined' | 'left' | 'ranked' | 'achieved' | 'penalized' | 'rewarded';
  details: string;
  impact: string;
  metadata: HistoryMetadata;
}

export interface HistoryMetadata {
  score?: number;
  rank?: number;
  achievement?: string;
  reward?: string;
  reason?: string;
}

export interface LeaderboardRanking {
  rankingId: string;
  userId: string;
  username: string;
  avatar?: string;
  rank: number;
  previousRank: number;
  score: number;
  tier: LeaderboardTier;
  badge: string;
  change: RankingChange;
  stats: RankingStats;
  achievements: RankingAchievement[];
  activity: RankingActivity;
  position: RankingPosition;
}

export interface RankingChange {
  rankChange: number;
  scoreChange: number;
  direction: 'up' | 'down' | 'same';
  significance: 'minor' | 'moderate' | 'major' | 'dramatic';
  reason: string;
}

export interface RankingStats {
  totalParticipants: number;
  averageScore: number;
  topScore: number;
  bottomScore: number;
  scoreDistribution: ScoreDistribution[];
  rankDistribution: RankDistribution[];
}

export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
  tier: string;
}

export interface RankDistribution {
  range: string;
  count: number;
  percentage: number;
  tier: string;
}

export interface RankingAchievement {
  achievementId: string;
  name: string;
  description: string;
  earnedDate: string;
  points: number;
  rarity: string;
  icon: string;
}

export interface RankingActivity {
  lastActive: string;
  totalSessions: number;
  averageScore: number;
  consistency: number;
  improvement: number;
  potential: number;
}

export interface RankingPosition {
  current: LeaderboardPosition;
  best: LeaderboardPosition;
  worst: LeaderboardPosition;
  average: LeaderboardPosition;
  trend: PositionTrend[];
}

export interface PositionTrend {
  period: string;
  rank: number;
  percentile: number;
  tier: string;
  change: number;
}

export interface LeaderboardHistory {
  historyId: string;
  period: string;
  startDate: string;
  endDate: string;
  participants: number;
  rankings: HistoricalRanking[];
  events: HistoryEvent[];
  stats: HistoryStats;
  archived: boolean;
}

export interface HistoricalRanking {
  rankingId: string;
  userId: string;
  username: string;
  rank: number;
  score: number;
  tier: string;
  badge: string;
}

export interface HistoryEvent {
  eventId: string;
  type: 'milestone' | 'record' | 'achievement' | 'competition' | 'update';
  title: string;
  description: string;
  timestamp: string;
  participants: string[];
  impact: string;
  metadata: EventMetadata;
}

export interface EventMetadata {
  record?: Record;
  achievement?: string;
  competition?: string;
  update?: UpdateInfo;
}

export interface Record {
  type: 'score' | 'rank' | 'streak' | 'speed';
  value: number;
  previous: number;
  holder: string;
  date: string;
}

export interface UpdateInfo {
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
}

export interface HistoryStats {
  totalParticipants: number;
  averageScore: number;
  totalPoints: number;
  topScore: number;
  completionRate: number;
  engagement: number;
  retention: number;
}

export interface LeaderboardStats {
  participants: number;
  activeParticipants: number;
  totalPoints: number;
  averageScore: number;
  topScore: number;
  completionRate: number;
  engagementRate: number;
  retentionRate: number;
  competitionRate: number;
  growth: GrowthStats;
  trends: TrendStats[];
  distribution: DistributionStats;
}

export interface GrowthStats {
  newParticipants: number;
  returningParticipants: number;
  growthRate: number;
  retentionRate: number;
  churnRate: number;
  period: string;
}

export interface TrendStats {
  period: string;
  participants: number;
  score: number;
  engagement: number;
  retention: number;
  change: number;
}

export interface DistributionStats {
  tiers: TierDistribution[];
  scores: ScoreDistribution[];
  ranks: RankDistribution[];
  activity: ActivityDistribution[];
}

export interface TierDistribution {
  tier: string;
  count: number;
  percentage: number;
  averageScore: number;
}

export interface ActivityDistribution {
  activity: string;
  count: number;
  percentage: number;
  averageScore: number;
}

export interface LeaderboardBadge {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  category: 'rank' | 'achievement' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: BadgeCondition[];
  rewards: BadgeReward[];
  expires?: string;
  limited: boolean;
}

export interface BadgeCondition {
  conditionId: string;
  name: string;
  description: string;
  type: 'rank' | 'score' | 'streak' | 'achievement' | 'activity';
  value: any;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  required: boolean;
}

export interface BadgeReward {
  rewardId: string;
  type: 'points' | 'privilege' | 'recognition' | 'access';
  value: any;
  description: string;
}

export interface Competition {
  competitionId: string;
  name: string;
  description: string;
  type: 'tournament' | 'challenge' | 'race' | 'marathon' | 'sprint';
  category: 'coding' | 'learning' | 'collaboration' | 'creativity' | 'speed';
  format: 'individual' | 'team' | 'relay' | 'elimination';
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  visibility: 'public' | 'private' | 'invite_only';
  createdDate: string;
  startDate: string;
  endDate: string;
  duration: string;
  timezone: string;
  participants: CompetitionParticipant[];
  teams: CompetitionTeam[];
  rounds: CompetitionRound[];
  rules: CompetitionRule[];
  rewards: CompetitionReward[];
  leaderboard: CompetitionLeaderboard;
  stats: CompetitionStats;
  settings: CompetitionSettings;
}

export interface CompetitionParticipant {
  participantId: string;
  userId: string;
  username: string;
  avatar?: string;
  teamId?: string;
  status: 'registered' | 'active' | 'eliminated' | 'disqualified' | 'withdrawn';
  registeredDate: string;
  stats: CompetitionParticipantStats;
  progress: CompetitionProgress[];
  achievements: CompetitionAchievement[];
}

export interface CompetitionParticipantStats {
  score: number;
  rank: number;
  completed: number;
  accuracy: number;
  speed: number;
  improvement: number;
  potential: number;
}

export interface CompetitionProgress {
  progressId: string;
  roundId: string;
  score: number;
  rank: number;
  completed: boolean;
  completedAt?: string;
  details: ProgressDetails;
}

export interface ProgressDetails {
  attempts: number;
  timeSpent: number;
  accuracy: number;
  hints: number;
  penalties: number;
  bonuses: number;
}

export interface CompetitionAchievement {
  achievementId: string;
  name: string;
  description: string;
  earnedDate: string;
  points: number;
  rarity: string;
  category: string;
}

export interface CompetitionTeam {
  teamId: string;
  name: string;
  description: string;
  avatar?: string;
  captainId: string;
  members: CompetitionTeamMember[];
  status: 'forming' | 'active' | 'eliminated' | 'disqualified';
  stats: CompetitionTeamStats;
  progress: CompetitionTeamProgress[];
}

export interface CompetitionTeamMember {
  userId: string;
  username: string;
  avatar?: string;
  role: 'captain' | 'member';
  joinedDate: string;
  status: 'active' | 'inactive' | 'removed';
  contribution: number;
}

export interface CompetitionTeamStats {
  score: number;
  rank: number;
  members: number;
  averageScore: number;
  bestMember: string;
  contribution: TeamContribution[];
}

export interface TeamContribution {
  userId: string;
  username: string;
  contribution: number;
  percentage: number;
  role: string;
}

export interface CompetitionTeamProgress {
  progressId: string;
  roundId: string;
  score: number;
  rank: number;
  completed: boolean;
  completedAt?: string;
  contributions: TeamContribution[];
}

export interface CompetitionRound {
  roundId: string;
  name: string;
  description: string;
  type: 'qualification' | 'preliminary' | 'quarterfinal' | 'semifinal' | 'final';
  format: 'individual' | 'team' | 'relay';
  startDate: string;
  endDate: string;
  duration: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  participants: string[];
  tasks: CompetitionTask[];
  leaderboard: RoundLeaderboard;
  stats: RoundStats;
}

export interface CompetitionTask {
  taskId: string;
  name: string;
  description: string;
  type: 'coding' | 'quiz' | 'project' | 'presentation' | 'collaboration';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  points: number;
  timeLimit: number;
  attempts: number;
  requirements: TaskRequirement[];
  evaluation: TaskEvaluation;
}

export interface TaskRequirement {
  requirementId: string;
  name: string;
  description: string;
  type: 'skill' | 'tool' | 'knowledge' | 'resource';
  required: boolean;
}

export interface TaskEvaluation {
  criteria: EvaluationCriteria[];
  weighting: EvaluationWeighting[];
  scoring: ScoringMethod;
}

export interface EvaluationCriteria {
  criterionId: string;
  name: string;
  description: string;
  type: 'score' | 'time' | 'accuracy' | 'creativity';
  weight: number;
  maxScore: number;
}

export interface EvaluationWeighting {
  component: string;
  weight: number;
  description: string;
}

export interface ScoringMethod {
  algorithm: 'additive' | 'weighted' | 'normalized' | 'custom';
  formula: string;
  parameters: ScoringParameter[];
}

export interface ScoringParameter {
  parameter: string;
  value: number;
  description: string;
}

export interface RoundLeaderboard {
  rankings: RoundRanking[];
  stats: RoundStats;
  updated: string;
}

export interface RoundRanking {
  rankingId: string;
  participantId: string;
  teamId?: string;
  rank: number;
  score: number;
  completed: number;
  time: number;
  accuracy: number;
  status: string;
}

export interface RoundStats {
  participants: number;
  completed: number;
  averageScore: number;
  topScore: number;
  averageTime: number;
  averageAccuracy: number;
}

export interface CompetitionRule {
  ruleId: string;
  name: string;
  description: string;
  type: 'participation' | 'scoring' | 'conduct' | 'eligibility';
  category: 'required' | 'recommended' | 'prohibited';
  condition: string;
  action: RuleAction;
  priority: 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
}

export interface CompetitionReward {
  rewardId: string;
  name: string;
  description: string;
  type: 'points' | 'badge' | 'prize' | 'privilege' | 'recognition';
  value: any;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  quantity: number;
  distribution: RewardDistribution[];
}

export interface RewardDistribution {
  rank: string;
  quantity: number;
  percentage: number;
}

export interface CompetitionLeaderboard {
  leaderboardId: string;
  name: string;
  type: 'overall' | 'round' | 'team' | 'individual';
  rankings: CompetitionRanking[];
  stats: CompetitionLeaderboardStats;
  updated: string;
}

export interface CompetitionRanking {
  rankingId: string;
  participantId: string;
  teamId?: string;
  rank: number;
  score: number;
  completed: number;
  time: number;
  accuracy: number;
  status: string;
  change: CompetitionRankingChange;
}

export interface CompetitionRankingChange {
  rankChange: number;
  scoreChange: number;
  direction: 'up' | 'down' | 'same';
  significance: string;
  reason: string;
}

export interface CompetitionLeaderboardStats {
  participants: number;
  completed: number;
  averageScore: number;
  topScore: number;
  averageTime: number;
  averageAccuracy: number;
  distribution: CompetitionDistribution[];
}

export interface CompetitionDistribution {
  category: string;
  ranges: DistributionRange[];
}

export interface DistributionRange {
  range: string;
  count: number;
  percentage: number;
}

export interface CompetitionStats {
  participants: number;
  teams: number;
  completed: number;
  averageScore: number;
  topScore: number;
  averageTime: number;
  averageAccuracy: number;
  engagement: CompetitionEngagement;
  retention: CompetitionRetention;
  growth: CompetitionGrowth;
}

export interface CompetitionEngagement {
  registrationRate: number;
  participationRate: number;
  completionRate: number;
  averageSessionTime: number;
  returnRate: number;
}

export interface CompetitionRetention {
  retentionRate: number;
  churnRate: number;
  averageLifetime: number;
  dropoffPoints: DropoffPoint[];
}

export interface DropoffPoint {
  point: string;
  count: number;
  percentage: number;
  reason: string;
}

export interface CompetitionGrowth {
  newParticipants: number;
  returningParticipants: number;
  growthRate: number;
  period: string;
}

export interface CompetitionSettings {
  registration: RegistrationSettings;
  participation: ParticipationSettings;
  scoring: CompetitionScoringSettings;
  communication: CommunicationSettings;
  privacy: PrivacySettings;
  rewards: CompetitionRewardSettings;
}

export interface RegistrationSettings {
  open: boolean;
  startDate: string;
  endDate: string;
  requirements: RegistrationRequirement[];
  approval: boolean;
  capacity: number;
  waitlist: boolean;
}

export interface RegistrationRequirement {
  requirementId: string;
  name: string;
  description: string;
  type: 'skill' | 'level' | 'experience' | 'custom';
  required: boolean;
  value: any;
}

export interface ParticipationSettings {
  minParticipation: number;
  maxParticipation: number;
  teamSize: TeamSize[];
  substitutions: boolean;
  withdrawals: boolean;
  disqualifications: boolean;
}

export interface TeamSize {
  min: number;
  max: number;
  description: string;
}

export interface CompetitionScoringSettings {
  algorithm: string;
  weights: CompetitionWeight[];
  bonuses: CompetitionBonus[];
  penalties: CompetitionPenalty[];
  ties: TieRule[];
}

export interface CompetitionWeight {
  component: string;
  weight: number;
  description: string;
}

export interface CompetitionBonus {
  bonusId: string;
  name: string;
  condition: string;
  points: number;
  description: string;
}

export interface CompetitionPenalty {
  penaltyId: string;
  name: string;
  condition: string;
  points: number;
  description: string;
}

export interface TieRule {
  ruleId: string;
  name: string;
  description: string;
  condition: string;
  resolution: string;
}

export interface CommunicationSettings {
  announcements: boolean;
  updates: boolean;
  reminders: boolean;
  results: boolean;
  channels: CommunicationChannel[];
}

export interface CommunicationChannel {
  channel: 'email' | 'push' | 'in_app' | 'sms';
  enabled: boolean;
  settings: ChannelSettings;
}

export interface ChannelSettings {
  frequency: string;
  quietHours: boolean;
  categories: string[];
}

export interface PrivacySettings {
  publicLeaderboard: boolean;
  showParticipants: boolean;
  allowAnonymous: boolean;
  dataRetention: number;
}

export interface CompetitionRewardSettings {
  enabled: boolean;
  tiers: RewardTier[];
  distribution: RewardDistributionMethod[];
  notifications: boolean;
}

export interface RewardTier {
  tier: string;
  name: string;
  description: string;
  minRank: number;
  maxRank: number;
  rewards: string[];
}

export interface RewardDistributionMethod {
  method: 'automatic' | 'manual' | 'ceremony';
  description: string;
  timeline: string;
}

export interface LeaderboardAchievement {
  achievementId: string;
  name: string;
  description: string;
  category: 'rank' | 'score' | 'streak' | 'participation' | 'improvement';
  type: 'milestone' | 'record' | 'special' | 'seasonal';
  icon: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: AchievementCondition[];
  rewards: AchievementReward[];
  progress: AchievementProgress[];
  earnedBy: string[];
}

export interface AchievementCondition {
  conditionId: string;
  name: string;
  description: string;
  type: 'rank' | 'score' | 'streak' | 'time' | 'combination';
  value: any;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  required: boolean;
}

export interface AchievementReward {
  rewardId: string;
  type: 'points' | 'badge' | 'privilege' | 'recognition';
  value: any;
  description: string;
}

export interface AchievementProgress {
  userId: string;
  progress: number; // 0-100
  current: any;
  target: any;
  lastUpdated: string;
  milestones: AchievementMilestone[];
}

export interface AchievementMilestone {
  milestoneId: string;
  title: string;
  description: string;
  achieved: boolean;
  achievedAt?: string;
}

export interface UserRanking {
  rankingId: string;
  userId: string;
  username: string;
  avatar?: string;
  leaderboards: UserLeaderboardRanking[];
  overall: UserOverallRanking;
  stats: UserRankingStats;
  achievements: UserAchievement[];
  history: UserRankingHistory[];
  preferences: UserRankingPreferences;
}

export interface UserLeaderboardRanking {
  leaderboardId: string;
  leaderboardName: string;
  rank: number;
  score: number;
  tier: string;
  badge: string;
  change: UserRankingChange;
  participation: UserParticipation;
}

export interface UserRankingChange {
  rankChange: number;
  scoreChange: number;
  direction: 'up' | 'down' | 'same';
  significance: 'minor' | 'moderate' | 'major' | 'dramatic';
  period: string;
  reason: string;
}

export interface UserParticipation {
  joined: string;
  lastActive: string;
  totalSessions: number;
  totalTime: number;
  averageScore: number;
  bestScore: number;
  improvement: number;
  consistency: number;
}

export interface UserOverallRanking {
  globalRank: number;
  globalScore: number;
  globalTier: string;
  communityRank: number;
  communityScore: number;
  communityTier: string;
  bestRank: number;
  bestScore: number;
  bestTier: string;
}

export interface UserRankingStats {
  totalLeaderboards: number;
  activeLeaderboards: number;
  averageRank: number;
  bestRank: number;
  worstRank: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  achievements: number;
  streaks: number;
}

export interface UserAchievement {
  achievementId: string;
  name: string;
  description: string;
  earnedDate: string;
  points: number;
  rarity: string;
  category: string;
  icon: string;
}

export interface UserRankingHistory {
  historyId: string;
  date: string;
  leaderboardId: string;
  rank: number;
  score: number;
  tier: string;
  action: string;
  details: string;
}

export interface UserRankingPreferences {
  visibility: 'public' | 'friends' | 'private';
  notifications: boolean;
  comparisons: boolean;
  sharing: boolean;
  anonymity: boolean;
  leaderboards: string[];
}

export interface LeaderboardReward {
  rewardId: string;
  name: string;
  description: string;
  type: 'points' | 'badge' | 'privilege' | 'recognition' | 'prize';
  category: 'rank' | 'achievement' | 'participation' | 'milestone';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  value: any;
  icon: string;
  condition: RewardCondition[];
  distribution: RewardDistribution[];
  expires?: string;
  limited: boolean;
}

export interface RewardCondition {
  conditionId: string;
  name: string;
  description: string;
  type: 'rank' | 'score' | 'achievement' | 'time';
  value: any;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  required: boolean;
}

export interface LeaderboardSettings {
  general: GeneralSettings;
  scoring: LeaderboardScoringSettings;
  participation: ParticipationSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  rewards: LeaderboardRewardSettings;
  competition: CompetitionSettings;
}

export interface GeneralSettings {
  defaultPeriod: string;
  maxParticipants: number;
  refreshInterval: number;
  archivePeriod: number;
  publicVisibility: boolean;
  allowAnonymous: boolean;
}

export interface LeaderboardScoringSettings {
  defaultAlgorithm: string;
  defaultWeights: ScoringWeight[];
  decayEnabled: boolean;
  capsEnabled: boolean;
  bonusesEnabled: boolean;
  penaltiesEnabled: boolean;
}

export interface NotificationSettings {
  rankChanges: boolean;
  achievements: boolean;
  competitions: boolean;
  rewards: boolean;
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  channels: NotificationChannel[];
}

export interface LeaderboardRewardSettings {
  enabled: boolean;
  autoDistribution: boolean;
  tiers: RewardTier[];
  notifications: boolean;
  ceremonies: boolean;
}

export interface LeaderboardNotification {
  notificationId: string;
  type: 'rank_change' | 'achievement' | 'competition' | 'reward' | 'milestone';
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
  leaderboardId?: string;
  competitionId?: string;
  achievementId?: string;
  rewardId?: string;
  rank?: number;
  score?: number;
  tier?: string;
}

export interface LeaderboardMetrics {
  overall: OverallMetrics;
  engagement: EngagementMetrics;
  competition: CompetitionMetrics;
  retention: RetentionMetrics;
  growth: GrowthMetrics;
  quality: QualityMetrics;
}

export interface OverallMetrics {
  totalLeaderboards: number;
  totalParticipants: number;
  activeParticipants: number;
  totalCompetitions: number;
  totalAchievements: number;
  totalRewards: number;
  averageEngagement: number;
  averageSatisfaction: number;
}

export interface EngagementMetrics {
  participationRate: number;
  completionRate: number;
  returnRate: number;
  averageSessionTime: number;
  averageScore: number;
  improvementRate: number;
  socialSharing: number;
}

export interface CompetitionMetrics {
  competitionRate: number;
  averageCompetitionSize: number;
  competitionCompletionRate: number;
  teamFormationRate: number;
  averageTeamSize: number;
  competitionSatisfaction: number;
}

export interface RetentionMetrics {
  retentionRate: number;
  churnRate: number;
  averageLifetime: number;
  dropoffRate: number;
  reactivationRate: number;
  loyaltyRate: number;
}

export interface GrowthMetrics {
  newParticipants: number;
  returningParticipants: number;
  growthRate: number;
  viralCoefficient: number;
  referralRate: number;
  expansionRate: number;
}

export interface QualityMetrics {
  averageRating: number;
  satisfactionScore: number;
  complaintRate: number;
  disputeRate: number;
  fairnessScore: number;
  integrityScore: number;
}

// Leaderboards context
interface LeaderboardsContextType {
  system: LeaderboardSystem;
  loading: boolean;
  error: string | null;
  createLeaderboard: (leaderboard: Omit<Leaderboard, 'leaderboardId' | 'createdDate' | 'updatedDate'>) => Promise<Leaderboard>;
  updateLeaderboard: (leaderboardId: string, updates: Partial<Leaderboard>) => Promise<void>;
  deleteLeaderboard: (leaderboardId: string) => Promise<void>;
  getLeaderboard: (leaderboardId: string) => Leaderboard | null;
  getLeaderboards: (filters?: LeaderboardFilters) => Leaderboard[];
  joinLeaderboard: (leaderboardId: string, userId: string) => Promise<void>;
  leaveLeaderboard: (leaderboardId: string, userId: string) => Promise<void>;
  updateScore: (leaderboardId: string, userId: string, activity: ScoreActivity) => Promise<void>;
  getRanking: (leaderboardId: string, userId: string) => LeaderboardRanking | null;
  getRankings: (leaderboardId: string, filters?: RankingFilters) => LeaderboardRanking[];
  createCompetition: (competition: Omit<Competition, 'competitionId' | 'createdDate'>) => Promise<Competition>;
  updateCompetition: (competitionId: string, updates: Partial<Competition>) => Promise<void>;
  deleteCompetition: (competitionId: string) => Promise<void>;
  getCompetition: (competitionId: string) => Competition | null;
  getCompetitions: (filters?: CompetitionFilters) => Competition[];
  joinCompetition: (competitionId: string, userId: string, teamId?: string) => Promise<void>;
  leaveCompetition: (competitionId: string, userId: string) => Promise<void>;
  updateCompetitionScore: (competitionId: string, userId: string, activity: CompetitionActivity) => Promise<void>;
  getCompetitionRanking: (competitionId: string, userId: string) => CompetitionRanking | null;
  getCompetitionRankings: (competitionId: string, filters?: CompetitionRankingFilters) => CompetitionRanking[];
  getUserRankings: (userId: string) => UserRanking | null;
  getUserAchievements: (userId: string) => UserAchievement[];
  getUserRewards: (userId: string) => LeaderboardReward[];
  getLeaderboardMetrics: (leaderboardId?: string) => LeaderboardMetrics;
  getCompetitionMetrics: (competitionId?: string) => CompetitionMetrics;
  searchLeaderboards: (query: string, filters?: SearchFilters) => Leaderboard[];
  searchCompetitions: (query: string, filters?: CompetitionSearchFilters) => Competition[];
  exportLeaderboardData: (type: 'leaderboards' | 'competitions' | 'rankings' | 'metrics', format: 'json' | 'csv') => Promise<string>;
}

export interface LeaderboardFilters {
  type?: Leaderboard['type'];
  category?: Leaderboard['category'];
  scope?: Leaderboard['scope'];
  status?: Leaderboard['status'];
  visibility?: Leaderboard['visibility'];
  tags?: string[];
}

export interface RankingFilters {
  tier?: string;
  rankRange?: { min: number; max: number };
  scoreRange?: { min: number; max: number };
  activity?: string;
  dateRange?: { start: string; end: string };
}

export interface CompetitionFilters {
  type?: Competition['type'];
  category?: Competition['category'];
  format?: Competition['format'];
  status?: Competition['status'];
  visibility?: Competition['visibility'];
  dateRange?: { start: string; end: string };
}

export interface CompetitionRankingFilters {
  roundId?: string;
  teamId?: string;
  status?: string;
  rankRange?: { min: number; max: number };
  scoreRange?: { min: number; max: number };
}

export interface SearchFilters {
  query: string;
  type?: string;
  category?: string;
  scope?: string;
  status?: string;
  sortBy?: 'relevance' | 'date' | 'popularity' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface CompetitionSearchFilters {
  query: string;
  type?: Competition['type'];
  category?: Competition['category'];
  format?: Competition['format'];
  status?: Competition['status'];
  dateRange?: { start: string; end: string };
  sortBy?: 'relevance' | 'date' | 'popularity' | 'prize';
  sortOrder?: 'asc' | 'desc';
}

export interface ScoreActivity {
  activityId: string;
  type: string;
  points: number;
  timestamp: string;
  details: ActivityDetails;
}

export interface CompetitionActivity {
  activityId: string;
  competitionId: string;
  roundId?: string;
  taskId?: string;
  type: string;
  score: number;
  timestamp: string;
  details: CompetitionActivityDetails;
}

export interface CompetitionActivityDetails {
  round: string;
  task: string;
  attempts: number;
  timeSpent: number;
  accuracy: number;
  hints: number;
  penalties: number;
  bonuses: number;
}

// Leaderboards engine
class LeaderboardsEngine {
  static async createLeaderboard(leaderboardData: Omit<Leaderboard, 'leaderboardId' | 'createdDate' | 'updatedDate'>): Promise<Leaderboard> {
    const leaderboardId = `leaderboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdDate = new Date().toISOString();
    const updatedDate = createdDate;

    const leaderboard: Leaderboard = {
      ...leaderboardData,
      leaderboardId,
      createdDate,
      updatedDate,
      participants: [],
      rankings: [],
      history: [],
      stats: this.initializeLeaderboardStats(),
      badges: [],
      rewards: [],
    };

    return leaderboard;
  }

  static initializeLeaderboardStats(): LeaderboardStats {
    return {
      participants: 0,
      activeParticipants: 0,
      totalPoints: 0,
      averageScore: 0,
      topScore: 0,
      completionRate: 0,
      engagementRate: 0,
      retentionRate: 0,
      competitionRate: 0,
      growth: {
        newParticipants: 0,
        returningParticipants: 0,
        growthRate: 0,
        retentionRate: 0,
        churnRate: 0,
        period: 'daily',
      },
      trends: [],
      distribution: {
        tiers: [],
        scores: [],
        ranks: [],
        activity: [],
      },
    };
  }

  static async joinLeaderboard(leaderboardId: string, userId: string): Promise<void> {
    // Implementation for joining a leaderboard
    console.log(`User ${userId} joining leaderboard ${leaderboardId}`);
  }

  static async updateScore(leaderboardId: string, userId: string, activity: ScoreActivity): Promise<void> {
    // Implementation for updating score
    console.log(`Updating score for user ${userId} in leaderboard ${leaderboardId}`);
  }

  static async createCompetition(competitionData: Omit<Competition, 'competitionId' | 'createdDate'>): Promise<Competition> {
    const competitionId = `competition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdDate = new Date().toISOString();

    const competition: Competition = {
      ...competitionData,
      competitionId,
      createdDate,
      participants: [],
      teams: [],
      rounds: [],
      rules: [],
      rewards: [],
      leaderboard: {
        leaderboardId: `comp_lb_${competitionId}`,
        name: `${competitionData.name} Leaderboard`,
        type: 'overall',
        rankings: [],
        stats: {
          participants: 0,
          completed: 0,
          averageScore: 0,
          topScore: 0,
          averageTime: 0,
          averageAccuracy: 0,
          distribution: [],
        },
        updated: createdDate,
      },
      stats: this.initializeCompetitionStats(),
      settings: {
        registration: {
          open: true,
          startDate: createdDate,
          endDate: competitionData.endDate,
          requirements: [],
          approval: false,
          capacity: 1000,
          waitlist: true,
        },
        participation: {
          minParticipation: 1,
          maxParticipation: 1,
          teamSize: [{ min: 1, max: 1, description: 'Individual' }],
          substitutions: false,
          withdrawals: true,
          disqualifications: true,
        },
        scoring: {
          algorithm: 'additive',
          weights: [],
          bonuses: [],
          penalties: [],
          ties: [],
        },
        communication: {
          announcements: true,
          updates: true,
          reminders: true,
          results: true,
          channels: [],
        },
        privacy: {
          publicLeaderboard: true,
          showParticipants: true,
          allowAnonymous: false,
          dataRetention: 365,
        },
        rewards: {
          enabled: true,
          tiers: [],
          distribution: [],
          notifications: true,
        },
      },
    };

    return competition;
  }

  static initializeCompetitionStats(): CompetitionStats {
    return {
      participants: 0,
      teams: 0,
      completed: 0,
      averageScore: 0,
      topScore: 0,
      averageTime: 0,
      averageAccuracy: 0,
      engagement: {
        registrationRate: 0,
        participationRate: 0,
        completionRate: 0,
        averageSessionTime: 0,
        returnRate: 0,
      },
      retention: {
        retentionRate: 0,
        churnRate: 0,
        averageLifetime: 0,
        dropoffPoints: [],
      },
      growth: {
        newParticipants: 0,
        returningParticipants: 0,
        growthRate: 0,
        period: 'daily',
      },
    };
  }

  static async joinCompetition(competitionId: string, userId: string, teamId?: string): Promise<void> {
    // Implementation for joining a competition
    console.log(`User ${userId} joining competition ${competitionId}${teamId ? ` in team ${teamId}` : ''}`);
  }

  static async updateCompetitionScore(competitionId: string, userId: string, activity: CompetitionActivity): Promise<void> {
    // Implementation for updating competition score
    console.log(`Updating competition score for user ${userId} in competition ${competitionId}`);
  }

  static async getUserRankings(userId: string): Promise<UserRanking | null> {
    // Mock implementation - would calculate actual user rankings
    return {
      rankingId: `user_ranking_${userId}`,
      userId,
      username: `user_${userId}`,
      leaderboards: [],
      overall: {
        globalRank: 0,
        globalScore: 0,
        globalTier: 'bronze',
        communityRank: 0,
        communityScore: 0,
        communityTier: 'bronze',
        bestRank: 0,
        bestScore: 0,
        bestTier: 'bronze',
      },
      stats: {
        totalLeaderboards: 0,
        activeLeaderboards: 0,
        averageRank: 0,
        bestRank: 0,
        worstRank: 0,
        totalScore: 0,
        averageScore: 0,
        bestScore: 0,
        achievements: 0,
        streaks: 0,
      },
      achievements: [],
      history: [],
      preferences: {
        visibility: 'public',
        notifications: true,
        comparisons: true,
        sharing: true,
        anonymity: false,
        leaderboards: [],
      },
    };
  }

  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    // Mock implementation - would get actual user achievements
    return [];
  }

  static async getUserRewards(userId: string): Promise<LeaderboardReward[]> {
    // Mock implementation - would get actual user rewards
    return [];
  }

  static async getLeaderboardMetrics(leaderboardId?: string): Promise<LeaderboardMetrics> {
    // Mock implementation - would calculate actual metrics
    return {
      overall: {
        totalLeaderboards: 10,
        totalParticipants: 1000,
        activeParticipants: 500,
        totalCompetitions: 20,
        totalAchievements: 500,
        totalRewards: 200,
        averageEngagement: 75,
        averageSatisfaction: 4.2,
      },
      engagement: {
        participationRate: 80,
        completionRate: 65,
        returnRate: 70,
        averageSessionTime: 30,
        averageScore: 75,
        improvementRate: 15,
        socialSharing: 25,
      },
      competition: {
        competitionRate: 30,
        averageCompetitionSize: 50,
        competitionCompletionRate: 70,
        teamFormationRate: 40,
        averageTeamSize: 3,
        competitionSatisfaction: 4.1,
      },
      retention: {
        retentionRate: 75,
        churnRate: 25,
        averageLifetime: 90,
        dropoffRate: 20,
        reactivationRate: 15,
        loyaltyRate: 80,
      },
      growth: {
        newParticipants: 50,
        returningParticipants: 200,
        growthRate: 15,
        viralCoefficient: 1.2,
        referralRate: 20,
        expansionRate: 10,
      },
      quality: {
        averageRating: 4.3,
        satisfactionScore: 85,
        complaintRate: 5,
        disputeRate: 2,
        fairnessScore: 90,
        integrityScore: 95,
      },
    };
  }

  static async getCompetitionMetrics(competitionId?: string): Promise<CompetitionMetrics> {
    // Mock implementation - would calculate actual competition metrics
    return {
      participants: 100,
      teams: 25,
      completed: 70,
      averageScore: 75,
      topScore: 95,
      averageTime: 45,
      averageAccuracy: 80,
      engagement: {
        registrationRate: 85,
        participationRate: 90,
        completionRate: 70,
        averageSessionTime: 45,
        returnRate: 75,
      },
      retention: {
        retentionRate: 80,
        churnRate: 20,
        averageLifetime: 14,
        dropoffPoints: [],
      },
      growth: {
        newParticipants: 20,
        returningParticipants: 80,
        growthRate: 25,
        period: 'daily',
      },
    };
  }

  static async searchLeaderboards(query: string, filters?: SearchFilters): Promise<Leaderboard[]> {
    // Mock implementation - would search actual leaderboards
    return [];
  }

  static async searchCompetitions(query: string, filters?: CompetitionSearchFilters): Promise<Competition[]> {
    // Mock implementation - would search actual competitions
    return [];
  }

  static async exportLeaderboardData(type: string, format: 'json' | 'csv'): Promise<string> {
    // Mock implementation - would export actual leaderboard data
    const exportData = {
      type,
      exportedAt: new Date().toISOString(),
      format,
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Leaderboards provider
export const LeaderboardsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [system, setSystem] = useState<LeaderboardSystem>({
    leaderboards: [],
    competitions: [],
    achievements: [],
    rankings: [],
    rewards: [],
    settings: {
      general: {
        defaultPeriod: 'weekly',
        maxParticipants: 10000,
        refreshInterval: 300, // 5 minutes
        archivePeriod: 90, // 90 days
        publicVisibility: true,
        allowAnonymous: false,
      },
      scoring: {
        defaultAlgorithm: 'weighted',
        defaultWeights: [],
        decayEnabled: true,
        capsEnabled: true,
        bonusesEnabled: true,
        penaltiesEnabled: true,
      },
      participation: {
        minParticipation: 1,
        maxParticipation: 100,
        teamSize: [],
        substitutions: true,
        withdrawals: true,
        disqualifications: true,
      },
      notifications: {
        rankChanges: true,
        achievements: true,
        competitions: true,
        rewards: true,
        frequency: 'real_time',
        channels: [],
      },
      privacy: {
        publicLeaderboard: true,
        showParticipants: true,
        allowAnonymous: false,
        dataRetention: 365,
      },
      rewards: {
        enabled: true,
        autoDistribution: true,
        tiers: [],
        notifications: true,
        ceremonies: false,
      },
      competition: {
        registration: {
          open: true,
          startDate: new Date().toISOString(),
          endDate: '',
          requirements: [],
          approval: false,
          capacity: 1000,
          waitlist: true,
        },
        participation: {
          minParticipation: 1,
          maxParticipation: 1,
          teamSize: [{ min: 1, max: 1, description: 'Individual' }],
          substitutions: false,
          withdrawals: true,
          disqualifications: true,
        },
        scoring: {
          algorithm: 'additive',
          weights: [],
          bonuses: [],
          penalties: [],
          ties: [],
        },
        communication: {
          announcements: true,
          updates: true,
          reminders: true,
          results: true,
          channels: [],
        },
        privacy: {
          publicLeaderboard: true,
          showParticipants: true,
          allowAnonymous: false,
          dataRetention: 365,
        },
        rewards: {
          enabled: true,
          tiers: [],
          distribution: [],
          notifications: true,
        },
      },
    },
    notifications: [],
    metrics: {
      overall: {
        totalLeaderboards: 0,
        totalParticipants: 0,
        activeParticipants: 0,
        totalCompetitions: 0,
        totalAchievements: 0,
        totalRewards: 0,
        averageEngagement: 0,
        averageSatisfaction: 0,
      },
      engagement: {
        participationRate: 0,
        completionRate: 0,
        returnRate: 0,
        averageSessionTime: 0,
        averageScore: 0,
        improvementRate: 0,
        socialSharing: 0,
      },
      competition: {
        competitionRate: 0,
        averageCompetitionSize: 0,
        competitionCompletionRate: 0,
        teamFormationRate: 0,
        averageTeamSize: 0,
        competitionSatisfaction: 0,
      },
      retention: {
        retentionRate: 0,
        churnRate: 0,
        averageLifetime: 0,
        dropoffRate: 0,
        reactivationRate: 0,
        loyaltyRate: 0,
      },
      growth: {
        newParticipants: 0,
        returningParticipants: 0,
        growthRate: 0,
        viralCoefficient: 0,
        referralRate: 0,
        expansionRate: 0,
      },
      quality: {
        averageRating: 0,
        satisfactionScore: 0,
        complaintRate: 0,
        disputeRate: 0,
        fairnessScore: 0,
        integrityScore: 0,
      },
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved system data
  useEffect(() => {
    const loadSystem = async () => {
      try {
        setLoading(true);
        const savedSystem = await AsyncStorage.getItem('@leaderboard_system');
        
        if (savedSystem) {
          setSystem(JSON.parse(savedSystem));
        }
      } catch (err) {
        setError('Failed to load leaderboard system');
        console.error('System loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSystem();
  }, []);

  const createLeaderboard = useCallback(async (leaderboardData: Omit<Leaderboard, 'leaderboardId' | 'createdDate' | 'updatedDate'>): Promise<Leaderboard> => {
    try {
      const newLeaderboard = await LeaderboardsEngine.createLeaderboard(leaderboardData);
      
      const updatedSystem = { ...system, leaderboards: [...system.leaderboards, newLeaderboard] };
      setSystem(updatedSystem);
      await AsyncStorage.setItem('@leaderboard_system', JSON.stringify(updatedSystem));

      return newLeaderboard;
    } catch (err) {
      setError('Failed to create leaderboard');
      console.error('Leaderboard creation error:', err);
      throw err;
    }
  }, [system]);

  const updateLeaderboard = useCallback(async (leaderboardId: string, updates: Partial<Leaderboard>): Promise<void> => {
    try {
      const leaderboardIndex = system.leaderboards.findIndex(l => l.leaderboardId === leaderboardId);
      if (leaderboardIndex === -1) throw new Error('Leaderboard not found');

      const updatedLeaderboards = [...system.leaderboards];
      updatedLeaderboards[leaderboardIndex] = { 
        ...updatedLeaderboards[leaderboardIndex], 
        ...updates,
        updatedDate: new Date().toISOString()
      };
      
      setSystem({ ...system, leaderboards: updatedLeaderboards });
      await AsyncStorage.setItem('@leaderboard_system', JSON.stringify({ ...system, leaderboards: updatedLeaderboards }));
    } catch (err) {
      setError('Failed to update leaderboard');
      console.error('Leaderboard update error:', err);
      throw err;
    }
  }, [system]);

  const deleteLeaderboard = useCallback(async (leaderboardId: string): Promise<void> => {
    try {
      const updatedLeaderboards = system.leaderboards.filter(l => l.leaderboardId !== leaderboardId);
      setSystem({ ...system, leaderboards: updatedLeaderboards });
      await AsyncStorage.setItem('@leaderboard_system', JSON.stringify({ ...system, leaderboards: updatedLeaderboards }));
    } catch (err) {
      setError('Failed to delete leaderboard');
      console.error('Leaderboard deletion error:', err);
      throw err;
    }
  }, [system]);

  const getLeaderboard = useCallback((leaderboardId: string): Leaderboard | null => {
    return system.leaderboards.find(l => l.leaderboardId === leaderboardId) || null;
  }, [system.leaderboards]);

  const getLeaderboards = useCallback((filters?: LeaderboardFilters): Leaderboard[] => {
    let leaderboards = system.leaderboards;
    
    if (filters) {
      if (filters.type) {
        leaderboards = leaderboards.filter(l => l.type === filters.type);
      }
      if (filters.category) {
        leaderboards = leaderboards.filter(l => l.category === filters.category);
      }
      if (filters.scope) {
        leaderboards = leaderboards.filter(l => l.scope === filters.scope);
      }
      if (filters.status) {
        leaderboards = leaderboards.filter(l => l.status === filters.status);
      }
      if (filters.visibility) {
        leaderboards = leaderboards.filter(l => l.visibility === filters.visibility);
      }
      if (filters.tags && filters.tags.length > 0) {
        // Would filter by tags if implemented
      }
    }
    
    return leaderboards.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }, [system.leaderboards]);

  const joinLeaderboard = useCallback(async (leaderboardId: string, userId: string): Promise<void> => {
    try {
      await LeaderboardsEngine.joinLeaderboard(leaderboardId, userId);
      
      // Update local state
      const leaderboard = getLeaderboard(leaderboardId);
      if (leaderboard) {
        const newParticipant: LeaderboardParticipant = {
          userId,
          username: `user_${userId}`,
          joinedDate: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          status: 'active',
          eligibility: {
            eligible: true,
            requirements: [],
            restrictions: [],
            waivers: [],
          },
          permissions: {
            canView: true,
            canParticipate: true,
            canCompete: true,
            canInvite: false,
            canModerate: false,
            canManage: false,
            canReport: true,
            canAppeal: true,
          },
          preferences: {
            visibility: 'public',
            notifications: true,
            comparison: true,
            sharing: true,
            anonymity: false,
          },
          stats: {
            totalScore: 0,
            currentScore: 0,
            rank: 0,
            previousRank: 0,
            rankChange: 0,
            participation: {
              joined: new Date().toISOString(),
              lastActive: new Date().toISOString(),
              totalSessions: 0,
              totalTime: 0,
              averageSessionTime: 0,
              completionRate: 0,
              consistency: 0,
            },
            performance: {
              averageScore: 0,
              bestScore: 0,
              worstScore: 0,
              improvement: 0,
              consistency: 0,
              potential: 0,
              trends: [],
            },
            achievements: [],
            streaks: [],
            history: [],
          },
          history: [],
        };

        await updateLeaderboard(leaderboardId, {
          participants: [...leaderboard.participants, newParticipant],
        });
      }
    } catch (err) {
      setError('Failed to join leaderboard');
      console.error('Leaderboard join error:', err);
      throw err;
    }
  }, [getLeaderboard, updateLeaderboard]);

  const leaveLeaderboard = useCallback(async (leaderboardId: string, userId: string): Promise<void> => {
    try {
      // Update local state
      const leaderboard = getLeaderboard(leaderboardId);
      if (leaderboard) {
        await updateLeaderboard(leaderboardId, {
          participants: leaderboard.participants.filter(p => p.userId !== userId),
        });
      }
    } catch (err) {
      setError('Failed to leave leaderboard');
      console.error('Leaderboard leave error:', err);
      throw err;
    }
  }, [getLeaderboard, updateLeaderboard]);

  const updateScore = useCallback(async (leaderboardId: string, userId: string, activity: ScoreActivity): Promise<void> => {
    try {
      await LeaderboardsEngine.updateScore(leaderboardId, userId, activity);
      
      // Update local state
      const leaderboard = getLeaderboard(leaderboardId);
      if (leaderboard) {
        const participant = leaderboard.participants.find(p => p.userId === userId);
        if (participant) {
          const updatedStats = { ...participant.stats };
          updatedStats.currentScore += activity.points;
          updatedStats.totalScore += activity.points;
          
          const updatedParticipants = leaderboard.participants.map(p => 
            p.userId === userId ? { ...p, stats: updatedStats } : p
          );
          
          await updateLeaderboard(leaderboardId, {
            participants: updatedParticipants,
          });
        }
      }
    } catch (err) {
      setError('Failed to update score');
      console.error('Score update error:', err);
      throw err;
    }
  }, [getLeaderboard, updateLeaderboard]);

  const getRanking = useCallback((leaderboardId: string, userId: string): LeaderboardRanking | null => {
    const leaderboard = getLeaderboard(leaderboardId);
    if (!leaderboard) return null;
    
    return leaderboard.rankings.find(r => r.userId === userId) || null;
  }, [getLeaderboard]);

  const getRankings = useCallback((leaderboardId: string, filters?: RankingFilters): LeaderboardRanking[] => {
    const leaderboard = getLeaderboard(leaderboardId);
    if (!leaderboard) return [];
    
    let rankings = leaderboard.rankings;
    
    if (filters) {
      if (filters.tier) {
        rankings = rankings.filter(r => r.tier.tier === filters.tier);
      }
      if (filters.rankRange) {
        rankings = rankings.filter(r => 
          r.rank >= filters.rankRange.min && r.rank <= filters.rankRange.max
        );
      }
      if (filters.scoreRange) {
        rankings = rankings.filter(r => 
          r.score >= filters.scoreRange.min && r.score <= filters.scoreRange.max
        );
      }
      if (filters.activity) {
        // Would filter by activity if implemented
      }
      if (filters.dateRange) {
        // Would filter by date if implemented
      }
    }
    
    return rankings.sort((a, b) => a.rank - b.rank);
  }, [getLeaderboard]);

  const createCompetition = useCallback(async (competitionData: Omit<Competition, 'competitionId' | 'createdDate'>): Promise<Competition> => {
    try {
      const newCompetition = await LeaderboardsEngine.createCompetition(competitionData);
      
      const updatedSystem = { ...system, competitions: [...system.competitions, newCompetition] };
      setSystem(updatedSystem);
      await AsyncStorage.setItem('@leaderboard_system', JSON.stringify(updatedSystem));

      return newCompetition;
    } catch (err) {
      setError('Failed to create competition');
      console.error('Competition creation error:', err);
      throw err;
    }
  }, [system]);

  const updateCompetition = useCallback(async (competitionId: string, updates: Partial<Competition>): Promise<void> => {
    try {
      const competitionIndex = system.competitions.findIndex(c => c.competitionId === competitionId);
      if (competitionIndex === -1) throw new Error('Competition not found');

      const updatedCompetitions = [...system.competitions];
      updatedCompetitions[competitionIndex] = { ...updatedCompetitions[competitionIndex], ...updates };
      
      setSystem({ ...system, competitions: updatedCompetitions });
      await AsyncStorage.setItem('@leaderboard_system', JSON.stringify({ ...system, competitions: updatedCompetitions }));
    } catch (err) {
      setError('Failed to update competition');
      console.error('Competition update error:', err);
      throw err;
    }
  }, [system]);

  const deleteCompetition = useCallback(async (competitionId: string): Promise<void> => {
    try {
      const updatedCompetitions = system.competitions.filter(c => c.competitionId !== competitionId);
      setSystem({ ...system, competitions: updatedCompetitions });
      await AsyncStorage.setItem('@leaderboard_system', JSON.stringify({ ...system, competitions: updatedCompetitions }));
    } catch (err) {
      setError('Failed to delete competition');
      console.error('Competition deletion error:', err);
      throw err;
    }
  }, [system]);

  const getCompetition = useCallback((competitionId: string): Competition | null => {
    return system.competitions.find(c => c.competitionId === competitionId) || null;
  }, [system.competitions]);

  const getCompetitions = useCallback((filters?: CompetitionFilters): Competition[] => {
    let competitions = system.competitions;
    
    if (filters) {
      if (filters.type) {
        competitions = competitions.filter(c => c.type === filters.type);
      }
      if (filters.category) {
        competitions = competitions.filter(c => c.category === filters.category);
      }
      if (filters.format) {
        competitions = competitions.filter(c => c.format === filters.format);
      }
      if (filters.status) {
        competitions = competitions.filter(c => c.status === filters.status);
      }
      if (filters.visibility) {
        competitions = competitions.filter(c => c.visibility === filters.visibility);
      }
      if (filters.dateRange) {
        competitions = competitions.filter(c => {
          const competitionDate = new Date(c.startDate);
          return competitionDate >= new Date(filters.dateRange.start) && competitionDate <= new Date(filters.dateRange.end);
        });
      }
    }
    
    return competitions.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }, [system.competitions]);

  const joinCompetition = useCallback(async (competitionId: string, userId: string, teamId?: string): Promise<void> => {
    try {
      await LeaderboardsEngine.joinCompetition(competitionId, userId, teamId);
      
      // Update local state
      const competition = getCompetition(competitionId);
      if (competition) {
        const newParticipant: CompetitionParticipant = {
          participantId: `participant_${userId}_${Date.now()}`,
          userId,
          username: `user_${userId}`,
          teamId,
          status: 'registered',
          registeredDate: new Date().toISOString(),
          stats: {
            score: 0,
            rank: 0,
            completed: 0,
            accuracy: 0,
            speed: 0,
            improvement: 0,
            potential: 0,
          },
          progress: [],
          achievements: [],
        };

        await updateCompetition(competitionId, {
          participants: [...competition.participants, newParticipant],
        });
      }
    } catch (err) {
      setError('Failed to join competition');
      console.error('Competition join error:', err);
      throw err;
    }
  }, [getCompetition, updateCompetition]);

  const leaveCompetition = useCallback(async (competitionId: string, userId: string): Promise<void> => {
    try {
      // Update local state
      const competition = getCompetition(competitionId);
      if (competition) {
        await updateCompetition(competitionId, {
          participants: competition.participants.filter(p => p.userId !== userId),
        });
      }
    } catch (err) {
      setError('Failed to leave competition');
      console.error('Competition leave error:', err);
      throw err;
    }
  }, [getCompetition, updateCompetition]);

  const updateCompetitionScore = useCallback(async (competitionId: string, userId: string, activity: CompetitionActivity): Promise<void> => {
    try {
      await LeaderboardsEngine.updateCompetitionScore(competitionId, userId, activity);
      
      // Update local state
      const competition = getCompetition(competitionId);
      if (competition) {
        const participant = competition.participants.find(p => p.userId === userId);
        if (participant) {
          const updatedStats = { ...participant.stats };
          updatedStats.score += activity.score;
          
          const updatedParticipants = competition.participants.map(p => 
            p.userId === userId ? { ...p, stats: updatedStats } : p
          );
          
          await updateCompetition(competitionId, {
            participants: updatedParticipants,
          });
        }
      }
    } catch (err) {
      setError('Failed to update competition score');
      console.error('Competition score update error:', err);
      throw err;
    }
  }, [getCompetition, updateCompetition]);

  const getCompetitionRanking = useCallback((competitionId: string, userId: string): CompetitionRanking | null => {
    const competition = getCompetition(competitionId);
    if (!competition) return null;
    
    return competition.leaderboard.rankings.find(r => r.participantId === userId) || null;
  }, [getCompetition]);

  const getCompetitionRankings = useCallback((competitionId: string, filters?: CompetitionRankingFilters): CompetitionRanking[] => {
    const competition = getCompetition(competitionId);
    if (!competition) return [];
    
    let rankings = competition.leaderboard.rankings;
    
    if (filters) {
      if (filters.roundId) {
        // Would filter by round if implemented
      }
      if (filters.teamId) {
        rankings = rankings.filter(r => r.teamId === filters.teamId);
      }
      if (filters.status) {
        rankings = rankings.filter(r => r.status === filters.status);
      }
      if (filters.rankRange) {
        rankings = rankings.filter(r => 
          r.rank >= filters.rankRange.min && r.rank <= filters.rankRange.max
        );
      }
      if (filters.scoreRange) {
        rankings = rankings.filter(r => 
          r.score >= filters.scoreRange.min && r.score <= filters.scoreRange.max
        );
      }
    }
    
    return rankings.sort((a, b) => a.rank - b.rank);
  }, [getCompetition]);

  const getUserRankings = useCallback(async (userId: string): Promise<UserRanking | null> => {
    try {
      return await LeaderboardsEngine.getUserRankings(userId);
    } catch (err) {
      setError('Failed to get user rankings');
      console.error('User rankings error:', err);
      throw err;
    }
  }, []);

  const getUserAchievements = useCallback(async (userId: string): Promise<UserAchievement[]> => {
    try {
      return await LeaderboardsEngine.getUserAchievements(userId);
    } catch (err) {
      setError('Failed to get user achievements');
      console.error('User achievements error:', err);
      throw err;
    }
  }, []);

  const getUserRewards = useCallback(async (userId: string): Promise<LeaderboardReward[]> => {
    try {
      return await LeaderboardsEngine.getUserRewards(userId);
    } catch (err) {
      setError('Failed to get user rewards');
      console.error('User rewards error:', err);
      throw err;
    }
  }, []);

  const getLeaderboardMetrics = useCallback(async (leaderboardId?: string): Promise<LeaderboardMetrics> => {
    try {
      return await LeaderboardsEngine.getLeaderboardMetrics(leaderboardId);
    } catch (err) {
      setError('Failed to get leaderboard metrics');
      console.error('Leaderboard metrics error:', err);
      throw err;
    }
  }, []);

  const getCompetitionMetrics = useCallback(async (competitionId?: string): Promise<CompetitionMetrics> => {
    try {
      return await LeaderboardsEngine.getCompetitionMetrics(competitionId);
    } catch (err) {
      setError('Failed to get competition metrics');
      console.error('Competition metrics error:', err);
      throw err;
    }
  }, []);

  const searchLeaderboards = useCallback(async (query: string, filters?: SearchFilters): Promise<Leaderboard[]> => {
    try {
      return await LeaderboardsEngine.searchLeaderboards(query, filters);
    } catch (err) {
      setError('Failed to search leaderboards');
      console.error('Leaderboard search error:', err);
      throw err;
    }
  }, []);

  const searchCompetitions = useCallback(async (query: string, filters?: CompetitionSearchFilters): Promise<Competition[]> => {
    try {
      return await LeaderboardsEngine.searchCompetitions(query, filters);
    } catch (err) {
      setError('Failed to search competitions');
      console.error('Competition search error:', err);
      throw err;
    }
  }, []);

  const exportLeaderboardData = useCallback(async (type: string, format: 'json' | 'csv'): Promise<string> => {
    try {
      return await LeaderboardsEngine.exportLeaderboardData(type, format);
    } catch (err) {
      setError('Failed to export leaderboard data');
      console.error('Leaderboard data export error:', err);
      throw err;
    }
  }, []);

  return (
    <LeaderboardsContext.Provider
      value={{
        system,
        loading,
        error,
        createLeaderboard,
        updateLeaderboard,
        deleteLeaderboard,
        getLeaderboard,
        getLeaderboards,
        joinLeaderboard,
        leaveLeaderboard,
        updateScore,
        getRanking,
        getRankings,
        createCompetition,
        updateCompetition,
        deleteCompetition,
        getCompetition,
        getCompetitions,
        joinCompetition,
        leaveCompetition,
        updateCompetitionScore,
        getCompetitionRanking,
        getCompetitionRankings,
        getUserRankings,
        getUserAchievements,
        getUserRewards,
        getLeaderboardMetrics,
        getCompetitionMetrics,
        searchLeaderboards,
        searchCompetitions,
        exportLeaderboardData,
      }}
    >
      {children}
    </LeaderboardsContext.Provider>
  );
};

export const useLeaderboards = (): LeaderboardsContextType => {
  const context = useContext(LeaderboardsContext);
  if (!context) {
    throw new Error('useLeaderboards must be used within a LeaderboardsProvider');
  }
  return context;
};

export default {
  LeaderboardsProvider,
  useLeaderboards,
  LeaderboardsEngine,
};
