import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';

// User journey mapping types
export interface UserJourney {
  journeyId: string;
  userId: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  journeyType: 'onboarding' | 'learning' | 'practice' | 'assessment' | 'exploration' | 'support';
  status: 'active' | 'completed' | 'abandoned' | 'error';
  touchpoints: JourneyTouchpoint[];
  flows: JourneyFlow[];
  conversions: JourneyConversion[];
  dropoffs: JourneyDropoff[];
  interactions: JourneyInteraction[];
  performance: JourneyPerformance;
  insights: JourneyInsights;
}

export interface JourneyTouchpoint {
  touchpointId: string;
  timestamp: string;
  screen: string;
  component: string;
  action: string;
  duration: number; // time spent on this touchpoint
  context: TouchpointContext;
  metadata: TouchpointMetadata;
  previousTouchpoint?: string;
  nextTouchpoint?: string;
}

export interface TouchpointContext {
  source: 'navigation' | 'button' | 'gesture' | 'auto' | 'external';
  trigger: string;
  parameters: Record<string, any>;
  userIntent: string;
  businessContext: string;
}

export interface TouchpointMetadata {
  coordinates?: { x: number; y: number };
  viewport?: { width: number; height: number };
  scrollPosition?: { x: number; y: number };
  deviceOrientation?: 'portrait' | 'landscape';
  networkStatus?: 'online' | 'offline' | 'poor';
  batteryLevel?: number;
}

export interface JourneyFlow {
  flowId: string;
  flowName: string;
  flowType: 'linear' | 'branched' | 'circular' | 'complex';
  startTouchpoint: string;
  endTouchpoint?: string;
  touchpoints: string[];
  duration: number;
  completionRate: number; // 0-100
  efficiency: number; // 0-100
  bottlenecks: FlowBottleneck[];
  shortcuts: FlowShortcut[];
  deviations: FlowDeviation[];
}

export interface FlowBottleneck {
  touchpointId: string;
  type: 'time' | 'error' | 'confusion' | 'abandonment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  affectedUsers: number;
  resolution: string[];
}

export interface FlowShortcut {
  fromTouchpoint: string;
  toTouchpoint: string;
  usage: number;
  efficiency: number;
  userSegment: string[];
  recommendation: string;
}

export interface FlowDeviation {
  expectedPath: string[];
  actualPath: string[];
  deviationPoint: string;
  deviationType: 'skip' | 'detour' | 'backtrack' | 'abandon';
  reason: string;
  frequency: number;
}

export interface JourneyConversion {
  conversionId: string;
  conversionType: 'signup' | 'lesson_complete' | 'purchase' | 'engagement' | 'retention';
  stage: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  value: number;
  timestamp: string;
  factors: ConversionFactor[];
  attribution: ConversionAttribution;
}

export interface ConversionFactor {
  factor: string;
  influence: number; // 0-100
  category: 'content' | 'ui' | 'performance' | 'external' | 'personal';
  description: string;
}

export interface ConversionAttribution {
  touchpoints: string[];
  channels: string[];
  campaigns: string[];
  sources: string[];
  weighted: boolean;
}

export interface JourneyDropoff {
  dropoffId: string;
  touchpointId: string;
  timestamp: string;
  reason: DropoffReason;
  context: DropoffContext;
  recovery: DropoffRecovery;
  impact: DropoffImpact;
}

export interface DropoffReason {
  primary: 'frustration' | 'confusion' | 'distraction' | 'completion' | 'technical' | 'time';
  secondary?: string;
  details: string;
  confidence: number; // 0-100
}

export interface DropoffContext {
  timeSpent: number;
  previousActions: string[];
  sessionPosition: 'early' | 'middle' | 'late';
  userState: 'new' | 'returning' | 'engaged' | 'struggling';
  environment: string;
}

export interface DropoffRecovery {
  attempted: boolean;
  successful: boolean;
  method: string;
  timeToRecovery?: number;
}

export interface DropoffImpact {
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  userImpact: 'low' | 'medium' | 'high';
  frequency: number;
  cost: number;
}

export interface JourneyInteraction {
  interactionId: string;
  type: 'click' | 'swipe' | 'scroll' | 'pinch' | 'tap' | 'long_press' | 'voice' | 'gesture';
  target: string;
  coordinates: { x: number; y: number };
  timestamp: string;
  duration: number;
  pressure?: number;
  velocity?: number;
  context: InteractionContext;
}

export interface InteractionContext {
  screen: string;
  component: string;
  state: string;
  userIntent: string;
  previousInteraction?: string;
  sequencePosition: number;
}

export interface JourneyPerformance {
  loadTimes: PerformanceMetric[];
  responseTimes: PerformanceMetric[];
  errorRates: PerformanceMetric[];
  crashRates: PerformanceMetric[];
  userSatisfaction: SatisfactionMetric[];
  technicalPerformance: TechnicalPerformance;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  benchmark: number;
  percentile: number;
  trend: 'improving' | 'stable' | 'declining';
  timestamp: string;
}

export interface SatisfactionMetric {
  metric: string;
  score: number; // 0-100
  feedback: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  timestamp: string;
}

export interface TechnicalPerformance {
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  batteryImpact: number;
  crashFreeSessions: number;
  anrRate: number; // Application Not Responding
}

export interface JourneyInsights {
  patterns: JourneyPattern[];
  anomalies: JourneyAnomaly[];
  opportunities: JourneyOpportunity[];
  recommendations: JourneyRecommendation[];
  predictions: JourneyPrediction[];
  segments: UserSegment[];
}

export interface JourneyPattern {
  patternId: string;
  name: string;
  description: string;
  frequency: number;
  confidence: number; // 0-100
  touchpoints: string[];
  duration: number;
  conversion: number;
  userSegment: string[];
  businessValue: string;
}

export interface JourneyAnomaly {
  anomalyId: string;
  type: 'unusual_flow' | 'performance_issue' | 'behavior_change' | 'technical_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedUsers: number;
  impact: string;
  detection: string;
  resolution?: string;
}

export interface JourneyOpportunity {
  opportunityId: string;
  type: 'optimization' | 'feature' | 'engagement' | 'conversion' | 'retention';
  description: string;
  potential: number;
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedImpact: string;
  implementation: string[];
}

export interface JourneyRecommendation {
  recommendationId: string;
  category: 'ui' | 'content' | 'performance' | 'feature' | 'strategy';
  title: string;
  description: string;
  rationale: string;
  expectedOutcome: string;
  implementation: ImplementationPlan;
  successMetrics: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ImplementationPlan {
  steps: ImplementationStep[];
  timeline: string;
  resources: string[];
  dependencies: string[];
  risks: string[];
  successCriteria: string[];
}

export interface ImplementationStep {
  step: number;
  action: string;
  description: string;
  owner: string;
  timeline: string;
  deliverables: string[];
  acceptanceCriteria: string[];
}

export interface JourneyPrediction {
  predictionId: string;
  type: 'conversion' | 'dropoff' | 'engagement' | 'retention' | 'satisfaction';
  confidence: number; // 0-100
  timeframe: string;
  prediction: string;
  factors: PredictionFactor[];
  accuracy: number;
  model: string;
}

export interface PredictionFactor {
  factor: string;
  weight: number; // 0-1
  value: any;
  contribution: string;
}

export interface UserSegment {
  segmentId: string;
  name: string;
  description: string;
  size: number;
  characteristics: SegmentCharacteristic[];
  behaviors: SegmentBehavior[];
  preferences: SegmentPreference[];
  journeys: string[];
  value: string;
}

export interface SegmentCharacteristic {
  characteristic: string;
  value: any;
  type: 'demographic' | 'behavioral' | 'technical' | 'contextual';
  importance: number; // 0-100
}

export interface SegmentBehavior {
  behavior: string;
  frequency: string;
  pattern: string;
  impact: string;
  drivers: string[];
}

export interface SegmentPreference {
  preference: string;
  value: any;
  strength: number; // 0-100
  context: string[];
}

// User journey context
interface UserJourneyContextType {
  journeys: UserJourney[];
  activeJourney: UserJourney | null;
  loading: boolean;
  error: string | null;
  startJourney: (userId: string, journeyType: UserJourney['journeyType'], context: any) => Promise<UserJourney>;
  recordTouchpoint: (journeyId: string, touchpoint: Omit<JourneyTouchpoint, 'touchpointId' | 'timestamp'>) => Promise<void>;
  recordInteraction: (journeyId: string, interaction: Omit<JourneyInteraction, 'interactionId' | 'timestamp'>) => Promise<void>;
  recordConversion: (journeyId: string, conversion: Omit<JourneyConversion, 'conversionId' | 'timestamp'>) => Promise<void>;
  recordDropoff: (journeyId: string, dropoff: Omit<JourneyDropoff, 'dropoffId' | 'timestamp'>) => Promise<void>;
  completeJourney: (journeyId: string, outcome: string, insights?: any) => Promise<void>;
  getJourneyAnalytics: (journeyId: string) => JourneyAnalytics;
  getUserJourneys: (userId: string, filters?: JourneyFilters) => UserJourney[];
  getJourneyFlows: (flowType?: string) => JourneyFlow[];
  getJourneyInsights: (timeframe?: string) => JourneyInsights;
  analyzeUserPaths: (userId: string) => PathAnalysis;
  exportJourneyData: (format: 'json' | 'csv') => Promise<string>;
  optimizeJourney: (journeyId: string) => OptimizationPlan;
}

export interface JourneyFilters {
  journeyType?: UserJourney['journeyType'];
  status?: UserJourney['status'];
  dateRange?: { start: string; end: string };
  deviceType?: UserJourney['deviceType'];
  platform?: UserJourney['platform'];
  duration?: { min?: number; max?: number };
}

export interface JourneyAnalytics {
  overview: JourneyOverview;
  flowAnalysis: FlowAnalysis;
  conversionAnalysis: ConversionAnalysis;
  dropoffAnalysis: DropoffAnalysis;
  performanceAnalysis: PerformanceAnalysis;
  userSegmentAnalysis: UserSegmentAnalysis;
  trends: JourneyTrend[];
  benchmarks: JourneyBenchmark[];
}

export interface JourneyOverview {
  totalJourneys: number;
  activeJourneys: number;
  completedJourneys: number;
  abandonedJourneys: number;
  averageDuration: number;
  conversionRate: number;
  dropoffRate: number;
  userSatisfaction: number;
  topJourneys: TopJourney[];
}

export interface TopJourney {
  journeyType: UserJourney['journeyType'];
  count: number;
  completionRate: number;
  averageDuration: number;
  conversionRate: number;
  userSatisfaction: number;
}

export interface FlowAnalysis {
  totalFlows: number;
  efficientFlows: number;
  bottleneckFlows: number;
  averageFlowDuration: number;
  commonFlows: CommonFlow[];
  flowEfficiency: number;
  optimizationOpportunities: string[];
}

export interface CommonFlow {
  flowName: string;
  usage: number;
  completionRate: number;
  averageDuration: number;
  userSegment: string[];
  issues: string[];
}

export interface ConversionAnalysis {
  totalConversions: number;
  conversionRate: number;
  conversionFunnel: ConversionFunnel[];
  topConversions: TopConversion[];
  conversionFactors: ConversionFactor[];
  attribution: AttributionAnalysis;
}

export interface ConversionFunnel {
  stage: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
  averageTime: number;
  issues: string[];
}

export interface TopConversion {
  conversionType: JourneyConversion['conversionType'];
  count: number;
  rate: number;
  value: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface AttributionAnalysis {
  channels: AttributionChannel[];
  touchpoints: AttributionTouchpoint[];
  campaigns: AttributionCampaign[];
  weightedAttribution: boolean;
}

export interface AttributionChannel {
  channel: string;
  conversions: number;
  value: number;
  rate: number;
  quality: number;
}

export interface AttributionTouchpoint {
  touchpoint: string;
  conversions: number;
  influence: number;
  position: string;
}

export interface AttributionCampaign {
  campaign: string;
  conversions: number;
  value: number;
  roi: number;
  quality: number;
}

export interface DropoffAnalysis {
  totalDropoffs: number;
  dropoffRate: number;
  dropoffPoints: DropoffPoint[];
  dropoffReasons: DropoffReason[];
  recoveryRate: number;
  impact: DropoffImpact[];
}

export interface DropoffPoint {
  touchpoint: string;
  dropoffs: number;
  rate: number;
  reasons: string[];
  recovery: number;
  impact: string;
}

export interface PerformanceAnalysis {
  averageLoadTime: number;
  averageResponseTime: number;
  errorRate: number;
  crashRate: number;
  userSatisfaction: number;
  performanceIssues: PerformanceIssue[];
  benchmarks: PerformanceBenchmark[];
}

export interface PerformanceIssue {
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  impact: string;
  resolution: string[];
}

export interface PerformanceBenchmark {
  metric: string;
  current: number;
  benchmark: number;
  percentile: number;
  trend: string;
}

export interface UserSegmentAnalysis {
  totalSegments: number;
  segmentDistribution: SegmentDistribution[];
  segmentPerformance: SegmentPerformance[];
  segmentJourneys: SegmentJourney[];
  opportunities: SegmentOpportunity[];
}

export interface SegmentDistribution {
  segment: string;
  size: number;
  percentage: number;
  growth: number;
}

export interface SegmentPerformance {
  segment: string;
  journeys: number;
  completionRate: number;
  satisfaction: number;
  value: number;
  retention: number;
}

export interface SegmentJourney {
  segment: string;
  preferredJourneys: string[];
  journeyPatterns: string[];
  issues: string[];
  opportunities: string[];
}

export interface SegmentOpportunity {
  segment: string;
  opportunity: string;
  potential: number;
  effort: string;
  priority: string;
}

export interface JourneyTrend {
  metric: string;
  period: string;
  value: number;
  change: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  significance: 'low' | 'medium' | 'high';
}

export interface JourneyBenchmark {
  metric: string;
  current: number;
  industry: number;
  competitor: number;
  best: number;
  percentile: number;
}

export interface PathAnalysis {
  userPaths: UserPath[];
  commonPaths: CommonPath[];
  efficientPaths: EfficientPath[];
  problematicPaths: ProblematicPath[];
  recommendations: PathRecommendation[];
}

export interface UserPath {
  pathId: string;
  touchpoints: string[];
  duration: number;
  conversions: number;
  dropoffs: number;
  efficiency: number;
  pattern: string;
}

export interface CommonPath {
  path: string[];
  usage: number;
  success: number;
  efficiency: number;
  userSegment: string[];
  characteristics: string[];
}

export interface EfficientPath {
  path: string[];
  efficiency: number;
  time: number;
  conversions: number;
  bestPractices: string[];
  applicable: string[];
}

export interface ProblematicPath {
  path: string[];
  issues: string[];
  dropoffRate: number;
  impact: string;
  resolution: string[];
}

export interface PathRecommendation {
  path: string[];
  recommendation: string;
  expectedImprovement: string;
  implementation: string[];
  priority: string;
}

export interface OptimizationPlan {
  planId: string;
  journeyId: string;
  optimizations: Optimization[];
  timeline: string;
  resources: string[];
  expectedImpact: string;
  successMetrics: string[];
  risks: string[];
}

export interface Optimization {
  optimizationId: string;
  type: 'flow' | 'touchpoint' | 'content' | 'performance' | 'ui';
  description: string;
  current: string;
  proposed: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  implementation: string[];
}

// User journey tracking engine
class UserJourneyTrackingEngine {
  static async startJourney(
    userId: string,
    journeyType: UserJourney['journeyType'],
    context: any
  ): Promise<UserJourney> {
    const journeyId = `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = `session_${Date.now()}`;
    const startTime = new Date().toISOString();

    const journey: UserJourney = {
      journeyId,
      userId,
      sessionId,
      startTime,
      deviceType: context.deviceType || 'mobile',
      platform: context.platform || 'ios',
      appVersion: context.appVersion || '1.0.0',
      journeyType,
      status: 'active',
      touchpoints: [],
      flows: [],
      conversions: [],
      dropoffs: [],
      interactions: [],
      performance: this.initializePerformance(),
      insights: this.initializeInsights(),
    };

    return journey;
  }

  static initializePerformance(): JourneyPerformance {
    return {
      loadTimes: [],
      responseTimes: [],
      errorRates: [],
      crashRates: [],
      userSatisfaction: [],
      technicalPerformance: {
        memoryUsage: 0,
        cpuUsage: 0,
        networkLatency: 0,
        batteryImpact: 0,
        crashFreeSessions: 100,
        anrRate: 0,
      },
    };
  }

  static initializeInsights(): JourneyInsights {
    return {
      patterns: [],
      anomalies: [],
      opportunities: [],
      recommendations: [],
      predictions: [],
      segments: [],
    };
  }

  static async recordTouchpoint(
    journey: UserJourney,
    touchpointData: Omit<JourneyTouchpoint, 'touchpointId' | 'timestamp'>
  ): Promise<void> {
    const touchpointId = `touchpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const touchpoint: JourneyTouchpoint = {
      ...touchpointData,
      touchpointId,
      timestamp,
    };

    journey.touchpoints.push(touchpoint);

    // Update flows if needed
    this.updateJourneyFlows(journey, touchpoint);
  }

  static updateJourneyFlows(journey: UserJourney, touchpoint: JourneyTouchpoint): void {
    // Simplified flow update logic
    const existingFlow = journey.flows.find(f => f.flowName === 'main_flow');
    
    if (!existingFlow) {
      journey.flows.push({
        flowId: 'main_flow',
        flowName: 'main_flow',
        flowType: 'linear',
        startTouchpoint: touchpoint.touchpointId,
        touchpoints: [touchpoint.touchpointId],
        duration: 0,
        completionRate: 0,
        efficiency: 0,
        bottlenecks: [],
        shortcuts: [],
        deviations: [],
      });
    } else {
      existingFlow.touchpoints.push(touchpoint.touchpointId);
      existingFlow.endTouchpoint = touchpoint.touchpointId;
    }
  }

  static async recordInteraction(
    journey: UserJourney,
    interactionData: Omit<JourneyInteraction, 'interactionId' | 'timestamp'>
  ): Promise<void> {
    const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const interaction: JourneyInteraction = {
      ...interactionData,
      interactionId,
      timestamp,
    };

    journey.interactions.push(interaction);
  }

  static async recordConversion(
    journey: UserJourney,
    conversionData: Omit<JourneyConversion, 'conversionId' | 'timestamp'>
  ): Promise<void> {
    const conversionId = `conversion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const conversion: JourneyConversion = {
      ...conversionData,
      conversionId,
      timestamp,
    };

    journey.conversions.push(conversion);
  }

  static async recordDropoff(
    journey: UserJourney,
    dropoffData: Omit<JourneyDropoff, 'dropoffId' | 'timestamp'>
  ): Promise<void> {
    const dropoffId = `dropoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const dropoff: JourneyDropoff = {
      ...dropoffData,
      dropoffId,
      timestamp,
    };

    journey.dropoffs.push(dropoff);
  }

  static async completeJourney(
    journey: UserJourney,
    outcome: string,
    insights?: any
  ): Promise<void> {
    journey.endTime = new Date().toISOString();
    journey.duration = Math.floor((new Date(journey.endTime).getTime() - new Date(journey.startTime).getTime()) / (1000 * 60));
    journey.status = outcome === 'completed' ? 'completed' : 'abandoned';

    // Generate insights
    journey.insights = this.generateJourneyInsights(journey);
  }

  static generateJourneyInsights(journey: UserJourney): JourneyInsights {
    const patterns = this.identifyPatterns(journey);
    const anomalies = this.detectAnomalies(journey);
    const opportunities = this.identifyOpportunities(journey);
    const recommendations = this.generateRecommendations(journey);
    const predictions = this.generatePredictions(journey);
    const segments = this.analyzeUserSegments(journey);

    return {
      patterns,
      anomalies,
      opportunities,
      recommendations,
      predictions,
      segments,
    };
  }

  static identifyPatterns(journey: UserJourney): JourneyPattern[] {
    const patterns: JourneyPattern[] = [];

    // Identify common touchpoint sequences
    if (journey.touchpoints.length >= 3) {
      patterns.push({
        patternId: 'common_sequence',
        name: 'Common Learning Sequence',
        description: 'Users typically follow this sequence when learning',
        frequency: 85,
        confidence: 90,
        touchpoints: journey.touchpoints.slice(0, 3).map(t => t.touchpointId),
        duration: journey.duration || 0,
        conversion: journey.conversions.length > 0 ? 75 : 25,
        userSegment: ['learners'],
        businessValue: 'Improved learning outcomes',
      });
    }

    return patterns;
  }

  static detectAnomalies(journey: UserJourney): JourneyAnomaly[] {
    const anomalies: JourneyAnomaly[] = [];

    // Check for unusual duration
    if (journey.duration && journey.duration > 60) {
      anomalies.push({
        anomalyId: 'long_duration',
        type: 'unusual_flow',
        severity: 'medium',
        description: 'Journey duration is unusually long',
        affectedUsers: 1,
        impact: 'May indicate user confusion or technical issues',
        detection: 'Duration analysis',
      });
    }

    return anomalies;
  }

  static identifyOpportunities(journey: UserJourney): JourneyOpportunity[] {
    const opportunities: JourneyOpportunity[] = [];

    // Check for dropoff opportunities
    if (journey.dropoffs.length > 0) {
      opportunities.push({
        opportunityId: 'reduce_dropoff',
        type: 'retention',
        description: 'Reduce dropoff at critical points',
        potential: 25,
        effort: 'medium',
        priority: 'high',
        expectedImpact: '15% increase in completion rate',
        implementation: ['Improve UI clarity', 'Add progress indicators'],
      });
    }

    return opportunities;
  }

  static generateRecommendations(journey: UserJourney): JourneyRecommendation[] {
    const recommendations: JourneyRecommendation[] = [];

    if (journey.dropoffs.length > 0) {
      recommendations.push({
        recommendationId: 'reduce_dropoff',
        category: 'ui',
        title: 'Reduce Dropoff Rate',
        description: 'Implement changes to reduce user dropoff',
        rationale: 'High dropoff rate indicates user experience issues',
        expectedOutcome: '15% increase in completion rate',
        implementation: {
          steps: [
            {
              step: 1,
              action: 'Analyze dropoff points',
              description: 'Identify where users are dropping off',
              owner: 'UX Team',
              timeline: '1 week',
              deliverables: ['Dropoff analysis report'],
              acceptanceCriteria: ['All dropoff points identified'],
            },
          ],
          timeline: '2 weeks',
          resources: ['UX Designer', 'Developer'],
          dependencies: ['Analytics data'],
          risks: ['User behavior changes'],
          successCriteria: ['10% reduction in dropoff rate'],
        },
        successMetrics: ['Dropoff rate', 'Completion rate', 'User satisfaction'],
        priority: 'high',
      });
    }

    return recommendations;
  }

  static generatePredictions(journey: UserJourney): JourneyPrediction[] {
    const predictions: JourneyPrediction[] = [];

    // Predict completion likelihood
    const completionProbability = this.calculateCompletionProbability(journey);
    
    predictions.push({
      predictionId: 'completion_prediction',
      type: 'conversion',
      confidence: 75,
      timeframe: 'next_session',
      prediction: completionProbability > 70 ? 'Likely to complete' : 'At risk of abandonment',
      factors: [
        {
          factor: 'Current progress',
          weight: 0.4,
          value: journey.touchpoints.length,
          contribution: 'More touchpoints indicate higher engagement',
        },
        {
          factor: 'Time spent',
          weight: 0.3,
          value: journey.duration || 0,
          contribution: 'Longer sessions suggest higher commitment',
        },
      ],
      accuracy: 80,
      model: 'journey_completion_v1',
    });

    return predictions;
  }

  static calculateCompletionProbability(journey: UserJourney): number {
    let probability = 50; // Base probability

    // Adjust based on progress
    probability += Math.min(30, journey.touchpoints.length * 5);

    // Adjust based on time spent
    if (journey.duration && journey.duration > 10) {
      probability += 10;
    }

    // Adjust based on conversions
    probability += journey.conversions.length * 10;

    // Adjust based on dropoffs
    probability -= journey.dropoffs.length * 15;

    return Math.min(100, Math.max(0, probability));
  }

  static analyzeUserSegments(journey: UserJourney): UserSegment[] {
    const segments: UserSegment[] = [];

    // Create segment based on journey type
    segments.push({
      segmentId: 'journey_type_segment',
      name: `${journey.journeyType} Users`,
      description: `Users who engage in ${journey.journeyType} journeys`,
      size: 1,
      characteristics: [
        {
          characteristic: 'journey_type',
          value: journey.journeyType,
          type: 'behavioral',
          importance: 80,
        },
      ],
      behaviors: [
        {
          behavior: 'engagement_pattern',
          frequency: 'session_based',
          pattern: 'linear_progression',
          impact: 'learning_outcomes',
          drivers: ['content_quality', 'ui_usability'],
        },
      ],
      preferences: [
        {
          preference: 'learning_style',
          value: 'visual',
          strength: 70,
          context: ['content_consumption'],
        },
      ],
      journeys: [journey.journeyId],
      value: 'Targeted content delivery',
    });

    return segments;
  }

  static getJourneyAnalytics(journey: UserJourney): JourneyAnalytics {
    const overview = this.calculateOverview(journey);
    const flowAnalysis = this.analyzeFlows(journey);
    const conversionAnalysis = this.analyzeConversions(journey);
    const dropoffAnalysis = this.analyzeDropoffs(journey);
    const performanceAnalysis = this.analyzePerformance(journey);
    const userSegmentAnalysis = this.analyzeUserSegments(journey);
    const trends = this.calculateTrends(journey);
    const benchmarks = this.calculateBenchmarks(journey);

    return {
      overview,
      flowAnalysis,
      conversionAnalysis,
      dropoffAnalysis,
      performanceAnalysis,
      userSegmentAnalysis,
      trends,
      benchmarks,
    };
  }

  static calculateOverview(journey: UserJourney): JourneyOverview {
    return {
      totalJourneys: 1,
      activeJourneys: journey.status === 'active' ? 1 : 0,
      completedJourneys: journey.status === 'completed' ? 1 : 0,
      abandonedJourneys: journey.status === 'abandoned' ? 1 : 0,
      averageDuration: journey.duration || 0,
      conversionRate: journey.touchpoints.length > 0 ? (journey.conversions.length / journey.touchpoints.length) * 100 : 0,
      dropoffRate: journey.touchpoints.length > 0 ? (journey.dropoffs.length / journey.touchpoints.length) * 100 : 0,
      userSatisfaction: 75, // Mock value
      topJourneys: [],
    };
  }

  static analyzeFlows(journey: UserJourney): FlowAnalysis {
    return {
      totalFlows: journey.flows.length,
      efficientFlows: journey.flows.filter(f => f.efficiency > 70).length,
      bottleneckFlows: journey.flows.filter(f => f.bottlenecks.length > 0).length,
      averageFlowDuration: journey.flows.reduce((sum, f) => sum + f.duration, 0) / Math.max(1, journey.flows.length),
      commonFlows: [],
      flowEfficiency: journey.flows.reduce((sum, f) => sum + f.efficiency, 0) / Math.max(1, journey.flows.length),
      optimizationOpportunities: ['Reduce bottlenecks', 'Improve flow efficiency'],
    };
  }

  static analyzeConversions(journey: UserJourney): ConversionAnalysis {
    return {
      totalConversions: journey.conversions.length,
      conversionRate: journey.touchpoints.length > 0 ? (journey.conversions.length / journey.touchpoints.length) * 100 : 0,
      conversionFunnel: [],
      topConversions: [],
      conversionFactors: [],
      attribution: {
        channels: [],
        touchpoints: [],
        campaigns: [],
        weightedAttribution: false,
      },
    };
  }

  static analyzeDropoffs(journey: UserJourney): DropoffAnalysis {
    return {
      totalDropoffs: journey.dropoffs.length,
      dropoffRate: journey.touchpoints.length > 0 ? (journey.dropoffs.length / journey.touchpoints.length) * 100 : 0,
      dropoffPoints: [],
      dropoffReasons: [],
      recoveryRate: journey.dropoffs.filter(d => d.recovery.successful).length / Math.max(1, journey.dropoffs.length) * 100,
      impact: [],
    };
  }

  static analyzePerformance(journey: UserJourney): PerformanceAnalysis {
    return {
      averageLoadTime: journey.performance.loadTimes.reduce((sum, m) => sum + m.value, 0) / Math.max(1, journey.performance.loadTimes.length),
      averageResponseTime: journey.performance.responseTimes.reduce((sum, m) => sum + m.value, 0) / Math.max(1, journey.performance.responseTimes.length),
      errorRate: journey.performance.errorRates.reduce((sum, m) => sum + m.value, 0) / Math.max(1, journey.performance.errorRates.length),
      crashRate: journey.performance.crashRates.reduce((sum, m) => sum + m.value, 0) / Math.max(1, journey.performance.crashRates.length),
      userSatisfaction: journey.performance.userSatisfaction.reduce((sum, m) => sum + m.score, 0) / Math.max(1, journey.performance.userSatisfaction.length),
      performanceIssues: [],
      benchmarks: [],
    };
  }

  static analyzeUserSegments(journey: UserJourney): UserSegmentAnalysis {
    return {
      totalSegments: journey.insights.segments.length,
      segmentDistribution: [],
      segmentPerformance: [],
      segmentJourneys: [],
      opportunities: [],
    };
  }

  static calculateTrends(journey: UserJourney): JourneyTrend[] {
    return [
      {
        metric: 'engagement',
        period: 'daily',
        value: journey.touchpoints.length,
        change: 5,
        trend: 'increasing',
        significance: 'medium',
      },
    ];
  }

  static calculateBenchmarks(journey: UserJourney): JourneyBenchmark[] {
    return [
      {
        metric: 'completion_rate',
        current: journey.status === 'completed' ? 100 : 0,
        industry: 75,
        competitor: 80,
        best: 95,
        percentile: 60,
      },
    ];
  }

  static analyzeUserPaths(userId: string, journeys: UserJourney[]): PathAnalysis {
    const userPaths: UserPath[] = journeys.map(journey => ({
      pathId: journey.journeyId,
      touchpoints: journey.touchpoints.map(t => t.touchpointId),
      duration: journey.duration || 0,
      conversions: journey.conversions.length,
      dropoffs: journey.dropoffs.length,
      efficiency: journey.touchpoints.length > 0 ? ((journey.touchpoints.length - journey.dropoffs.length) / journey.touchpoints.length) * 100 : 0,
      pattern: 'linear',
    }));

    return {
      userPaths,
      commonPaths: [],
      efficientPaths: [],
      problematicPaths: [],
      recommendations: [],
    };
  }

  static optimizeJourney(journey: UserJourney): OptimizationPlan {
    const optimizations: Optimization[] = [];

    if (journey.dropoffs.length > 0) {
      optimizations.push({
        optimizationId: 'reduce_dropoff',
        type: 'flow',
        description: 'Reduce dropoff at critical points',
        current: 'High dropoff rate',
        proposed: 'Improved flow with better guidance',
        expectedImpact: '15% increase in completion',
        effort: 'medium',
        priority: 'high',
        implementation: ['Analyze dropoff points', 'Improve UI clarity'],
      });
    }

    return {
      planId: `optimization_${journey.journeyId}`,
      journeyId: journey.journeyId,
      optimizations,
      timeline: '2 weeks',
      resources: ['UX Designer', 'Developer'],
      expectedImpact: 'Improved user experience and completion rates',
      successMetrics: ['Dropoff rate', 'Completion rate', 'User satisfaction'],
      risks: ['User resistance to changes'],
    };
  }
}

// User journey provider
export const UserJourneyProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [journeys, setJourneys] = useState<UserJourney[]>([]);
  const [activeJourney, setActiveJourney] = useState<UserJourney | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved journeys
  useEffect(() => {
    const loadJourneys = async () => {
      try {
        setLoading(true);
        const savedJourneys = await AsyncStorage.getItem('@user_journeys');
        
        if (savedJourneys) {
          setJourneys(JSON.parse(savedJourneys));
        }
      } catch (err) {
        setError('Failed to load user journeys');
        console.error('Journeys loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadJourneys();
  }, []);

  const startJourney = useCallback(async (
    userId: string,
    journeyType: UserJourney['journeyType'],
    context: any
  ): Promise<UserJourney> => {
    try {
      const newJourney = await UserJourneyTrackingEngine.startJourney(userId, journeyType, context);
      
      const updatedJourneys = [...journeys, newJourney];
      setJourneys(updatedJourneys);
      setActiveJourney(newJourney);
      await AsyncStorage.setItem('@user_journeys', JSON.stringify(updatedJourneys));

      return newJourney;
    } catch (err) {
      setError('Failed to start journey');
      console.error('Journey start error:', err);
      throw err;
    }
  }, [journeys]);

  const recordTouchpoint = useCallback(async (
    journeyId: string,
    touchpointData: Omit<JourneyTouchpoint, 'touchpointId' | 'timestamp'>
  ): Promise<void> => {
    try {
      const journeyIndex = journeys.findIndex(j => j.journeyId === journeyId);
      if (journeyIndex === -1) throw new Error('Journey not found');

      const updatedJourneys = [...journeys];
      await UserJourneyTrackingEngine.recordTouchpoint(updatedJourneys[journeyIndex], touchpointData);
      
      setJourneys(updatedJourneys);
      if (activeJourney?.journeyId === journeyId) {
        setActiveJourney(updatedJourneys[journeyIndex]);
      }
      await AsyncStorage.setItem('@user_journeys', JSON.stringify(updatedJourneys));
    } catch (err) {
      setError('Failed to record touchpoint');
      console.error('Touchpoint recording error:', err);
      throw err;
    }
  }, [journeys, activeJourney]);

  const recordInteraction = useCallback(async (
    journeyId: string,
    interactionData: Omit<JourneyInteraction, 'interactionId' | 'timestamp'>
  ): Promise<void> => {
    try {
      const journeyIndex = journeys.findIndex(j => j.journeyId === journeyId);
      if (journeyIndex === -1) throw new Error('Journey not found');

      const updatedJourneys = [...journeys];
      await UserJourneyTrackingEngine.recordInteraction(updatedJourneys[journeyIndex], interactionData);
      
      setJourneys(updatedJourneys);
      if (activeJourney?.journeyId === journeyId) {
        setActiveJourney(updatedJourneys[journeyIndex]);
      }
      await AsyncStorage.setItem('@user_journeys', JSON.stringify(updatedJourneys));
    } catch (err) {
      setError('Failed to record interaction');
      console.error('Interaction recording error:', err);
      throw err;
    }
  }, [journeys, activeJourney]);

  const recordConversion = useCallback(async (
    journeyId: string,
    conversionData: Omit<JourneyConversion, 'conversionId' | 'timestamp'>
  ): Promise<void> => {
    try {
      const journeyIndex = journeys.findIndex(j => j.journeyId === journeyId);
      if (journeyIndex === -1) throw new Error('Journey not found');

      const updatedJourneys = [...journeys];
      await UserJourneyTrackingEngine.recordConversion(updatedJourneys[journeyIndex], conversionData);
      
      setJourneys(updatedJourneys);
      if (activeJourney?.journeyId === journeyId) {
        setActiveJourney(updatedJourneys[journeyIndex]);
      }
      await AsyncStorage.setItem('@user_journeys', JSON.stringify(updatedJourneys));
    } catch (err) {
      setError('Failed to record conversion');
      console.error('Conversion recording error:', err);
      throw err;
    }
  }, [journeys, activeJourney]);

  const recordDropoff = useCallback(async (
    journeyId: string,
    dropoffData: Omit<JourneyDropoff, 'dropoffId' | 'timestamp'>
  ): Promise<void> => {
    try {
      const journeyIndex = journeys.findIndex(j => j.journeyId === journeyId);
      if (journeyIndex === -1) throw new Error('Journey not found');

      const updatedJourneys = [...journeys];
      await UserJourneyTrackingEngine.recordDropoff(updatedJourneys[journeyIndex], dropoffData);
      
      setJourneys(updatedJourneys);
      if (activeJourney?.journeyId === journeyId) {
        setActiveJourney(updatedJourneys[journeyIndex]);
      }
      await AsyncStorage.setItem('@user_journeys', JSON.stringify(updatedJourneys));
    } catch (err) {
      setError('Failed to record dropoff');
      console.error('Dropoff recording error:', err);
      throw err;
    }
  }, [journeys, activeJourney]);

  const completeJourney = useCallback(async (
    journeyId: string,
    outcome: string,
    insights?: any
  ): Promise<void> => {
    try {
      const journeyIndex = journeys.findIndex(j => j.journeyId === journeyId);
      if (journeyIndex === -1) throw new Error('Journey not found');

      const updatedJourneys = [...journeys];
      await UserJourneyTrackingEngine.completeJourney(updatedJourneys[journeyIndex], outcome, insights);
      
      setJourneys(updatedJourneys);
      if (activeJourney?.journeyId === journeyId) {
        setActiveJourney(null);
      }
      await AsyncStorage.setItem('@user_journeys', JSON.stringify(updatedJourneys));
    } catch (err) {
      setError('Failed to complete journey');
      console.error('Journey completion error:', err);
      throw err;
    }
  }, [journeys, activeJourney]);

  const getJourneyAnalytics = useCallback((journeyId: string): JourneyAnalytics => {
    const journey = journeys.find(j => j.journeyId === journeyId);
    if (!journey) {
      throw new Error('Journey not found');
    }
    return UserJourneyTrackingEngine.getJourneyAnalytics(journey);
  }, [journeys]);

  const getUserJourneys = useCallback((userId: string, filters?: JourneyFilters): UserJourney[] => {
    let userJourneys = journeys.filter(j => j.userId === userId);
    
    if (filters) {
      if (filters.journeyType) {
        userJourneys = userJourneys.filter(j => j.journeyType === filters.journeyType);
      }
      if (filters.status) {
        userJourneys = userJourneys.filter(j => j.status === filters.status);
      }
      if (filters.dateRange) {
        userJourneys = userJourneys.filter(j => {
          const journeyDate = new Date(j.startTime);
          return journeyDate >= new Date(filters.dateRange.start) && journeyDate <= new Date(filters.dateRange.end);
        });
      }
    }
    
    return userJourneys.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [journeys]);

  const getJourneyFlows = useCallback((flowType?: string): JourneyFlow[] => {
    const allFlows = journeys.flatMap(j => j.flows);
    
    if (flowType) {
      return allFlows.filter(f => f.flowType === flowType);
    }
    
    return allFlows;
  }, [journeys]);

  const getJourneyInsights = useCallback((timeframe?: string): JourneyInsights => {
    // Aggregate insights across all journeys
    const allPatterns: JourneyPattern[] = [];
    const allAnomalies: JourneyAnomaly[] = [];
    const allOpportunities: JourneyOpportunity[] = [];
    const allRecommendations: JourneyRecommendation[] = [];
    const allPredictions: JourneyPrediction[] = [];
    const allSegments: UserSegment[] = [];

    journeys.forEach(journey => {
      allPatterns.push(...journey.insights.patterns);
      allAnomalies.push(...journey.insights.anomalies);
      allOpportunities.push(...journey.insights.opportunities);
      allRecommendations.push(...journey.insights.recommendations);
      allPredictions.push(...journey.insights.predictions);
      allSegments.push(...journey.insights.segments);
    });

    return {
      patterns: allPatterns,
      anomalies: allAnomalies,
      opportunities: allOpportunities,
      recommendations: allRecommendations,
      predictions: allPredictions,
      segments: allSegments,
    };
  }, [journeys]);

  const analyzeUserPaths = useCallback((userId: string): PathAnalysis => {
    const userJourneys = getUserJourneys(userId);
    return UserJourneyTrackingEngine.analyzeUserPaths(userId, userJourneys);
  }, [getUserJourneys]);

  const exportJourneyData = useCallback(async (format: 'json' | 'csv'): Promise<string> => {
    const exportData = {
      journeys,
      insights: getJourneyInsights(),
      exportedAt: new Date().toISOString(),
      format,
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }, [journeys, getJourneyInsights]);

  const optimizeJourney = useCallback((journeyId: string): OptimizationPlan => {
    const journey = journeys.find(j => j.journeyId === journeyId);
    if (!journey) {
      throw new Error('Journey not found');
    }
    return UserJourneyTrackingEngine.optimizeJourney(journey);
  }, [journeys]);

  return (
    <UserJourneyContext.Provider
      value={{
        journeys,
        activeJourney,
        loading,
        error,
        startJourney,
        recordTouchpoint,
        recordInteraction,
        recordConversion,
        recordDropoff,
        completeJourney,
        getJourneyAnalytics,
        getUserJourneys,
        getJourneyFlows,
        getJourneyInsights,
        analyzeUserPaths,
        exportJourneyData,
        optimizeJourney,
      }}
    >
      {children}
    </UserJourneyContext.Provider>
  );
};

export const useUserJourney = (): UserJourneyContextType => {
  const context = useContext(UserJourneyContext);
  if (!context) {
    throw new Error('useUserJourney must be used within a UserJourneyProvider');
  }
  return context;
};

export default {
  UserJourneyProvider,
  useUserJourney,
  UserJourneyTrackingEngine,
};
