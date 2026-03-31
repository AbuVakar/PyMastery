import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';

// Mentorship program types
export interface MentorshipProgram {
  programId: string;
  name: string;
  description: string;
  category: 'technical' | 'career' | 'academic' | 'personal' | 'leadership';
  type: 'one_on_one' | 'group' | 'peer' | 'reverse' | 'team';
  status: 'active' | 'inactive' | 'archived';
  visibility: 'public' | 'private' | 'invite_only';
  createdDate: string;
  createdBy: string;
  admins: string[];
  mentors: Mentor[];
  mentees: Mentee[];
  matches: MentorshipMatch[];
  sessions: MentorshipSession[];
  resources: MentorshipResource[];
  guidelines: MentorshipGuideline[];
  requirements: MentorshipRequirement[];
  settings: MentorshipSettings;
  metrics: MentorshipMetrics;
  achievements: MentorshipAchievement[];
}

export interface Mentor {
  mentorId: string;
  userId: string;
  username: string;
  email: string;
  avatar?: string;
  bio: string;
  expertise: ExpertiseArea[];
  experience: ExperienceArea[];
  availability: MentorAvailability[];
  preferences: MentorPreferences;
  profile: MentorProfile;
  stats: MentorStats;
  reputation: MentorReputation;
  certifications: MentorCertification[];
  specializations: string[];
  languages: string[];
  timezone: string;
  location: string;
  rate?: MentorRate;
  status: 'active' | 'inactive' | 'busy' | 'unavailable';
  joinedDate: string;
  lastActive: string;
  verification: MentorVerification;
  background: MentorBackground;
  teaching: MentorTeaching;
}

export interface ExpertiseArea {
  area: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years: number;
  projects: number;
  description: string;
  endorsements: number;
  examples: ExpertiseExample[];
}

export interface ExpertiseExample {
  exampleId: string;
  title: string;
  description: string;
  type: 'project' | 'achievement' | 'certification' | 'publication';
  url?: string;
  date: string;
  impact: string;
}

export interface ExperienceArea {
  area: string;
  company?: string;
  position: string;
  duration: string;
  description: string;
  responsibilities: string[];
  achievements: string[];
  startDate: string;
  endDate?: string;
}

export interface MentorAvailability {
  availabilityId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  timezone: string;
  type: 'one_on_one' | 'group' | 'workshop' | 'consultation';
  maxSessions: number;
  currentSessions: number;
  recurring: boolean;
  exceptions: AvailabilityException[];
}

export interface AvailabilityException {
  exceptionId: string;
  date: string;
  type: 'unavailable' | 'available' | 'modified';
  startTime?: string;
  endTime?: string;
  reason: string;
}

export interface MentorPreferences {
  menteeLevel: MenteeLevel[];
  mentorshipType: MentorshipType[];
  communication: CommunicationPreference[];
  sessionFormat: SessionFormat[];
  duration: SessionDuration[];
  frequency: SessionFrequency[];
  groupSize: GroupSize[];
  topics: string[];
  avoidTopics: string[];
  maxMentees: number;
  currentMentees: number;
  matchingCriteria: MatchingCriteria[];
}

export interface MenteeLevel {
  level: 'beginner' | 'intermediate' | 'advanced';
  preferred: boolean;
  experience: string;
}

export interface MentorshipType {
  type: 'technical' | 'career' | 'academic' | 'personal';
  preferred: boolean;
  description: string;
}

export interface CommunicationPreference {
  method: 'video' | 'audio' | 'text' | 'email' | 'in_person';
  preferred: boolean;
  frequency: string;
}

export interface SessionFormat {
  format: 'structured' | 'flexible' | 'project_based' | 'goal_oriented';
  preferred: boolean;
  description: string;
}

export interface SessionDuration {
  duration: string;
  preferred: boolean;
  minMinutes: number;
  maxMinutes: number;
}

export interface SessionFrequency {
  frequency: 'weekly' | 'bi_weekly' | 'monthly' | 'as_needed';
  preferred: boolean;
  description: string;
}

export interface GroupSize {
  size: 'one_on_one' | 'small_group' | 'large_group';
  preferred: boolean;
  maxParticipants: number;
}

export interface MatchingCriteria {
  criterionId: string;
  name: string;
  type: 'skill' | 'experience' | 'availability' | 'personality' | 'goals';
  weight: number; // 0-1
  required: boolean;
  description: string;
}

export interface MentorProfile {
  headline: string;
  summary: string;
  philosophy: string;
  approach: string;
  successStories: SuccessStory[];
  testimonials: MentorTestimonial[];
  portfolio: PortfolioItem[];
  socialLinks: SocialLink[];
  awards: MentorAward[];
}

export interface SuccessStory {
  storyId: string;
  title: string;
  description: string;
  menteeName: string;
  menteeAvatar?: string;
  outcome: string;
  duration: string;
  challenges: string[];
  achievements: string[];
  date: string;
  verified: boolean;
}

export interface MentorTestimonial {
  testimonialId: string;
  menteeId: string;
  menteeName: string;
  menteeAvatar?: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
}

export interface PortfolioItem {
  itemId: string;
  title: string;
  description: string;
  type: 'project' | 'article' | 'video' | 'presentation' | 'certification';
  url?: string;
  content?: string;
  image?: string;
  date: string;
  tags: string[];
  featured: boolean;
}

export interface SocialLink {
  platform: string;
  url: string;
  username: string;
  verified: boolean;
}

export interface MentorAward {
  awardId: string;
  name: string;
  description: string;
  organization: string;
  date: string;
  category: string;
  level: 'local' | 'regional' | 'national' | 'international';
}

export interface MentorStats {
  totalMentees: number;
  activeMentees: number;
  completedMentees: number;
  totalSessions: number;
  totalHours: number;
  averageRating: number;
  responseRate: number;
  successRate: number;
  specialties: SpecialtyStat[];
  activity: MentorActivity;
}

export interface SpecialtyStat {
  specialty: string;
  mentees: number;
  sessions: number;
  hours: number;
  rating: number;
  success: number;
}

export interface MentorActivity {
  lastLogin: string;
  lastSession: string;
  weeklySessions: number;
  monthlySessions: number;
  responseTime: number; // in hours
  availability: number; // 0-100
}

export interface MentorReputation {
  score: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  badges: ReputationBadge[];
  endorsements: MentorEndorsement[];
  reviews: MentorReview[];
  history: ReputationHistory[];
}

export interface ReputationBadge {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  category: 'experience' | 'quality' | 'commitment' | 'impact' | 'specialty';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedDate: string;
  points: number;
}

export interface MentorEndorsement {
  endorsementId: string;
  endorserId: string;
  endorserName: string;
  skill: string;
  comment: string;
  rating: number; // 1-5
  date: string;
  verified: boolean;
  helpful: number;
}

export interface MentorReview {
  reviewId: string;
  menteeId: string;
  menteeName: string;
  rating: number; // 1-5
  comment: string;
  categories: ReviewCategory[];
  date: string;
  verified: boolean;
  helpful: number;
}

export interface ReviewCategory {
  category: string;
  rating: number; // 1-5
  comment: string;
}

export interface ReputationHistory {
  historyId: string;
  type: 'session' | 'review' | 'endorsement' | 'achievement' | 'penalty';
  points: number;
  reason: string;
  date: string;
}

export interface MentorCertification {
  certificationId: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
  verified: boolean;
  category: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

export interface MentorRate {
  type: 'hourly' | 'session' | 'package' | 'donation';
  amount: number;
  currency: string;
  description: string;
  discounts: RateDiscount[];
}

export interface RateDiscount {
  discountId: string;
  type: 'percentage' | 'fixed';
  value: number;
  condition: string;
  description: string;
}

export interface MentorVerification {
  verified: boolean;
  verificationDate?: string;
  verificationMethod: string;
  documents: VerificationDocument[];
  checks: VerificationCheck[];
  status: 'pending' | 'verified' | 'rejected';
}

export interface VerificationDocument {
  documentId: string;
  type: 'identity' | 'education' | 'employment' | 'certification';
  name: string;
  url: string;
  uploadedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
}

export interface VerificationCheck {
  checkId: string;
  type: 'background' | 'identity' | 'credentials' | 'references';
  status: 'pending' | 'passed' | 'failed';
  date: string;
  result?: string;
}

export interface MentorBackground {
  education: Education[];
  employment: Employment[];
  volunteering: Volunteering[];
  languages: Language[];
  interests: string[];
  goals: string[];
}

export interface Education {
  educationId: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  gpa?: number;
  achievements: string[];
  description: string;
}

export interface Employment {
  employmentId: string;
  company: string;
  position: string;
  department?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  responsibilities: string[];
  achievements: string[];
  description: string;
}

export interface Volunteering {
  volunteeringId: string;
  organization: string;
  role: string;
  startDate: string;
  endDate?: string;
  hours: number;
  description: string;
  impact: string;
}

export interface Language {
  language: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  certification?: string;
}

export interface MentorTeaching {
  experience: TeachingExperience[];
  style: TeachingStyle;
  methods: TeachingMethod[];
  materials: TeachingMaterial[];
  assessment: TeachingAssessment[];
}

export interface TeachingExperience {
  experienceId: string;
  context: string;
  role: string;
  duration: string;
  students: number;
  subjects: string[];
  outcomes: string[];
  date: string;
}

export interface TeachingStyle {
  approach: string;
  methodology: string;
  techniques: string[];
  philosophy: string;
  adaptability: string;
}

export interface TeachingMethod {
  methodId: string;
  name: string;
  description: string;
  effectiveness: number; // 0-100
  usage: number;
}

export interface TeachingMaterial {
  materialId: string;
  type: 'curriculum' | 'exercise' | 'resource' | 'tool';
  name: string;
  description: string;
  url?: string;
  content?: string;
  level: string[];
  subjects: string[];
}

export interface TeachingAssessment {
  assessmentId: string;
  type: 'quiz' | 'project' | 'presentation' | 'practical';
  name: string;
  description: string;
  criteria: AssessmentCriteria[];
  effectiveness: number; // 0-100
}

export interface AssessmentCriteria {
  criterion: string;
  weight: number;
  description: string;
}

export interface Mentee {
  menteeId: string;
  userId: string;
  username: string;
  email: string;
  avatar?: string;
  bio: string;
  goals: MenteeGoal[];
  background: MenteeBackground;
  preferences: MenteePreferences;
  profile: MenteeProfile;
  stats: MenteeStats;
  progress: MenteeProgress;
  feedback: MenteeFeedback[];
  status: 'active' | 'inactive' | 'matched' | 'waiting';
  joinedDate: string;
  lastActive: string;
  applications: MentorshipApplication[];
  matches: MenteeMatch[];
}

export interface MenteeGoal {
  goalId: string;
  title: string;
  description: string;
  category: 'technical' | 'career' | 'academic' | 'personal';
  priority: 'low' | 'medium' | 'high';
  timeframe: string;
  milestones: GoalMilestone[];
  skills: string[];
  currentLevel: string;
  targetLevel: string;
  progress: number; // 0-100
  createdDate: string;
  targetDate: string;
}

export interface GoalMilestone {
  milestoneId: string;
  title: string;
  description: string;
  completed: boolean;
  completedDate?: string;
  dueDate: string;
}

export interface MenteeBackground {
  education: Education[];
  experience: ExperienceArea[];
  projects: MenteeProject[];
  skills: Skill[];
  interests: string[];
  challenges: string[];
}

export interface MenteeProject {
  projectId: string;
  name: string;
  description: string;
  type: 'personal' | 'academic' | 'professional' | 'learning';
  status: 'planned' | 'in_progress' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  technologies: string[];
  role: string;
  description: string;
  outcomes: string[];
  url?: string;
}

export interface Skill {
  skill: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  experience: string;
  projects: number;
  learning: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface MenteePreferences {
  mentorType: MentorType[];
  mentorshipFormat: MentorshipFormat[];
  communication: CommunicationPreference[];
  availability: MenteeAvailability[];
  topics: string[];
  learningStyle: LearningStyle[];
  pace: LearningPace[];
  budget: MenteeBudget;
  location: LocationPreference[];
  language: string[];
  timezone: string;
}

export interface MentorType {
  type: 'industry_expert' | 'academic' | 'peer' | 'senior' | 'specialist';
  preferred: boolean;
  experience: string;
}

export interface MentorshipFormat {
  format: 'one_on_one' | 'group' | 'workshop' | 'project_based';
  preferred: boolean;
  description: string;
}

export interface MenteeAvailability {
  availabilityId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  flexibility: 'flexible' | 'strict' | 'moderate';
  exceptions: AvailabilityException[];
}

export interface LearningStyle {
  style: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed';
  preferred: boolean;
  description: string;
}

export interface LearningPace {
  pace: 'slow' | 'moderate' | 'fast' | 'adaptive';
  preferred: boolean;
  description: string;
}

export interface MenteeBudget {
  type: 'free' | 'paid' | 'donation' | 'flexible';
  maxAmount?: number;
  currency?: string;
  frequency: 'hourly' | 'session' | 'monthly' | 'project';
  description: string;
}

export interface LocationPreference {
  type: 'remote' | 'in_person' | 'hybrid';
  preferred: boolean;
  locations: string[];
  description: string;
}

export interface MenteeProfile {
  headline: string;
  summary: string;
  motivations: string[];
  expectations: string[];
  concerns: string[];
  previousMentorship: PreviousMentorship[];
  portfolio: MenteePortfolio[];
}

export interface PreviousMentorship {
  mentorshipId: string;
  mentorName: string;
  duration: string;
  outcome: string;
  rating: number;
  feedback: string;
  date: string;
}

export interface MenteePortfolio {
  itemId: string;
  title: string;
  description: string;
  type: 'project' | 'assignment' | 'achievement' | 'certification';
  url?: string;
  content?: string;
  image?: string;
  date: string;
  tags: string[];
}

export interface MenteeStats {
  totalMentors: number;
  activeMentors: number;
  totalSessions: number;
  totalHours: number;
  completedGoals: number;
  inProgressGoals: number;
  skillsLearned: number;
  projectsCompleted: number;
  averageRating: number;
  satisfaction: number;
}

export interface MenteeProgress {
  overall: number; // 0-100
  goals: GoalProgress[];
  skills: SkillProgress[];
  sessions: SessionProgress[];
  feedback: FeedbackProgress[];
  timeline: ProgressTimeline[];
}

export interface GoalProgress {
  goalId: string;
  title: string;
  progress: number; // 0-100
  completed: boolean;
  lastUpdated: string;
  milestones: MilestoneProgress[];
}

export interface MilestoneProgress {
  milestoneId: string;
  completed: boolean;
  completedDate?: string;
}

export interface SkillProgress {
  skill: string;
  currentLevel: string;
  targetLevel: string;
  progress: number; // 0-100
  assessments: SkillAssessment[];
  lastUpdated: string;
}

export interface SkillAssessment {
  assessmentId: string;
  score: number;
  level: string;
  feedback: string;
  date: string;
  assessedBy: string;
}

export interface SessionProgress {
  sessionId: string;
  progress: number; // 0-100
  completed: boolean;
  outcomes: string[];
  nextSteps: string[];
  date: string;
}

export interface FeedbackProgress {
  feedbackId: string;
  rating: number;
  category: string;
  improvement: string;
  date: string;
}

export interface ProgressTimeline {
  eventId: string;
  type: 'goal_set' | 'milestone_reached' | 'skill_learned' | 'session_completed';
  title: string;
  description: string;
  date: string;
  impact: string;
}

export interface MenteeFeedback {
  feedbackId: string;
  sessionId: string;
  mentorId: string;
  mentorName: string;
  rating: number; // 1-5
  comment: string;
  categories: FeedbackCategory[];
  date: string;
  helpful: number;
}

export interface FeedbackCategory {
  category: string;
  rating: number; // 1-5
  comment: string;
}

export interface MentorshipApplication {
  applicationId: string;
  mentorId: string;
  mentorName: string;
  programId: string;
  programName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  submittedDate: string;
  reviewedDate?: string;
  message: string;
  qualifications: ApplicationQualification[];
  interview?: ApplicationInterview;
  decision?: ApplicationDecision;
}

export interface ApplicationQualification {
  qualificationId: string;
  type: 'skill' | 'experience' | 'education' | 'project';
  title: string;
  description: string;
  relevance: number; // 0-100
}

export interface ApplicationInterview {
  interviewId: string;
  scheduledDate: string;
  duration: string;
  type: 'video' | 'phone' | 'in_person';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
  evaluation: InterviewEvaluation[];
}

export interface InterviewEvaluation {
  criterion: string;
  rating: number; // 1-5
  comment: string;
  weight: number;
}

export interface ApplicationDecision {
  decision: 'accept' | 'reject' | 'waitlist';
  reason: string;
  feedback: string;
  conditions: string[];
  decidedBy: string;
  decidedDate: string;
}

export interface MenteeMatch {
  matchId: string;
  mentorId: string;
  mentorName: string;
  programId: string;
  programName: string;
  status: 'pending' | 'active' | 'completed' | 'paused' | 'cancelled';
  matchDate: string;
  startDate?: string;
  endDate?: string;
  duration: string;
  goals: string[];
  schedule: MatchSchedule[];
  progress: MatchProgress;
  feedback: MatchFeedback[];
  sessions: MatchSession[];
}

export interface MatchSchedule {
  scheduleId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  recurring: boolean;
  location: string;
  type: 'session' | 'check_in' | 'review';
}

export interface MatchProgress {
  overall: number; // 0-100
  goals: MatchGoalProgress[];
  sessions: MatchSessionProgress[];
  skills: MatchSkillProgress[];
  satisfaction: number;
  engagement: number;
}

export interface MatchGoalProgress {
  goalId: string;
  title: string;
  progress: number; // 0-100
  completed: boolean;
  lastUpdated: string;
}

export interface MatchSessionProgress {
  sessionId: string;
  progress: number; // 0-100
  completed: boolean;
  outcomes: string[];
  date: string;
}

export interface MatchSkillProgress {
  skill: string;
  initialLevel: string;
  currentLevel: string;
  targetLevel: string;
  progress: number; // 0-100
  assessments: MatchSkillAssessment[];
}

export interface MatchSkillAssessment {
  assessmentId: string;
  score: number;
  level: string;
  feedback: string;
  date: string;
  assessedBy: string;
}

export interface MatchFeedback {
  feedbackId: string;
  from: 'mentor' | 'mentee';
  rating: number; // 1-5
  comment: string;
  categories: MatchFeedbackCategory[];
  date: string;
  actionable: boolean;
}

export interface MatchFeedbackCategory {
  category: string;
  rating: number; // 1-5
  comment: string;
  improvement: string;
}

export interface MatchSession {
  sessionId: string;
  type: 'regular' | 'check_in' | 'review' | 'workshop' | 'project';
  title: string;
  description: string;
  agenda: SessionAgenda[];
  date: string;
  duration: number;
  location: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participants: SessionParticipant[];
  materials: SessionMaterial[];
  notes: SessionNote[];
  outcomes: SessionOutcome[];
  feedback: SessionFeedback[];
}

export interface SessionAgenda {
  agendaId: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  type: 'discussion' | 'presentation' | 'exercise' | 'review';
}

export interface SessionParticipant {
  userId: string;
  username: string;
  role: 'mentor' | 'mentee';
  joinedAt: string;
  leftAt?: string;
  status: 'joined' | 'left' | 'absent';
}

export interface SessionMaterial {
  materialId: string;
  type: 'document' | 'presentation' | 'code' | 'video' | 'link';
  name: string;
  url?: string;
  content?: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface SessionNote {
  noteId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: 'preparation' | 'discussion' | 'action' | 'follow_up';
  timestamp: string;
  private: boolean;
}

export interface SessionOutcome {
  outcomeId: string;
  title: string;
  description: string;
  type: 'goal' | 'skill' | 'action' | 'insight';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  dueDate?: string;
  completed: boolean;
}

export interface SessionFeedback {
  feedbackId: string;
  from: 'mentor' | 'mentee';
  rating: number; // 1-5
  comment: string;
  categories: SessionFeedbackCategory[];
  date: string;
}

export interface SessionFeedbackCategory {
  category: string;
  rating: number; // 1-5
  comment: string;
}

export interface MentorshipMatch {
  matchId: string;
  mentorId: string;
  menteeId: string;
  programId: string;
  status: 'pending' | 'active' | 'completed' | 'paused' | 'cancelled';
  matchDate: string;
  startDate?: string;
  endDate?: string;
  duration: string;
  goals: MatchGoal[];
  schedule: MatchSchedule[];
  progress: MatchProgress;
  feedback: MatchFeedback[];
  sessions: MatchSession[];
  metrics: MatchMetrics;
  notes: MatchNote[];
}

export interface MatchGoal {
  goalId: string;
  title: string;
  description: string;
  category: 'technical' | 'career' | 'academic' | 'personal';
  priority: 'low' | 'medium' | 'high';
  progress: number; // 0-100
  milestones: MatchMilestone[];
  skills: string[];
  dueDate: string;
  completed: boolean;
}

export interface MatchMilestone {
  milestoneId: string;
  title: string;
  description: string;
  completed: boolean;
  completedDate?: string;
  dueDate: string;
}

export interface MatchMetrics {
  sessions: number;
  hours: number;
  goalsCompleted: number;
  goalsInProgress: number;
  skillsImproved: number;
  satisfaction: number;
  engagement: number;
  effectiveness: number;
  retention: number;
}

export interface MatchNote {
  noteId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: 'progress' | 'observation' | 'concern' | 'achievement';
  visibility: 'private' | 'shared';
  timestamp: string;
  tags: string[];
}

export interface MentorshipSession {
  sessionId: string;
  matchId: string;
  mentorId: string;
  menteeId: string;
  type: 'regular' | 'check_in' | 'review' | 'workshop' | 'project';
  title: string;
  description: string;
  agenda: SessionAgenda[];
  date: string;
  duration: number;
  location: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  participants: SessionParticipant[];
  materials: SessionMaterial[];
  notes: SessionNote[];
  outcomes: SessionOutcome[];
  feedback: SessionFeedback[];
  recording?: SessionRecording;
}

export interface SessionRecording {
  recordingId: string;
  url: string;
  duration: number;
  format: string;
  size: number;
  quality: string;
  availableUntil: string;
  permissions: RecordingPermission[];
}

export interface RecordingPermission {
  userId: string;
  canView: boolean;
  canDownload: boolean;
  canShare: boolean;
}

export interface MentorshipResource {
  resourceId: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'tool' | 'template' | 'guide' | 'course';
  category: string;
  url?: string;
  content?: string;
  format: string;
  size?: number;
  uploadedBy: string;
  uploadedAt: string;
  tags: string[];
  rating: number;
  reviews: ResourceReview[];
  downloads: number;
  permissions: ResourcePermission[];
}

export interface ResourceReview {
  reviewId: string;
  userId: string;
  username: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  helpful: number;
}

export interface ResourcePermission {
  userId: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

export interface MentorshipGuideline {
  guidelineId: string;
  title: string;
  description: string;
  category: 'conduct' | 'communication' | 'expectations' | 'responsibilities' | 'safety';
  type: 'rule' | 'recommendation' | 'best_practice';
  priority: 'low' | 'medium' | 'high';
  audience: 'mentor' | 'mentee' | 'both';
  content: string;
  examples: GuidelineExample[];
  enforcement: GuidelineEnforcement;
}

export interface GuidelineExample {
  exampleId: string;
  title: string;
  description: string;
  type: 'good' | 'bad';
  scenario: string;
  outcome: string;
}

export interface GuidelineEnforcement {
  method: 'warning' | 'suspension' | 'removal' | 'report';
  severity: 'low' | 'medium' | 'high';
  autoEnforce: boolean;
}

export interface MentorshipRequirement {
  requirementId: string;
  title: string;
  description: string;
  type: 'mentor' | 'mentee' | 'both';
  category: 'qualification' | 'commitment' | 'availability' | 'conduct';
  priority: 'low' | 'medium' | 'high';
  criteria: RequirementCriteria[];
  verification: RequirementVerification[];
}

export interface RequirementCriteria {
  criterionId: string;
  name: string;
  description: string;
  type: 'minimum' | 'preferred' | 'required';
  value: any;
  unit: string;
}

export interface RequirementVerification {
  verificationId: string;
  method: 'document' | 'reference' | 'interview' | 'test';
  description: string;
  required: boolean;
}

export interface MentorshipSettings {
  general: GeneralSettings;
  matching: MatchingSettings;
  sessions: SessionSettings;
  communication: CommunicationSettings;
  privacy: PrivacySettings;
  rewards: RewardSettings;
}

export interface GeneralSettings {
  programDuration: number;
  minMatchDuration: number;
  maxMatchDuration: number;
  maxMenteesPerMentor: number;
  maxMentorsPerMentee: number;
  allowSelfMatching: boolean;
  requireApproval: boolean;
  autoMatching: boolean;
}

export interface MatchingSettings {
  algorithm: 'compatibility' | 'availability' | 'expertise' | 'goals' | 'hybrid';
  criteria: MatchingCriteria[];
  weights: MatchingWeight[];
  thresholds: MatchingThreshold[];
  preferences: MatchingPreference[];
}

export interface MatchingWeight {
  criterion: string;
  weight: number; // 0-1
  description: string;
}

export interface MatchingThreshold {
  criterion: string;
  minimum: number;
  maximum: number;
  description: string;
}

export interface MatchingPreference {
  preferenceId: string;
  name: string;
  type: 'mentor' | 'mentee';
  description: string;
  value: any;
}

export interface SessionSettings {
  minDuration: number;
  maxDuration: number;
  defaultDuration: number;
  reminderHours: number;
  cancellationHours: number;
  rescheduleLimit: number;
  recordingEnabled: boolean;
  materialsEnabled: boolean;
}

export interface CommunicationSettings {
  channels: CommunicationChannel[];
  responseTime: number;
  availabilityRequired: boolean;
  emergencyContact: boolean;
  languageRequirements: string[];
}

export interface CommunicationChannel {
  channel: 'video' | 'audio' | 'text' | 'email' | 'phone';
  enabled: boolean;
  required: boolean;
  settings: ChannelSettings;
}

export interface ChannelSettings {
  quality: string;
  encryption: boolean;
  recording: boolean;
  participants: number;
}

export interface PrivacySettings {
  publicProfiles: boolean;
  shareProgress: boolean;
  anonymousFeedback: boolean;
  dataRetention: number;
  gdprCompliant: boolean;
}

export interface RewardSettings {
  pointsEnabled: boolean;
  badgesEnabled: boolean;
  certificatesEnabled: boolean;
  leaderboardsEnabled: boolean;
  pointsPerSession: number;
  pointsPerGoal: number;
  bonusCriteria: BonusCriteria[];
}

export interface BonusCriteria {
  criterionId: string;
  name: string;
  description: string;
  points: number;
  conditions: string[];
}

export interface MentorshipMetrics {
  overall: OverallMetrics;
  matching: MatchingMetrics;
  engagement: EngagementMetrics;
  outcomes: OutcomeMetrics;
  quality: QualityMetrics;
  growth: GrowthMetrics;
}

export interface OverallMetrics {
  totalMentors: number;
  totalMentees: number;
  totalMatches: number;
  activeMatches: number;
  completedMatches: number;
  totalSessions: number;
  totalHours: number;
  averageMatchDuration: number;
  satisfaction: number;
}

export interface MatchingMetrics {
  matchRequests: number;
  matchAcceptance: number;
  averageMatchTime: number;
  matchSuccess: number;
  matchRetention: number;
  compatibility: CompatibilityMetrics[];
}

export interface CompatibilityMetrics {
  criterion: string;
  averageScore: number;
  successRate: number;
  satisfaction: number;
}

export interface EngagementMetrics {
  sessionAttendance: number;
  sessionCompletion: number;
  responseRate: number;
  communicationFrequency: number;
  resourceUsage: number;
  communityParticipation: number;
}

export interface OutcomeMetrics {
  goalsCompleted: number;
  skillsImproved: number;
  projectsCompleted: number;
  careerProgress: number;
  academicPerformance: number;
  personalDevelopment: number;
}

export interface QualityMetrics {
  mentorRating: number;
  menteeRating: number;
  sessionQuality: number;
  contentQuality: number;
  supportQuality: number;
  overallQuality: number;
}

export interface GrowthMetrics {
  newMentors: number;
  newMentees: number;
  programExpansion: number;
  retentionRate: number;
  referralRate: number;
  satisfactionTrend: number;
}

export interface MentorshipAchievement {
  achievementId: string;
  title: string;
  description: string;
  category: 'mentorship' | 'learning' | 'contribution' | 'leadership';
  type: 'milestone' | 'recognition' | 'impact' | 'excellence';
  icon: string;
  points: number;
  criteria: AchievementCriteria[];
  rewards: AchievementReward[];
  earnedBy: string[];
  progress: AchievementProgress[];
}

export interface AchievementCriteria {
  criterionId: string;
  description: string;
  type: 'count' | 'duration' | 'rating' | 'combination';
  target: number;
  current: number;
}

export interface AchievementReward {
  rewardId: string;
  type: 'badge' | 'points' | 'privilege' | 'recognition';
  title: string;
  description: string;
  value: number;
  icon: string;
}

export interface AchievementProgress {
  userId: string;
  progress: number; // 0-100
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

// Mentorship context
interface MentorshipContextType {
  programs: MentorshipProgram[];
  loading: boolean;
  error: string | null;
  createProgram: (program: Omit<MentorshipProgram, 'programId' | 'createdDate'>) => Promise<MentorshipProgram>;
  updateProgram: (programId: string, updates: Partial<MentorshipProgram>) => Promise<void>;
  deleteProgram: (programId: string) => Promise<void>;
  getProgram: (programId: string) => MentorshipProgram | null;
  getPrograms: (filters?: ProgramFilters) => MentorshipProgram[];
  applyAsMentor: (programId: string, application: Omit<Mentor, 'mentorId'>) => Promise<void>;
  applyAsMentee: (programId: string, application: Omit<Mentee, 'menteeId'>) => Promise<void>;
  findMentors: (criteria: MentorSearchCriteria) => Promise<Mentor[]>;
  findMentees: (criteria: MenteeSearchCriteria) => Promise<Mentee[]>;
  createMatch: (mentorId: string, menteeId: string, programId: string, details: Omit<MentorshipMatch, 'matchId' | 'matchDate' | 'status'>) => Promise<MentorshipMatch>;
  updateMatch: (matchId: string, updates: Partial<MentorshipMatch>) => Promise<void>;
  endMatch: (matchId: string, reason: string) => Promise<void>;
  getMatch: (matchId: string) => MentorshipMatch | null;
  getMatches: (userId: string, role: 'mentor' | 'mentee', filters?: MatchFilters) => MentorshipMatch[];
  scheduleSession: (matchId: string, session: Omit<MentorshipSession, 'sessionId' | 'status'>) => Promise<MentorshipSession>;
  updateSession: (sessionId: string, updates: Partial<MentorshipSession>) => Promise<void>;
  cancelSession: (sessionId: string, reason: string) => Promise<void>;
  getSession: (sessionId: string) => MentorshipSession | null;
  getSessions: (matchId: string, filters?: SessionFilters) => MentorshipSession[];
  provideFeedback: (sessionId: string, feedback: Omit<SessionFeedback, 'feedbackId' | 'date'>) => Promise<void>;
  addResource: (programId: string, resource: Omit<MentorshipResource, 'resourceId' | 'uploadedAt' | 'rating' | 'reviews' | 'downloads'>) => Promise<void>;
  getProgramMetrics: (programId: string) => MentorshipMetrics;
  getMentorStats: (mentorId: string) => MentorStats;
  getMenteeStats: (menteeId: string) => MenteeStats;
  getRecommendations: (userId: string, role: 'mentor' | 'mentee') => MentorshipMatch[];
  exportMentorshipData: (type: 'programs' | 'matches' | 'sessions' | 'metrics', format: 'json' | 'csv') => Promise<string>;
}

export interface ProgramFilters {
  category?: MentorshipProgram['category'];
  type?: MentorshipProgram['type'];
  status?: MentorshipProgram['status'];
  visibility?: MentorshipProgram['visibility'];
  tags?: string[];
}

export interface MentorSearchCriteria {
  expertise?: string[];
  experience?: string[];
  availability?: string[];
  location?: string;
  language?: string[];
  rate?: { min?: number; max?: number };
  rating?: { min?: number };
  type?: MentorType[];
  verification?: boolean;
}

export interface MenteeSearchCriteria {
  goals?: string[];
  skills?: string[];
  level?: string[];
  availability?: string[];
  location?: string;
  language?: string[];
  background?: string[];
  experience?: string;
}

export interface MatchFilters {
  status?: MentorshipMatch['status'];
  programId?: string;
  dateRange?: { start: string; end: string };
  progress?: { min?: number; max?: number };
}

export interface SessionFilters {
  status?: MentorshipSession['status'];
  type?: MentorshipSession['type'];
  dateRange?: { start: string; end: string };
  mentorId?: string;
  menteeId?: string;
}

// Mentorship engine
class MentorshipEngine {
  static async createProgram(programData: Omit<MentorshipProgram, 'programId' | 'createdDate'>): Promise<MentorshipProgram> {
    const programId = `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdDate = new Date().toISOString();

    const program: MentorshipProgram = {
      ...programData,
      programId,
      createdDate,
      mentors: [],
      mentees: [],
      matches: [],
      sessions: [],
      resources: [],
      guidelines: [],
      requirements: [],
      metrics: this.initializeProgramMetrics(),
      achievements: [],
    };

    return program;
  }

  static initializeProgramMetrics(): MentorshipMetrics {
    return {
      overall: {
        totalMentors: 0,
        totalMentees: 0,
        totalMatches: 0,
        activeMatches: 0,
        completedMatches: 0,
        totalSessions: 0,
        totalHours: 0,
        averageMatchDuration: 0,
        satisfaction: 0,
      },
      matching: {
        matchRequests: 0,
        matchAcceptance: 0,
        averageMatchTime: 0,
        matchSuccess: 0,
        matchRetention: 0,
        compatibility: [],
      },
      engagement: {
        sessionAttendance: 0,
        sessionCompletion: 0,
        responseRate: 0,
        communicationFrequency: 0,
        resourceUsage: 0,
        communityParticipation: 0,
      },
      outcomes: {
        goalsCompleted: 0,
        skillsImproved: 0,
        projectsCompleted: 0,
        careerProgress: 0,
        academicPerformance: 0,
        personalDevelopment: 0,
      },
      quality: {
        mentorRating: 0,
        menteeRating: 0,
        sessionQuality: 0,
        contentQuality: 0,
        supportQuality: 0,
        overallQuality: 0,
      },
      growth: {
        newMentors: 0,
        newMentees: 0,
        programExpansion: 0,
        retentionRate: 0,
        referralRate: 0,
        satisfactionTrend: 0,
      },
    };
  }

  static async findMentors(criteria: MentorSearchCriteria): Promise<Mentor[]> {
    // Mock implementation - would search actual mentors
    console.log('Finding mentors with criteria:', criteria);
    return [];
  }

  static async findMentees(criteria: MenteeSearchCriteria): Promise<Mentee[]> {
    // Mock implementation - would search actual mentees
    console.log('Finding mentees with criteria:', criteria);
    return [];
  }

  static async createMatch(
    mentorId: string,
    menteeId: string,
    programId: string,
    details: Omit<MentorshipMatch, 'matchId' | 'matchDate' | 'status'>
  ): Promise<MentorshipMatch> {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const matchDate = new Date().toISOString();

    const match: MentorshipMatch = {
      ...details,
      matchId,
      mentorId,
      menteeId,
      programId,
      matchDate,
      status: 'pending',
      goals: [],
      schedule: [],
      progress: {
        overall: 0,
        goals: [],
        sessions: [],
        skills: [],
        satisfaction: 0,
        engagement: 0,
      },
      feedback: [],
      sessions: [],
      metrics: {
        sessions: 0,
        hours: 0,
        goalsCompleted: 0,
        goalsInProgress: 0,
        skillsImproved: 0,
        satisfaction: 0,
        engagement: 0,
        effectiveness: 0,
        retention: 0,
      },
      notes: [],
    };

    return match;
  }

  static async scheduleSession(
    matchId: string,
    sessionData: Omit<MentorshipSession, 'sessionId' | 'status'>
  ): Promise<MentorshipSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: MentorshipSession = {
      ...sessionData,
      sessionId,
      matchId,
      status: 'scheduled',
      participants: [],
      materials: [],
      notes: [],
      outcomes: [],
      feedback: [],
    };

    return session;
  }

  static async getProgramMetrics(programId: string): Promise<MentorshipMetrics> {
    // Mock implementation - would calculate actual metrics
    return this.initializeProgramMetrics();
  }

  static async getMentorStats(mentorId: string): Promise<MentorStats> {
    // Mock implementation - would calculate actual mentor stats
    return {
      totalMentees: 0,
      activeMentees: 0,
      completedMentees: 0,
      totalSessions: 0,
      totalHours: 0,
      averageRating: 0,
      responseRate: 0,
      successRate: 0,
      specialties: [],
      activity: {
        lastLogin: new Date().toISOString(),
        lastSession: new Date().toISOString(),
        weeklySessions: 0,
        monthlySessions: 0,
        responseTime: 0,
        availability: 0,
      },
    };
  }

  static async getMenteeStats(menteeId: string): Promise<MenteeStats> {
    // Mock implementation - would calculate actual mentee stats
    return {
      totalMentors: 0,
      activeMentors: 0,
      totalSessions: 0,
      totalHours: 0,
      completedGoals: 0,
      inProgressGoals: 0,
      skillsLearned: 0,
      projectsCompleted: 0,
      averageRating: 0,
      satisfaction: 0,
    };
  }

  static async getRecommendations(userId: string, role: 'mentor' | 'mentee'): Promise<MentorshipMatch[]> {
    // Mock implementation - would use ML to recommend matches
    return [];
  }

  static async exportMentorshipData(type: string, format: 'json' | 'csv'): Promise<string> {
    // Mock implementation - would export actual mentorship data
    const exportData = {
      type,
      exportedAt: new Date().toISOString(),
      format,
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Mentorship provider
export const MentorshipProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [programs, setPrograms] = useState<MentorshipProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved programs
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setLoading(true);
        const savedPrograms = await AsyncStorage.getItem('@mentorship_programs');
        
        if (savedPrograms) {
          setPrograms(JSON.parse(savedPrograms));
        }
      } catch (err) {
        setError('Failed to load mentorship programs');
        console.error('Programs loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPrograms();
  }, []);

  const createProgram = useCallback(async (programData: Omit<MentorshipProgram, 'programId' | 'createdDate'>): Promise<MentorshipProgram> => {
    try {
      const newProgram = await MentorshipEngine.createProgram(programData);
      
      const updatedPrograms = [...programs, newProgram];
      setPrograms(updatedPrograms);
      await AsyncStorage.setItem('@mentorship_programs', JSON.stringify(updatedPrograms));

      return newProgram;
    } catch (err) {
      setError('Failed to create mentorship program');
      console.error('Program creation error:', err);
      throw err;
    }
  }, [programs]);

  const updateProgram = useCallback(async (programId: string, updates: Partial<MentorshipProgram>): Promise<void> => {
    try {
      const programIndex = programs.findIndex(p => p.programId === programId);
      if (programIndex === -1) throw new Error('Program not found');

      const updatedPrograms = [...programs];
      updatedPrograms[programIndex] = { ...updatedPrograms[programIndex], ...updates };
      
      setPrograms(updatedPrograms);
      await AsyncStorage.setItem('@mentorship_programs', JSON.stringify(updatedPrograms));
    } catch (err) {
      setError('Failed to update mentorship program');
      console.error('Program update error:', err);
      throw err;
    }
  }, [programs]);

  const deleteProgram = useCallback(async (programId: string): Promise<void> => {
    try {
      const updatedPrograms = programs.filter(p => p.programId !== programId);
      setPrograms(updatedPrograms);
      await AsyncStorage.setItem('@mentorship_programs', JSON.stringify(updatedPrograms));
    } catch (err) {
      setError('Failed to delete mentorship program');
      console.error('Program deletion error:', err);
      throw err;
    }
  }, [programs]);

  const getProgram = useCallback((programId: string): MentorshipProgram | null => {
    return programs.find(p => p.programId === programId) || null;
  }, [programs]);

  const getPrograms = useCallback((filters?: ProgramFilters): MentorshipProgram[] => {
    let programList = programs;
    
    if (filters) {
      if (filters.category) {
        programList = programList.filter(p => p.category === filters.category);
      }
      if (filters.type) {
        programList = programList.filter(p => p.type === filters.type);
      }
      if (filters.status) {
        programList = programList.filter(p => p.status === filters.status);
      }
      if (filters.visibility) {
        programList = programList.filter(p => p.visibility === filters.visibility);
      }
      if (filters.tags && filters.tags.length > 0) {
        programList = programList.filter(p => filters.tags.some(tag => p.settings.general.allowSelfMatching));
      }
    }
    
    return programList.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }, [programs]);

  const applyAsMentor = useCallback(async (programId: string, application: Omit<Mentor, 'mentorId'>): Promise<void> => {
    try {
      // Implementation for mentor application
      console.log(`Applying as mentor to program ${programId}`);
    } catch (err) {
      setError('Failed to apply as mentor');
      console.error('Mentor application error:', err);
      throw err;
    }
  }, []);

  const applyAsMentee = useCallback(async (programId: string, application: Omit<Mentee, 'menteeId'>): Promise<void> => {
    try {
      // Implementation for mentee application
      console.log(`Applying as mentee to program ${programId}`);
    } catch (err) {
      setError('Failed to apply as mentee');
      console.error('Mentee application error:', err);
      throw err;
    }
  }, []);

  const findMentors = useCallback(async (criteria: MentorSearchCriteria): Promise<Mentor[]> => {
    try {
      return await MentorshipEngine.findMentors(criteria);
    } catch (err) {
      setError('Failed to find mentors');
      console.error('Mentor search error:', err);
      throw err;
    }
  }, []);

  const findMentees = useCallback(async (criteria: MenteeSearchCriteria): Promise<Mentee[]> => {
    try {
      return await MentorshipEngine.findMentees(criteria);
    } catch (err) {
      setError('Failed to find mentees');
      console.error('Mentee search error:', err);
      throw err;
    }
  }, []);

  const createMatch = useCallback(async (
    mentorId: string,
    menteeId: string,
    programId: string,
    details: Omit<MentorshipMatch, 'matchId' | 'matchDate' | 'status'>
  ): Promise<MentorshipMatch> => {
    try {
      const newMatch = await MentorshipEngine.createMatch(mentorId, menteeId, programId, details);
      
      // Update local state
      const program = getProgram(programId);
      if (program) {
        await updateProgram(programId, {
          matches: [...program.matches, newMatch],
        });
      }

      return newMatch;
    } catch (err) {
      setError('Failed to create mentorship match');
      console.error('Match creation error:', err);
      throw err;
    }
  }, [getProgram, updateProgram]);

  const updateMatch = useCallback(async (matchId: string, updates: Partial<MentorshipMatch>): Promise<void> => {
    try {
      // Find and update match in all programs
      const updatedPrograms = programs.map(program => {
        const matchIndex = program.matches.findIndex(m => m.matchId === matchId);
        if (matchIndex !== -1) {
          const updatedMatches = [...program.matches];
          updatedMatches[matchIndex] = { ...updatedMatches[matchIndex], ...updates };
          return { ...program, matches: updatedMatches };
        }
        return program;
      });
      
      setPrograms(updatedPrograms);
      await AsyncStorage.setItem('@mentorship_programs', JSON.stringify(updatedPrograms));
    } catch (err) {
      setError('Failed to update mentorship match');
      console.error('Match update error:', err);
      throw err;
    }
  }, [programs]);

  const endMatch = useCallback(async (matchId: string, reason: string): Promise<void> => {
    try {
      await updateMatch(matchId, {
        status: 'completed',
        endDate: new Date().toISOString(),
      });
    } catch (err) {
      setError('Failed to end mentorship match');
      console.error('Match end error:', err);
      throw err;
    }
  }, [updateMatch]);

  const getMatch = useCallback((matchId: string): MentorshipMatch | null => {
    for (const program of programs) {
      const match = program.matches.find(m => m.matchId === matchId);
      if (match) return match;
    }
    return null;
  }, [programs]);

  const getMatches = useCallback((userId: string, role: 'mentor' | 'mentee', filters?: MatchFilters): MentorshipMatch[] => {
    let matches: MentorshipMatch[] = [];
    
    programs.forEach(program => {
      program.matches.forEach(match => {
        if ((role === 'mentor' && match.mentorId === userId) ||
            (role === 'mentee' && match.menteeId === userId)) {
          matches.push(match);
        }
      });
    });
    
    if (filters) {
      if (filters.status) {
        matches = matches.filter(m => m.status === filters.status);
      }
      if (filters.programId) {
        matches = matches.filter(m => m.programId === filters.programId);
      }
      if (filters.dateRange) {
        matches = matches.filter(m => {
          const matchDate = new Date(m.matchDate);
          return matchDate >= new Date(filters.dateRange.start) && matchDate <= new Date(filters.dateRange.end);
        });
      }
      if (filters.progress) {
        if (filters.progress.min !== undefined) {
          matches = matches.filter(m => m.progress.overall >= filters.progress.min!);
        }
        if (filters.progress.max !== undefined) {
          matches = matches.filter(m => m.progress.overall <= filters.progress.max!);
        }
      }
    }
    
    return matches.sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());
  }, [programs]);

  const scheduleSession = useCallback(async (
    matchId: string,
    sessionData: Omit<MentorshipSession, 'sessionId' | 'status'>
  ): Promise<MentorshipSession> => {
    try {
      const newSession = await MentorshipEngine.scheduleSession(matchId, sessionData);
      
      // Update local state
      const match = getMatch(matchId);
      if (match) {
        await updateMatch(matchId, {
          sessions: [...match.sessions, newSession],
        });
      }

      return newSession;
    } catch (err) {
      setError('Failed to schedule session');
      console.error('Session scheduling error:', err);
      throw err;
    }
  }, [getMatch, updateMatch]);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<MentorshipSession>): Promise<void> => {
    try {
      // Find and update session in all matches
      const updatedPrograms = programs.map(program => {
        const updatedMatches = program.matches.map(match => {
          const sessionIndex = match.sessions.findIndex(s => s.sessionId === sessionId);
          if (sessionIndex !== -1) {
            const updatedSessions = [...match.sessions];
            updatedSessions[sessionIndex] = { ...updatedSessions[sessionIndex], ...updates };
            return { ...match, sessions: updatedSessions };
          }
          return match;
        });
        return { ...program, matches: updatedMatches };
      });
      
      setPrograms(updatedPrograms);
      await AsyncStorage.setItem('@mentorship_programs', JSON.stringify(updatedPrograms));
    } catch (err) {
      setError('Failed to update session');
      console.error('Session update error:', err);
      throw err;
    }
  }, [programs]);

  const cancelSession = useCallback(async (sessionId: string, reason: string): Promise<void> => {
    try {
      await updateSession(sessionId, {
        status: 'cancelled',
      });
    } catch (err) {
      setError('Failed to cancel session');
      console.error('Session cancellation error:', err);
      throw err;
    }
  }, [updateSession]);

  const getSession = useCallback((sessionId: string): MentorshipSession | null => {
    for (const program of programs) {
      for (const match of program.matches) {
        const session = match.sessions.find(s => s.sessionId === sessionId);
        if (session) return session;
      }
    }
    return null;
  }, [programs]);

  const getSessions = useCallback((matchId: string, filters?: SessionFilters): MentorshipSession[] => {
    const match = getMatch(matchId);
    if (!match) return [];
    
    let sessions = match.sessions;
    
    if (filters) {
      if (filters.status) {
        sessions = sessions.filter(s => s.status === filters.status);
      }
      if (filters.type) {
        sessions = sessions.filter(s => s.type === filters.type);
      }
      if (filters.dateRange) {
        sessions = sessions.filter(s => {
          const sessionDate = new Date(s.date);
          return sessionDate >= new Date(filters.dateRange.start) && sessionDate <= new Date(filters.dateRange.end);
        });
      }
      if (filters.mentorId) {
        sessions = sessions.filter(s => s.mentorId === filters.mentorId);
      }
      if (filters.menteeId) {
        sessions = sessions.filter(s => s.menteeId === filters.menteeId);
      }
    }
    
    return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [getMatch]);

  const provideFeedback = useCallback(async (
    sessionId: string,
    feedbackData: Omit<SessionFeedback, 'feedbackId' | 'date'>
  ): Promise<void> => {
    try {
      const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const date = new Date().toISOString();
      
      const newFeedback: SessionFeedback = {
        ...feedbackData,
        feedbackId,
        date,
        helpful: 0,
      };

      // Update local state
      const session = getSession(sessionId);
      if (session) {
        await updateSession(sessionId, {
          feedback: [...session.feedback, newFeedback],
        });
      }
    } catch (err) {
      setError('Failed to provide feedback');
      console.error('Feedback provision error:', err);
      throw err;
    }
  }, [getSession, updateSession]);

  const addResource = useCallback(async (
    programId: string,
    resourceData: Omit<MentorshipResource, 'resourceId' | 'uploadedAt' | 'rating' | 'reviews' | 'downloads'>
  ): Promise<void> => {
    try {
      const resourceId = `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const uploadedAt = new Date().toISOString();
      
      const newResource: MentorshipResource = {
        ...resourceData,
        resourceId,
        uploadedAt,
        rating: 0,
        reviews: [],
        downloads: 0,
      };

      // Update local state
      const program = getProgram(programId);
      if (program) {
        await updateProgram(programId, {
          resources: [...program.resources, newResource],
        });
      }
    } catch (err) {
      setError('Failed to add resource');
      console.error('Resource addition error:', err);
      throw err;
    }
  }, [getProgram, updateProgram]);

  const getProgramMetrics = useCallback(async (programId: string): Promise<MentorshipMetrics> => {
    try {
      return await MentorshipEngine.getProgramMetrics(programId);
    } catch (err) {
      setError('Failed to get program metrics');
      console.error('Program metrics error:', err);
      throw err;
    }
  }, []);

  const getMentorStats = useCallback(async (mentorId: string): Promise<MentorStats> => {
    try {
      return await MentorshipEngine.getMentorStats(mentorId);
    } catch (err) {
      setError('Failed to get mentor stats');
      console.error('Mentor stats error:', err);
      throw err;
    }
  }, []);

  const getMenteeStats = useCallback(async (menteeId: string): Promise<MenteeStats> => {
    try {
      return await MentorshipEngine.getMenteeStats(menteeId);
    } catch (err) {
      setError('Failed to get mentee stats');
      console.error('Mentee stats error:', err);
      throw err;
    }
  }, []);

  const getRecommendations = useCallback(async (userId: string, role: 'mentor' | 'mentee'): Promise<MentorshipMatch[]> => {
    try {
      return await MentorshipEngine.getRecommendations(userId, role);
    } catch (err) {
      setError('Failed to get recommendations');
      console.error('Recommendations error:', err);
      throw err;
    }
  }, []);

  const exportMentorshipData = useCallback(async (type: string, format: 'json' | 'csv'): Promise<string> => {
    try {
      return await MentorshipEngine.exportMentorshipData(type, format);
    } catch (err) {
      setError('Failed to export mentorship data');
      console.error('Mentorship data export error:', err);
      throw err;
    }
  }, []);

  return (
    <MentorshipContext.Provider
      value={{
        programs,
        loading,
        error,
        createProgram,
        updateProgram,
        deleteProgram,
        getProgram,
        getPrograms,
        applyAsMentor,
        applyAsMentee,
        findMentors,
        findMentees,
        createMatch,
        updateMatch,
        endMatch,
        getMatch,
        getMatches,
        scheduleSession,
        updateSession,
        cancelSession,
        getSession,
        getSessions,
        provideFeedback,
        addResource,
        getProgramMetrics,
        getMentorStats,
        getMenteeStats,
        getRecommendations,
        exportMentorshipData,
      }}
    >
      {children}
    </MentorshipContext.Provider>
  );
};

export const useMentorship = (): MentorshipContextType => {
  const context = useContext(MentorshipContext);
  if (!context) {
    throw new Error('useMentorship must be used within a MentorshipProvider');
  }
  return context;
};

export default {
  MentorshipProvider,
  useMentorship,
  MentorshipEngine,
};
