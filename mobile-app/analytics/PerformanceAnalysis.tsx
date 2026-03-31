import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';

// Code performance analysis types
export interface CodePerformance {
  submissionId: string;
  userId: string;
  problemId: string;
  language: string;
  code: string;
  timestamp: string;
  executionTime: number; // in milliseconds
  memoryUsage: number; // in KB
  status: 'success' | 'error' | 'timeout' | 'memory_limit_exceeded';
  score: number; // 0-100
  testCasesPassed: number;
  totalTestCases: number;
  metrics: PerformanceMetrics;
  codeQuality: CodeQualityMetrics;
  optimizationSuggestions: OptimizationSuggestion[];
  comparativeAnalysis: ComparativeAnalysis;
  learningMetrics: LearningMetrics;
}

export interface PerformanceMetrics {
  timeComplexity: TimeComplexity;
  spaceComplexity: SpaceComplexity;
  efficiency: number; // 0-100
  scalability: number; // 0-100
  resourceUtilization: number; // 0-100
  bottleneckAnalysis: BottleneckAnalysis;
}

export interface TimeComplexity {
  complexity: 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(n³)' | 'O(2^n)' | 'O(n!)';
  analysis: string;
  actualPerformance: number;
  expectedPerformance: number;
  efficiency: number; // 0-100
}

export interface SpaceComplexity {
  complexity: 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(n³)';
  analysis: string;
  actualMemory: number;
  expectedMemory: number;
  efficiency: number; // 0-100
}

export interface BottleneckAnalysis {
  primaryBottleneck: string;
  secondaryBottlenecks: string[];
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  optimizationPotential: number; // 0-100
  recommendations: string[];
}

export interface CodeQualityMetrics {
  readability: number; // 0-100
  maintainability: number; // 0-100
  complexity: number; // 0-100 (lower is better)
  duplication: number; // 0-100 (lower is better)
  documentation: number; // 0-100
  bestPractices: number; // 0-100
  styleConsistency: number; // 0-100
  errorHandling: number; // 0-100
  testability: number; // 0-100
  overallScore: number; // 0-100
  issues: CodeIssue[];
  strengths: CodeStrength[];
}

export interface CodeIssue {
  type: 'syntax' | 'logic' | 'performance' | 'security' | 'style' | 'documentation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  line: number;
  description: string;
  suggestion: string;
  category: string;
}

export interface CodeStrength {
  type: 'efficiency' | 'readability' | 'structure' | 'innovation' | 'best_practice';
  description: string;
  impact: 'low' | 'medium' | 'high';
  line?: number;
}

export interface OptimizationSuggestion {
  type: 'performance' | 'memory' | 'readability' | 'structure' | 'algorithm';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  example: string;
  expectedImprovement: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  estimatedTime: string;
}

export interface ComparativeAnalysis {
  userRank: number;
  totalUsers: number;
  percentile: number;
  betterThan: number; // percentage
  similarSolutions: number;
  uniqueApproaches: string[];
  commonPatterns: string[];
  improvementAreas: string[];
  strengths: string[];
}

export interface LearningMetrics {
  conceptUnderstanding: number; // 0-100
  problemSolvingSkills: number; // 0-100
  algorithmicThinking: number; // 0-100
  codeOrganization: number; // 0-100
  debuggingSkills: number; // 0-100
  optimizationAwareness: number; // 0-100
  learningVelocity: number; // improvement rate
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  nextLearningObjectives: string[];
}

// Performance analysis context
interface PerformanceAnalysisContextType {
  performances: CodePerformance[];
  loading: boolean;
  error: string | null;
  analyzeCodePerformance: (code: string, language: string, problemId: string, executionResults: any) => Promise<CodePerformance>;
  getPerformanceHistory: (userId: string, problemId?: string) => CodePerformance[];
  getPerformanceTrends: (userId: string) => PerformanceTrends;
  getComparativeAnalysis: (userId: string, problemId: string) => ComparativeAnalysis;
  getCodeQualityAnalysis: (code: string, language: string) => CodeQualityMetrics;
  getOptimizationSuggestions: (performance: CodePerformance) => OptimizationSuggestion[];
  getLearningMetrics: (userId: string) => LearningMetrics;
  exportPerformanceData: (userId: string) => Promise<string>;
}

export interface PerformanceTrends {
  executionTimeTrend: 'improving' | 'stable' | 'declining';
  memoryUsageTrend: 'improving' | 'stable' | 'declining';
  scoreTrend: 'improving' | 'stable' | 'declining';
  codeQualityTrend: 'improving' | 'stable' | 'declining';
  learningVelocity: number;
  masteryProgress: MasteryProgress[];
  skillDevelopment: SkillDevelopment[];
}

export interface MasteryProgress {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  progress: number; // 0-100
  timeToMastery: string;
  requiredImprovements: string[];
}

export interface SkillDevelopment {
  skill: string;
  level: number;
  improvementRate: number;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
}

// Code analysis utilities
class CodeAnalyzer {
  static analyzeComplexity(code: string, language: string): TimeComplexity {
    // Simplified complexity analysis
    const lines = code.split('\n');
    let complexity: TimeComplexity['complexity'] = 'O(1)';
    let loops = 0;
    let nestedLoops = 0;
    let recursion = false;

    lines.forEach(line => {
      const trimmedLine = line.trim().toLowerCase();
      
      // Check for loops
      if (trimmedLine.includes('for') || trimmedLine.includes('while')) {
        loops++;
        if (nestedLoops > 0) nestedLoops++;
        else nestedLoops = 1;
      }
      
      // Check for recursion
      if (trimmedLine.includes('return') && trimmedLine.includes(code.split('(')[0]?.trim())) {
        recursion = true;
      }
      
      // Reset nested loops when exiting
      if (trimmedLine === '}' && nestedLoops > 0) {
        nestedLoops--;
      }
    });

    // Determine complexity based on patterns
    if (recursion) {
      complexity = 'O(n!)';
    } else if (nestedLoops >= 2) {
      complexity = 'O(n²)';
    } else if (loops > 0) {
      complexity = 'O(n)';
    } else {
      complexity = 'O(1)';
    }

    return {
      complexity,
      analysis: `Detected ${loops} loops and ${nestedLoops} nested levels. Recursion: ${recursion}`,
      actualPerformance: 0,
      expectedPerformance: this.getExpectedPerformance(complexity),
      efficiency: 85,
    };
  }

  static getExpectedPerformance(complexity: TimeComplexity['complexity']): number {
    switch (complexity) {
      case 'O(1)': return 1;
      case 'O(log n)': return 10;
      case 'O(n)': return 100;
      case 'O(n log n)': return 1000;
      case 'O(n²)': return 10000;
      case 'O(n³)': return 100000;
      case 'O(2^n)': return 1000000;
      case 'O(n!)': return 10000000;
      default: return 100;
    }
  }

  static analyzeCodeQuality(code: string, language: string): CodeQualityMetrics {
    const lines = code.split('\n');
    const issues: CodeIssue[] = [];
    const strengths: CodeStrength[] = [];

    // Readability analysis
    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const readability = Math.max(0, 100 - (avgLineLength - 80) * 2);

    // Complexity analysis
    const complexity = this.calculateCyclomaticComplexity(code);
    
    // Duplication analysis
    const duplication = this.detectDuplication(code);
    
    // Documentation analysis
    const documentation = this.analyzeDocumentation(code);
    
    // Best practices analysis
    const bestPractices = this.analyzeBestPractices(code, language);
    
    // Style consistency
    const styleConsistency = this.analyzeStyleConsistency(code);
    
    // Error handling
    const errorHandling = this.analyzeErrorHandling(code, language);
    
    // Testability
    const testability = this.analyzeTestability(code);

    // Generate issues
    if (avgLineLength > 120) {
      issues.push({
        type: 'style',
        severity: 'medium',
        line: lines.findIndex(line => line.length > 120),
        description: 'Line too long',
        suggestion: 'Break long lines into multiple lines',
        category: 'readability',
      });
    }

    if (complexity > 10) {
      issues.push({
        type: 'complexity',
        severity: 'high',
        line: 0,
        description: 'High cyclomatic complexity',
        suggestion: 'Refactor complex functions into smaller ones',
        category: 'maintainability',
      });
    }

    // Generate strengths
    if (readability > 80) {
      strengths.push({
        type: 'readability',
        description: 'Good code readability with appropriate line lengths',
        impact: 'medium',
      });
    }

    if (bestPractices > 80) {
      strengths.push({
        type: 'best_practice',
        description: 'Follows language best practices',
        impact: 'high',
      });
    }

    const overallScore = (
      readability * 0.15 +
      (100 - complexity) * 0.2 +
      (100 - duplication) * 0.15 +
      documentation * 0.1 +
      bestPractices * 0.2 +
      styleConsistency * 0.1 +
      errorHandling * 0.05 +
      testability * 0.05
    );

    return {
      readability,
      maintainability: 100 - complexity,
      complexity,
      duplication,
      documentation,
      bestPractices,
      styleConsistency,
      errorHandling,
      testability,
      overallScore,
      issues,
      strengths,
    };
  }

  static calculateCyclomaticComplexity(code: string): number {
    let complexity = 1; // Base complexity
    
    const decisionKeywords = ['if', 'else', 'elif', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];
    
    code.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      decisionKeywords.forEach(keyword => {
        if (trimmedLine.includes(keyword)) {
          complexity++;
        }
      });
    });
    
    return complexity;
  }

  static detectDuplication(code: string): number {
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const lineMap = new Map<string, number>();
    
    lines.forEach(line => {
      const normalized = line.trim().toLowerCase();
      lineMap.set(normalized, (lineMap.get(normalized) || 0) + 1);
    });
    
    const duplicates = Array.from(lineMap.values()).filter(count => count > 1);
    const duplicateLines = duplicates.reduce((sum, count) => sum + (count - 1), 0);
    
    return lines.length > 0 ? (duplicateLines / lines.length) * 100 : 0;
  }

  static analyzeDocumentation(code: string): number {
    const lines = code.split('\n');
    let documentedLines = 0;
    let totalLines = 0;
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 0) {
        totalLines++;
        if (trimmedLine.includes('//') || trimmedLine.includes('/*') || trimmedLine.includes('*') || trimmedLine.includes('"""')) {
          documentedLines++;
        }
      }
    });
    
    return totalLines > 0 ? (documentedLines / totalLines) * 100 : 0;
  }

  static analyzeBestPractices(code: string, language: string): number {
    let score = 100;
    
    // Check for common anti-patterns
    if (code.includes('eval(')) score -= 20;
    if (code.includes('var ')) score -= 10;
    if (code.includes('== ')) score -= 5;
    if (!code.includes('const ') && !code.includes('let ')) score -= 15;
    
    return Math.max(0, score);
  }

  static analyzeStyleConsistency(code: string): number {
    const lines = code.split('\n');
    let consistentIndentation = true;
    let consistentSpacing = true;
    let indentationStyle = '';
    
    lines.forEach(line => {
      if (line.trim().length > 0) {
        const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';
        
        if (indentationStyle === '') {
          indentationStyle = leadingWhitespace;
        } else if (indentationStyle !== leadingWhitespace && leadingWhitespace.length > 0) {
          consistentIndentation = false;
        }
      }
    });
    
    return consistentIndentation ? 90 : 70;
  }

  static analyzeErrorHandling(code: string, language: string): number {
    let score = 50; // Base score
    
    if (code.includes('try') && code.includes('catch')) {
      score += 30;
    }
    
    if (code.includes('throw') || code.includes('raise')) {
      score += 20;
    }
    
    return Math.min(100, score);
  }

  static analyzeTestability(code: string): number {
    let score = 70; // Base score
    
    if (code.includes('function') || code.includes('def ')) {
      score += 10;
    }
    
    if (code.includes('return') && !code.includes('console.log') && !code.includes('print(')) {
      score += 10;
    }
    
    if (code.includes('module.exports') || code.includes('export ')) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  static generateOptimizationSuggestions(performance: CodePerformance): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Time complexity suggestions
    if (performance.metrics.timeComplexity.efficiency < 70) {
      suggestions.push({
        type: 'algorithm',
        priority: 'high',
        description: 'Consider optimizing your algorithm for better time complexity',
        example: 'Replace nested loops with a single loop or use a more efficient algorithm',
        expectedImprovement: '50-80% faster execution',
        difficulty: 'medium',
        estimatedTime: '30-60 minutes',
      });
    }
    
    // Memory usage suggestions
    if (performance.metrics.spaceComplexity.efficiency < 70) {
      suggestions.push({
        type: 'memory',
        priority: 'medium',
        description: 'Optimize memory usage by reducing unnecessary data structures',
        example: 'Use generators instead of lists where possible',
        expectedImprovement: '30-50% less memory usage',
        difficulty: 'easy',
        estimatedTime: '15-30 minutes',
      });
    }
    
    // Code quality suggestions
    if (performance.codeQuality.overallScore < 70) {
      suggestions.push({
        type: 'readability',
        priority: 'medium',
        description: 'Improve code readability for better maintainability',
        example: 'Add meaningful variable names and break down complex functions',
        expectedImprovement: 'Better code maintainability',
        difficulty: 'easy',
        estimatedTime: '20-40 minutes',
      });
    }
    
    return suggestions;
  }
}

// Performance analysis provider
export const PerformanceAnalysisProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [performances, setPerformances] = useState<CodePerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved performances
  useEffect(() => {
    const loadPerformances = async () => {
      try {
        setLoading(true);
        const savedPerformances = await AsyncStorage.getItem('@performances');
        
        if (savedPerformances) {
          setPerformances(JSON.parse(savedPerformances));
        }
      } catch (err) {
        setError('Failed to load performance data');
        console.error('Performance loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPerformances();
  }, []);

  const analyzeCodePerformance = useCallback(async (
    code: string,
    language: string,
    problemId: string,
    executionResults: any
  ): Promise<CodePerformance> => {
    try {
      const timeComplexity = CodeAnalyzer.analyzeComplexity(code, language);
      const codeQuality = CodeAnalyzer.analyzeCodeQuality(code, language);
      
      const performance: CodePerformance = {
        submissionId: `sub_${Date.now()}`,
        userId: 'current_user', // This would come from auth context
        problemId,
        language,
        code,
        timestamp: new Date().toISOString(),
        executionTime: executionResults.executionTime || 0,
        memoryUsage: executionResults.memoryUsage || 0,
        status: executionResults.status || 'success',
        score: executionResults.score || 0,
        testCasesPassed: executionResults.testCasesPassed || 0,
        totalTestCases: executionResults.totalTestCases || 1,
        metrics: {
          timeComplexity,
          spaceComplexity: {
            complexity: 'O(n)',
            analysis: 'Standard linear space complexity',
            actualMemory: executionResults.memoryUsage || 0,
            expectedMemory: 1000,
            efficiency: 85,
          },
          efficiency: Math.max(0, 100 - (executionResults.executionTime || 0) / 10),
          scalability: 75,
          resourceUtilization: 80,
          bottleneckAnalysis: {
            primaryBottleneck: 'Algorithm complexity',
            secondaryBottlenecks: ['Memory allocation'],
            impactLevel: 'medium',
            optimizationPotential: 60,
            recommendations: ['Optimize algorithm', 'Reduce memory allocations'],
          },
        },
        codeQuality,
        optimizationSuggestions: [],
        comparativeAnalysis: {
          userRank: 0,
          totalUsers: 100,
          percentile: 50,
          betterThan: 50,
          similarSolutions: 20,
          uniqueApproaches: [],
          commonPatterns: ['Standard approach'],
          improvementAreas: ['Algorithm efficiency'],
          strengths: ['Code structure'],
        },
        learningMetrics: {
          conceptUnderstanding: 70,
          problemSolvingSkills: 75,
          algorithmicThinking: 65,
          codeOrganization: 80,
          debuggingSkills: 70,
          optimizationAwareness: 60,
          learningVelocity: 1.2,
          masteryLevel: 'intermediate',
          nextLearningObjectives: ['Advanced algorithms', 'Data structures'],
        },
      };

      performance.optimizationSuggestions = CodeAnalyzer.generateOptimizationSuggestions(performance);

      // Save performance
      const updatedPerformances = [...performances, performance];
      setPerformances(updatedPerformances);
      await AsyncStorage.setItem('@performances', JSON.stringify(updatedPerformances));

      return performance;
    } catch (err) {
      setError('Failed to analyze code performance');
      console.error('Performance analysis error:', err);
      throw err;
    }
  }, [performances]);

  const getPerformanceHistory = useCallback((userId: string, problemId?: string): CodePerformance[] => {
    let filtered = performances.filter(p => p.userId === userId);
    
    if (problemId) {
      filtered = filtered.filter(p => p.problemId === problemId);
    }
    
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [performances]);

  const getPerformanceTrends = useCallback((userId: string): PerformanceTrends => {
    const userPerformances = getPerformanceHistory(userId);
    
    if (userPerformances.length < 2) {
      return {
        executionTimeTrend: 'stable',
        memoryUsageTrend: 'stable',
        scoreTrend: 'stable',
        codeQualityTrend: 'stable',
        learningVelocity: 0,
        masteryProgress: [],
        skillDevelopment: [],
      };
    }

    const recent = userPerformances.slice(0, 5);
    const older = userPerformances.slice(5, 10);

    const calculateTrend = (recentValues: number[], olderValues: number[]): 'improving' | 'stable' | 'declining' => {
      const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
      const olderAvg = olderValues.reduce((sum, val) => sum + val, 0) / olderValues.length;
      
      const difference = recentAvg - olderAvg;
      if (Math.abs(difference) < 5) return 'stable';
      return difference > 0 ? 'improving' : 'declining';
    };

    return {
      executionTimeTrend: calculateTrend(
        recent.map(p => p.executionTime),
        older.map(p => p.executionTime)
      ),
      memoryUsageTrend: calculateTrend(
        recent.map(p => p.memoryUsage),
        older.map(p => p.memoryUsage)
      ),
      scoreTrend: calculateTrend(
        recent.map(p => p.score),
        older.map(p => p.score)
      ),
      codeQualityTrend: calculateTrend(
        recent.map(p => p.codeQuality.overallScore),
        older.map(p => p.codeQuality.overallScore)
      ),
      learningVelocity: 1.2,
      masteryProgress: [],
      skillDevelopment: [],
    };
  }, [getPerformanceHistory]);

  const getComparativeAnalysis = useCallback((userId: string, problemId: string): ComparativeAnalysis => {
    const problemPerformances = performances.filter(p => p.problemId === problemId);
    const userPerformances = problemPerformances.filter(p => p.userId === userId);
    
    if (userPerformances.length === 0) {
      return {
        userRank: 0,
        totalUsers: 0,
        percentile: 0,
        betterThan: 0,
        similarSolutions: 0,
        uniqueApproaches: [],
        commonPatterns: [],
        improvementAreas: [],
        strengths: [],
      };
    }

    const userBestScore = Math.max(...userPerformances.map(p => p.score));
    const allScores = problemPerformances.map(p => p.score);
    const betterScores = allScores.filter(score => score < userBestScore).length;
    
    return {
      userRank: betterScores + 1,
      totalUsers: problemPerformances.length,
      percentile: (betterScores / problemPerformances.length) * 100,
      betterThan: (betterScores / problemPerformances.length) * 100,
      similarSolutions: Math.floor(problemPerformances.length * 0.3),
      uniqueApproaches: [],
      commonPatterns: ['Standard approach'],
      improvementAreas: ['Algorithm efficiency'],
      strengths: ['Code structure'],
    };
  }, [performances]);

  const getCodeQualityAnalysis = useCallback((code: string, language: string): CodeQualityMetrics => {
    return CodeAnalyzer.analyzeCodeQuality(code, language);
  }, []);

  const getOptimizationSuggestions = useCallback((performance: CodePerformance): OptimizationSuggestion[] => {
    return CodeAnalyzer.generateOptimizationSuggestions(performance);
  }, []);

  const getLearningMetrics = useCallback((userId: string): LearningMetrics => {
    const userPerformances = getPerformanceHistory(userId);
    
    if (userPerformances.length === 0) {
      return {
        conceptUnderstanding: 0,
        problemSolvingSkills: 0,
        algorithmicThinking: 0,
        codeOrganization: 0,
        debuggingSkills: 0,
        optimizationAwareness: 0,
        learningVelocity: 0,
        masteryLevel: 'beginner',
        nextLearningObjectives: [],
      };
    }

    const avgScore = userPerformances.reduce((sum, p) => sum + p.score, 0) / userPerformances.length;
    const avgCodeQuality = userPerformances.reduce((sum, p) => sum + p.codeQuality.overallScore, 0) / userPerformances.length;
    const avgEfficiency = userPerformances.reduce((sum, p) => sum + p.metrics.efficiency, 0) / userPerformances.length;

    return {
      conceptUnderstanding: avgScore,
      problemSolvingSkills: avgScore,
      algorithmicThinking: avgEfficiency,
      codeOrganization: avgCodeQuality,
      debuggingSkills: avgScore * 0.8, // Assumed based on score
      optimizationAwareness: avgEfficiency,
      learningVelocity: 1.2,
      masteryLevel: avgScore > 80 ? 'advanced' : avgScore > 60 ? 'intermediate' : 'beginner',
      nextLearningObjectives: ['Advanced algorithms', 'Data structures'],
    };
  }, [getPerformanceHistory]);

  const exportPerformanceData = useCallback(async (userId: string): Promise<string> => {
    const userPerformances = getPerformanceHistory(userId);
    const trends = getPerformanceTrends(userId);
    const learningMetrics = getLearningMetrics(userId);

    const exportData = {
      performances: userPerformances,
      trends,
      learningMetrics,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }, [getPerformanceHistory, getPerformanceTrends, getLearningMetrics]);

  return (
    <PerformanceAnalysisContext.Provider
      value={{
        performances,
        loading,
        error,
        analyzeCodePerformance,
        getPerformanceHistory,
        getPerformanceTrends,
        getComparativeAnalysis,
        getCodeQualityAnalysis,
        getOptimizationSuggestions,
        getLearningMetrics,
        exportPerformanceData,
      }}
    >
      {children}
    </PerformanceAnalysisContext.Provider>
  );
};

export const usePerformanceAnalysis = (): PerformanceAnalysisContextType => {
  const context = useContext(PerformanceAnalysisContext);
  if (!context) {
    throw new Error('usePerformanceAnalysis must be used within a PerformanceAnalysisProvider');
  }
  return context;
};

export default {
  PerformanceAnalysisProvider,
  usePerformanceAnalysis,
  CodeAnalyzer,
};
