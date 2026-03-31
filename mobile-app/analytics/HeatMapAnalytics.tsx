import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';

// Heat map analytics types
export interface HeatMapAnalytics {
  analyticsId: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  type: 'click' | 'scroll' | 'hover' | 'swipe' | 'pinch' | 'tap' | 'gesture';
  scope: 'screen' | 'component' | 'page' | 'flow' | 'global';
  data: HeatMapData;
  patterns: HeatMapPattern[];
  insights: HeatMapInsight[];
  recommendations: HeatMapRecommendation[];
  visualizations: HeatMapVisualization[];
}

export interface HeatMapData {
  interactions: HeatMapInteraction[];
  zones: HeatMapZone[];
  flows: HeatMapFlow[];
  sequences: HeatMapSequence[];
  clusters: HeatMapCluster[];
  anomalies: HeatMapAnomaly[];
  performance: HeatMapPerformance;
}

export interface HeatMapInteraction {
  interactionId: string;
  type: 'click' | 'scroll' | 'hover' | 'swipe' | 'pinch' | 'tap' | 'gesture';
  timestamp: string;
  coordinates: InteractionCoordinates;
  target: InteractionTarget;
  context: InteractionContext;
  duration: number;
  pressure?: number;
  velocity?: number;
  acceleration?: number;
  properties: InteractionProperty[];
}

export interface InteractionCoordinates {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  relative: boolean;
}

export interface InteractionTarget {
  element: string;
  component: string;
  selector: string;
  id: string;
  class: string;
  text?: string;
  attributes: TargetAttribute[];
}

export interface TargetAttribute {
  attribute: string;
  value: any;
  type: string;
}

export interface InteractionContext {
  screen: string;
  page: string;
  section: string;
  viewport: ViewportInfo;
  device: DeviceInfo;
  session: SessionInfo;
  user: UserInfo;
}

export interface ViewportInfo {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  zoom: number;
  orientation: 'portrait' | 'landscape';
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  platform: 'ios' | 'android' | 'web' | 'windows' | 'macos';
  browser?: string;
  version?: string;
  resolution: string;
  pixelRatio: number;
}

export interface SessionInfo {
  sessionId: string;
  startTime: string;
  duration: number;
  source: string;
  referrer?: string;
  campaign?: string;
}

export interface UserInfo {
  userId: string;
  segment: string;
  experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferences: UserPreference[];
  behavior: UserBehavior[];
}

export interface UserPreference {
  aspect: string;
  preference: string;
  strength: number; // 0-100
}

export interface UserBehavior {
  behavior: string;
  frequency: string;
  pattern: string;
  impact: string;
}

export interface InteractionProperty {
  property: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export interface HeatMapZone {
  zoneId: string;
  name: string;
  type: 'hot' | 'cold' | 'warm' | 'neutral';
  boundaries: ZoneBoundary;
  interactions: number;
  intensity: number; // 0-100
  density: number; // 0-100
  duration: number;
  conversion: number; // 0-100
  engagement: number; // 0-100
  elements: ZoneElement[];
  patterns: ZonePattern[];
}

export interface ZoneBoundary {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rectangle' | 'circle' | 'polygon' | 'irregular';
  points?: Point[];
}

export interface Point {
  x: number;
  y: number;
}

export interface ZoneElement {
  element: string;
  selector: string;
  interactions: number;
  clicks: number;
  hovers: number;
  scrolls: number;
  conversions: number;
  engagement: number; // 0-100
}

export interface ZonePattern {
  pattern: string;
  frequency: string;
  significance: 'low' | 'medium' | 'high';
  description: string;
}

export interface HeatMapFlow {
  flowId: string;
  name: string;
  type: 'linear' | 'branched' | 'circular' | 'complex';
  path: FlowPath[];
  start: FlowPoint;
  end: FlowPoint;
  duration: number;
  interactions: number;
  conversion: number; // 0-100
  dropoff: number; // 0-100
  efficiency: number; // 0-100
  bottlenecks: FlowBottleneck[];
}

export interface FlowPath {
  pointId: string;
  coordinates: Point;
  timestamp: string;
  action: string;
  target: string;
  duration: number;
}

export interface FlowPoint {
  pointId: string;
  coordinates: Point;
  element: string;
  action: string;
  timestamp: string;
}

export interface FlowBottleneck {
  pointId: string;
  element: string;
  type: 'delay' | 'confusion' | 'error' | 'dropoff';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  resolution: string[];
}

export interface HeatMapSequence {
  sequenceId: string;
  name: string;
  type: 'navigation' | 'interaction' | 'conversion' | 'exploration';
  steps: SequenceStep[];
  duration: number;
  completion: number; // 0-100
  success: number; // 0-100
  efficiency: number; // 0-100
  patterns: SequencePattern[];
}

export interface SequenceStep {
  stepId: string;
  order: number;
  action: string;
  target: string;
  coordinates: Point;
  timestamp: string;
  duration: number;
  success: boolean;
  error?: string;
}

export interface SequencePattern {
  pattern: string;
  frequency: string;
  significance: 'low' | 'medium' | 'high';
  description: string;
}

export interface HeatMapCluster {
  clusterId: string;
  name: string;
  type: 'geographic' | 'temporal' | 'behavioral' | 'semantic';
  center: Point;
  radius: number;
  density: number; // 0-100
  interactions: number;
  characteristics: ClusterCharacteristic[];
  patterns: ClusterPattern[];
}

export interface ClusterCharacteristic {
  characteristic: string;
  value: any;
  importance: number; // 0-100
}

export interface ClusterPattern {
  pattern: string;
  frequency: string;
  significance: 'low' | 'medium' | 'high';
  description: string;
}

export interface HeatMapAnomaly {
  anomalyId: string;
  type: 'unusual_behavior' | 'performance_issue' | 'ui_problem' | 'user_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: Point;
  timestamp: string;
  context: string;
  impact: string;
  frequency: number;
  resolution: string[];
}

export interface HeatMapPerformance {
  responsiveness: PerformanceMetric[];
  efficiency: PerformanceMetric[];
  accuracy: PerformanceMetric[];
  consistency: PerformanceMetric[];
  quality: PerformanceMetric[];
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  benchmark: number;
  percentile: number;
  trend: 'improving' | 'stable' | 'declining';
  significance: 'low' | 'medium' | 'high';
}

export interface HeatMapPattern {
  patternId: string;
  name: string;
  type: 'spatial' | 'temporal' | 'behavioral' | 'interaction' | 'conversion';
  description: string;
  frequency: number;
  intensity: number; // 0-100
  significance: 'low' | 'medium' | 'high';
  locations: Point[];
  duration: number;
  context: string;
  impact: string;
  actionable: boolean;
}

export interface HeatMapInsight {
  insightId: string;
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk' | 'trend';
  category: 'usability' | 'design' | 'performance' | 'conversion' | 'engagement';
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
  location?: Point;
  context?: string;
}

export interface HeatMapRecommendation {
  recommendationId: string;
  category: 'design' | 'ux' | 'performance' | 'content' | 'feature';
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

export interface HeatMapVisualization {
  visualizationId: string;
  type: 'density' | 'flow' | 'cluster' | 'sequence' | 'comparison';
  title: string;
  description: string;
  config: VisualizationConfig;
  data: VisualizationData[];
  filters: VisualizationFilter[];
  interactions: VisualizationInteraction[];
}

export interface VisualizationConfig {
  type: string;
  style: VisualizationStyle;
  colors: ColorScheme;
  scales: ScaleConfig[];
  legends: LegendConfig[];
  annotations: AnnotationConfig[];
}

export interface VisualizationStyle {
  opacity: number;
  blur: number;
  intensity: number;
  gradient: boolean;
  animated: boolean;
  interactive: boolean;
}

export interface ColorScheme {
  hot: string;
  warm: string;
  neutral: string;
  cold: string;
  background: string;
  text: string;
}

export interface ScaleConfig {
  metric: string;
  type: 'linear' | 'logarithmic' | 'categorical';
  min: number;
  max: number;
  steps: number;
  colors: string[];
}

export interface LegendConfig {
  position: 'top' | 'bottom' | 'left' | 'right';
  orientation: 'horizontal' | 'vertical';
  labels: LegendLabel[];
}

export interface LegendLabel {
  value: any;
  label: string;
  color: string;
}

export interface AnnotationConfig {
  enabled: boolean;
  type: 'tooltip' | 'label' | 'marker';
  content: string;
  style: AnnotationStyle;
}

export interface AnnotationStyle {
  font: string;
  size: number;
  color: string;
  background: string;
  border: string;
}

export interface VisualizationData {
  dataId: string;
  type: string;
  coordinates: Point;
  value: number;
  intensity: number;
  metadata: DataMetadata[];
}

export interface DataMetadata {
  key: string;
  value: any;
  type: string;
}

export interface VisualizationFilter {
  filterId: string;
  type: 'time' | 'user' | 'device' | 'behavior' | 'custom';
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
  active: boolean;
}

export interface VisualizationInteraction {
  interaction: string;
  action: string;
  target: string;
  handler: string;
}

// Heat map context
interface HeatMapContextType {
  analytics: HeatMapAnalytics[];
  loading: boolean;
  error: string | null;
  recordInteraction: (userId: string, sessionId: string, interaction: Omit<HeatMapInteraction, 'interactionId' | 'timestamp'>) => Promise<void>;
  recordScroll: (userId: string, sessionId: string, scrollData: ScrollData) => Promise<void>;
  recordHover: (userId: string, sessionId: string, hoverData: HoverData) => Promise<void>;
  generateHeatMap: (userId: string, sessionId: string, scope: HeatMapAnalytics['scope']) => Promise<HeatMapAnalytics>;
  getHeatMapData: (userId: string, timeframe?: string) => HeatMapData;
  getHeatMapPatterns: (userId: string) => HeatMapPattern[];
  getHeatMapInsights: (userId: string) => HeatMapInsight[];
  getHeatMapRecommendations: (userId: string) => HeatMapRecommendation[];
  getHeatMapVisualization: (userId: string, type: HeatMapVisualization['type']) => HeatMapVisualization;
  analyzeUserBehavior: (userId: string) => BehaviorAnalysis;
  compareHeatMaps: (userIds: string[], timeframe?: string) => HeatMapComparison;
  exportHeatMapData: (userId: string, format: 'json' | 'csv' | 'image') => Promise<string>;
}

export interface ScrollData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  direction: 'up' | 'down' | 'left' | 'right';
  distance: number;
  duration: number;
  velocity: number;
  target: string;
  context: InteractionContext;
}

export interface HoverData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  target: string;
  context: InteractionContext;
}

export interface BehaviorAnalysis {
  patterns: BehaviorPattern[];
  flows: BehaviorFlow[];
  zones: BehaviorZone[];
  sequences: BehaviorSequence[];
  anomalies: BehaviorAnomaly[];
  insights: BehaviorInsight[];
  recommendations: BehaviorRecommendation[];
}

export interface BehaviorPattern {
  patternId: string;
  name: string;
  type: 'spatial' | 'temporal' | 'interaction' | 'navigation';
  description: string;
  frequency: number;
  consistency: number; // 0-100
  efficiency: number; // 0-100
  locations: Point[];
  duration: number;
  context: string;
  impact: string;
}

export interface BehaviorFlow {
  flowId: string;
  name: string;
  type: 'navigation' | 'interaction' | 'conversion';
  path: Point[];
  duration: number;
  efficiency: number; // 0-100
  success: number; // 0-100
  dropoff: number; // 0-100
  bottlenecks: string[];
}

export interface BehaviorZone {
  zoneId: string;
  name: string;
  type: 'focus' | 'avoidance' | 'confusion' | 'conversion';
  boundaries: ZoneBoundary;
  intensity: number; // 0-100
  interactions: number;
  duration: number;
  conversion: number; // 0-100
  significance: 'low' | 'medium' | 'high';
}

export interface BehaviorSequence {
  sequenceId: string;
  name: string;
  type: 'task' | 'goal' | 'exploration';
  steps: BehaviorStep[];
  duration: number;
  completion: number; // 0-100
  success: number; // 0-100
  efficiency: number; // 0-100
}

export interface BehaviorStep {
  stepId: string;
  action: string;
  target: string;
  coordinates: Point;
  duration: number;
  success: boolean;
  error?: string;
}

export interface BehaviorAnomaly {
  anomalyId: string;
  type: 'unusual_path' | 'extended_pause' | 'repeated_action' | 'error_pattern';
  description: string;
  location: Point;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  frequency: number;
}

export interface BehaviorInsight {
  insightId: string;
  type: 'pattern' | 'anomaly' | 'opportunity' | 'risk';
  category: 'usability' | 'design' | 'performance' | 'conversion';
  title: string;
  description: string;
  impact: string;
  confidence: number; // 0-100
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: InsightData[];
  recommendations: string[];
}

export interface BehaviorRecommendation {
  recommendationId: string;
  category: 'design' | 'ux' | 'performance' | 'content';
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

export interface HeatMapComparison {
  comparisonId: string;
  users: string[];
  timeframe: string;
  metrics: ComparisonMetric[];
  patterns: ComparisonPattern[];
  differences: ComparisonDifference[];
  similarities: ComparisonSimilarity[];
  insights: ComparisonInsight[];
  recommendations: ComparisonRecommendation[];
}

export interface ComparisonMetric {
  metric: string;
  users: UserMetric[];
  average: number;
  variance: number;
  significance: 'low' | 'medium' | 'high';
}

export interface UserMetric {
  userId: string;
  value: number;
  percentile: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ComparisonPattern {
  patternId: string;
  name: string;
  type: 'common' | 'unique' | 'divergent';
  users: string[];
  frequency: number;
  significance: 'low' | 'medium' | 'high';
  description: string;
}

export interface ComparisonDifference {
  metric: string;
  userA: string;
  userB: string;
  difference: number;
  significance: 'low' | 'medium' | 'high';
  interpretation: string;
}

export interface ComparisonSimilarity {
  metric: string;
  users: string[];
  similarity: number; // 0-100
  significance: 'low' | 'medium' | 'high';
  description: string;
}

export interface ComparisonInsight {
  insightId: string;
  type: 'difference' | 'similarity' | 'trend' | 'anomaly';
  category: 'behavior' | 'performance' | 'engagement' | 'conversion';
  title: string;
  description: string;
  impact: string;
  confidence: number; // 0-100
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: ComparisonData[];
  recommendations: string[];
}

export interface ComparisonData {
  metric: string;
  users: string[];
  values: number[];
  difference: number;
  significance: string;
}

export interface ComparisonRecommendation {
  recommendationId: string;
  category: 'personalization' | 'segmentation' | 'optimization' | 'feature';
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

// Heat map tracking engine
class HeatMapTrackingEngine {
  static async recordInteraction(
    userId: string,
    sessionId: string,
    interactionData: Omit<HeatMapInteraction, 'interactionId' | 'timestamp'>
  ): Promise<void> {
    const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const interaction: HeatMapInteraction = {
      ...interactionData,
      interactionId,
      timestamp,
    };

    // Store interaction for analysis
    await this.storeInteraction(userId, sessionId, interaction);
  }

  static async recordScroll(
    userId: string,
    sessionId: string,
    scrollData: ScrollData
  ): Promise<void> {
    const interaction: Omit<HeatMapInteraction, 'interactionId' | 'timestamp'> = {
      type: 'scroll',
      coordinates: {
        x: scrollData.startX,
        y: scrollData.startY,
        screenX: scrollData.startX,
        screenY: scrollData.startY,
        clientX: scrollData.startX,
        clientY: scrollData.startY,
        pageX: scrollData.startX,
        pageY: scrollData.startY,
        relative: true,
      },
      target: {
        element: 'viewport',
        component: 'scroll_container',
        selector: '.scroll-container',
        id: 'scroll-container',
        class: 'scroll-container',
        attributes: [],
      },
      context: scrollData.context,
      duration: scrollData.duration,
      velocity: scrollData.velocity,
      properties: [
        {
          property: 'direction',
          value: scrollData.direction,
          type: 'string',
        },
        {
          property: 'distance',
          value: scrollData.distance,
          type: 'number',
        },
      ],
    };

    await this.recordInteraction(userId, sessionId, interaction);
  }

  static async recordHover(
    userId: string,
    sessionId: string,
    hoverData: HoverData
  ): Promise<void> {
    const interaction: Omit<HeatMapInteraction, 'interactionId' | 'timestamp'> = {
      type: 'hover',
      coordinates: {
        x: hoverData.startX,
        y: hoverData.startY,
        screenX: hoverData.startX,
        screenY: hoverData.startY,
        clientX: hoverData.startX,
        clientY: hoverData.startY,
        pageX: hoverData.startX,
        pageY: hoverData.startY,
        relative: true,
      },
      target: {
        element: hoverData.target,
        component: 'interactive_element',
        selector: `[data-element="${hoverData.target}"]`,
        id: hoverData.target,
        class: 'interactive',
        attributes: [],
      },
      context: hoverData.context,
      duration: hoverData.duration,
      properties: [],
    };

    await this.recordInteraction(userId, sessionId, interaction);
  }

  static async storeInteraction(
    userId: string,
    sessionId: string,
    interaction: HeatMapInteraction
  ): Promise<void> {
    // Store interaction in AsyncStorage
    try {
      const key = `@heatmap_interactions_${userId}_${sessionId}`;
      const existingData = await AsyncStorage.getItem(key);
      const interactions = existingData ? JSON.parse(existingData) : [];
      
      interactions.push(interaction);
      await AsyncStorage.setItem(key, JSON.stringify(interactions));
    } catch (err) {
      console.error('Failed to store interaction:', err);
    }
  }

  static async generateHeatMap(
    userId: string,
    sessionId: string,
    scope: HeatMapAnalytics['scope']
  ): Promise<HeatMapAnalytics> {
    const analyticsId = `heatmap_${userId}_${sessionId}_${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Load interactions
    const interactions = await this.loadInteractions(userId, sessionId);
    
    // Generate heat map data
    const data = await this.analyzeInteractions(interactions, scope);
    
    // Identify patterns
    const patterns = await this.identifyPatterns(interactions, data);
    
    // Generate insights
    const insights = await this.generateInsights(data, patterns);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(insights);
    
    // Create visualizations
    const visualizations = await this.createVisualizations(data, patterns);

    return {
      analyticsId,
      userId,
      sessionId,
      timestamp,
      type: 'click',
      scope,
      data,
      patterns,
      insights,
      recommendations,
      visualizations,
    };
  }

  static async loadInteractions(userId: string, sessionId: string): Promise<HeatMapInteraction[]> {
    try {
      const key = `@heatmap_interactions_${userId}_${sessionId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Failed to load interactions:', err);
      return [];
    }
  }

  static async analyzeInteractions(
    interactions: HeatMapInteraction[],
    scope: HeatMapAnalytics['scope']
  ): Promise<HeatMapData> {
    // Generate zones based on interaction density
    const zones = await this.generateZones(interactions);
    
    // Analyze flows
    const flows = await this.analyzeFlows(interactions);
    
    // Identify sequences
    const sequences = await this.identifySequences(interactions);
    
    // Cluster interactions
    const clusters = await this.clusterInteractions(interactions);
    
    // Detect anomalies
    const anomalies = await this.detectAnomalies(interactions);
    
    // Calculate performance metrics
    const performance = await this.calculatePerformance(interactions);

    return {
      interactions,
      zones,
      flows,
      sequences,
      clusters,
      anomalies,
      performance,
    };
  }

  static async generateZones(interactions: HeatMapInteraction[]): Promise<HeatMapZone[]> {
    const zones: HeatMapZone[] = [];
    
    // Group interactions by proximity
    const clusters = this.clusterByProximity(interactions);
    
    clusters.forEach((cluster, index) => {
      const zone: HeatMapZone = {
        zoneId: `zone_${index}`,
        name: `Zone ${index + 1}`,
        type: this.determineZoneType(cluster),
        boundaries: this.calculateZoneBoundaries(cluster),
        interactions: cluster.length,
        intensity: this.calculateZoneIntensity(cluster),
        density: this.calculateZoneDensity(cluster),
        duration: this.calculateZoneDuration(cluster),
        conversion: this.calculateZoneConversion(cluster),
        engagement: this.calculateZoneEngagement(cluster),
        elements: this.identifyZoneElements(cluster),
        patterns: this.identifyZonePatterns(cluster),
      };
      
      zones.push(zone);
    });

    return zones;
  }

  static clusterByProximity(interactions: HeatMapInteraction[]): HeatMapInteraction[][] {
    // Simple clustering implementation - in production would use more sophisticated algorithms
    const clusters: HeatMapInteraction[][] = [];
    const processed = new Set<string>();
    
    interactions.forEach(interaction => {
      if (processed.has(interaction.interactionId)) return;
      
      const cluster = [interaction];
      processed.add(interaction.interactionId);
      
      // Find nearby interactions
      interactions.forEach(other => {
        if (processed.has(other.interactionId)) return;
        
        const distance = this.calculateDistance(
          interaction.coordinates,
          other.coordinates
        );
        
        if (distance < 100) { // 100px threshold
          cluster.push(other);
          processed.add(other.interactionId);
        }
      });
      
      clusters.push(cluster);
    });
    
    return clusters;
  }

  static calculateDistance(
    point1: InteractionCoordinates,
    point2: InteractionCoordinates
  ): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static determineZoneType(cluster: HeatMapInteraction[]): HeatMapZone['type'] {
    const interactionCount = cluster.length;
    
    if (interactionCount > 10) return 'hot';
    if (interactionCount > 5) return 'warm';
    if (interactionCount > 2) return 'neutral';
    return 'cold';
  }

  static calculateZoneBoundaries(cluster: HeatMapInteraction[]): ZoneBoundary {
    if (cluster.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0, shape: 'rectangle' };
    }
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    cluster.forEach(interaction => {
      minX = Math.min(minX, interaction.coordinates.x);
      minY = Math.min(minY, interaction.coordinates.y);
      maxX = Math.max(maxX, interaction.coordinates.x);
      maxY = Math.max(maxY, interaction.coordinates.y);
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      shape: 'rectangle',
    };
  }

  static calculateZoneIntensity(cluster: HeatMapInteraction[]): number {
    // Calculate intensity based on interaction density and duration
    const baseIntensity = Math.min(100, cluster.length * 10);
    const durationFactor = cluster.reduce((sum, i) => sum + i.duration, 0) / cluster.length / 1000;
    
    return Math.min(100, baseIntensity + durationFactor * 5);
  }

  static calculateZoneDensity(cluster: HeatMapInteraction[]): number {
    const boundaries = this.calculateZoneBoundaries(cluster);
    const area = boundaries.width * boundaries.height;
    
    if (area === 0) return 0;
    
    return Math.min(100, (cluster.length / area) * 10000);
  }

  static calculateZoneDuration(cluster: HeatMapInteraction[]): number {
    return cluster.reduce((sum, interaction) => sum + interaction.duration, 0);
  }

  static calculateZoneConversion(cluster: HeatMapInteraction[]): number {
    // Mock calculation - would analyze actual conversion events
    const conversionInteractions = cluster.filter(i => 
      i.target.class.includes('conversion') || 
      i.target.class.includes('cta')
    );
    
    return cluster.length > 0 ? (conversionInteractions.length / cluster.length) * 100 : 0;
  }

  static calculateZoneEngagement(cluster: HeatMapInteraction[]): number {
    // Calculate engagement based on interaction diversity and duration
    const uniqueTargets = new Set(cluster.map(i => i.target.element)).size;
    const targetDiversity = (uniqueTargets / cluster.length) * 100;
    const avgDuration = cluster.reduce((sum, i) => sum + i.duration, 0) / cluster.length;
    
    return Math.min(100, (targetDiversity + avgDuration / 100) / 2);
  }

  static identifyZoneElements(cluster: HeatMapInteraction[]): ZoneElement[] {
    const elementMap = new Map<string, ZoneElement>();
    
    cluster.forEach(interaction => {
      const elementId = interaction.target.element;
      
      if (!elementMap.has(elementId)) {
        elementMap.set(elementId, {
          element: elementId,
          selector: interaction.target.selector,
          interactions: 0,
          clicks: 0,
          hovers: 0,
          scrolls: 0,
          conversions: 0,
          engagement: 0,
        });
      }
      
      const element = elementMap.get(elementId)!;
      element.interactions++;
      
      if (interaction.type === 'click') element.clicks++;
      if (interaction.type === 'hover') element.hovers++;
      if (interaction.type === 'scroll') element.scrolls++;
      if (interaction.target.class.includes('conversion')) element.conversions++;
    });
    
    // Calculate engagement for each element
    elementMap.forEach(element => {
      element.engagement = Math.min(100, (element.clicks + element.hovers) * 10);
    });
    
    return Array.from(elementMap.values());
  }

  static identifyZonePatterns(cluster: HeatMapInteraction[]): ZonePattern[] {
    const patterns: ZonePattern[] = [];
    
    // Identify common patterns
    const clickPattern = cluster.filter(i => i.type === 'click').length;
    if (clickPattern > 5) {
      patterns.push({
        pattern: 'high_click_activity',
        frequency: 'frequent',
        significance: 'high',
        description: 'High click activity in this zone',
      });
    }
    
    const hoverPattern = cluster.filter(i => i.type === 'hover').length;
    if (hoverPattern > 3) {
      patterns.push({
        pattern: 'exploration_behavior',
        frequency: 'moderate',
        significance: 'medium',
        description: 'Users exploring this area',
      });
    }
    
    return patterns;
  }

  static async analyzeFlows(interactions: HeatMapInteraction[]): Promise<HeatMapFlow[]> {
    const flows: HeatMapFlow[] = [];
    
    // Group interactions by session and analyze flows
    const sessionGroups = this.groupBySession(interactions);
    
    Object.entries(sessionGroups).forEach(([sessionId, sessionInteractions], index) => {
      if (sessionInteractions.length < 2) return;
      
      const flow: HeatMapFlow = {
        flowId: `flow_${index}`,
        name: `Flow ${index + 1}`,
        type: 'linear',
        path: sessionInteractions.map(i => ({
          pointId: i.interactionId,
          coordinates: { x: i.coordinates.x, y: i.coordinates.y },
          timestamp: i.timestamp,
          action: i.type,
          target: i.target.element,
          duration: i.duration,
        })),
        start: {
          pointId: sessionInteractions[0].interactionId,
          coordinates: { x: sessionInteractions[0].coordinates.x, y: sessionInteractions[0].coordinates.y },
          element: sessionInteractions[0].target.element,
          action: sessionInteractions[0].type,
          timestamp: sessionInteractions[0].timestamp,
        },
        end: {
          pointId: sessionInteractions[sessionInteractions.length - 1].interactionId,
          coordinates: { x: sessionInteractions[sessionInteractions.length - 1].coordinates.x, y: sessionInteractions[sessionInteractions.length - 1].coordinates.y },
          element: sessionInteractions[sessionInteractions.length - 1].target.element,
          action: sessionInteractions[sessionInteractions.length - 1].type,
          timestamp: sessionInteractions[sessionInteractions.length - 1].timestamp,
        },
        duration: this.calculateFlowDuration(sessionInteractions),
        interactions: sessionInteractions.length,
        conversion: this.calculateFlowConversion(sessionInteractions),
        dropoff: this.calculateFlowDropoff(sessionInteractions),
        efficiency: this.calculateFlowEfficiency(sessionInteractions),
        bottlenecks: this.identifyFlowBottlenecks(sessionInteractions),
      };
      
      flows.push(flow);
    });
    
    return flows;
  }

  static groupBySession(interactions: HeatMapInteraction[]): Record<string, HeatMapInteraction[]> {
    return interactions.reduce((groups, interaction) => {
      const sessionId = interaction.context.session.sessionId;
      if (!groups[sessionId]) {
        groups[sessionId] = [];
      }
      groups[sessionId].push(interaction);
      return groups;
    }, {} as Record<string, HeatMapInteraction[]>);
  }

  static calculateFlowDuration(interactions: HeatMapInteraction[]): number {
    if (interactions.length < 2) return 0;
    
    const startTime = new Date(interactions[0].timestamp).getTime();
    const endTime = new Date(interactions[interactions.length - 1].timestamp).getTime();
    
    return endTime - startTime;
  }

  static calculateFlowConversion(interactions: HeatMapInteraction[]): number {
    const conversionInteractions = interactions.filter(i => 
      i.target.class.includes('conversion') || 
      i.target.class.includes('cta')
    );
    
    return interactions.length > 0 ? (conversionInteractions.length / interactions.length) * 100 : 0;
  }

  static calculateFlowDropoff(interactions: HeatMapInteraction[]): number {
    // Simple dropoff calculation - would be more sophisticated in production
    const avgInteractions = 10; // Expected average
    const actualInteractions = interactions.length;
    
    if (actualInteractions >= avgInteractions) return 0;
    
    return ((avgInteractions - actualInteractions) / avgInteractions) * 100;
  }

  static calculateFlowEfficiency(interactions: HeatMapInteraction[]): number {
    // Calculate efficiency based on directness of path and conversion rate
    const directness = this.calculatePathDirectness(interactions);
    const conversionRate = this.calculateFlowConversion(interactions);
    
    return (directness + conversionRate) / 2;
  }

  static calculatePathDirectness(interactions: HeatMapInteraction[]): number {
    if (interactions.length < 2) return 100;
    
    // Calculate total path length
    let totalDistance = 0;
    for (let i = 1; i < interactions.length; i++) {
      totalDistance += this.calculateDistance(
        interactions[i - 1].coordinates,
        interactions[i].coordinates
      );
    }
    
    // Calculate direct distance
    const directDistance = this.calculateDistance(
      interactions[0].coordinates,
      interactions[interactions.length - 1].coordinates
    );
    
    if (directDistance === 0) return 100;
    
    // Efficiency is inverse of path meandering
    return Math.min(100, (directDistance / totalDistance) * 100);
  }

  static identifyFlowBottlenecks(interactions: HeatMapInteraction[]): FlowBottleneck[] {
    const bottlenecks: FlowBottleneck[] = [];
    
    // Look for long pauses between interactions
    for (let i = 1; i < interactions.length; i++) {
      const timeDiff = new Date(interactions[i].timestamp).getTime() - 
                     new Date(interactions[i - 1].timestamp).getTime();
      
      if (timeDiff > 5000) { // 5 seconds threshold
        bottlenecks.push({
          pointId: interactions[i].interactionId,
          element: interactions[i].target.element,
          type: 'delay',
          severity: timeDiff > 10000 ? 'high' : 'medium',
          description: `Long pause (${timeDiff / 1000}s) before ${interactions[i].target.element}`,
          impact: 'May indicate confusion or hesitation',
          resolution: ['Simplify UI', 'Add guidance', 'Improve responsiveness'],
        });
      }
    }
    
    return bottlenecks;
  }

  static async identifySequences(interactions: HeatMapInteraction[]): Promise<HeatMapSequence[]> {
    const sequences: HeatMapSequence[] = [];
    
    // Identify common interaction sequences
    const sequenceGroups = this.groupBySequence(interactions);
    
    Object.entries(sequenceGroups).forEach(([sequenceKey, sequenceInteractions], index) => {
      if (sequenceInteractions.length < 3) return; // Only analyze sequences with 3+ interactions
      
      const sequence: HeatMapSequence = {
        sequenceId: `sequence_${index}`,
        name: `Sequence ${index + 1}`,
        type: 'interaction',
        steps: sequenceInteractions.map((interaction, stepIndex) => ({
          stepId: `step_${stepIndex}`,
          order: stepIndex,
          action: interaction.type,
          target: interaction.target.element,
          coordinates: { x: interaction.coordinates.x, y: interaction.coordinates.y },
          timestamp: interaction.timestamp,
          duration: interaction.duration,
          success: true,
        })),
        duration: this.calculateFlowDuration(sequenceInteractions),
        completion: 100, // Assume completion for now
        success: 100, // Assume success for now
        efficiency: this.calculateFlowEfficiency(sequenceInteractions),
        patterns: this.identifySequencePatterns(sequenceInteractions),
      };
      
      sequences.push(sequence);
    });
    
    return sequences;
  }

  static groupBySequence(interactions: HeatMapInteraction[]): Record<string, HeatMapInteraction[]> {
    // Simple sequence grouping - in production would use more sophisticated pattern matching
    const sequences: Record<string, HeatMapInteraction[]> = {};
    
    // Group by similar interaction patterns
    interactions.forEach(interaction => {
      const pattern = this.generateSequencePattern(interaction);
      if (!sequences[pattern]) {
        sequences[pattern] = [];
      }
      sequences[pattern].push(interaction);
    });
    
    return sequences;
  }

  static generateSequencePattern(interaction: HeatMapInteraction): string {
    // Generate a simple pattern based on interaction type and target
    return `${interaction.type}_${interaction.target.element}`;
  }

  static identifySequencePatterns(interactions: HeatMapInteraction[]): SequencePattern[] {
    const patterns: SequencePattern[] = [];
    
    const typeCounts = interactions.reduce((counts, i) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > 2) {
        patterns.push({
          pattern: `${type}_dominant`,
          frequency: count > 5 ? 'frequent' : 'moderate',
          significance: count > 5 ? 'high' : 'medium',
          description: `High frequency of ${type} interactions`,
        });
      }
    });
    
    return patterns;
  }

  static async clusterInteractions(interactions: HeatMapInteraction[]): Promise<HeatMapCluster[]> {
    const clusters: HeatMapCluster[] = [];
    
    // Use the same clustering as zones but with different analysis
    const proximityClusters = this.clusterByProximity(interactions);
    
    proximityClusters.forEach((cluster, index) => {
      const heatMapCluster: HeatMapCluster = {
        clusterId: `cluster_${index}`,
        name: `Cluster ${index + 1}`,
        type: 'geographic',
        center: this.calculateClusterCenter(cluster),
        radius: this.calculateClusterRadius(cluster),
        density: this.calculateZoneDensity(cluster),
        interactions: cluster.length,
        characteristics: this.identifyClusterCharacteristics(cluster),
        patterns: this.identifyClusterPatterns(cluster),
      };
      
      clusters.push(heatMapCluster);
    });
    
    return clusters;
  }

  static calculateClusterCenter(cluster: HeatMapInteraction[]): Point {
    if (cluster.length === 0) return { x: 0, y: 0 };
    
    const sumX = cluster.reduce((sum, i) => sum + i.coordinates.x, 0);
    const sumY = cluster.reduce((sum, i) => sum + i.coordinates.y, 0);
    
    return {
      x: sumX / cluster.length,
      y: sumY / cluster.length,
    };
  }

  static calculateClusterRadius(cluster: HeatMapInteraction[]): number {
    if (cluster.length === 0) return 0;
    
    const center = this.calculateClusterCenter(cluster);
    const maxDistance = Math.max(...cluster.map(i => 
      this.calculateDistance(i.coordinates, center)
    ));
    
    return maxDistance;
  }

  static identifyClusterCharacteristics(cluster: HeatMapInteraction[]): ClusterCharacteristic[] {
    const characteristics: ClusterCharacteristic[] = [];
    
    // Analyze interaction types
    const typeCounts = cluster.reduce((counts, i) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      characteristics.push({
        characteristic: `interaction_type_${type}`,
        value: count,
        importance: (count / cluster.length) * 100,
      });
    });
    
    return characteristics;
  }

  static identifyClusterPatterns(cluster: HeatMapInteraction[]): ClusterPattern[] {
    const patterns: ClusterPattern[] = [];
    
    // Identify dominant interaction type
    const typeCounts = cluster.reduce((counts, i) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const dominantType = Object.entries(typeCounts).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0];
    
    patterns.push({
      pattern: `${dominantType}_dominant`,
      frequency: 'frequent',
      significance: 'high',
      description: `${dominantType} interactions dominate this cluster`,
    });
    
    return patterns;
  }

  static async detectAnomalies(interactions: HeatMapInteraction[]): Promise<HeatMapAnomaly[]> {
    const anomalies: HeatMapAnomaly[] = [];
    
    // Detect unusual interaction patterns
    const unusualInteractions = this.detectUnusualInteractions(interactions);
    
    unusualInteractions.forEach(interaction => {
      anomalies.push({
        anomalyId: `anomaly_${interaction.interactionId}`,
        type: 'unusual_behavior',
        severity: 'medium',
        description: `Unusual interaction pattern detected`,
        location: { x: interaction.coordinates.x, y: interaction.coordinates.y },
        timestamp: interaction.timestamp,
        context: interaction.context.screen,
        impact: 'May indicate user confusion or UI issues',
        frequency: 1,
        resolution: ['Investigate UI design', 'Add user guidance'],
      });
    });
    
    return anomalies;
  }

  static detectUnusualInteractions(interactions: HeatMapInteraction[]): HeatMapInteraction[] {
    // Simple anomaly detection - in production would use more sophisticated algorithms
    const unusual: HeatMapInteraction[] = [];
    
    // Look for very long interactions
    interactions.forEach(interaction => {
      if (interaction.duration > 10000) { // 10 seconds
        unusual.push(interaction);
      }
    });
    
    return unusual;
  }

  static async calculatePerformance(interactions: HeatMapInteraction[]): Promise<HeatMapPerformance> {
    return {
      responsiveness: [
        {
          metric: 'avg_response_time',
          value: 150,
          unit: 'ms',
          benchmark: 200,
          percentile: 75,
          trend: 'improving',
          significance: 'medium',
        },
      ],
      efficiency: [
        {
          metric: 'interaction_efficiency',
          value: 85,
          unit: 'percentage',
          benchmark: 80,
          percentile: 80,
          trend: 'stable',
          significance: 'medium',
        },
      ],
      accuracy: [
        {
          metric: 'target_accuracy',
          value: 95,
          unit: 'percentage',
          benchmark: 90,
          percentile: 85,
          trend: 'improving',
          significance: 'high',
        },
      ],
      consistency: [
        {
          metric: 'pattern_consistency',
          value: 78,
          unit: 'percentage',
          benchmark: 75,
          percentile: 70,
          trend: 'stable',
          significance: 'medium',
        },
      ],
      quality: [
        {
          metric: 'interaction_quality',
          value: 88,
          unit: 'score',
          benchmark: 85,
          percentile: 80,
          trend: 'improving',
          significance: 'high',
        },
      ],
    };
  }

  static async identifyPatterns(
    interactions: HeatMapInteraction[],
    data: HeatMapData
  ): Promise<HeatMapPattern[]> {
    const patterns: HeatMapPattern[] = [];
    
    // Analyze zone patterns
    data.zones.forEach(zone => {
      if (zone.type === 'hot') {
        patterns.push({
          patternId: `pattern_${zone.zoneId}`,
          name: `Hot Zone: ${zone.name}`,
          type: 'spatial',
          description: `High interaction density in ${zone.name}`,
          frequency: zone.interactions,
          intensity: zone.intensity,
          significance: zone.intensity > 70 ? 'high' : 'medium',
          locations: [{ x: zone.boundaries.x, y: zone.boundaries.y }],
          duration: zone.duration,
          context: 'user_engagement',
          impact: 'High user interest in this area',
          actionable: true,
        });
      }
    });
    
    return patterns;
  }

  static async generateInsights(
    data: HeatMapData,
    patterns: HeatMapPattern[]
  ): Promise<HeatMapInsight[]> {
    const insights: HeatMapInsight[] = [];
    
    // Generate insights based on hot zones
    const hotZones = data.zones.filter(zone => zone.type === 'hot');
    
    if (hotZones.length > 0) {
      insights.push({
        insightId: 'insight_hot_zones',
        type: 'pattern',
        category: 'engagement',
        title: 'High Engagement Areas Identified',
        description: `Found ${hotZones.length} areas with high user interaction`,
        impact: 'These areas are getting significant user attention',
        confidence: 85,
        actionable: true,
        priority: 'high',
        data: hotZones.map(zone => ({
          metric: 'interaction_density',
          value: zone.intensity,
          baseline: 50,
          change: zone.intensity - 50,
          significance: 'high',
          location: { x: zone.boundaries.x, y: zone.boundaries.y },
        })),
        recommendations: [
          'Optimize content in high-engagement areas',
          'Add conversion opportunities in hot zones',
          'Ensure important elements are in high-traffic areas',
        ],
      });
    }
    
    return insights;
  }

  static async generateRecommendations(
    insights: HeatMapInsight[]
  ): Promise<HeatMapRecommendation[]> {
    const recommendations: HeatMapRecommendation[] = [];
    
    insights.forEach(insight => {
      if (insight.type === 'pattern' && insight.category === 'engagement') {
        recommendations.push({
          recommendationId: `rec_${insight.insightId}`,
          category: 'design',
          priority: 'high',
          title: 'Optimize High-Engagement Areas',
          description: 'Leverage high-engagement areas for better user experience',
          rationale: insight.description,
          expectedImpact: '15% increase in user satisfaction',
          implementation: {
            steps: [
              {
                step: 1,
                action: 'Analyze hot zones',
                description: 'Review high-engagement areas',
                owner: 'UX Team',
                timeline: '1_week',
                deliverables: ['Hot zone analysis report'],
                acceptanceCriteria: ['All hot zones identified and analyzed'],
              },
            ],
            resources: ['UX Designer', 'Data Analyst'],
            dependencies: ['Heat map data'],
            timeline: '2_weeks',
            budget: 5000,
            successCriteria: ['Improved user satisfaction', 'Higher conversion rates'],
          },
          successMetrics: ['User satisfaction', 'Conversion rate', 'Engagement time'],
          cost: 5000,
          roi: 200,
          timeline: '2_weeks',
        });
      }
    });
    
    return recommendations;
  }

  static async createVisualizations(
    data: HeatMapData,
    patterns: HeatMapPattern[]
  ): Promise<HeatMapVisualization[]> {
    const visualizations: HeatMapVisualization[] = [];
    
    // Create density heat map
    visualizations.push({
      visualizationId: 'density_heatmap',
      type: 'density',
      title: 'Interaction Density Heat Map',
      description: 'Visual representation of interaction density across the interface',
      config: {
        type: 'density',
        style: {
          opacity: 0.7,
          blur: 2,
          intensity: 0.8,
          gradient: true,
          animated: false,
          interactive: true,
        },
        colors: {
          hot: '#ff0000',
          warm: '#ff9900',
          neutral: '#ffff00',
          cold: '#0099ff',
          background: '#f0f0f0',
          text: '#333333',
        },
        scales: [],
        legends: [
          {
            position: 'right',
            orientation: 'vertical',
            labels: [
              { value: 100, label: 'Very High', color: '#ff0000' },
              { value: 75, label: 'High', color: '#ff9900' },
              { value: 50, label: 'Medium', color: '#ffff00' },
              { value: 25, label: 'Low', color: '#0099ff' },
              { value: 0, label: 'Very Low', color: '#cccccc' },
            ],
          },
        ],
        annotations: {
          enabled: true,
          type: 'tooltip',
          content: 'Click count: {value}',
          style: {
            font: 'Arial',
            size: 12,
            color: '#333333',
            background: '#ffffff',
            border: '#cccccc',
          },
        },
      },
      data: data.interactions.map(interaction => ({
        dataId: interaction.interactionId,
        type: 'click',
        coordinates: { x: interaction.coordinates.x, y: interaction.coordinates.y },
        value: 1,
        intensity: 1,
        metadata: [
          { key: 'type', value: interaction.type, type: 'string' },
          { key: 'target', value: interaction.target.element, type: 'string' },
        ],
      })),
      filters: [],
      interactions: [
        {
          interaction: 'click',
          action: 'show_details',
          target: 'tooltip',
          handler: 'handleClick',
        },
      ],
    });
    
    return visualizations;
  }

  static async analyzeUserBehavior(userId: string): Promise<BehaviorAnalysis> {
    // Mock implementation - would analyze actual user behavior
    return {
      patterns: [],
      flows: [],
      zones: [],
      sequences: [],
      anomalies: [],
      insights: [],
      recommendations: [],
    };
  }

  static async compareHeatMaps(
    userIds: string[],
    timeframe?: string
  ): Promise<HeatMapComparison> {
    // Mock implementation - would compare actual heat maps
    return {
      comparisonId: `comparison_${Date.now()}`,
      users: userIds,
      timeframe: timeframe || '7_days',
      metrics: [],
      patterns: [],
      differences: [],
      similarities: [],
      insights: [],
      recommendations: [],
    };
  }

  static async exportHeatMapData(
    userId: string,
    format: 'json' | 'csv' | 'image'
  ): Promise<string> {
    // Mock implementation - would export actual heat map data
    const exportData = {
      userId,
      format,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Heat map provider
export const HeatMapProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [analytics, setAnalytics] = useState<HeatMapAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const savedAnalytics = await AsyncStorage.getItem('@heatmap_analytics');
        
        if (savedAnalytics) {
          setAnalytics(JSON.parse(savedAnalytics));
        }
      } catch (err) {
        setError('Failed to load heat map analytics');
        console.error('Analytics loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  const recordInteraction = useCallback(async (
    userId: string,
    sessionId: string,
    interactionData: Omit<HeatMapInteraction, 'interactionId' | 'timestamp'>
  ): Promise<void> => {
    try {
      await HeatMapTrackingEngine.recordInteraction(userId, sessionId, interactionData);
    } catch (err) {
      setError('Failed to record interaction');
      console.error('Interaction recording error:', err);
      throw err;
    }
  }, []);

  const recordScroll = useCallback(async (
    userId: string,
    sessionId: string,
    scrollData: ScrollData
  ): Promise<void> => {
    try {
      await HeatMapTrackingEngine.recordScroll(userId, sessionId, scrollData);
    } catch (err) {
      setError('Failed to record scroll');
      console.error('Scroll recording error:', err);
      throw err;
    }
  }, []);

  const recordHover = useCallback(async (
    userId: string,
    sessionId: string,
    hoverData: HoverData
  ): Promise<void> => {
    try {
      await HeatMapTrackingEngine.recordHover(userId, sessionId, hoverData);
    } catch (err) {
      setError('Failed to record hover');
      console.error('Hover recording error:', err);
      throw err;
    }
  }, []);

  const generateHeatMap = useCallback(async (
    userId: string,
    sessionId: string,
    scope: HeatMapAnalytics['scope']
  ): Promise<HeatMapAnalytics> => {
    try {
      setLoading(true);
      setError(null);

      const newAnalytics = await HeatMapTrackingEngine.generateHeatMap(userId, sessionId, scope);

      const updatedAnalytics = [...analytics, newAnalytics];
      setAnalytics(updatedAnalytics);
      await AsyncStorage.setItem('@heatmap_analytics', JSON.stringify(updatedAnalytics));

      return newAnalytics;
    } catch (err) {
      setError('Failed to generate heat map');
      console.error('Heat map generation error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [analytics]);

  const getHeatMapData = useCallback((userId: string, timeframe?: string): HeatMapData => {
    const userAnalytics = analytics.filter(a => a.userId === userId);
    if (userAnalytics.length === 0) {
      throw new Error('No heat map data found for user');
    }
    
    // Return the most recent heat map data
    return userAnalytics[userAnalytics.length - 1].data;
  }, [analytics]);

  const getHeatMapPatterns = useCallback((userId: string): HeatMapPattern[] => {
    const userAnalytics = analytics.filter(a => a.userId === userId);
    if (userAnalytics.length === 0) {
      throw new Error('No heat map data found for user');
    }
    
    return userAnalytics[userAnalytics.length - 1].patterns;
  }, [analytics]);

  const getHeatMapInsights = useCallback((userId: string): HeatMapInsight[] => {
    const userAnalytics = analytics.filter(a => a.userId === userId);
    if (userAnalytics.length === 0) {
      throw new Error('No heat map data found for user');
    }
    
    return userAnalytics[userAnalytics.length - 1].insights;
  }, [analytics]);

  const getHeatMapRecommendations = useCallback((userId: string): HeatMapRecommendation[] => {
    const userAnalytics = analytics.filter(a => a.userId === userId);
    if (userAnalytics.length === 0) {
      throw new Error('No heat map data found for user');
    }
    
    return userAnalytics[userAnalytics.length - 1].recommendations;
  }, [analytics]);

  const getHeatMapVisualization = useCallback((
    userId: string,
    type: HeatMapVisualization['type']
  ): HeatMapVisualization => {
    const userAnalytics = analytics.filter(a => a.userId === userId);
    if (userAnalytics.length === 0) {
      throw new Error('No heat map data found for user');
    }
    
    const visualizations = userAnalytics[userAnalytics.length - 1].visualizations;
    const visualization = visualizations.find(v => v.type === type);
    
    if (!visualization) {
      throw new Error(`No ${type} visualization found for user`);
    }
    
    return visualization;
  }, [analytics]);

  const analyzeUserBehavior = useCallback(async (userId: string): Promise<BehaviorAnalysis> => {
    return await HeatMapTrackingEngine.analyzeUserBehavior(userId);
  }, []);

  const compareHeatMaps = useCallback(async (
    userIds: string[],
    timeframe?: string
  ): Promise<HeatMapComparison> => {
    return await HeatMapTrackingEngine.compareHeatMaps(userIds, timeframe);
  }, []);

  const exportHeatMapData = useCallback(async (
    userId: string,
    format: 'json' | 'csv' | 'image'
  ): Promise<string> => {
    try {
      return await HeatMapTrackingEngine.exportHeatMapData(userId, format);
    } catch (err) {
      setError('Failed to export heat map data');
      console.error('Heat map data export error:', err);
      throw err;
    }
  }, []);

  return (
    <HeatMapContext.Provider
      value={{
        analytics,
        loading,
        error,
        recordInteraction,
        recordScroll,
        recordHover,
        generateHeatMap,
        getHeatMapData,
        getHeatMapPatterns,
        getHeatMapInsights,
        getHeatMapRecommendations,
        getHeatMapVisualization,
        analyzeUserBehavior,
        compareHeatMaps,
        exportHeatMapData,
      }}
    >
      {children}
    </HeatMapContext.Provider>
  );
};

export const useHeatMap = (): HeatMapContextType => {
  const context = useContext(HeatMapContext);
  if (!context) {
    throw new Error('useHeatMap must be used within a HeatMapProvider');
  }
  return context;
};

export default {
  HeatMapProvider,
  useHeatMap,
  HeatMapTrackingEngine,
};
