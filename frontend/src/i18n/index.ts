/**
 * Internationalization (i18n) configuration for PyMastery
 * Supports multiple languages with dynamic loading and fallback
 */

import i18n from 'i18next';
import { initReactI18next, useTranslation as useI18nTranslation } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';
import zhTranslations from './locales/zh.json';
import jaTranslations from './locales/ja.json';
import arTranslations from './locales/ar.json';
import hiTranslations from './locales/hi.json';
import ptTranslations from './locales/pt.json';
import ruTranslations from './locales/ru.json';

export const availableLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
] as const;

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
  de: { translation: deTranslations },
  zh: { translation: zhTranslations },
  ja: { translation: jaTranslations },
  ar: { translation: arTranslations },
  hi: { translation: hiTranslations },
  pt: { translation: ptTranslations },
  ru: { translation: ruTranslations },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    backend: {
      loadPath: '/i18n/locales/{{lng}}.json',
    },
  });

export default i18n;

export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};

export const setLanguage = async (language: string): Promise<void> => {
  await i18n.changeLanguage(language);
  localStorage.setItem('language', language);
};

export const getLanguageDirection = (language: string): 'ltr' | 'rtl' => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
};

export const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
  const language = getCurrentLanguage();
  return new Intl.NumberFormat(language, options).format(number);
};

export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const language = getCurrentLanguage();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(language, options).format(dateObj);
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  const language = getCurrentLanguage();
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
  }).format(amount);
};

export const namespaces = {
  common: 'common',
  auth: 'auth',
  dashboard: 'dashboard',
  courses: 'courses',
  problems: 'problems',
  gamification: 'gamification',
  analytics: 'analytics',
  settings: 'settings',
  errors: 'errors',
} as const;

export interface TranslationKeys {
  'common.loading': string;
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;
  'common.create': string;
  'common.update': string;
  'common.search': string;
  'common.filter': string;
  'common.sort': string;
  'common.export': string;
  'common.import': string;
  'common.refresh': string;
  'common.close': string;
  'common.back': string;
  'common.next': string;
  'common.previous': string;
  'common.submit': string;
  'common.reset': string;
  'common.confirm': string;
  'common.success': string;
  'common.error': string;
  'common.warning': string;
  'common.info': string;
  'nav.dashboard': string;
  'nav.courses': string;
  'nav.problems': string;
  'nav.gamification': string;
  'nav.analytics': string;
  'nav.settings': string;
  'nav.profile': string;
  'nav.logout': string;
  'nav.login': string;
  'nav.register': string;
  'auth.login': string;
  'auth.register': string;
  'auth.logout': string;
  'auth.forgot_password': string;
  'auth.reset_password': string;
  'auth.change_password': string;
  'auth.email': string;
  'auth.password': string;
  'auth.confirm_password': string;
  'auth.first_name': string;
  'auth.last_name': string;
  'auth.remember_me': string;
  'auth.login_success': string;
  'auth.logout_success': string;
  'auth.register_success': string;
  'auth.password_changed': string;
  'auth.invalid_credentials': string;
  'auth.user_not_found': string;
  'auth.email_required': string;
  'auth.password_required': string;
  'auth.password_mismatch': string;
  'auth.email_invalid': string;
  'auth.password_weak': string;
  'dashboard.welcome': string;
  'dashboard.overview': string;
  'dashboard.recent_activity': string;
  'dashboard.quick_actions': string;
  'dashboard.progress': string;
  'dashboard.achievements': string;
  'dashboard.leaderboard': string;
  'dashboard.stats': string;
  'dashboard.no_data': string;
  'courses.title': string;
  'courses.description': string;
  'courses.duration': string;
  'courses.difficulty': string;
  'courses.instructor': string;
  'courses.enrolled': string;
  'courses.completed': string;
  'courses.progress': string;
  'courses.start_learning': string;
  'courses.continue_learning': string;
  'courses.view_details': string;
  'courses.enroll': string;
  'courses.unenroll': string;
  'courses.no_courses': string;
  'courses.all_courses': string;
  'courses.my_courses': string;
  'courses.recommended': string;
  'problems.title': string;
  'problems.description': string;
  'problems.difficulty': string;
  'problems.category': string;
  'problems.points': string;
  'problems.attempts': string;
  'problems.success_rate': string;
  'problems.solve': string;
  'problems.view_solution': string;
  'problems.reset': string;
  'problems.submit': string;
  'problems.test': string;
  'problems.success': string;
  'problems.failure': string;
  'problems.no_problems': string;
  'problems.all_problems': string;
  'problems.recommended': string;
  'problems.solved': string;
  'problems.unsolved': string;
  'gamification.points': string;
  'gamification.level': string;
  'gamification.streak': string;
  'gamification.badges': string;
  'gamification.achievements': string;
  'gamification.challenges': string;
  'gamification.leaderboard': string;
  'gamification.rank': string;
  'gamification.points_earned': string;
  'gamification.level_up': string;
  'gamification.streak_lost': string;
  'gamification.badge_earned': string;
  'gamification.achievement_unlocked': string;
  'gamification.challenge_completed': string;
  'analytics.overview': string;
  'analytics.progress': string;
  'analytics.performance': string;
  'analytics.engagement': string;
  'analytics.insights': string;
  'analytics.recommendations': string;
  'analytics.trends': string;
  'analytics.metrics': string;
  'analytics.reports': string;
  'analytics.export': string;
  'analytics.no_data': string;
  'analytics.loading': string;
  'settings.profile': string;
  'settings.preferences': string;
  'settings.notifications': string;
  'settings.privacy': string;
  'settings.security': string;
  'settings.language': string;
  'settings.theme': string;
  'settings.timezone': string;
  'settings.email_notifications': string;
  'settings.push_notifications': string;
  'settings.two_factor': string;
  'settings.privacy_public': string;
  'settings.privacy_private': string;
  'settings.delete_account': string;
  'settings.saved': string;
  'errors.network': string;
  'errors.server': string;
  'errors.not_found': string;
  'errors.unauthorized': string;
  'errors.forbidden': string;
  'errors.validation': string;
  'errors.timeout': string;
  'errors.unknown': string;
  'errors.something_went_wrong': string;
  'errors.try_again': string;
  'errors.contact_support': string;
}

type TranslationOptions = Record<string, unknown>;

export const useTypedTranslation = () => {
  const { t } = useI18nTranslation();
  return t as <K extends keyof TranslationKeys>(key: K, options?: TranslationOptions) => TranslationKeys[K];
};

export { useTypedTranslation as useTranslation };
