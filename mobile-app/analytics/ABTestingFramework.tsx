import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';

// A/B testing types
export interface ABTest {
  testId: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  type: 'feature' | 'ui' | 'content' | 'pricing' | 'algorithm' | 'onboarding';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string;
  endDate?: string;
  targetAudience: TargetAudience;
  variants: TestVariant[];
  metrics: TestMetrics;
  hypothesis: string;
  confidence: number; // 0-100
  sampleSize: number;
  duration: number; // in days
  traffic: TrafficAllocation;
  results: TestResults;
  insights: TestInsight[];
  recommendations: TestRecommendation[];
}

export interface TargetAudience {
  criteria: AudienceCriteria[];
  segments: AudienceSegment[];
  percentage: number; // 0-100
  filters: AudienceFilter[];
  exclusions: AudienceExclusion[];
}

export interface AudienceCriteria {
  criterion: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
  weight: number; // 0-1
  type: 'demographic' | 'behavioral' | 'technical' | 'contextual';
}

export interface AudienceSegment {
  segmentId: string;
  name: string;
  description: string;
  size: number;
  characteristics: SegmentCharacteristic[];
  behavior: SegmentBehavior[];
  value: SegmentValue;
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

export interface SegmentValue {
  acquisitionCost: number;
  lifetimeValue: number;
  revenue: number;
  profitability: number;
}

export interface AudienceFilter {
  filter: string;
  type: 'include' | 'exclude';
  condition: string;
  value: any;
}

export interface AudienceExclusion {
  exclusion: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
}

export interface TestVariant {
  variantId: string;
  name: string;
  description: string;
  type: 'control' | 'treatment';
  weight: number; // 0-1
  traffic: number; // 0-100
  configuration: VariantConfiguration;
  implementation: VariantImplementation;
  performance: VariantPerformance;
}

export interface VariantConfiguration {
  features: FeatureConfig[];
  ui: UIConfig;
  content: ContentConfig;
  algorithm: AlgorithmConfig;
  pricing: PricingConfig;
  parameters: ConfigParameter[];
}

export interface FeatureConfig {
  feature: string;
  enabled: boolean;
  configuration: any;
  dependencies: string[];
}

export interface UIConfig {
  layout: string;
  components: UIComponent[];
  styling: UIStyling;
  interactions: UIInteraction[];
}

export interface UIComponent {
  component: string;
  properties: ComponentProperty[];
  position: ComponentPosition;
  visibility: boolean;
}

export interface ComponentProperty {
  property: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export interface ComponentPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface UIStyling {
  colors: ColorScheme;
  fonts: FontScheme;
  spacing: SpacingScheme;
  animations: AnimationScheme;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface FontScheme {
  primary: FontConfig;
  secondary: FontConfig;
  tertiary: FontConfig;
}

export interface FontConfig {
  family: string;
  size: number;
  weight: string;
  style: string;
}

export interface SpacingScheme {
  small: number;
  medium: number;
  large: number;
  xlarge: number;
}

export interface AnimationScheme {
  duration: number;
  easing: string;
  delay: number;
}

export interface UIInteraction {
  interaction: string;
  trigger: string;
  action: string;
  feedback: string;
}

export interface ContentConfig {
  content: string;
  media: MediaConfig[];
  structure: ContentStructure;
  personalization: ContentPersonalization[];
}

export interface MediaConfig {
  type: 'image' | 'video' | 'audio' | 'animation';
  url: string;
  properties: MediaProperty[];
}

export interface MediaProperty {
  property: string;
  value: any;
}

export interface ContentStructure {
  sections: ContentSection[];
  hierarchy: string[];
  flow: string;
}

export interface ContentSection {
  sectionId: string;
  type: string;
  content: string;
  order: number;
  visibility: boolean;
}

export interface ContentPersonalization {
  aspect: string;
  rule: string;
  condition: string;
  adaptation: string;
}

export interface AlgorithmConfig {
  algorithm: string;
  parameters: AlgorithmParameter[];
  logic: string;
  optimization: string;
}

export interface AlgorithmParameter {
  parameter: string;
  value: any;
  type: 'number' | 'string' | 'boolean' | 'array' | 'object';
  range?: [number, number];
}

export interface PricingConfig {
  pricing: string;
  tiers: PricingTier[];
  discounts: DiscountConfig[];
  currency: string;
}

export interface PricingTier {
  tier: string;
  price: number;
  features: string[];
  limitations: string[];
}

export interface DiscountConfig {
  type: string;
  value: number;
  conditions: string[];
  duration: string;
}

export interface ConfigParameter {
  parameter: string;
  value: any;
  type: 'number' | 'string' | 'boolean' | 'array' | 'object';
  category: string;
}

export interface VariantImplementation {
  code: string;
  assets: AssetConfig[];
  dependencies: DependencyConfig[];
  deployment: DeploymentConfig;
  testing: TestingConfig;
}

export interface AssetConfig {
  asset: string;
  type: 'image' | 'video' | 'audio' | 'font' | 'icon';
  url: string;
  version: string;
  cache: boolean;
}

export interface DependencyConfig {
  dependency: string;
  version: string;
  type: 'library' | 'service' | 'api' | 'component';
  optional: boolean;
}

export interface DeploymentConfig {
  environment: string;
  servers: string[];
  regions: string[];
  rollout: RolloutConfig;
}

export interface RolloutConfig {
  strategy: 'immediate' | 'gradual' | 'canary' | 'blue_green';
  percentage: number;
  duration: string;
  criteria: string[];
}

export interface TestingConfig {
  unit: boolean;
  integration: boolean;
  e2e: boolean;
  performance: boolean;
  security: boolean;
}

export interface VariantPerformance {
  metrics: PerformanceMetric[];
  quality: QualityMetric[];
  stability: StabilityMetric[];
  userFeedback: UserFeedbackMetric[];
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  benchmark: number;
  percentile: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface QualityMetric {
  metric: string;
  score: number; // 0-100
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityIssue {
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fix: string;
}

export interface StabilityMetric {
  metric: string;
  value: number;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  incidents: StabilityIncident[];
}

export interface StabilityIncident {
  incidentId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  description: string;
  resolution?: string;
}

export interface UserFeedbackMetric {
  metric: string;
  score: number; // 0-100
  feedback: UserFeedback[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface UserFeedback {
  feedbackId: string;
  rating: number; // 1-5
  comment: string;
  timestamp: string;
  context: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface TrafficAllocation {
  strategy: 'equal' | 'weighted' | 'adaptive' | 'sequential';
  allocation: TrafficAllocationEntry[];
  rules: AllocationRule[];
  adjustments: TrafficAdjustment[];
}

export interface TrafficAllocationEntry {
  variantId: string;
  percentage: number; // 0-100
  conditions: AllocationCondition[];
  priority: number;
}

export interface AllocationCondition {
  condition: string;
  value: any;
  operator: string;
}

export interface AllocationRule {
  rule: string;
  condition: string;
  action: string;
  priority: number;
}

export interface TrafficAdjustment {
  adjustmentId: string;
  type: 'increase' | 'decrease' | 'pause' | 'stop';
  variantId: string;
  reason: string;
  timestamp: string;
  oldValue: number;
  newValue: number;
}

export interface TestMetrics {
  primary: PrimaryMetric[];
  secondary: SecondaryMetric[];
  guardrail: GuardrailMetric[];
  custom: CustomMetric[];
}

export interface PrimaryMetric {
  metric: string;
  description: string;
  type: 'conversion' | 'engagement' | 'revenue' | 'retention' | 'satisfaction';
  target: string;
  successCriteria: string;
  measurement: string;
}

export interface SecondaryMetric {
  metric: string;
  description: string;
  type: 'behavioral' | 'technical' | 'business' | 'user_experience';
  importance: 'low' | 'medium' | 'high';
  target: string;
  measurement: string;
}

export interface GuardrailMetric {
  metric: string;
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  action: 'stop_test' | 'alert' | 'adjust_traffic';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CustomMetric {
  metric: string;
  description: string;
  calculation: string;
  target: string;
  measurement: string;
}

export interface TestResults {
  summary: ResultSummary;
  variantComparison: VariantComparison;
  statisticalAnalysis: StatisticalAnalysis;
  businessImpact: BusinessImpact;
  userImpact: UserImpact;
  technicalImpact: TechnicalImpact;
  recommendations: ResultRecommendation[];
}

export interface ResultSummary {
  status: 'inconclusive' | 'significant' | 'no_significant_difference';
  winner: string;
  confidence: number; // 0-100
  significance: number; // p-value
  power: number; // statistical power
  sampleSize: number;
  duration: number;
  reliability: number; // 0-100
}

export interface VariantComparison {
  variants: VariantResult[];
  comparisons: VariantComparisonEntry[];
  improvements: VariantImprovement[];
  tradeoffs: VariantTradeoff[];
}

export interface VariantResult {
  variantId: string;
  name: string;
  metrics: VariantMetricResult[];
  performance: VariantPerformanceResult[];
  quality: VariantQualityResult[];
  userFeedback: VariantFeedbackResult[];
}

export interface VariantMetricResult {
  metric: string;
  value: number;
  change: number; // percentage change from baseline
  significance: boolean;
  confidence: number; // 0-100
  interpretation: string;
}

export interface VariantPerformanceResult {
  metric: string;
  value: number;
  baseline: number;
  change: number;
  significance: boolean;
  interpretation: string;
}

export interface VariantQualityResult {
  metric: string;
  score: number;
  baseline: number;
  change: number;
  issues: string[];
  improvements: string[];
}

export interface VariantFeedbackResult {
  metric: string;
  score: number;
  baseline: number;
  change: number;
  feedback: string[];
  sentiment: string;
}

export interface VariantComparisonEntry {
  variantA: string;
  variantB: string;
  metric: string;
  difference: number;
  significance: boolean;
  confidence: number;
  winner: string;
}

export interface VariantImprovement {
  variant: string;
  metric: string;
  improvement: number;
  significance: boolean;
  impact: string;
}

export interface VariantTradeoff {
  variant: string;
  improvements: string[];
  regressions: string[];
  netImpact: string;
  recommendation: string;
}

export interface StatisticalAnalysis {
  tests: StatisticalTest[];
  assumptions: StatisticalAssumption[];
  validity: ValidityCheck[];
  power: PowerAnalysis[];
  effectSize: EffectSize[];
}

export interface StatisticalTest {
  test: string;
  statistic: number;
  pValue: number;
  confidence: number;
  interpretation: string;
  assumptions: string[];
}

export interface StatisticalAssumption {
  assumption: string;
  met: boolean;
  impact: 'low' | 'medium' | 'high';
  description: string;
}

export interface ValidityCheck {
  check: string;
  result: 'passed' | 'failed' | 'warning';
  description: string;
  impact: string;
}

export interface PowerAnalysis {
  metric: string;
  power: number;
  sampleSize: number;
  effectSize: number;
  significance: number;
  interpretation: string;
}

export interface EffectSize {
  metric: string;
  size: number;
  magnitude: 'small' | 'medium' | 'large';
  interpretation: string;
}

export interface BusinessImpact {
  revenue: RevenueImpact;
  costs: CostImpact;
  roi: ROIImpact;
  strategic: StrategicImpact;
}

export interface RevenueImpact {
  current: number;
  projected: number;
  change: number;
  confidence: number;
  timeframe: string;
}

export interface CostImpact {
  implementation: number;
  maintenance: number;
  opportunity: number;
  total: number;
  change: number;
}

export interface ROIImpact {
  current: number;
  projected: number;
  change: number;
  paybackPeriod: number;
  confidence: number;
}

export interface StrategicImpact {
  goals: string[];
  alignment: number; // 0-100
  competitive: string[];
  market: string[];
}

export interface UserImpact {
  experience: ExperienceImpact;
  behavior: BehaviorImpact;
  satisfaction: SatisfactionImpact;
  segmentation: SegmentationImpact;
}

export interface ExperienceImpact {
  usability: number;
  satisfaction: number;
  engagement: number;
  retention: number;
  feedback: string[];
}

export interface BehaviorImpact {
  patterns: BehaviorPattern[];
  changes: BehaviorChange[];
  adoption: AdoptionRate[];
}

export interface BehaviorPattern {
  pattern: string;
  frequency: string;
  change: string;
  significance: string;
}

export interface BehaviorChange {
  behavior: string;
  from: string;
  to: string;
  magnitude: number;
  significance: string;
}

export interface AdoptionRate {
  feature: string;
  current: number;
  projected: number;
  change: number;
  timeline: string;
}

export interface SatisfactionImpact {
  overall: number;
  nps: number;
  csat: number;
  feedback: string[];
  sentiment: string;
}

export interface SegmentationImpact {
  segments: SegmentImpact[];
  changes: SegmentChange[];
  opportunities: SegmentOpportunity[];
}

export interface SegmentImpact {
  segment: string;
  impact: string;
  magnitude: number;
  significance: string;
}

export interface SegmentChange {
  segment: string;
  metric: string;
  change: number;
  significance: string;
}

export interface SegmentOpportunity {
  segment: string;
  opportunity: string;
  potential: number;
  effort: string;
}

export interface TechnicalImpact {
  performance: PerformanceImpact;
  stability: StabilityImpact;
  scalability: ScalabilityImpact;
  maintenance: MaintenanceImpact;
}

export interface PerformanceImpact {
  loadTime: number;
  responseTime: number;
  throughput: number;
  memory: number;
  cpu: number;
  change: string;
}

export interface StabilityImpact {
  errors: number;
  crashes: number;
  uptime: number;
  incidents: number;
  change: string;
}

export interface ScalabilityImpact {
  users: number;
  requests: number;
  data: number;
  change: string;
}

export interface MaintenanceImpact {
  complexity: number;
  effort: number;
  cost: number;
  risk: string;
  change: string;
}

export interface ResultRecommendation {
  recommendationId: string;
  type: 'implement' | 'iterate' | 'abandon' | 'extend';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  expectedImpact: string;
  implementation: ImplementationPlan;
  risks: string[];
  timeline: string;
  cost: number;
  roi: number;
}

export interface ImplementationPlan {
  steps: ImplementationStep[];
  resources: string[];
  dependencies: string[];
  timeline: string;
  budget: number;
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

export interface TestInsight {
  insightId: string;
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk' | 'learning';
  category: string;
  title: string;
  description: string;
  impact: string;
  confidence: number; // 0-100
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: InsightData[];
  recommendations: string[];
}

export interface InsightData {
  metric: string;
  value: number;
  baseline: number;
  change: number;
  significance: string;
}

export interface TestRecommendation {
  recommendationId: string;
  category: 'design' | 'implementation' | 'measurement' | 'strategy';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  rationale: string;
  expectedImpact: string;
  implementation: ImplementationPlan;
  successMetrics: string[];
  cost: number;
  roi: number;
  timeline: string;
}

// A/B testing context
interface ABTestingContextType {
  tests: ABTest[];
  activeTests: ABTest[];
  loading: boolean;
  error: string | null;
  createTest: (test: Omit<ABTest, 'testId' | 'status' | 'startDate'>) => Promise<ABTest>;
  updateTest: (testId: string, updates: Partial<ABTest>) => Promise<void>;
  deleteTest: (testId: string) => Promise<void>;
  getTest: (testId: string) => ABTest | null;
  getTests: (filters?: TestFilters) => ABTest[];
  getActiveTests: () => ABTest[];
  getTestResults: (testId: string) => TestResults;
  startTest: (testId: string) => Promise<void>;
  pauseTest: (testId: string) => Promise<void>;
  resumeTest: (testId: string) => Promise<void>;
  stopTest: (testId: string) => Promise<void>;
  getVariant: (userId: string, testId: string) => TestVariant | null;
  recordEvent: (userId: string, testId: string, variantId: string, event: TestEvent) => Promise<void>;
  analyzeTest: (testId: string) => Promise<TestResults>;
  getTestInsights: (testId: string) => TestInsight[];
  getTestRecommendations: (testId: string) => TestRecommendation[];
  exportTestData: (testId: string, format: 'json' | 'csv') => Promise<string>;
}

export interface TestFilters {
  status?: ABTest['status'];
  type?: ABTest['type'];
  priority?: ABTest['priority'];
  dateRange?: { start: string; end: string };
  targetAudience?: string;
}

export interface TestEvent {
  eventId: string;
  type: string;
  timestamp: string;
  properties: EventProperty[];
  value?: number;
  context: EventContext;
}

export interface EventProperty {
  property: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export interface EventContext {
  screen: string;
  component: string;
  userState: string;
  session: string;
  device: string;
}

// A/B testing engine
class ABTestingEngine {
  static async createTest(testData: Omit<ABTest, 'testId' | 'status' | 'startDate'>): Promise<ABTest> {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startDate = new Date().toISOString();
    const status: ABTest['status'] = 'draft';

    const test: ABTest = {
      ...testData,
      testId,
      status,
      startDate,
      results: this.initializeTestResults(),
      insights: [],
      recommendations: [],
    };

    return test;
  }

  static initializeTestResults(): TestResults {
    return {
      summary: {
        status: 'inconclusive',
        winner: '',
        confidence: 0,
        significance: 1.0,
        power: 0,
        sampleSize: 0,
        duration: 0,
        reliability: 0,
      },
      variantComparison: {
        variants: [],
        comparisons: [],
        improvements: [],
        tradeoffs: [],
      },
      statisticalAnalysis: {
        tests: [],
        assumptions: [],
        validity: [],
        power: [],
        effectSize: [],
      },
      businessImpact: {
        revenue: {
          current: 0,
          projected: 0,
          change: 0,
          confidence: 0,
          timeframe: '',
        },
        costs: {
          implementation: 0,
          maintenance: 0,
          opportunity: 0,
          total: 0,
          change: 0,
        },
        roi: {
          current: 0,
          projected: 0,
          change: 0,
          paybackPeriod: 0,
          confidence: 0,
        },
        strategic: {
          goals: [],
          alignment: 0,
          competitive: [],
          market: [],
        },
      },
      userImpact: {
        experience: {
          usability: 0,
          satisfaction: 0,
          engagement: 0,
          retention: 0,
          feedback: [],
        },
        behavior: {
          patterns: [],
          changes: [],
          adoption: [],
        },
        satisfaction: {
          overall: 0,
          nps: 0,
          csat: 0,
          feedback: [],
          sentiment: '',
        },
        segmentation: {
          segments: [],
          changes: [],
          opportunities: [],
        },
      },
      technicalImpact: {
        performance: {
          loadTime: 0,
          responseTime: 0,
          throughput: 0,
          memory: 0,
          cpu: 0,
          change: '',
        },
        stability: {
          errors: 0,
          crashes: 0,
          uptime: 0,
          incidents: 0,
          change: '',
        },
        scalability: {
          users: 0,
          requests: 0,
          data: 0,
          change: '',
        },
        maintenance: {
          complexity: 0,
          effort: 0,
          cost: 0,
          risk: '',
          change: '',
        },
      },
      recommendations: [],
    };
  }

  static async startTest(test: ABTest): Promise<void> {
    test.status = 'running';
    
    // Initialize variant traffic allocation
    await this.initializeTrafficAllocation(test);
    
    // Start collecting data
    await this.startDataCollection(test);
  }

  static async initializeTrafficAllocation(test: ABTest): Promise<void> {
    // Implement traffic allocation logic
    test.traffic.allocation = test.variants.map((variant, index) => ({
      variantId: variant.variantId,
      percentage: variant.weight * 100,
      conditions: [],
      priority: index + 1,
    }));
  }

  static async startDataCollection(test: ABTest): Promise<void> {
    // Initialize data collection for the test
    console.log(`Starting data collection for test: ${test.testId}`);
  }

  static async pauseTest(test: ABTest): Promise<void> {
    test.status = 'paused';
    // Pause data collection
    console.log(`Pausing test: ${test.testId}`);
  }

  static async resumeTest(test: ABTest): Promise<void> {
    test.status = 'running';
    // Resume data collection
    console.log(`Resuming test: ${test.testId}`);
  }

  static async stopTest(test: ABTest): Promise<void> {
    test.status = 'completed';
    test.endDate = new Date().toISOString();
    
    // Stop data collection and analyze results
    await this.analyzeTestResults(test);
  }

  static async analyzeTestResults(test: ABTest): Promise<void> {
    // Mock implementation - would analyze actual test results
    test.results.summary.status = 'significant';
    test.results.summary.winner = test.variants[0].variantId;
    test.results.summary.confidence = 85;
    test.results.summary.significance = 0.05;
    test.results.summary.power = 0.8;
    test.results.summary.sampleSize = 1000;
    test.results.summary.duration = 30;
    test.results.summary.reliability = 90;

    // Generate insights
    test.insights = await this.generateTestInsights(test);
    
    // Generate recommendations
    test.recommendations = await this.generateTestRecommendations(test);
  }

  static async generateTestInsights(test: ABTest): Promise<TestInsight[]> {
    const insights: TestInsight[] = [];

    // Add insights based on test results
    if (test.results.summary.status === 'significant') {
      insights.push({
        insightId: `insight_${test.testId}_1`,
        type: 'pattern',
        category: 'performance',
        title: 'Significant Performance Improvement',
        description: 'Test variant shows statistically significant improvement',
        impact: 'Positive impact on key metrics',
        confidence: 85,
        actionable: true,
        priority: 'high',
        data: [
          {
            metric: 'conversion_rate',
            value: 15,
            baseline: 10,
            change: 50,
            significance: 'high',
          },
        ],
        recommendations: [
          'Implement winning variant',
          'Monitor performance post-launch',
          'Consider further optimization',
        ],
      });
    }

    return insights;
  }

  static async generateTestRecommendations(test: ABTest): Promise<TestRecommendation[]> {
    const recommendations: TestRecommendation[] = [];

    if (test.results.summary.status === 'significant') {
      recommendations.push({
        recommendationId: `rec_${test.testId}_1`,
        category: 'implementation',
        priority: 'high',
        title: 'Implement Winning Variant',
        description: 'Roll out the winning variant to all users',
        rationale: 'Statistically significant improvement in key metrics',
        expectedImpact: '15% increase in conversion rate',
        implementation: {
          steps: [
            {
              step: 1,
              action: 'Prepare deployment',
              description: 'Prepare winning variant for full deployment',
              owner: 'Engineering Team',
              timeline: '1_week',
              deliverables: ['Deployment package'],
              acceptanceCriteria: ['Variant ready for deployment'],
            },
          ],
          resources: ['Engineering Team', 'QA Team', 'DevOps'],
          dependencies: ['Test completion', 'Stakeholder approval'],
          timeline: '2_weeks',
          budget: 10000,
          successCriteria: ['Successful deployment', 'No regressions'],
        },
        successMetrics: ['Conversion rate', 'User satisfaction', 'Revenue'],
        cost: 10000,
        roi: 150,
        timeline: '2_weeks',
      });
    }

    return recommendations;
  }

  static getVariant(userId: string, testId: string, tests: ABTest[]): TestVariant | null {
    const test = tests.find(t => t.testId === testId);
    if (!test || test.status !== 'running') {
      return null;
    }

    // Simple hash-based assignment for demo
    const hash = this.hashUserId(userId);
    const cumulativeWeight = 0;
    
    for (const variant of test.variants) {
      if (hash < cumulativeWeight + variant.weight) {
        return variant;
      }
    }

    return test.variants[0]; // Fallback to first variant
  }

  static hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  static async recordEvent(
    userId: string,
    testId: string,
    variantId: string,
    event: TestEvent
  ): Promise<void> {
    // Record event for analysis
    console.log(`Recording event for test ${testId}, variant ${variantId}, user ${userId}`);
  }

  static async analyzeTest(test: ABTest): Promise<TestResults> {
    // Mock implementation - would analyze actual test data
    return test.results;
  }

  static async getTestInsights(testId: string, tests: ABTest[]): Promise<TestInsight[]> {
    const test = tests.find(t => t.testId === testId);
    if (!test) {
      throw new Error('Test not found');
    }
    return test.insights;
  }

  static async getTestRecommendations(testId: string, tests: ABTest[]): Promise<TestRecommendation[]> {
    const test = tests.find(t => t.testId === testId);
    if (!test) {
      throw new Error('Test not found');
    }
    return test.recommendations;
  }

  static async exportTestData(testId: string, tests: ABTest[], format: 'json' | 'csv'): Promise<string> {
    const test = tests.find(t => t.testId === testId);
    if (!test) {
      throw new Error('Test not found');
    }

    const exportData = {
      test,
      results: test.results,
      insights: test.insights,
      recommendations: test.recommendations,
      exportedAt: new Date().toISOString(),
      format,
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// A/B testing provider
export const ABTestingProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved tests
  useEffect(() => {
    const loadTests = async () => {
      try {
        setLoading(true);
        const savedTests = await AsyncStorage.getItem('@ab_tests');
        
        if (savedTests) {
          setTests(JSON.parse(savedTests));
        }
      } catch (err) {
        setError('Failed to load A/B tests');
        console.error('Tests loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, []);

  const createTest = useCallback(async (testData: Omit<ABTest, 'testId' | 'status' | 'startDate'>): Promise<ABTest> => {
    try {
      const newTest = await ABTestingEngine.createTest(testData);
      
      const updatedTests = [...tests, newTest];
      setTests(updatedTests);
      await AsyncStorage.setItem('@ab_tests', JSON.stringify(updatedTests));

      return newTest;
    } catch (err) {
      setError('Failed to create A/B test');
      console.error('Test creation error:', err);
      throw err;
    }
  }, [tests]);

  const updateTest = useCallback(async (testId: string, updates: Partial<ABTest>): Promise<void> => {
    try {
      const testIndex = tests.findIndex(t => t.testId === testId);
      if (testIndex === -1) throw new Error('Test not found');

      const updatedTests = [...tests];
      updatedTests[testIndex] = { ...updatedTests[testIndex], ...updates };
      
      setTests(updatedTests);
      await AsyncStorage.setItem('@ab_tests', JSON.stringify(updatedTests));
    } catch (err) {
      setError('Failed to update A/B test');
      console.error('Test update error:', err);
      throw err;
    }
  }, [tests]);

  const deleteTest = useCallback(async (testId: string): Promise<void> => {
    try {
      const updatedTests = tests.filter(t => t.testId !== testId);
      setTests(updatedTests);
      await AsyncStorage.setItem('@ab_tests', JSON.stringify(updatedTests));
    } catch (err) {
      setError('Failed to delete A/B test');
      console.error('Test deletion error:', err);
      throw err;
    }
  }, [tests]);

  const getTest = useCallback((testId: string): ABTest | null => {
    return tests.find(t => t.testId === testId) || null;
  }, [tests]);

  const getTests = useCallback((filters?: TestFilters): ABTest[] => {
    let filteredTests = tests;
    
    if (filters) {
      if (filters.status) {
        filteredTests = filteredTests.filter(t => t.status === filters.status);
      }
      if (filters.type) {
        filteredTests = filteredTests.filter(t => t.type === filters.type);
      }
      if (filters.priority) {
        filteredTests = filteredTests.filter(t => t.priority === filters.priority);
      }
      if (filters.dateRange) {
        filteredTests = filteredTests.filter(t => {
          const testDate = new Date(t.startDate);
          return testDate >= new Date(filters.dateRange.start) && testDate <= new Date(filters.dateRange.end);
        });
      }
    }
    
    return filteredTests.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [tests]);

  const getActiveTests = useCallback((): ABTest[] => {
    return tests.filter(t => t.status === 'running');
  }, [tests]);

  const getTestResults = useCallback((testId: string): TestResults => {
    const test = getTest(testId);
    if (!test) {
      throw new Error('Test not found');
    }
    return test.results;
  }, [getTest]);

  const startTest = useCallback(async (testId: string): Promise<void> => {
    try {
      const test = getTest(testId);
      if (!test) {
        throw new Error('Test not found');
      }
      
      await ABTestingEngine.startTest(test);
      await updateTest(testId, { status: 'running' });
    } catch (err) {
      setError('Failed to start A/B test');
      console.error('Test start error:', err);
      throw err;
    }
  }, [getTest, updateTest]);

  const pauseTest = useCallback(async (testId: string): Promise<void> => {
    try {
      const test = getTest(testId);
      if (!test) {
        throw new Error('Test not found');
      }
      
      await ABTestingEngine.pauseTest(test);
      await updateTest(testId, { status: 'paused' });
    } catch (err) {
      setError('Failed to pause A/B test');
      console.error('Test pause error:', err);
      throw err;
    }
  }, [getTest, updateTest]);

  const resumeTest = useCallback(async (testId: string): Promise<void> => {
    try {
      const test = getTest(testId);
      if (!test) {
        throw new Error('Test not found');
      }
      
      await ABTestingEngine.resumeTest(test);
      await updateTest(testId, { status: 'running' });
    } catch (err) {
      setError('Failed to resume A/B test');
      console.error('Test resume error:', err);
      throw err;
    }
  }, [getTest, updateTest]);

  const stopTest = useCallback(async (testId: string): Promise<void> => {
    try {
      const test = getTest(testId);
      if (!test) {
        throw new Error('Test not found');
      }
      
      await ABTestingEngine.stopTest(test);
      await updateTest(testId, { 
        status: 'completed',
        endDate: new Date().toISOString(),
        results: test.results,
        insights: test.insights,
        recommendations: test.recommendations
      });
    } catch (err) {
      setError('Failed to stop A/B test');
      console.error('Test stop error:', err);
      throw err;
    }
  }, [getTest, updateTest]);

  const getVariant = useCallback((userId: string, testId: string): TestVariant | null => {
    return ABTestingEngine.getVariant(userId, testId, tests);
  }, [tests]);

  const recordEvent = useCallback(async (
    userId: string,
    testId: string,
    variantId: string,
    event: TestEvent
  ): Promise<void> => {
    try {
      await ABTestingEngine.recordEvent(userId, testId, variantId, event);
    } catch (err) {
      setError('Failed to record A/B test event');
      console.error('Event recording error:', err);
      throw err;
    }
  }, []);

  const analyzeTest = useCallback(async (testId: string): Promise<TestResults> => {
    try {
      const test = getTest(testId);
      if (!test) {
        throw new Error('Test not found');
      }
      
      const results = await ABTestingEngine.analyzeTest(test);
      await updateTest(testId, { results });
      
      return results;
    } catch (err) {
      setError('Failed to analyze A/B test');
      console.error('Test analysis error:', err);
      throw err;
    }
  }, [getTest, updateTest]);

  const getTestInsights = useCallback((testId: string): Promise<TestInsight[]> => {
    return ABTestingEngine.getTestInsights(testId, tests);
  }, [tests]);

  const getTestRecommendations = useCallback((testId: string): Promise<TestRecommendation[]> => {
    return ABTestingEngine.getTestRecommendations(testId, tests);
  }, [tests]);

  const exportTestData = useCallback(async (testId: string, format: 'json' | 'csv'): Promise<string> => {
    try {
      return await ABTestingEngine.exportTestData(testId, tests, format);
    } catch (err) {
      setError('Failed to export A/B test data');
      console.error('Test data export error:', err);
      throw err;
    }
  }, [tests]);

  return (
    <ABTestingContext.Provider
      value={{
        tests,
        activeTests: getActiveTests(),
        loading,
        error,
        createTest,
        updateTest,
        deleteTest,
        getTest,
        getTests,
        getActiveTests,
        getTestResults,
        startTest,
        pauseTest,
        resumeTest,
        stopTest,
        getVariant,
        recordEvent,
        analyzeTest,
        getTestInsights,
        getTestRecommendations,
        exportTestData,
      }}
    >
      {children}
    </ABTestingContext.Provider>
  );
};

export const useABTesting = (): ABTestingContextType => {
  const context = useContext(ABTestingContext);
  if (!context) {
    throw new Error('useABTesting must be used within an ABTestingProvider');
  }
  return context;
};

export default {
  ABTestingProvider,
  useABTesting,
  ABTestingEngine,
};
