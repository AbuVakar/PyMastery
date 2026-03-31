import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';

// Peer review system types
export interface PeerReviewSystem {
  reviews: CodeReview[];
  requests: ReviewRequest[];
  assignments: ReviewAssignment[];
  feedback: ReviewFeedback[];
  metrics: ReviewMetrics;
  settings: ReviewSettings;
  notifications: ReviewNotification[];
}

export interface CodeReview {
  reviewId: string;
  requestId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  revieweeId: string;
  revieweeName: string;
  submissionId: string;
  codeTitle: string;
  codeLanguage: string;
  codeContent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: string;
  completedAt?: string;
  timeSpent: number; // in minutes
  overallRating: number; // 1-5
  categories: ReviewCategory[];
  strengths: ReviewStrength[];
  improvements: ReviewImprovement[];
  suggestions: ReviewSuggestion[];
  codeAnalysis: CodeAnalysis;
  feedback: ReviewFeedback[];
  attachments: ReviewAttachment[];
  tags: string[];
  visibility: 'public' | 'private' | 'reviewer_only';
  helpful: number;
  notHelpful: number;
  responses: ReviewResponse[];
}

export interface ReviewCategory {
  categoryId: string;
  name: string;
  description: string;
  rating: number; // 1-5
  weight: number; // 0-1
  comments: CategoryComment[];
  examples: CategoryExample[];
}

export interface CategoryComment {
  commentId: string;
  text: string;
  severity: 'info' | 'suggestion' | 'warning' | 'error';
  lineNumbers: number[];
  codeSnippet?: string;
  timestamp: string;
}

export interface CategoryExample {
  exampleId: string;
  title: string;
  description: string;
  code: string;
  explanation: string;
  lineNumbers: number[];
}

export interface ReviewStrength {
  strengthId: string;
  title: string;
  description: string;
  category: string;
  evidence: StrengthEvidence[];
  impact: 'low' | 'medium' | 'high';
  lineNumbers: number[];
  codeSnippet?: string;
}

export interface StrengthEvidence {
  evidenceId: string;
  description: string;
  code: string;
  lineNumbers: number[];
  significance: string;
}

export interface ReviewImprovement {
  improvementId: string;
  title: string;
  description: string;
  category: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  urgency: 'low' | 'medium' | 'high';
  lineNumbers: number[];
  codeSnippet?: string;
  explanation: string;
  examples: ImprovementExample[];
  resources: ImprovementResource[];
}

export interface ImprovementExample {
  exampleId: string;
  title: string;
  description: string;
  code: string;
  explanation: string;
  before: string;
  after: string;
}

export interface ImprovementResource {
  resourceId: string;
  type: 'documentation' | 'tutorial' | 'example' | 'tool';
  title: string;
  url?: string;
  content?: string;
  description: string;
}

export interface ReviewSuggestion {
  suggestionId: string;
  title: string;
  description: string;
  type: 'refactoring' | 'optimization' | 'style' | 'security' | 'performance';
  priority: 'low' | 'medium' | 'high';
  lineNumbers: number[];
  codeSnippet?: string;
  explanation: string;
  implementation: ImplementationGuide[];
  benefits: string[];
  effort: 'low' | 'medium' | 'high';
}

export interface ImplementationGuide {
  stepId: string;
  step: number;
  title: string;
  description: string;
  code: string;
  explanation: string;
  alternatives: string[];
}

export interface CodeAnalysis {
  complexity: ComplexityAnalysis;
  quality: QualityAnalysis;
  security: SecurityAnalysis;
  performance: PerformanceAnalysis;
  style: StyleAnalysis;
  bestPractices: BestPracticesAnalysis;
  metrics: CodeMetrics;
}

export interface ComplexityAnalysis {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  halsteadMetrics: HalsteadMetrics;
  maintainabilityIndex: number;
  complexityScore: number; // 0-100
  hotspots: ComplexityHotspot[];
}

export interface HalsteadMetrics {
  volume: number;
  difficulty: number;
  effort: number;
  time: number;
  bugs: number;
}

export interface ComplexityHotspot {
  hotspotId: string;
  functionName: string;
  lineNumbers: number[];
  complexity: number;
  type: 'cyclomatic' | 'cognitive' | 'nested';
  suggestion: string;
}

export interface QualityAnalysis {
  overallScore: number; // 0-100
  readability: ReadabilityScore;
  maintainability: MaintainabilityScore;
  testability: TestabilityScore;
  documentation: DocumentationScore;
  issues: QualityIssue[];
}

export interface ReadabilityScore {
  score: number;
  factors: ReadabilityFactor[];
  issues: ReadabilityIssue[];
}

export interface ReadabilityFactor {
  factor: string;
  value: number;
  weight: number;
  description: string;
}

export interface ReadabilityIssue {
  issueId: string;
  type: 'naming' | 'length' | 'structure' | 'formatting';
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumbers: number[];
  suggestion: string;
}

export interface MaintainabilityScore {
  score: number;
  factors: MaintainabilityFactor[];
  issues: MaintainabilityIssue[];
}

export interface MaintainabilityFactor {
  factor: string;
  value: number;
  weight: number;
  description: string;
}

export interface MaintainabilityIssue {
  issueId: string;
  type: 'coupling' | 'cohesion' | 'duplication' | 'complexity';
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumbers: number[];
  suggestion: string;
}

export interface TestabilityScore {
  score: number;
  factors: TestabilityFactor[];
  issues: TestabilityIssue[];
}

export interface TestabilityFactor {
  factor: string;
  value: number;
  weight: number;
  description: string;
}

export interface TestabilityIssue {
  issueId: string;
  type: 'dependencies' | 'side_effects' | 'state' | 'complexity';
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumbers: number[];
  suggestion: string;
}

export interface DocumentationScore {
  score: number;
  factors: DocumentationFactor[];
  issues: DocumentationIssue[];
}

export interface DocumentationFactor {
  factor: string;
  value: number;
  weight: number;
  description: string;
}

export interface DocumentationIssue {
  issueId: string;
  type: 'missing' | 'outdated' | 'unclear' | 'incomplete';
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumbers: number[];
  suggestion: string;
}

export interface QualityIssue {
  issueId: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumbers: number[];
  suggestion: string;
}

export interface SecurityAnalysis {
  overallScore: number; // 0-100
  vulnerabilities: SecurityVulnerability[];
  bestPractices: SecurityBestPractice[];
  compliance: ComplianceCheck[];
}

export interface SecurityVulnerability {
  vulnerabilityId: string;
  type: 'injection' | 'xss' | 'csrf' | 'authentication' | 'authorization' | 'encryption';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  lineNumbers: number[];
  cwe: string;
  owasp: string;
  recommendation: string;
  examples: VulnerabilityExample[];
}

export interface VulnerabilityExample {
  exampleId: string;
  title: string;
  description: string;
  vulnerableCode: string;
  fixedCode: string;
  explanation: string;
}

export interface SecurityBestPractice {
  practiceId: string;
  name: string;
  description: string;
  category: string;
  compliance: boolean;
  lineNumbers: number[];
  suggestion: string;
}

export interface ComplianceCheck {
  checkId: string;
  standard: string;
  category: string;
  requirement: string;
  compliant: boolean;
  lineNumbers: number[];
  recommendation: string;
}

export interface PerformanceAnalysis {
  overallScore: number; // 0-100
  bottlenecks: PerformanceBottleneck[];
  optimizations: PerformanceOptimization[];
  metrics: PerformanceMetrics[];
}

export interface PerformanceBottleneck {
  bottleneckId: string;
  type: 'algorithmic' | 'memory' | 'io' | 'network' | 'cpu';
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumbers: number[];
  impact: string;
  recommendation: string;
}

export interface PerformanceOptimization {
  optimizationId: string;
  type: 'algorithm' | 'data_structure' | 'caching' | 'parallelization';
  description: string;
  lineNumbers: number[];
  complexity: 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(2^n)';
  improvement: string;
  examples: OptimizationExample[];
}

export interface OptimizationExample {
  exampleId: string;
  title: string;
  description: string;
  beforeCode: string;
  afterCode: string;
  explanation: string;
  performanceGain: string;
}

export interface PerformanceMetrics {
  timeComplexity: string;
  spaceComplexity: string;
  memoryUsage: number;
  cpuUsage: number;
  ioOperations: number;
}

export interface StyleAnalysis {
  overallScore: number; // 0-100
  consistency: StyleConsistency;
  formatting: StyleFormatting;
  naming: StyleNaming;
  structure: StyleStructure;
  issues: StyleIssue[];
}

export interface StyleConsistency {
  score: number;
  issues: ConsistencyIssue[];
}

export interface ConsistencyIssue {
  issueId: string;
  type: 'indentation' | 'spacing' | 'brackets' | 'quotes';
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumbers: number[];
  suggestion: string;
}

export interface StyleFormatting {
  score: number;
  issues: FormattingIssue[];
}

export interface FormattingIssue {
  issueId: string;
  type: 'line_length' | 'blank_lines' | 'comments' | 'imports';
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumbers: number[];
  suggestion: string;
}

export interface StyleNaming {
  score: number;
  issues: NamingIssue[];
}

export interface NamingIssue {
  issueId: string;
  type: 'variable' | 'function' | 'class' | 'constant' | 'file';
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumbers: number[];
  suggestion: string;
}

export interface StyleStructure {
  score: number;
  issues: StructureIssue[];
}

export interface StructureIssue {
  issueId: string;
  type: 'organization' | 'imports' | 'exports' | 'functions';
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumbers: number[];
  suggestion: string;
}

export interface StyleIssue {
  issueId: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumbers: number[];
  suggestion: string;
}

export interface BestPracticesAnalysis {
  overallScore: number; // 0-100
  practices: BestPractice[];
  violations: BestPracticeViolation[];
  recommendations: BestPracticeRecommendation[];
}

export interface BestPractice {
  practiceId: string;
  name: string;
  description: string;
  category: string;
  followed: boolean;
  lineNumbers: number[];
  explanation: string;
}

export interface BestPracticeViolation {
  violationId: string;
  practice: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  lineNumbers: number[];
  recommendation: string;
}

export interface BestPracticeRecommendation {
  recommendationId: string;
  practice: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  lineNumbers: number[];
  implementation: string;
}

export interface CodeMetrics {
  linesOfCode: number;
  linesOfComments: number;
  commentRatio: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
  testCoverage: number;
  duplication: number;
}

export interface ReviewFeedback {
  feedbackId: string;
  type: 'rating' | 'comment' | 'response' | 'endorsement';
  from: string;
  to: string;
  content: string;
  rating?: number; // 1-5
  helpful: number;
  timestamp: string;
  visibility: 'public' | 'private';
  responses: FeedbackResponse[];
}

export interface FeedbackResponse {
  responseId: string;
  from: string;
  content: string;
  timestamp: string;
  helpful: number;
}

export interface ReviewAttachment {
  attachmentId: string;
  type: 'image' | 'document' | 'code' | 'link' | 'video';
  name: string;
  url?: string;
  content?: string;
  size?: number;
  format?: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ReviewResponse {
  responseId: string;
  reviewId: string;
  responderId: string;
  responderName: string;
  content: string;
  type: 'clarification' | 'agreement' | 'disagreement' | 'additional';
  timestamp: string;
  helpful: number;
  replies: ResponseReply[];
}

export interface ResponseReply {
  replyId: string;
  from: string;
  content: string;
  timestamp: string;
  helpful: number;
}

export interface ReviewRequest {
  requestId: string;
  title: string;
  description: string;
  codeTitle: string;
  codeLanguage: string;
  codeContent: string;
  submitterId: string;
  submitterName: string;
  submitterAvatar?: string;
  category: 'algorithm' | 'data_structure' | 'web_development' | 'mobile' | 'ai_ml' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'general' | 'specific' | 'educational' | 'production';
  focus: ReviewFocus[];
  requirements: ReviewRequirement[];
  context: ReviewContext;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  submittedAt: string;
  deadline?: string;
  assignedReviewers: string[];
  completedReviews: number;
  targetReviews: number;
  tags: string[];
  visibility: 'public' | 'private' | 'invite_only';
  attachments: RequestAttachment[];
}

export interface ReviewFocus {
  focusId: string;
  area: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  examples: string[];
}

export interface ReviewRequirement {
  requirementId: string;
  type: 'skill_level' | 'experience' | 'availability' | 'expertise';
  description: string;
  value: string;
  required: boolean;
}

export interface ReviewContext {
  purpose: string;
  background: string;
  constraints: string[];
  environment: string;
  dependencies: string[];
}

export interface RequestAttachment {
  attachmentId: string;
  type: 'test_case' | 'documentation' | 'screenshot' | 'specification';
  name: string;
  url?: string;
  content?: string;
  description: string;
}

export interface ReviewAssignment {
  assignmentId: string;
  requestId: string;
  reviewerId: string;
  reviewerName: string;
  assignedBy: string;
  assignedAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired';
  acceptedAt?: string;
  declinedAt?: string;
  completedAt?: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number; // in minutes
  actualTime?: number; // in minutes
  quality: AssignmentQuality;
  feedback: AssignmentFeedback[];
}

export interface AssignmentQuality {
  timeliness: number; // 0-100
  thoroughness: number; // 0-100
  helpfulness: number; // 0-100
  accuracy: number; // 0-100
  overall: number; // 0-100
}

export interface AssignmentFeedback {
  feedbackId: string;
  from: string;
  type: 'quality' | 'timeliness' | 'helpfulness';
  rating: number; // 1-5
  comment: string;
  timestamp: string;
}

export interface ReviewMetrics {
  overall: OverallMetrics;
  reviewer: ReviewerMetrics;
  reviewee: RevieweeMetrics;
  system: SystemMetrics;
  quality: QualityMetrics;
  performance: PerformanceMetrics;
}

export interface OverallMetrics {
  totalReviews: number;
  averageRating: number;
  averageTimeSpent: number;
  completionRate: number;
  satisfaction: number;
  helpfulness: number;
}

export interface ReviewerMetrics {
  topReviewers: ReviewerRanking[];
  activity: ReviewerActivity[];
  expertise: ReviewerExpertise[];
  performance: ReviewerPerformance[];
  contributions: ReviewerContribution[];
}

export interface ReviewerRanking {
  reviewerId: string;
  reviewerName: string;
  rank: number;
  score: number;
  reviews: number;
  averageRating: number;
  specialties: string[];
}

export interface ReviewerActivity {
  period: string;
  reviews: number;
  timeSpent: number;
  averageRating: number;
  helpfulness: number;
}

export interface ReviewerExpertise {
  skill: string;
  level: number; // 0-100
  reviews: number;
  averageRating: number;
  endorsements: number;
}

export interface ReviewerPerformance {
  timeliness: number; // 0-100
  thoroughness: number; // 0-100
  helpfulness: number; // 0-100
  accuracy: number; // 0-100
  consistency: number; // 0-100
}

export interface ReviewerContribution {
  type: 'review' | 'mentorship' | 'knowledge_sharing' | 'community';
  value: number;
  recognition: string[];
}

export interface RevieweeMetrics {
  topReviewees: RevieweeRanking[];
  improvement: RevieweeImprovement[];
  learning: RevieweeLearning[];
  engagement: RevieweeEngagement[];
}

export interface RevieweeRanking {
  revieweeId: string;
  revieweeName: string;
  rank: number;
  score: number;
  submissions: number;
  averageRating: number;
  improvement: number;
}

export interface RevieweeImprovement {
  period: string;
  submissions: number;
  averageRating: number;
  improvement: number;
  areas: string[];
}

export interface RevieweeLearning {
  skill: string;
  initialLevel: number;
  currentLevel: number;
  improvement: number;
  reviews: number;
  timeSpent: number;
}

export interface RevieweeEngagement {
  period: string;
  submissions: number;
  reviews: number;
  responseRate: number;
  satisfaction: number;
}

export interface SystemMetrics {
  efficiency: SystemEfficiency;
  quality: SystemQuality;
  utilization: SystemUtilization;
  growth: SystemGrowth;
}

export interface SystemEfficiency {
  averageReviewTime: number;
  reviewQueue: number;
  turnaround: number;
  utilization: number;
}

export interface SystemQuality {
  averageRating: number;
  helpfulness: number;
  accuracy: number;
  consistency: number;
}

export interface SystemUtilization {
  activeReviewers: number;
  activeRequests: number;
  completionRate: number;
  engagement: number;
}

export interface SystemGrowth {
  newReviewers: number;
  newRequests: number;
  retention: number;
  expansion: number;
}

export interface PerformanceMetrics {
  speed: SpeedMetrics;
  quality: QualityMetrics;
  efficiency: EfficiencyMetrics;
  satisfaction: SatisfactionMetrics;
}

export interface SpeedMetrics {
  averageReviewTime: number;
  medianReviewTime: number;
  fastestReview: number;
  slowestReview: number;
  trends: SpeedTrend[];
}

export interface SpeedTrend {
  period: string;
  averageTime: number;
  change: number;
  factors: string[];
}

export interface EfficiencyMetrics {
  throughput: number;
  utilization: number;
  productivity: number;
  optimization: EfficiencyOptimization[];
}

export interface EfficiencyOptimization {
  optimizationId: string;
  area: string;
  current: number;
  target: number;
  strategy: string;
  impact: string;
}

export interface SatisfactionMetrics {
  overall: number;
  reviewer: number;
  reviewee: number;
  trends: SatisfactionTrend[];
}

export interface SatisfactionTrend {
  period: string;
  score: number;
  change: number;
  factors: string[];
}

export interface ReviewSettings {
  general: GeneralSettings;
  quality: QualitySettings;
  matching: MatchingSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  rewards: RewardSettings;
}

export interface GeneralSettings {
  maxReviewsPerRequest: number;
  maxReviewersPerRequest: number;
  defaultDeadline: number; // in hours
  autoAssignment: boolean;
  publicVisibility: boolean;
  anonymousReviews: boolean;
}

export interface QualitySettings {
  minimumRating: number;
  qualityThreshold: number;
  reviewRequirements: ReviewRequirement[];
  qualityChecks: QualityCheck[];
  standards: QualityStandard[];
}

export interface QualityCheck {
  checkId: string;
  name: string;
  description: string;
  category: string;
  required: boolean;
  weight: number;
}

export interface QualityStandard {
  standardId: string;
  name: string;
  description: string;
  criteria: QualityCriterion[];
}

export interface QualityCriterion {
  criterionId: string;
  name: string;
  description: string;
  weight: number;
  threshold: number;
}

export interface MatchingSettings {
  algorithm: 'random' | 'skill_based' | 'availability' | 'reputation' | 'hybrid';
  criteria: MatchingCriteria[];
  preferences: MatchingPreference[];
  constraints: MatchingConstraint[];
}

export interface MatchingCriteria {
  criterionId: string;
  name: string;
  type: 'skill' | 'experience' | 'availability' | 'reputation' | 'workload';
  weight: number;
  description: string;
}

export interface MatchingPreference {
  preferenceId: string;
  userId: string;
  type: 'skill' | 'availability' | 'experience';
  value: string;
  priority: 'low' | 'medium' | 'high';
}

export interface MatchingConstraint {
  constraintId: string;
  type: 'workload' | 'availability' | 'skill' | 'conflict';
  description: string;
  value: any;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between';
}

export interface NotificationSettings {
  reviewAssigned: boolean;
  reviewCompleted: boolean;
  reviewRequested: boolean;
  deadlineReminder: boolean;
  qualityAlert: boolean;
  channels: NotificationChannel[];
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
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

export interface PrivacySettings {
  anonymousReviews: boolean;
  publicProfiles: boolean;
  shareReviews: boolean;
  showRating: boolean;
  showExpertise: boolean;
  dataRetention: number; // in days
}

export interface RewardSettings {
  pointsEnabled: boolean;
  badgesEnabled: boolean;
  leaderboardsEnabled: boolean;
  recognitionEnabled: boolean;
  rewards: Reward[];
}

export interface Reward {
  rewardId: string;
  type: 'points' | 'badge' | 'privilege' | 'recognition';
  name: string;
  description: string;
  value: number;
  icon: string;
  criteria: RewardCriteria[];
}

export interface RewardCriteria {
  criterionId: string;
  type: 'reviews' | 'rating' | 'helpfulness' | 'expertise';
  target: number;
  current: number;
}

export interface ReviewNotification {
  notificationId: string;
  type: 'review_assigned' | 'review_completed' | 'review_requested' | 'deadline_reminder' | 'quality_alert';
  from: string;
  to: string;
  title: string;
  message: string;
  data: NotificationData;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface NotificationData {
  reviewId?: string;
  requestId?: string;
  assignmentId?: string;
  rating?: number;
  deadline?: string;
  priority?: string;
}

// Peer review context
interface PeerReviewContextType {
  system: PeerReviewSystem;
  loading: boolean;
  error: string | null;
  createReviewRequest: (request: Omit<ReviewRequest, 'requestId' | 'submittedAt' | 'status' | 'completedReviews'>) => Promise<ReviewRequest>;
  updateReviewRequest: (requestId: string, updates: Partial<ReviewRequest>) => Promise<void>;
  deleteReviewRequest: (requestId: string) => Promise<void>;
  getReviewRequest: (requestId: string) => ReviewRequest | null;
  getReviewRequests: (filters?: ReviewRequestFilters) => ReviewRequest[];
  assignReviewer: (requestId: string, reviewerId: string) => Promise<void>;
  unassignReviewer: (requestId: string, reviewerId: string) => Promise<void>;
  acceptReview: (assignmentId: string) => Promise<void>;
  declineReview: (assignmentId: string, reason?: string) => Promise<void>;
  completeReview: (reviewId: string, review: Omit<CodeReview, 'reviewId' | 'submittedAt' | 'status'>) => Promise<void>;
  updateReview: (reviewId: string, updates: Partial<CodeReview>) => Promise<void>;
  getReview: (reviewId: string) => CodeReview | null;
  getReviews: (filters?: ReviewFilters) => CodeReview[];
  addReviewFeedback: (reviewId: string, feedback: Omit<ReviewFeedback, 'feedbackId' | 'timestamp'>) => Promise<void>;
  respondToReview: (reviewId: string, response: Omit<ReviewResponse, 'responseId' | 'timestamp'>) => Promise<void>;
  getReviewMetrics: (type?: 'overall' | 'reviewer' | 'reviewee' | 'system') => any;
  getRecommendations: (userId: string) => ReviewRequest[];
  searchReviews: (query: string, filters?: ReviewSearchFilters) => CodeReview[];
  exportReviewData: (type: 'reviews' | 'requests' | 'metrics', format: 'json' | 'csv') => Promise<string>;
}

export interface ReviewRequestFilters {
  status?: ReviewRequest['status'];
  category?: ReviewRequest['category'];
  difficulty?: ReviewRequest['difficulty'];
  priority?: ReviewRequest['priority'];
  type?: ReviewRequest['type'];
  submitterId?: string;
  tags?: string[];
  dateRange?: { start: string; end: string };
}

export interface ReviewFilters {
  status?: CodeReview['status'];
  rating?: number;
  reviewerId?: string;
  revieweeId?: string;
  category?: string;
  language?: string;
  tags?: string[];
  dateRange?: { start: string; end: string };
}

export interface ReviewSearchFilters {
  query: string;
  category?: string;
  language?: string;
  rating?: number;
  dateRange?: { start: string; end: string };
  sortBy?: 'relevance' | 'date' | 'rating' | 'helpfulness';
  sortOrder?: 'asc' | 'desc';
}

// Peer review engine
class PeerReviewEngine {
  static async createReviewRequest(requestData: Omit<ReviewRequest, 'requestId' | 'submittedAt' | 'status' | 'completedReviews'>): Promise<ReviewRequest> {
    const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const submittedAt = new Date().toISOString();

    const request: ReviewRequest = {
      ...requestData,
      requestId,
      submittedAt,
      status: 'open',
      completedReviews: 0,
    };

    return request;
  }

  static async assignReviewer(requestId: string, reviewerId: string): Promise<void> {
    // Implementation for assigning a reviewer
    console.log(`Assigning reviewer ${reviewerId} to request ${requestId}`);
  }

  static async acceptReview(assignmentId: string): Promise<void> {
    // Implementation for accepting a review assignment
    console.log(`Accepting review assignment ${assignmentId}`);
  }

  static async completeReview(reviewId: string, reviewData: Omit<CodeReview, 'reviewId' | 'submittedAt' | 'status'>): Promise<void> {
    // Implementation for completing a review
    console.log(`Completing review ${reviewId}`);
  }

  static async getReviewMetrics(type?: string): Promise<any> {
    // Mock implementation - would calculate actual metrics
    return {
      overall: {
        totalReviews: 1000,
        averageRating: 4.2,
        averageTimeSpent: 45,
        completionRate: 85,
        satisfaction: 4.1,
        helpfulness: 4.3,
      },
    };
  }

  static async getRecommendations(userId: string): Promise<ReviewRequest[]> {
    // Mock implementation - would use ML to recommend reviews
    return [];
  }

  static async searchReviews(query: string, filters?: ReviewSearchFilters): Promise<CodeReview[]> {
    // Mock implementation - would search actual reviews
    return [];
  }

  static async exportReviewData(type: string, format: 'json' | 'csv'): Promise<string> {
    // Mock implementation - would export actual review data
    const exportData = {
      type,
      exportedAt: new Date().toISOString(),
      format,
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Peer review provider
export const PeerReviewProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [system, setSystem] = useState<PeerReviewSystem>({
    reviews: [],
    requests: [],
    assignments: [],
    feedback: [],
    metrics: {
      overall: {
        totalReviews: 0,
        averageRating: 0,
        averageTimeSpent: 0,
        completionRate: 0,
        satisfaction: 0,
        helpfulness: 0,
      },
      reviewer: {
        topReviewers: [],
        activity: [],
        expertise: [],
        performance: [],
        contributions: [],
      },
      reviewee: {
        topReviewees: [],
        improvement: [],
        learning: [],
        engagement: [],
      },
      system: {
        efficiency: {
          averageReviewTime: 0,
          reviewQueue: 0,
          turnaround: 0,
          utilization: 0,
        },
        quality: {
          averageRating: 0,
          helpfulness: 0,
          accuracy: 0,
          consistency: 0,
        },
        utilization: {
          activeReviewers: 0,
          activeRequests: 0,
          completionRate: 0,
          engagement: 0,
        },
        growth: {
          newReviewers: 0,
          newRequests: 0,
          retention: 0,
          expansion: 0,
        },
      },
      quality: {
        overallScore: 0,
        readability: {
          score: 0,
          factors: [],
          issues: [],
        },
        maintainability: {
          score: 0,
          factors: [],
          issues: [],
        },
        testability: {
          score: 0,
          factors: [],
          issues: [],
        },
        documentation: {
          score: 0,
          factors: [],
          issues: [],
        },
        issues: [],
      },
      performance: {
        speed: {
          averageReviewTime: 0,
          medianReviewTime: 0,
          fastestReview: 0,
          slowestReview: 0,
          trends: [],
        },
        quality: {
          overallScore: 0,
          readability: 0,
          maintainability: 0,
          testability: 0,
          documentation: 0,
        },
        efficiency: {
          throughput: 0,
          utilization: 0,
          productivity: 0,
          optimization: [],
        },
        satisfaction: {
          overall: 0,
          reviewer: 0,
          reviewee: 0,
          trends: [],
        },
      },
    },
    settings: {
      general: {
        maxReviewsPerRequest: 3,
        maxReviewersPerRequest: 2,
        defaultDeadline: 24,
        autoAssignment: false,
        publicVisibility: true,
        anonymousReviews: false,
      },
      quality: {
        minimumRating: 3,
        qualityThreshold: 70,
        reviewRequirements: [],
        qualityChecks: [],
        standards: [],
      },
      matching: {
        algorithm: 'skill_based',
        criteria: [],
        preferences: [],
        constraints: [],
      },
      notifications: {
        reviewAssigned: true,
        reviewCompleted: true,
        reviewRequested: true,
        deadlineReminder: true,
        qualityAlert: false,
        channels: [
          {
            channel: 'in_app',
            enabled: true,
            settings: {
              quietHours: false,
              quietHoursStart: '22:00',
              quietHoursEnd: '08:00',
              frequency: 'real_time',
              categories: ['all'],
            },
          },
        ],
        frequency: 'real_time',
      },
      privacy: {
        anonymousReviews: false,
        publicProfiles: true,
        shareReviews: true,
        showRating: true,
        showExpertise: true,
        dataRetention: 365,
      },
      rewards: {
        pointsEnabled: true,
        badgesEnabled: true,
        leaderboardsEnabled: true,
        recognitionEnabled: true,
        rewards: [],
      },
    },
    notifications: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved system data
  useEffect(() => {
    const loadSystem = async () => {
      try {
        setLoading(true);
        const savedSystem = await AsyncStorage.getItem('@peer_review_system');
        
        if (savedSystem) {
          setSystem(JSON.parse(savedSystem));
        }
      } catch (err) {
        setError('Failed to load peer review system');
        console.error('System loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSystem();
  }, []);

  const createReviewRequest = useCallback(async (requestData: Omit<ReviewRequest, 'requestId' | 'submittedAt' | 'status' | 'completedReviews'>): Promise<ReviewRequest> => {
    try {
      const newRequest = await PeerReviewEngine.createReviewRequest(requestData);
      
      const updatedSystem = { ...system, requests: [...system.requests, newRequest] };
      setSystem(updatedSystem);
      await AsyncStorage.setItem('@peer_review_system', JSON.stringify(updatedSystem));

      return newRequest;
    } catch (err) {
      setError('Failed to create review request');
      console.error('Review request creation error:', err);
      throw err;
    }
  }, [system]);

  const updateReviewRequest = useCallback(async (requestId: string, updates: Partial<ReviewRequest>): Promise<void> => {
    try {
      const requestIndex = system.requests.findIndex(r => r.requestId === requestId);
      if (requestIndex === -1) throw new Error('Review request not found');

      const updatedRequests = [...system.requests];
      updatedRequests[requestIndex] = { ...updatedRequests[requestIndex], ...updates };
      
      setSystem({ ...system, requests: updatedRequests });
      await AsyncStorage.setItem('@peer_review_system', JSON.stringify({ ...system, requests: updatedRequests }));
    } catch (err) {
      setError('Failed to update review request');
      console.error('Review request update error:', err);
      throw err;
    }
  }, [system]);

  const deleteReviewRequest = useCallback(async (requestId: string): Promise<void> => {
    try {
      const updatedRequests = system.requests.filter(r => r.requestId !== requestId);
      setSystem({ ...system, requests: updatedRequests });
      await AsyncStorage.setItem('@peer_review_system', JSON.stringify({ ...system, requests: updatedRequests }));
    } catch (err) {
      setError('Failed to delete review request');
      console.error('Review request deletion error:', err);
      throw err;
    }
  }, [system]);

  const getReviewRequest = useCallback((requestId: string): ReviewRequest | null => {
    return system.requests.find(r => r.requestId === requestId) || null;
  }, [system.requests]);

  const getReviewRequests = useCallback((filters?: ReviewRequestFilters): ReviewRequest[] => {
    let requests = system.requests;
    
    if (filters) {
      if (filters.status) {
        requests = requests.filter(r => r.status === filters.status);
      }
      if (filters.category) {
        requests = requests.filter(r => r.category === filters.category);
      }
      if (filters.difficulty) {
        requests = requests.filter(r => r.difficulty === filters.difficulty);
      }
      if (filters.priority) {
        requests = requests.filter(r => r.priority === filters.priority);
      }
      if (filters.type) {
        requests = requests.filter(r => r.type === filters.type);
      }
      if (filters.submitterId) {
        requests = requests.filter(r => r.submitterId === filters.submitterId);
      }
      if (filters.tags && filters.tags.length > 0) {
        requests = requests.filter(r => filters.tags.some(tag => r.tags.includes(tag)));
      }
      if (filters.dateRange) {
        requests = requests.filter(r => {
          const requestDate = new Date(r.submittedAt);
          return requestDate >= new Date(filters.dateRange.start) && requestDate <= new Date(filters.dateRange.end);
        });
      }
    }
    
    return requests.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [system.requests]);

  const assignReviewer = useCallback(async (requestId: string, reviewerId: string): Promise<void> => {
    try {
      await PeerReviewEngine.assignReviewer(requestId, reviewerId);
      
      // Update local state
      const request = getReviewRequest(requestId);
      if (request) {
        await updateReviewRequest(requestId, {
          assignedReviewers: [...request.assignedReviewers, reviewerId],
        });
      }
    } catch (err) {
      setError('Failed to assign reviewer');
      console.error('Reviewer assignment error:', err);
      throw err;
    }
  }, [getReviewRequest, updateReviewRequest]);

  const unassignReviewer = useCallback(async (requestId: string, reviewerId: string): Promise<void> => {
    try {
      // Update local state
      const request = getReviewRequest(requestId);
      if (request) {
        await updateReviewRequest(requestId, {
          assignedReviewers: request.assignedReviewers.filter(id => id !== reviewerId),
        });
      }
    } catch (err) {
      setError('Failed to unassign reviewer');
      console.error('Reviewer unassignment error:', err);
      throw err;
    }
  }, [getReviewRequest, updateReviewRequest]);

  const acceptReview = useCallback(async (assignmentId: string): Promise<void> => {
    try {
      await PeerReviewEngine.acceptReview(assignmentId);
    } catch (err) {
      setError('Failed to accept review');
      console.error('Review acceptance error:', err);
      throw err;
    }
  }, []);

  const declineReview = useCallback(async (assignmentId: string, reason?: string): Promise<void> => {
    try {
      // Implementation for declining a review
      console.log(`Declining review assignment ${assignmentId}${reason ? `: ${reason}` : ''}`);
    } catch (err) {
      setError('Failed to decline review');
      console.error('Review decline error:', err);
      throw err;
    }
  }, []);

  const completeReview = useCallback(async (reviewId: string, reviewData: Omit<CodeReview, 'reviewId' | 'submittedAt' | 'status'>): Promise<void> => {
    try {
      await PeerReviewEngine.completeReview(reviewId, reviewData);
      
      // Update local state
      const newReview: CodeReview = {
        ...reviewData,
        reviewId,
        submittedAt: new Date().toISOString(),
        status: 'completed',
        helpful: 0,
        notHelpful: 0,
        responses: [],
      };

      const updatedSystem = { ...system, reviews: [...system.reviews, newReview] };
      setSystem(updatedSystem);
      await AsyncStorage.setItem('@peer_review_system', JSON.stringify(updatedSystem));
    } catch (err) {
      setError('Failed to complete review');
      console.error('Review completion error:', err);
      throw err;
    }
  }, [system]);

  const updateReview = useCallback(async (reviewId: string, updates: Partial<CodeReview>): Promise<void> => {
    try {
      const reviewIndex = system.reviews.findIndex(r => r.reviewId === reviewId);
      if (reviewIndex === -1) throw new Error('Review not found');

      const updatedReviews = [...system.reviews];
      updatedReviews[reviewIndex] = { ...updatedReviews[reviewIndex], ...updates };
      
      setSystem({ ...system, reviews: updatedReviews });
      await AsyncStorage.setItem('@peer_review_system', JSON.stringify({ ...system, reviews: updatedReviews }));
    } catch (err) {
      setError('Failed to update review');
      console.error('Review update error:', err);
      throw err;
    }
  }, [system]);

  const getReview = useCallback((reviewId: string): CodeReview | null => {
    return system.reviews.find(r => r.reviewId === reviewId) || null;
  }, [system.reviews]);

  const getReviews = useCallback((filters?: ReviewFilters): CodeReview[] => {
    let reviews = system.reviews;
    
    if (filters) {
      if (filters.status) {
        reviews = reviews.filter(r => r.status === filters.status);
      }
      if (filters.rating) {
        reviews = reviews.filter(r => r.overallRating >= filters.rating);
      }
      if (filters.reviewerId) {
        reviews = reviews.filter(r => r.reviewerId === filters.reviewerId);
      }
      if (filters.revieweeId) {
        reviews = reviews.filter(r => r.revieweeId === filters.revieweeId);
      }
      if (filters.category) {
        reviews = reviews.filter(r => r.categories.some(c => c.name === filters.category));
      }
      if (filters.language) {
        reviews = reviews.filter(r => r.codeLanguage === filters.language);
      }
      if (filters.tags && filters.tags.length > 0) {
        reviews = reviews.filter(r => filters.tags.some(tag => r.tags.includes(tag)));
      }
      if (filters.dateRange) {
        reviews = reviews.filter(r => {
          const reviewDate = new Date(r.submittedAt);
          return reviewDate >= new Date(filters.dateRange.start) && reviewDate <= new Date(filters.dateRange.end);
        });
      }
    }
    
    return reviews.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [system.reviews]);

  const addReviewFeedback = useCallback(async (reviewId: string, feedbackData: Omit<ReviewFeedback, 'feedbackId' | 'timestamp'>): Promise<void> => {
    try {
      const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      const newFeedback: ReviewFeedback = {
        ...feedbackData,
        feedbackId,
        timestamp,
        helpful: 0,
        responses: [],
      };

      // Update local state
      const review = getReview(reviewId);
      if (review) {
        await updateReview(reviewId, {
          feedback: [...review.feedback, newFeedback],
        });
      }
    } catch (err) {
      setError('Failed to add review feedback');
      console.error('Review feedback addition error:', err);
      throw err;
    }
  }, [getReview, updateReview]);

  const respondToReview = useCallback(async (reviewId: string, responseData: Omit<ReviewResponse, 'responseId' | 'timestamp'>): Promise<void> => {
    try {
      const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      const newResponse: ReviewResponse = {
        ...responseData,
        responseId,
        timestamp,
        helpful: 0,
        replies: [],
      };

      // Update local state
      const review = getReview(reviewId);
      if (review) {
        await updateReview(reviewId, {
          responses: [...review.responses, newResponse],
        });
      }
    } catch (err) {
      setError('Failed to respond to review');
      console.error('Review response error:', err);
      throw err;
    }
  }, [getReview, updateReview]);

  const getReviewMetrics = useCallback(async (type?: string): Promise<any> => {
    try {
      return await PeerReviewEngine.getReviewMetrics(type);
    } catch (err) {
      setError('Failed to get review metrics');
      console.error('Review metrics error:', err);
      throw err;
    }
  }, []);

  const getRecommendations = useCallback(async (userId: string): Promise<ReviewRequest[]> => {
    try {
      return await PeerReviewEngine.getRecommendations(userId);
    } catch (err) {
      setError('Failed to get recommendations');
      console.error('Recommendations error:', err);
      throw err;
    }
  }, []);

  const searchReviews = useCallback(async (query: string, filters?: ReviewSearchFilters): Promise<CodeReview[]> => {
    try {
      return await PeerReviewEngine.searchReviews(query, filters);
    } catch (err) {
      setError('Failed to search reviews');
      console.error('Review search error:', err);
      throw err;
    }
  }, []);

  const exportReviewData = useCallback(async (type: string, format: 'json' | 'csv'): Promise<string> => {
    try {
      return await PeerReviewEngine.exportReviewData(type, format);
    } catch (err) {
      setError('Failed to export review data');
      console.error('Review data export error:', err);
      throw err;
    }
  }, []);

  return (
    <PeerReviewContext.Provider
      value={{
        system,
        loading,
        error,
        createReviewRequest,
        updateReviewRequest,
        deleteReviewRequest,
        getReviewRequest,
        getReviewRequests,
        assignReviewer,
        unassignReviewer,
        acceptReview,
        declineReview,
        completeReview,
        updateReview,
        getReview,
        getReviews,
        addReviewFeedback,
        respondToReview,
        getReviewMetrics,
        getRecommendations,
        searchReviews,
        exportReviewData,
      }}
    >
      {children}
    </PeerReviewContext.Provider>
  );
};

export const usePeerReview = (): PeerReviewContextType => {
  const context = useContext(PeerReviewContext);
  if (!context) {
    throw new Error('usePeerReview must be used within a PeerReviewProvider');
  }
  return context;
};

export default {
  PeerReviewProvider,
  usePeerReview,
  PeerReviewEngine,
};
