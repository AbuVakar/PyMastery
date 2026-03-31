import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/DesignSystem';

// Internationalization types
export interface InternationalizationSystem {
  languages: Language[];
  translations: TranslationMap;
  currentLanguage: string;
  currentRegion: string;
  settings: I18nSettings;
  localization: LocalizationData;
  formatting: FormattingRules;
  rtl: RTLConfiguration;
  metrics: I18nMetrics;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  status: 'active' | 'beta' | 'deprecated';
  completeness: number; // 0-100
  contributors: Contributor[];
  lastUpdated: string;
  supportedFeatures: string[];
  culturalNotes: CulturalNote[];
}

export interface Contributor {
  userId: string;
  username: string;
  role: 'translator' | 'reviewer' | 'maintainer';
  contributions: number;
  lastActivity: string;
}

export interface CulturalNote {
  noteId: string;
  category: 'greeting' | 'formality' | 'color' | 'symbol' | 'custom';
  description: string;
  examples: string[];
  importance: 'low' | 'medium' | 'high';
}

export interface TranslationMap {
  [languageCode: string]: {
    [namespace: string]: {
      [key: string]: string | TranslationObject;
    };
  };
}

export interface TranslationObject {
  singular: string;
  plural?: string;
  context?: string;
  description?: string;
  variables?: string[];
  examples?: string[];
}

export interface I18nSettings {
  defaultLanguage: string;
  fallbackLanguage: string;
  autoDetect: boolean;
  rtlSupport: boolean;
  pluralRules: PluralRule[];
  dateFormats: DateFormat[];
  numberFormats: NumberFormat[];
  currencyFormats: CurrencyFormat[];
  timeFormats: TimeFormat[];
  measurementSystems: MeasurementSystem[];
}

export interface PluralRule {
  language: string;
  rule: string;
  categories: PluralCategory[];
  examples: PluralExample[];
}

export interface PluralCategory {
  category: 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
  condition: string;
  example: string;
}

export interface PluralExample {
  count: number;
  category: string;
  example: string;
}

export interface DateFormat {
  locale: string;
  formats: DateFormatPattern[];
  examples: DateExample[];
}

export interface DateFormatPattern {
  name: string;
  pattern: string;
  description: string;
  example: string;
}

export interface DateExample {
  date: string;
  format: string;
  result: string;
}

export interface NumberFormat {
  locale: string;
  decimal: number;
  thousands: string;
  grouping: number;
  currency: string;
  precision: number;
  patterns: NumberPattern[];
}

export interface NumberPattern {
  type: 'decimal' | 'currency' | 'percent' | 'scientific';
  pattern: string;
  example: string;
}

export interface CurrencyFormat {
  code: string;
  symbol: string;
  locale: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  patterns: CurrencyPattern[];
}

export interface CurrencyPattern {
  amount: number;
  format: string;
  result: string;
}

export interface TimeFormat {
  locale: string;
  hour12: boolean;
  separator: string;
  formats: TimePattern[];
}

export interface TimePattern {
  name: string;
  pattern: string;
  description: string;
  example: string;
}

export interface MeasurementSystem {
  type: 'metric' | 'imperial' | 'custom';
  locale: string;
  units: MeasurementUnit[];
}

export interface MeasurementUnit {
  type: 'length' | 'weight' | 'volume' | 'temperature' | 'area' | 'speed';
  baseUnit: string;
  conversions: UnitConversion[];
}

export interface UnitConversion {
  from: string;
  to: string;
  factor: number;
  offset?: number;
}

export interface LocalizationData {
  region: string;
  locale: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  measurementSystem: string;
  weekStart: number; // 0-6 (Sunday-Saturday)
  firstDayOfWeek: string;
  weekendDays: number[];
  holidays: Holiday[];
  businessHours: BusinessHours;
  cultural: CulturalSettings;
}

export interface Holiday {
  id: string;
  name: string;
  type: 'public' | 'religious' | 'cultural' | 'observance';
  date: string;
  recurring: boolean;
  recurringPattern?: RecurringPattern;
  observed: boolean;
  regions: string[];
  description: string;
}

export interface RecurringPattern {
  type: 'annual' | 'monthly' | 'weekly' | 'custom';
  rule: string;
  exceptions: string[];
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  timezone: string;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
  breaks: Break[];
}

export interface Break {
  start: string;
  end: string;
  description: string;
}

export interface CulturalSettings {
  greeting: GreetingStyle;
  formality: FormalityLevel;
  color: ColorPreferences;
  symbols: SymbolPreferences;
  content: ContentPreferences;
  communication: CommunicationPreferences;
  ui: UIPreferences;
}

export interface GreetingStyle {
  formal: string;
  informal: string;
  casual: string;
  business: string;
}

export interface FormalityLevel {
  level: 'very_formal' | 'formal' | 'semi_formal' | 'casual' | 'very_casual';
  context: string;
  examples: string[];
}

export interface ColorPreferences {
  primary: string[];
  secondary: string[];
  avoid: string[];
  cultural: ColorCultural[];
}

export interface ColorCultural {
  color: string;
  meaning: string;
  usage: string[];
  avoid: boolean;
}

export interface SymbolPreferences {
  religious: SymbolReligious[];
  cultural: SymbolCultural[];
  business: SymbolBusiness[];
}

export interface SymbolReligious {
  symbol: string;
  religion: string;
  meaning: string;
  usage: string[];
  avoid: boolean;
}

export interface SymbolCultural {
  symbol: string;
  culture: string;
  meaning: string;
  usage: string[];
  avoid: boolean;
}

export interface SymbolBusiness {
  symbol: string;
  industry: string;
  meaning: string;
  usage: string[];
  avoid: boolean;
}

export interface ContentPreferences {
  topics: string[];
  avoid: string[];
  sensitivity: ContentSensitivity[];
  examples: ContentExample[];
}

export interface ContentSensitivity {
  topic: string;
  sensitivity: 'low' | 'medium' | 'high' | 'cultural';
  description: string;
  guidelines: string[];
}

export interface ContentExample {
  topic: string;
  appropriate: string;
  inappropriate: string;
  reason: string;
}

export interface CommunicationPreferences {
  tone: CommunicationTone;
  formality: CommunicationFormality;
  directness: CommunicationDirectness;
  timing: CommunicationTiming;
  channels: CommunicationChannel[];
}

export interface CommunicationTone {
  professional: string;
  friendly: string;
  casual: string;
  formal: string;
}

export interface CommunicationFormality {
  very_formal: string;
  formal: string;
  semi_formal: string;
  casual: string;
  very_casual: string;
}

export interface CommunicationDirectness {
  direct: string;
  indirect: string;
  context: string;
}

export interface CommunicationChannel {
  channel: 'email' | 'phone' | 'chat' | 'video' | 'in_person';
  preference: 'preferred' | 'acceptable' | 'avoid';
  context: string;
}

export interface UIPreferences {
  layout: UILayout;
  colors: UIColors;
  typography: UITypography;
  icons: UIIcons;
  gestures: UIGestures;
  navigation: UINavigation;
}

export interface UILayout {
  density: 'compact' | 'normal' | 'spacious';
  direction: 'ltr' | 'rtl';
  alignment: 'left' | 'right' | 'center';
  spacing: SpacingPreferences;
}

export interface SpacingPreferences {
  small: number;
  medium: number;
  large: number;
  extra_large: number;
}

export interface UIColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface UITypography {
  fontFamily: string;
  fontSize: FontSize;
  fontWeight: FontWeight;
  lineHeight: number;
  letterSpacing: number;
}

export interface FontSize {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface FontWeight {
  light: number;
  normal: number;
  medium: number;
  bold: number;
  extra_bold: number;
}

export interface UIIcons {
  style: 'outlined' | 'filled' | 'rounded' | 'sharp';
  size: IconSize;
  density: 'low' | 'medium' | 'high';
}

export interface IconSize {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface UIGestures {
  swipe: SwipeGesture;
  tap: TapGesture;
  scroll: ScrollGesture;
  pinch: PinchGesture;
}

export interface SwipeGesture {
  direction: 'horizontal' | 'vertical' | 'both';
  sensitivity: 'low' | 'medium' | 'high';
  feedback: boolean;
}

export interface TapGesture {
  duration: 'short' | 'medium' | 'long';
  feedback: boolean;
  haptic: boolean;
}

export interface ScrollGesture {
  direction: 'vertical' | 'horizontal' | 'both';
  sensitivity: 'low' | 'medium' | 'high';
  momentum: boolean;
}

export interface PinchGesture {
  sensitivity: 'low' | 'medium' | 'high';
  feedback: boolean;
}

export interface UINavigation {
  style: 'tabs' | 'drawer' | 'stack' | 'bottom_sheets';
  position: 'top' | 'bottom' | 'left' | 'right';
  back_button: 'left' | 'right';
  gestures: boolean;
}

export interface FormattingRules {
  numbers: NumberFormattingRules;
  dates: DateFormattingRules;
  times: TimeFormattingRules;
  currency: CurrencyFormattingRules;
  addresses: AddressFormattingRules;
  phone: PhoneFormattingRules;
  names: NameFormattingRules;
}

export interface NumberFormattingRules {
  decimalSeparator: string;
  thousandsSeparator: string;
  grouping: number;
  precision: number;
  negative: NegativeNumberFormat;
  patterns: NumberFormatPattern[];
}

export interface NegativeNumberFormat {
  prefix: string;
  suffix: string;
  style: 'parentheses' | 'minus_sign' | 'red';
}

export interface NumberFormatPattern {
  type: 'decimal' | 'currency' | 'percent' | 'scientific';
  pattern: string;
  example: string;
}

export interface DateFormattingRules {
  separator: string;
  order: 'dmy' | 'mdy' | 'ymd';
  monthFormat: 'numeric' | 'short' | 'long';
  dayFormat: 'numeric' | 'short' | 'long';
  yearFormat: '2_digit' | '4_digit';
  patterns: DateFormatPattern[];
}

export interface DateFormatPattern {
  name: string;
  pattern: string;
  description: string;
  example: string;
}

export interface TimeFormattingRules {
  separator: string;
  hour12: boolean;
  hourFormat: '12' | '24';
  minuteFormat: '2_digit' | 'numeric';
  secondFormat: '2_digit' | 'numeric';
  ampm: 'AM/PM' | 'am/pm' | 'A/P';
  patterns: TimeFormatPattern[];
}

export interface TimeFormatPattern {
  name: string;
  pattern: string;
  description: string;
  example: string;
}

export interface CurrencyFormattingRules {
  symbol: string;
  code: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  patterns: CurrencyFormatPattern[];
}

export interface CurrencyFormatPattern {
  amount: number;
  format: string;
  result: string;
}

export interface AddressFormattingRules {
  order: AddressOrder[];
  separators: AddressSeparator[];
  components: AddressComponent[];
  examples: AddressExample[];
}

export interface AddressOrder {
  component: string;
  order: number;
  required: boolean;
}

export interface AddressSeparator {
  type: 'line' | 'component';
  separator: string;
}

export interface AddressComponent {
  name: string;
  label: string;
  required: boolean;
  format: string;
}

export interface AddressExample {
  type: 'residential' | 'business' | 'postal';
  format: string;
  example: string;
}

export interface PhoneFormattingRules {
  country: string;
  code: string;
  pattern: string;
  format: string;
  international: boolean;
  examples: PhoneExample[];
}

export interface PhoneExample {
  number: string;
  formatted: string;
  type: 'mobile' | 'landline' | 'toll_free';
}

export interface NameFormattingRules {
  order: NameOrder[];
  separators: NameSeparator[];
  components: NameComponent[];
  examples: NameExample[];
}

export interface NameOrder {
  component: string;
  order: number;
  required: boolean;
}

export interface NameSeparator {
  type: 'component' | 'suffix';
  separator: string;
}

export interface NameComponent {
  name: string;
  label: string;
  required: boolean;
  format: string;
}

export interface NameExample {
  type: 'full_name' | 'formal' | 'informal';
  format: string;
  example: string;
}

export interface RTLConfiguration {
  enabled: boolean;
  languages: string[];
  rules: RTLRules;
  exceptions: RTLException[];
  testing: RTLTesting;
}

export interface RTLRules {
  textDirection: 'rtl' | 'ltr';
  textAlign: 'right' | 'left' | 'start' | 'end';
  margin: 'margin_start' | 'margin_end' | 'margin_left' | 'margin_right';
  padding: 'padding_start' | 'padding_end' | 'padding_left' | 'padding_right';
  border: 'border_start' | 'border_end' | 'border_left' | 'border_right';
  float: 'float_start' | 'float_end' | 'float_left' | 'float_right';
}

export interface RTLException {
  language: string;
  component: string;
  rule: string;
  reason: string;
}

export interface RTLTesting {
  testCases: RTLTestCase[];
  visual: RTLVisualTest[];
  interaction: RTLInteractionTest[];
}

export interface RTLTestCase {
  name: string;
  description: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface RTLVisualTest {
  component: string;
  screenshot: string;
  direction: 'rtl' | 'ltr';
  passed: boolean;
}

export interface RTLInteractionTest {
  component: string;
  action: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface I18nMetrics {
  usage: UsageMetrics;
  quality: QualityMetrics;
  performance: PerformanceMetrics;
  coverage: CoverageMetrics;
  feedback: FeedbackMetrics;
}

export interface UsageMetrics {
  totalUsers: number;
  activeUsers: number;
  languageDistribution: LanguageDistribution[];
  featureUsage: FeatureUsage[];
  errors: ErrorMetrics[];
}

export interface LanguageDistribution {
  language: string;
  users: number;
  percentage: number;
  growth: number;
}

export interface FeatureUsage {
  feature: string;
  usage: number;
  languages: string[];
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByLanguage: ErrorByLanguage[];
  errorsByFeature: ErrorByFeature[];
}

export interface ErrorByLanguage {
  language: string;
  errors: number;
  types: ErrorType[];
}

export interface ErrorByFeature {
  feature: string;
  errors: number;
  languages: string[];
}

export interface ErrorType {
  type: 'missing_translation' | 'formatting_error' | 'rtl_issue' | 'cultural_sensitivity';
  count: number;
}

export interface QualityMetrics {
  translationQuality: TranslationQuality[];
  completeness: CompletenessMetrics;
  consistency: ConsistencyMetrics;
  cultural: CulturalQualityMetrics;
}

export interface TranslationQuality {
  language: string;
  quality: number; // 0-100
  issues: QualityIssue[];
  reviews: TranslationReview[];
}

export interface QualityIssue {
  issueId: string;
  type: 'grammar' | 'spelling' | 'context' | 'cultural' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  key: string;
  suggested: string;
}

export interface TranslationReview {
  reviewId: string;
  reviewer: string;
  rating: number; // 1-5
  comment: string;
  timestamp: string;
}

export interface CompletenessMetrics {
  overall: number; // 0-100
  byLanguage: LanguageCompleteness[];
  byFeature: FeatureCompleteness[];
  byNamespace: NamespaceCompleteness[];
}

export interface LanguageCompleteness {
  language: string;
  completeness: number;
  missing: MissingTranslation[];
}

export interface MissingTranslation {
  namespace: string;
  key: string;
  context: string;
}

export interface FeatureCompleteness {
  feature: string;
  completeness: number;
  languages: string[];
}

export interface NamespaceCompleteness {
  namespace: string;
  completeness: number;
  languages: string[];
}

export interface ConsistencyMetrics {
  overall: number; // 0-100
  inconsistencies: ConsistencyIssue[];
  patterns: ConsistencyPattern[];
}

export interface ConsistencyIssue {
  issueId: string;
  type: 'terminology' | 'formatting' | 'style' | 'cultural';
  severity: 'low' | 'medium' | 'high';
  description: string;
  examples: string[];
}

export interface ConsistencyPattern {
  pattern: string;
  occurrences: number;
  languages: string[];
}

export interface CulturalQualityMetrics {
  sensitivity: CulturalSensitivity[];
  appropriateness: CulturalAppropriateness[];
  feedback: CulturalFeedback[];
}

export interface CulturalSensitivity {
  issueId: string;
  type: 'religious' | 'political' | 'cultural' | 'historical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  key: string;
  context: string;
}

export interface CulturalAppropriateness {
  aspect: string;
  appropriateness: number; // 0-100
  feedback: string[];
}

export interface CulturalFeedback {
  feedbackId: string;
  user: string;
  rating: number; // 1-5
  comment: string;
  timestamp: string;
}

export interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
  errors: PerformanceError[];
  optimization: OptimizationOpportunity[];
}

export interface PerformanceError {
  errorId: string;
  type: 'load' | 'parse' | 'render' | 'memory';
  description: string;
  timestamp: string;
  impact: 'low' | 'medium' | 'high';
}

export interface OptimizationOpportunity {
  opportunityId: string;
  area: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedGain: number;
}

export interface CoverageMetrics {
  languageCoverage: LanguageCoverage[];
  featureCoverage: FeatureCoverage[];
  regionCoverage: RegionCoverage[];
}

export interface LanguageCoverage {
  language: string;
  coverage: number; // 0-100
  features: string[];
  missing: string[];
}

export interface FeatureCoverage {
  feature: string;
  coverage: number; // 0-100
  languages: string[];
  missing: string[];
}

export interface RegionCoverage {
  region: string;
  coverage: number; // 0-100
  languages: string[];
  features: string[];
}

export interface FeedbackMetrics {
  totalFeedback: number;
  averageRating: number;
  feedbackByType: FeedbackByType[];
  feedbackByLanguage: FeedbackByLanguage[];
  trends: FeedbackTrend[];
}

export interface FeedbackByType {
  type: 'translation' | 'formatting' | 'cultural' | 'ui' | 'performance';
  count: number;
  averageRating: number;
}

export interface FeedbackByLanguage {
  language: string;
  count: number;
  averageRating: number;
  issues: string[];
}

export interface FeedbackTrend {
  period: string;
  rating: number;
  feedback: number;
  issues: string[];
}

// Internationalization context
interface I18nContextType {
  system: InternationalizationSystem;
  loading: boolean;
  error: string | null;
  currentLanguage: string;
  currentRegion: string;
  supportedLanguages: Language[];
  translations: TranslationMap;
  setLanguage: (language: string) => Promise<void>;
  setRegion: (region: string) => Promise<void>;
  translate: (key: string, namespace?: string, variables?: Record<string, any>) => string;
  translatePlural: (key: string, count: number, namespace?: string, variables?: Record<string, any>) => string;
  formatDate: (date: Date, format?: string) => string;
  formatNumber: (number: number, format?: string) => string;
  formatCurrency: (amount: number, currency?: string, format?: string) => string;
  formatTime: (date: Date, format?: string) => string;
  formatRelativeTime: (date: Date) => string;
  isRTL: () => boolean;
  getDirection: () => 'ltr' | 'rtl';
  getLocale: () => string;
  getTimezone: () => string;
  getCurrency: () => string;
  getMeasurementSystem: () => string;
  getDateFormat: () => string;
  getTimeFormat: () => string;
  loadTranslations: (language: string, namespace?: string) => Promise<void>;
  updateTranslations: (language: string, namespace: string, translations: Record<string, any>) => Promise<void>;
  addLanguage: (language: Language) => Promise<void>;
  removeLanguage: (language: string) => Promise<void>;
  getLanguageProgress: (language: string) => number;
  exportTranslations: (language: string, format: 'json' | 'csv') => Promise<string>;
  importTranslations: (language: string, data: string, format: 'json' | 'csv') => Promise<void>;
  validateTranslations: (language: string) => Promise<ValidationResult>;
  getMetrics: () => I18nMetrics;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  completeness: number;
  consistency: number;
  quality: number;
}

export interface ValidationIssue {
  type: 'missing' | 'format' | 'consistency' | 'cultural';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  key: string;
  suggestion?: string;
}

// Internationalization engine
class I18nEngine {
  static async initializeI18n(): Promise<InternationalizationSystem> {
    // Load supported languages
    const languages = await this.loadSupportedLanguages();
    
    // Load current settings
    const settings = await this.loadI18nSettings();
    
    // Detect user language
    const detectedLanguage = this.detectUserLanguage();
    const currentLanguage = settings.autoDetect ? detectedLanguage : settings.defaultLanguage;
    
    // Load translations
    const translations = await this.loadTranslations(currentLanguage);
    
    // Load localization data
    const localization = await this.loadLocalization(currentLanguage);
    
    // Load formatting rules
    const formatting = await this.loadFormattingRules(currentLanguage);
    
    // Load RTL configuration
    const rtl = await this.loadRTLConfiguration(currentLanguage);
    
    // Load metrics
    const metrics = await this.loadI18nMetrics();

    return {
      languages,
      translations,
      currentLanguage,
      currentRegion: localization.region,
      settings,
      localization,
      formatting,
      rtl,
      metrics,
    };
  }

  static async loadSupportedLanguages(): Promise<Language[]> {
    // Mock implementation - would load from API or local storage
    return [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        region: 'US',
        flag: '🇺🇸',
        direction: 'ltr',
        status: 'active',
        completeness: 100,
        contributors: [],
        lastUpdated: new Date().toISOString(),
        supportedFeatures: ['all'],
        culturalNotes: [],
      },
      {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        region: 'ES',
        flag: '🇪🇸',
        direction: 'ltr',
        status: 'active',
        completeness: 95,
        contributors: [],
        lastUpdated: new Date().toISOString(),
        supportedFeatures: ['all'],
        culturalNotes: [],
      },
      {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        region: 'FR',
        flag: '🇫🇷',
        direction: 'ltr',
        status: 'active',
        completeness: 90,
        contributors: [],
        lastUpdated: new Date().toISOString(),
        supportedFeatures: ['all'],
        culturalNotes: [],
      },
      {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        region: 'DE',
        flag: '🇩🇪',
        direction: 'ltr',
        status: 'active',
        completeness: 85,
        contributors: [],
        lastUpdated: new Date().toISOString(),
        supportedFeatures: ['all'],
        culturalNotes: [],
      },
      {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        region: 'JP',
        flag: '🇯🇵',
        direction: 'ltr',
        status: 'active',
        completeness: 80,
        contributors: [],
        lastUpdated: new Date().toISOString(),
        supportedFeatures: ['all'],
        culturalNotes: [],
      },
      {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        region: 'CN',
        flag: '🇨🇳',
        direction: 'ltr',
        status: 'active',
        completeness: 75,
        contributors: [],
        lastUpdated: new Date().toISOString(),
        supportedFeatures: ['all'],
        culturalNotes: [],
      },
      {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        region: 'SA',
        flag: '🇸🇦',
        direction: 'rtl',
        status: 'active',
        completeness: 70,
        contributors: [],
        lastUpdated: new Date().toISOString(),
        supportedFeatures: ['all'],
        culturalNotes: [],
      },
    ];
  }

  static async loadI18nSettings(): Promise<I18nSettings> {
    // Mock implementation - would load from storage or API
    return {
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      autoDetect: true,
      rtlSupport: true,
      pluralRules: [],
      dateFormats: [],
      numberFormats: [],
      currencyFormats: [],
      timeFormats: [],
      measurementSystems: [],
    };
  }

  static detectUserLanguage(): string {
    // Detect from browser/locale
    if (typeof navigator !== 'undefined') {
      const browserLanguage = navigator.language || (navigator as any).userLanguage;
      if (browserLanguage) {
        const languageCode = browserLanguage.split('-')[0];
        return languageCode;
      }
    }
    
    // Fallback to device locale
    return 'en';
  }

  static async loadTranslations(language: string): Promise<TranslationMap> {
    // Mock implementation - would load from API or local storage
    return {
      [language]: {
        common: {
          hello: 'Hello',
          goodbye: 'Goodbye',
          welcome: 'Welcome',
          error: 'Error',
          success: 'Success',
          loading: 'Loading...',
          cancel: 'Cancel',
          confirm: 'Confirm',
          save: 'Save',
          delete: 'Delete',
          edit: 'Edit',
          add: 'Add',
          remove: 'Remove',
          search: 'Search',
          filter: 'Filter',
          sort: 'Sort',
          next: 'Next',
          previous: 'Previous',
          submit: 'Submit',
          reset: 'Reset',
          clear: 'Clear',
          select: 'Select',
          choose: 'Choose',
          back: 'Back',
          forward: 'Forward',
          home: 'Home',
          settings: 'Settings',
          profile: 'Profile',
          logout: 'Logout',
          login: 'Login',
          register: 'Register',
          signup: 'Sign Up',
          signin: 'Sign In',
          forgot_password: 'Forgot Password',
          reset_password: 'Reset Password',
          change_password: 'Change Password',
          email: 'Email',
          password: 'Password',
          username: 'Username',
          name: 'Name',
          first_name: 'First Name',
          last_name: 'Last Name',
          phone: 'Phone',
          address: 'Address',
          city: 'City',
          country: 'Country',
          state: 'State',
          zip: 'Zip Code',
          birthday: 'Birthday',
          gender: 'Gender',
          age: 'Age',
          height: 'Height',
          weight: 'Weight',
          language: 'Language',
          timezone: 'Timezone',
          currency: 'Currency',
          date_of_birth: 'Date of Birth',
          phone_number: 'Phone Number',
          email_address: 'Email Address',
          postal_code: 'Postal Code',
          street_address: 'Street Address',
          mailing_address: 'Mailing Address',
          billing_address: 'Billing Address',
          shipping_address: 'Shipping Address',
          home_address: 'Home Address',
          work_address: 'Work Address',
        },
        navigation: {
          dashboard: 'Dashboard',
          courses: 'Courses',
          lessons: 'Lessons',
          exercises: 'Exercises',
          progress: 'Progress',
          achievements: 'Achievements',
          profile: 'Profile',
          settings: 'Settings',
          help: 'Help',
          about: 'About',
          contact: 'Contact',
          privacy: 'Privacy',
          terms: 'Terms',
          faq: 'FAQ',
          support: 'Support',
          feedback: 'Feedback',
          logout: 'Logout',
        },
        courses: {
          title: 'Courses',
          description: 'Description',
          duration: 'Duration',
          difficulty: 'Difficulty',
          level: 'Level',
          category: 'Category',
          instructor: 'Instructor',
          students: 'Students',
          rating: 'Rating',
          reviews: 'Reviews',
          enroll: 'Enroll',
          enrolled: 'Enrolled',
          start: 'Start',
          continue: 'Continue',
          complete: 'Complete',
          completed: 'Completed',
          progress: 'Progress',
          certificate: 'Certificate',
          prerequisites: 'Prerequisites',
          objectives: 'Objectives',
          outcomes: 'Outcomes',
          materials: 'Materials',
          resources: 'Resources',
          discussion: 'Discussion',
          announcements: 'Announcements',
          assignments: 'Assignments',
          quizzes: 'Quizzes',
          exams: 'Exams',
          projects: 'Projects',
          grades: 'Grades',
          feedback: 'Feedback',
        },
        lessons: {
          title: 'Lesson',
          description: 'Description',
          content: 'Content',
          video: 'Video',
          audio: 'Audio',
          text: 'Text',
          code: 'Code',
          example: 'Example',
          exercise: 'Exercise',
          quiz: 'Quiz',
          assignment: 'Assignment',
          project: 'Project',
          discussion: 'Discussion',
          notes: 'Notes',
          bookmarks: 'Bookmarks',
          progress: 'Progress',
          completed: 'Completed',
          next: 'Next',
          previous: 'Previous',
          mark_complete: 'Mark Complete',
          bookmark: 'Bookmark',
          share: 'Share',
          download: 'Download',
          print: 'Print',
        },
        exercises: {
          title: 'Exercise',
          description: 'Description',
          instructions: 'Instructions',
          code: 'Code',
          solution: 'Solution',
          hint: 'Hint',
          test: 'Test',
          run: 'Run',
          reset: 'Reset',
          submit: 'Submit',
          result: 'Result',
          passed: 'Passed',
          failed: 'Failed',
          score: 'Score',
          attempts: 'Attempts',
          feedback: 'Feedback',
          help: 'Help',
          save: 'Save',
          load: 'Load',
          clear: 'Clear',
        },
        errors: {
          network_error: 'Network Error',
          server_error: 'Server Error',
          validation_error: 'Validation Error',
          authentication_error: 'Authentication Error',
          authorization_error: 'Authorization Error',
          not_found: 'Not Found',
          access_denied: 'Access Denied',
          timeout_error: 'Timeout Error',
          unknown_error: 'Unknown Error',
          try_again: 'Please try again',
          contact_support: 'Please contact support',
        },
        success: {
          saved: 'Saved successfully',
          updated: 'Updated successfully',
          deleted: 'Deleted successfully',
          created: 'Created successfully',
          completed: 'Completed successfully',
          submitted: 'Submitted successfully',
          uploaded: 'Uploaded successfully',
          downloaded: 'Downloaded successfully',
          sent: 'Sent successfully',
          received: 'Received successfully',
        },
      },
    };
  }

  static async loadLocalization(language: string): Promise<LocalizationData> {
    // Mock implementation - would load from API or local storage
    return {
      region: 'US',
      locale: 'en-US',
      timezone: 'America/New_York',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12-hour',
      numberFormat: '1,234.56',
      measurementSystem: 'imperial',
      weekStart: 0,
      firstDayOfWeek: 'Sunday',
      weekendDays: [0, 6],
      holidays: [],
      businessHours: {
        monday: { open: '09:00', close: '17:00', closed: false, breaks: [] },
        tuesday: { open: '09:00', close: '17:00', closed: false, breaks: [] },
        wednesday: { open: '09:00', close: '17:00', closed: false, breaks: [] },
        thursday: { open: '09:00', close: '17:00', closed: false, breaks: [] },
        friday: { open: '09:00', close: '17:00', closed: false, breaks: [] },
        saturday: { open: '09:00', close: '13:00', closed: false, breaks: [] },
        sunday: { open: '', close: '', closed: true, breaks: [] },
        timezone: 'America/New_York',
      },
      cultural: {
        greeting: {
          formal: 'Dear {name}',
          informal: 'Hi {name}',
          casual: 'Hey {name}',
          business: 'Dear {name}',
        },
        formality: {
          level: 'formal',
          context: 'Professional communication',
          examples: ['Dear Sir/Madam', 'Yours sincerely'],
        },
        color: {
          primary: ['#007bff', '#28a745', '#dc3545', '#ffc107'],
          secondary: ['#6c757d', '#17a2b8', '#343a40'],
          avoid: ['#000000', '#ffffff'],
          cultural: [],
        },
        symbols: {
          religious: [],
          cultural: [],
          business: [],
        },
        content: {
          topics: ['programming', 'technology', 'education'],
          avoid: ['politics', 'religion'],
          sensitivity: [],
          examples: [],
        },
        communication: {
          tone: {
            professional: 'Professional',
            friendly: 'Friendly',
            casual: 'Casual',
            formal: 'Formal',
          },
          formality: {
            very_formal: 'Very Formal',
            formal: 'Formal',
            semi_formal: 'Semi Formal',
            casual: 'Casual',
            very_casual: 'Very Casual',
          },
          directness: {
            direct: 'Direct',
            indirect: 'Indirect',
            context: 'Business context',
          },
          timing: {
            business_hours: 'During business hours',
            after_hours: 'After business hours',
          },
          channels: [
            { channel: 'email', preference: 'preferred', context: 'Formal communication' },
            { channel: 'phone', preference: 'acceptable', context: 'Urgent matters' },
            { channel: 'chat', preference: 'acceptable', context: 'Quick questions' },
            { channel: 'video', preference: 'acceptable', context: 'Meetings' },
            { channel: 'in_person', preference: 'preferred', context: 'Important discussions' },
          ],
        },
        ui: {
          layout: {
            density: 'normal',
            direction: 'ltr',
            alignment: 'left',
            spacing: {
              small: 8,
              medium: 16,
              large: 24,
              extra_large: 32,
            },
          },
          colors: {
            primary: '#007bff',
            secondary: '#6c757d',
            accent: '#17a2b8',
            background: '#ffffff',
            text: '#212529',
            error: '#dc3545',
            warning: '#ffc107',
            success: '#28a745',
            info: '#17a2b8',
          },
          typography: {
            fontFamily: 'Arial, sans-serif',
            fontSize: {
              xs: 12,
              sm: 14,
              md: 16,
              lg: 18,
              xl: 20,
              xxl: 24,
            },
            fontWeight: {
              light: 300,
              normal: 400,
              medium: 500,
              bold: 700,
              extra_bold: 900,
            },
            lineHeight: 1.5,
            letterSpacing: 0,
          },
          icons: {
            style: 'outlined',
            size: {
              xs: 16,
              sm: 20,
              md: 24,
              lg: 32,
              xl: 40,
            },
            density: 'medium',
          },
          gestures: {
            swipe: {
              direction: 'horizontal',
              sensitivity: 'medium',
              feedback: true,
            },
            tap: {
              duration: 'short',
              feedback: true,
              haptic: true,
            },
            scroll: {
              direction: 'vertical',
              sensitivity: 'medium',
              momentum: true,
            },
            pinch: {
              sensitivity: 'medium',
              feedback: true,
            },
          },
          navigation: {
            style: 'tabs',
            position: 'bottom',
            back_button: 'left',
            gestures: true,
          },
        },
      },
    };
  }

  static async loadFormattingRules(language: string): Promise<FormattingRules> {
    // Mock implementation - would load from API or local storage
    return {
      numbers: {
        decimalSeparator: '.',
        thousandsSeparator: ',',
        grouping: 3,
        precision: 2,
        negative: {
          prefix: '-',
          suffix: '',
          style: 'minus_sign',
        },
        patterns: [],
      },
      dates: {
        separator: '/',
        order: 'mdy',
        monthFormat: 'numeric',
        dayFormat: 'numeric',
        yearFormat: '4_digit',
        patterns: [],
      },
      times: {
        separator: ':',
        hour12: true,
        hourFormat: '12',
        minuteFormat: '2_digit',
        secondFormat: '2_digit',
        ampm: 'AM/PM',
        patterns: [],
      },
      currency: {
        symbol: '$',
        code: 'USD',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        patterns: [],
      },
      addresses: {
        order: [],
        separators: [],
        components: [],
        examples: [],
      },
      phone: {
        country: 'US',
        code: '+1',
        pattern: '(XXX) XXX-XXXX',
        format: '+1 (XXX) XXX-XXXX',
        international: true,
        examples: [],
      },
      names: {
        order: [],
        separators: [],
        components: [],
        examples: [],
      },
    };
  }

  static async loadRTLConfiguration(language: string): Promise<RTLConfiguration> {
    // Mock implementation - would load from API or local storage
    const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi'];
    
    return {
      enabled: true,
      languages: rtlLanguages,
      rules: {
        textDirection: rtlLanguages.includes(language) ? 'rtl' : 'ltr',
        textAlign: rtlLanguages.includes(language) ? 'right' : 'left',
        margin: rtlLanguages.includes(language) ? 'margin_start' : 'margin_left',
        padding: rtlLanguages.includes(language) ? 'padding_start' : 'padding_left',
        border: rtlLanguages.includes(language) ? 'border_start' : 'border_left',
        float: rtlLanguages.includes(language) ? 'float_start' : 'float_left',
      },
      exceptions: [],
      testing: {
        testCases: [],
        visual: [],
        interaction: [],
      },
    };
  }

  static async loadI18nMetrics(): Promise<I18nMetrics> {
    // Mock implementation - would calculate actual metrics
    return {
      usage: {
        totalUsers: 1000,
        activeUsers: 800,
        languageDistribution: [
          { language: 'en', users: 600, percentage: 60, growth: 5 },
          { language: 'es', users: 200, percentage: 20, growth: 10 },
          { language: 'fr', users: 100, percentage: 10, growth: 8 },
          { language: 'de', users: 50, percentage: 5, growth: 6 },
          { language: 'ja', users: 30, percentage: 3, growth: 12 },
          { language: 'zh', users: 15, percentage: 1.5, growth: 15 },
          { language: 'ar', users: 5, percentage: 0.5, growth: 20 },
        ],
        featureUsage: [],
        errors: [],
      },
      quality: {
        translationQuality: [],
        completeness: {
          overall: 85,
          byLanguage: [],
          byFeature: [],
          byNamespace: [],
        },
        consistency: {
          overall: 90,
          inconsistencies: [],
          patterns: [],
        },
        cultural: {
          sensitivity: [],
          appropriateness: [],
          feedback: [],
        },
      },
      performance: {
        loadTime: 100,
        memoryUsage: 50,
        bundleSize: 200,
        cacheHitRate: 95,
        errors: [],
        optimization: [],
      },
      coverage: {
        languageCoverage: [],
        featureCoverage: [],
        regionCoverage: [],
      },
      feedback: {
        totalFeedback: 100,
        averageRating: 4.2,
        feedbackByType: [],
        feedbackByLanguage: [],
        trends: [],
      },
    };
  }

  static async setLanguage(language: string): Promise<void> {
    // Implementation for setting language
    console.log(`Setting language to: ${language}`);
  }

  static async setRegion(region: string): Promise<void> {
    // Implementation for setting region
    console.log(`Setting region to: ${region}`);
  }

  static translate(key: string, namespace?: string, variables?: Record<string, any>): string {
    // Implementation for translation
    const namespaceToUse = namespace || 'common';
    const translation = this.getTranslation(key, namespaceToUse);
    
    if (variables) {
      return this.interpolateVariables(translation, variables);
    }
    
    return translation;
  }

  static translatePlural(key: string, count: number, namespace?: string, variables?: Record<string, any>): string {
    // Implementation for plural translation
    const namespaceToUse = namespace || 'common';
    const translation = this.getPluralTranslation(key, count, namespaceToUse);
    
    if (variables) {
      return this.interpolateVariables(translation, { ...variables, count });
    }
    
    return translation;
  }

  static getTranslation(key: string, namespace: string): string {
    // Mock implementation - would get from translation map
    return key;
  }

  static getPluralTranslation(key: string, count: number, namespace: string): string {
    // Mock implementation - would get plural form based on count
    return key;
  }

  static interpolateVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  static formatDate(date: Date, format?: string): string {
    // Mock implementation - would format based on locale
    return date.toLocaleDateString();
  }

  static formatNumber(number: number, format?: string): string {
    // Mock implementation - would format based on locale
    return number.toLocaleString();
  }

  static formatCurrency(amount: number, currency?: string, format?: string): string {
    // Mock implementation - would format based on locale
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }

  static formatTime(date: Date, format?: string): string {
    // Mock implementation - would format based on locale
    return date.toLocaleTimeString();
  }

  static formatRelativeTime(date: Date): string {
    // Mock implementation - would format relative time
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return `${seconds} seconds ago`;
  }

  static isRTL(): boolean {
    // Mock implementation - would check current language
    return false;
  }

  static getDirection(): 'ltr' | 'rtl' {
    // Mock implementation - would get text direction
    return 'ltr';
  }

  static getLocale(): string {
    // Mock implementation - would get current locale
    return 'en-US';
  }

  static getTimezone(): string {
    // Mock implementation - would get current timezone
    return 'America/New_York';
  }

  static getCurrency(): string {
    // Mock implementation - would get current currency
    return 'USD';
  }

  static getMeasurementSystem(): string {
    // Mock implementation - would get current measurement system
    return 'imperial';
  }

  static getDateFormat(): string {
    // Mock implementation - would get current date format
    return 'MM/DD/YYYY';
  }

  static getTimeFormat(): string {
    // Mock implementation - would get current time format
    return '12-hour';
  }

  static async loadTranslations(language: string, namespace?: string): Promise<void> {
    // Implementation for loading translations
    console.log(`Loading translations for ${language}${namespace ? ` (${namespace})` : ''}`);
  }

  static async updateTranslations(language: string, namespace: string, translations: Record<string, any>): Promise<void> {
    // Implementation for updating translations
    console.log(`Updating translations for ${language} (${namespace})`);
  }

  static async addLanguage(language: Language): Promise<void> {
    // Implementation for adding language
    console.log(`Adding language: ${language.name} (${language.code})`);
  }

  static async removeLanguage(language: string): Promise<void> {
    // Implementation for removing language
    console.log(`Removing language: ${language}`);
  }

  static getLanguageProgress(language: string): number {
    // Mock implementation - would calculate actual progress
    return 85;
  }

  static async exportTranslations(language: string, format: 'json' | 'csv'): Promise<string> {
    // Mock implementation - would export actual translations
    const exportData = {
      language,
      exportedAt: new Date().toISOString(),
      format,
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }

  static async importTranslations(language: string, data: string, format: 'json' | 'csv'): Promise<void> {
    // Implementation for importing translations
    console.log(`Importing translations for ${language} (${format})`);
  }

  static async validateTranslations(language: string): Promise<ValidationResult> {
    // Mock implementation - would validate actual translations
    return {
      valid: true,
      issues: [],
      completeness: 85,
      consistency: 90,
      quality: 88,
    };
  }

  static async getMetrics(): Promise<I18nMetrics> {
    // Mock implementation - would calculate actual metrics
    return await this.loadI18nMetrics();
  }
}

// Internationalization provider
export const I18nProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [system, setSystem] = useState<InternationalizationSystem>({
    languages: [],
    translations: {},
    currentLanguage: 'en',
    currentRegion: 'US',
    settings: {
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      autoDetect: true,
      rtlSupport: true,
      pluralRules: [],
      dateFormats: [],
      numberFormats: [],
      currencyFormats: [],
      timeFormats: [],
      measurementSystems: [],
    },
    localization: {
      region: 'US',
      locale: 'en-US',
      timezone: 'America/New_York',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12-hour',
      numberFormat: '1,234.56',
      measurementSystem: 'imperial',
      weekStart: 0,
      firstDayOfWeek: 'Sunday',
      weekendDays: [0, 6],
      holidays: [],
      businessHours: {
        monday: { open: '09:00', close: '17:00', closed: false, breaks: [] },
        tuesday: { open: '09:00', close: '17:00', closed: false, breaks: [] },
        wednesday: { open: '09:00', close: '17:00', closed: false, breaks: [] },
        thursday: { open: '09:00', close: '17:00', closed: false, breaks: [] },
        friday: { open: '09:00', close: '17:00', closed: false, breaks: [] },
        saturday: { open: '09:00', close: '13:00', closed: false, breaks: [] },
        sunday: { open: '', close: '', closed: true, breaks: [] },
        timezone: 'America/New_York',
      },
      cultural: {
        greeting: {
          formal: 'Dear {name}',
          informal: 'Hi {name}',
          casual: 'Hey {name}',
          business: 'Dear {name}',
        },
        formality: {
          level: 'formal',
          context: 'Professional communication',
          examples: ['Dear Sir/Madam', 'Yours sincerely'],
        },
        color: {
          primary: ['#007bff', '#28a745', '#dc3545', '#ffc107'],
          secondary: ['#6c757d', '#17a2b8', '#343a40'],
          avoid: ['#000000', '#ffffff'],
          cultural: [],
        },
        symbols: {
          religious: [],
          cultural: [],
          business: [],
        },
        content: {
          topics: ['programming', 'technology', 'education'],
          avoid: ['politics', 'religion'],
          sensitivity: [],
          examples: [],
        },
        communication: {
          tone: {
            professional: 'Professional',
            friendly: 'Friendly',
            casual: 'Casual',
            formal: 'Formal',
          },
          formality: {
            very_formal: 'Very Formal',
            formal: 'Formal',
            semi_formal: 'Semi Formal',
            casual: 'Casual',
            very_casual: 'Very Casual',
          },
          directness: {
            direct: 'Direct',
            indirect: 'Indirect',
            context: 'Business context',
          },
          timing: {
            business_hours: 'During business hours',
            after_hours: 'After business hours',
          },
          channels: [
            { channel: 'email', preference: 'preferred', context: 'Formal communication' },
            { channel: 'phone', preference: 'acceptable', context: 'Urgent matters' },
            { channel: 'chat', preference: 'acceptable', context: 'Quick questions' },
            { channel: 'video', preference: 'acceptable', context: 'Meetings' },
            { channel: 'in_person', preference: 'preferred', context: 'Important discussions' },
          ],
        },
        ui: {
          layout: {
            density: 'normal',
            direction: 'ltr',
            alignment: 'left',
            spacing: {
              small: 8,
              medium: 16,
              large: 24,
              extra_large: 32,
            },
          },
          colors: {
            primary: '#007bff',
            secondary: '#6c757d',
            accent: '#17a2b8',
            background: '#ffffff',
            text: '#212529',
            error: '#dc3545',
            warning: '#ffc107',
            success: '#28a745',
            info: '#17a2b8',
          },
          typography: {
            fontFamily: 'Arial, sans-serif',
            fontSize: {
              xs: 12,
              sm: 14,
              md: 16,
              lg: 18,
              xl: 20,
              xxl: 24,
            },
            fontWeight: {
              light: 300,
              normal: 400,
              medium: 500,
              bold: 700,
              extra_bold: 900,
            },
            lineHeight: 1.5,
            letterSpacing: 0,
          },
          icons: {
            style: 'outlined',
            size: {
              xs: 16,
              sm: 20,
              md: 24,
              lg: 32,
              xl: 40,
            },
            density: 'medium',
          },
          gestures: {
            swipe: {
              direction: 'horizontal',
              sensitivity: 'medium',
              feedback: true,
            },
            tap: {
              duration: 'short',
              feedback: true,
              haptic: true,
            },
            scroll: {
              direction: 'vertical',
              sensitivity: 'medium',
              momentum: true,
            },
            pinch: {
              sensitivity: 'medium',
              feedback: true,
            },
          },
          navigation: {
            style: 'tabs',
            position: 'bottom',
            back_button: 'left',
            gestures: true,
          },
        },
      },
    },
    formatting: {
      numbers: {
        decimalSeparator: '.',
        thousandsSeparator: ',',
        grouping: 3,
        precision: 2,
        negative: {
          prefix: '-',
          suffix: '',
          style: 'minus_sign',
        },
        patterns: [],
      },
      dates: {
        separator: '/',
        order: 'mdy',
        monthFormat: 'numeric',
        dayFormat: 'numeric',
        yearFormat: '4_digit',
        patterns: [],
      },
      times: {
        separator: ':',
        hour12: true,
        hourFormat: '12',
        minuteFormat: '2_digit',
        secondFormat: '2_digit',
        ampm: 'AM/PM',
        patterns: [],
      },
      currency: {
        symbol: '$',
        code: 'USD',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        patterns: [],
      },
      addresses: {
        order: [],
        separators: [],
        components: [],
        examples: [],
      },
      phone: {
        country: 'US',
        code: '+1',
        pattern: '(XXX) XXX-XXXX',
        format: '+1 (XXX) XXX-XXXX',
        international: true,
        examples: [],
      },
      names: {
        order: [],
        separators: [],
        components: [],
        examples: [],
      },
    },
    rtl: {
      enabled: true,
      languages: ['ar', 'he', 'fa', 'ur', 'yi'],
      rules: {
        textDirection: 'ltr',
        textAlign: 'left',
        margin: 'margin_left',
        padding: 'padding_left',
        border: 'border_left',
        float: 'float_left',
      },
      exceptions: [],
      testing: {
        testCases: [],
        visual: [],
        interaction: [],
      },
    },
    metrics: {
      usage: {
        totalUsers: 1000,
        activeUsers: 800,
        languageDistribution: [
          { language: 'en', users: 600, percentage: 60, growth: 5 },
          { language: 'es', users: 200, percentage: 20, growth: 10 },
          { language: 'fr', users: 100, percentage: 10, growth: 8 },
          { language: 'de', users: 50, percentage: 5, growth: 6 },
          { language: 'ja', users: 30, percentage: 3, growth: 12 },
          { language: 'zh', users: 15, percentage: 1.5, growth: 15 },
          { language: 'ar', users: 5, percentage: 0.5, growth: 20 },
        ],
        featureUsage: [],
        errors: [],
      },
      quality: {
        translationQuality: [],
        completeness: {
          overall: 85,
          byLanguage: [],
          byFeature: [],
          byNamespace: [],
        },
        consistency: {
          overall: 90,
          inconsistencies: [],
          patterns: [],
        },
        cultural: {
          sensitivity: [],
          appropriateness: [],
          feedback: [],
        },
      },
      performance: {
        loadTime: 100,
        memoryUsage: 50,
        bundleSize: 200,
        cacheHitRate: 95,
        errors: [],
        optimization: [],
      },
      coverage: {
        languageCoverage: [],
        featureCoverage: [],
        regionCoverage: [],
      },
      feedback: {
        totalFeedback: 100,
        averageRating: 4.2,
        feedbackByType: [],
        feedbackByLanguage: [],
        trends: [],
      },
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize i18n system
  useEffect(() => {
    const initializeI18n = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const i18nSystem = await I18nEngine.initializeI18n();
        setSystem(i18nSystem);
      } catch (err) {
        setError('Failed to initialize internationalization');
        console.error('I18n initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeI18n();
  }, []);

  const setLanguage = useCallback(async (language: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await I18nEngine.setLanguage(language);
      
      // Update system state
      const newSystem = { ...system, currentLanguage: language };
      setSystem(newSystem);
      
      // Save to storage
      await AsyncStorage.setItem('@i18n_current_language', language);
    } catch (err) {
      setError('Failed to set language');
      console.error('Language setting error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [system]);

  const setRegion = useCallback(async (region: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await I18nEngine.setRegion(region);
      
      // Update system state
      const newSystem = { ...system, currentRegion: region };
      setSystem(newSystem);
      
      // Save to storage
      await AsyncStorage.setItem('@i18n_current_region', region);
    } catch (err) {
      setError('Failed to set region');
      console.error('Region setting error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [system]);

  const translate = useCallback((key: string, namespace?: string, variables?: Record<string, any>): string => {
    return I18nEngine.translate(key, namespace, variables);
  }, []);

  const translatePlural = useCallback((key: string, count: number, namespace?: string, variables?: Record<string, any>): string => {
    return I18nEngine.translatePlural(key, count, namespace, variables);
  }, []);

  const formatDate = useCallback((date: Date, format?: string): string => {
    return I18nEngine.formatDate(date, format);
  }, []);

  const formatNumber = useCallback((number: number, format?: string): string => {
    return I18nEngine.formatNumber(number, format);
  }, []);

  const formatCurrency = useCallback((amount: number, currency?: string, format?: string): string => {
    return I18nEngine.formatCurrency(amount, currency, format);
  }, []);

  const formatTime = useCallback((date: Date, format?: string): string => {
    return I18nEngine.formatTime(date, format);
  }, []);

  const formatRelativeTime = useCallback((date: Date): string => {
    return I18nEngine.formatRelativeTime(date);
  }, []);

  const isRTL = useCallback((): boolean => {
    return I18nEngine.isRTL();
  }, []);

  const getDirection = useCallback((): 'ltr' | 'rtl' => {
    return I18nEngine.getDirection();
  }, []);

  const getLocale = useCallback((): string => {
    return I18nEngine.getLocale();
  }, []);

  const getTimezone = useCallback((): string => {
    return I18nEngine.getTimezone();
  }, []);

  const getCurrency = useCallback((): string => {
    return I18nEngine.getCurrency();
  }, []);

  const getMeasurementSystem = useCallback((): string => {
    return I18nEngine.getMeasurementSystem();
  }, []);

  const getDateFormat = useCallback((): string => {
    return I18nEngine.getDateFormat();
  }, []);

  const getTimeFormat = useCallback((): string => {
    return I18nEngine.getTimeFormat();
  }, []);

  const loadTranslations = useCallback(async (language: string, namespace?: string): Promise<void> => {
    try {
      await I18nEngine.loadTranslations(language, namespace);
      
      // Update system state
      const newTranslations = { ...system.translations };
      if (!newTranslations[language]) {
        newTranslations[language] = {};
      }
      
      setSystem({ ...system, translations: newTranslations });
    } catch (err) {
      setError('Failed to load translations');
      console.error('Translations loading error:', err);
      throw err;
    }
  }, [system]);

  const updateTranslations = useCallback(async (language: string, namespace: string, translations: Record<string, any>): Promise<void> => {
    try {
      await I18nEngine.updateTranslations(language, namespace, translations);
      
      // Update system state
      const newTranslations = { ...system.translations };
      if (!newTranslations[language]) {
        newTranslations[language] = {};
      }
      if (!newTranslations[language][namespace]) {
        newTranslations[language][namespace] = {};
      }
      
      newTranslations[language][namespace] = translations;
      setSystem({ ...system, translations: newTranslations });
    } catch (err) {
      setError('Failed to update translations');
      console.error('Translations update error:', err);
      throw err;
    }
  }, [system]);

  const addLanguage = useCallback(async (language: Language): Promise<void> => {
    try {
      await I18nEngine.addLanguage(language);
      
      // Update system state
      const newLanguages = [...system.languages, language];
      setSystem({ ...system, languages: newLanguages });
    } catch (err) {
      setError('Failed to add language');
      console.error('Language addition error:', err);
      throw err;
    }
  }, [system]);

  const removeLanguage = useCallback(async (language: string): Promise<void> => {
    try {
      await I18nEngine.removeLanguage(language);
      
      // Update system state
      const newLanguages = system.languages.filter(l => l.code !== language);
      setSystem({ ...system, languages: newLanguages });
    } catch (err) {
      setError('Failed to remove language');
      console.error('Language removal error:', err);
      throw err;
    }
  }, [system]);

  const getLanguageProgress = useCallback((language: string): number => {
    return I18nEngine.getLanguageProgress(language);
  }, []);

  const exportTranslations = useCallback(async (language: string, format: 'json' | 'csv'): Promise<string> => {
    try {
      return await I18nEngine.exportTranslations(language, format);
    } catch (err) {
      setError('Failed to export translations');
      console.error('Translations export error:', err);
      throw err;
    }
  }, []);

  const importTranslations = useCallback(async (language: string, data: string, format: 'json' | 'csv'): Promise<void> => {
    try {
      await I18nEngine.importTranslations(language, data, format);
    } catch (err) {
      setError('Failed to import translations');
      console.error('Translations import error:', err);
      throw err;
    }
  }, []);

  const validateTranslations = useCallback(async (language: string): Promise<ValidationResult> => {
    try {
      return await I18nEngine.validateTranslations(language);
    } catch (err) {
      setError('Failed to validate translations');
      console.error('Translations validation error:', err);
      throw err;
    }
  }, []);

  const getMetrics = useCallback(async (): Promise<I18nMetrics> => {
    try {
      return await I18nEngine.getMetrics();
    } catch (err) {
      setError('Failed to get i18n metrics');
      console.error('I18n metrics error:', err);
      throw err;
    }
  }, []);

  return (
    <I18nContext.Provider
      value={{
        system,
        loading,
        error,
        currentLanguage: system.currentLanguage,
        currentRegion: system.currentRegion,
        supportedLanguages: system.languages,
        translations: system.translations,
        setLanguage,
        setRegion,
        translate,
        translatePlural,
        formatDate,
        formatNumber,
        formatCurrency,
        formatTime,
        formatRelativeTime,
        isRTL,
        getDirection,
        getLocale,
        getTimezone,
        getCurrency,
        getMeasurementSystem,
        getDateFormat,
        getTimeFormat,
        loadTranslations,
        updateTranslations,
        addLanguage,
        removeLanguage,
        getLanguageProgress,
        exportTranslations,
        importTranslations,
        validateTranslations,
        getMetrics,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export default {
  I18nProvider,
  useI18n,
  I18nEngine,
};
