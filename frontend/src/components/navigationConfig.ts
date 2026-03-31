export interface NavigationItem {
  label: string;
  to: string;
  authOnly?: boolean;
  guestOnly?: boolean;
  authTo?: string;
}

export const resolveNavigationHref = (item: NavigationItem, isAuthenticated: boolean): string =>
  isAuthenticated && item.authTo ? item.authTo : item.to;

export const primaryNavigationLinks: NavigationItem[] = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/#about' },
  { label: 'Learn', to: '/#learn', authTo: '/courses' },
  { label: 'Projects', to: '/#projects', authTo: '/problems' },
  { label: 'Roadmap', to: '/#roadmap' },
  { label: 'Pricing', to: '/#pricing' },
  { label: 'Resources', to: '/#resources' },
  { label: 'Contact Us', to: '/contact' }
];

export const footerProductLinks: NavigationItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Dashboard', to: '/dashboard', authOnly: true },
  { label: 'Courses', to: '/#learn', authTo: '/courses' },
  { label: 'Projects', to: '/#projects', authTo: '/problems' },
  { label: 'Roadmap', to: '/#roadmap' },
  { label: 'Pricing', to: '/#pricing' }
];

export const footerLearnLinks: NavigationItem[] = [
  { label: 'Python Foundations', to: '/#learn', authTo: '/courses' },
  { label: 'Problem Solving', to: '/#projects', authTo: '/problems' },
  { label: 'AI Mentor', to: '/#learn', authTo: '/ai-chat' },
  { label: 'Career Tracks', to: '/#roadmap' },
  { label: 'Resource Library', to: '/#resources' }
];

export const footerCompanyLinks: NavigationItem[] = [
  { label: 'About PyMastery', to: '/#about' },
  { label: 'Learning Philosophy', to: '/#roadmap' },
  { label: 'Success Stories', to: '/#resources' },
  { label: 'Contact Us', to: '/contact' }
];

export const footerSupportLinks: NavigationItem[] = [
  { label: 'Help Center', to: '/contact' },
  { label: 'Account Settings', to: '/settings', authOnly: true },
  { label: 'Profile', to: '/profile', authOnly: true },
  { label: 'Login', to: '/login', guestOnly: true },
  { label: 'Create Account', to: '/signup', guestOnly: true }
];

export const authenticatedAccountLinks: NavigationItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Profile', to: '/profile' },
  { label: 'Settings', to: '/settings' }
];

export const guestAccountLinks: NavigationItem[] = [
  { label: 'Login', to: '/login' },
  { label: 'Create Account', to: '/signup' }
];
