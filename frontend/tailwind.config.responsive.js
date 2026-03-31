/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';
import aspectRatio from '@tailwindcss/aspect-ratio';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      // Mobile-first approach - exact breakpoints as requested
      'mobile': '375px',    // iPhone SE and similar
      'tablet': '768px',    // iPad and similar
      'desktop': '1366px',  // MacBook Air and similar
      
      // Additional breakpoints for better control
      'mobile-sm': '320px',   // Very small mobile
      'mobile-lg': '425px',   // Large mobile/phablet
      'tablet-sm': '640px',   // Small tablet
      'tablet-lg': '1024px',  // Large tablet/small desktop
      'desktop-sm': '1280px', // Small desktop
      'desktop-lg': '1536px', // Large desktop
      'desktop-xl': '1920px', // Extra large desktop
      
      // Legacy breakpoints for compatibility
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Brand Colors - matching design system
        primary: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          dark: '#7C3AED',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        accent: {
          DEFAULT: '#EC4899',
          light: '#F472B6',
          dark: '#DB2777',
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#EC4899',
          600: '#DB2777',
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843',
        },
        
        // Semantic Colors
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FCD34D',
          dark: '#D97706',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#DC2626',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        
        // Slate Colors - matching design system
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        
        // Gray Colors - keeping for compatibility
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          850: '#1E293B',
          900: '#0F172A',
        }
      },
      
      // Responsive spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
        '160': '40rem',
        '176': '44rem',
        '192': '48rem',
        '208': '52rem',
        '224': '56rem',
        '240': '60rem',
        
        // Mobile-specific spacing
        'mobile-safe': 'env(safe-area-inset-bottom)',
        'mobile-header': 'env(safe-area-inset-top)',
      },
      
      // Border radius matching design system
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
        
        // Mobile-specific border radius
        'mobile': '0.75rem',
        'mobile-lg': '1rem',
      },
      
      // Font families with mobile optimization
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        'display': ['Inter Display', 'Inter', 'system-ui', 'sans-serif'],
        'mobile': ['SF Pro Display', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      
      // Responsive font sizes
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
        
        // Mobile-specific font sizes
        'mobile-xs': ['0.75rem', { lineHeight: '1rem' }],
        'mobile-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'mobile-base': ['1rem', { lineHeight: '1.5rem' }],
        'mobile-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'mobile-xl': ['1.25rem', { lineHeight: '1.75rem' }],
      },
      
      // Animation durations
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '900': '900ms',
        
        // Mobile-specific durations
        'mobile-fast': '150ms',
        'mobile-normal': '200ms',
        'mobile-slow': '300ms',
      },
      
      // Animation timing functions
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-out-circ': 'cubic-bezier(0.08, 0.82, 0.17, 1)',
        'ease-in-circ': 'cubic-bezier(0.6, 0.04, 0.98, 0.34)',
        'mobile': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      // Box shadows matching design system
      boxShadow: {
        'glow': '0 0 20px rgba(139, 92, 246, 0.5)',
        'glow-lg': '0 0 40px rgba(139, 92, 246, 0.8)',
        'glow-primary': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-secondary': '0 0 20px rgba(139, 92, 246, 0.5)',
        'glow-accent': '0 0 20px rgba(236, 72, 153, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(139, 92, 246, 0.3)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'button-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        
        // Mobile-specific shadows
        'mobile-card': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'mobile-button': '0 1px 1px 0 rgba(0, 0, 0, 0.05)',
        'mobile-header': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
      
      // Background images
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0F172A 0%, #1E293B 25%, #8B5CF6 75%, #0F172A 100%)',
        'gradient-warm': 'linear-gradient(135deg, #F59E0B 0%, #EF4444 50%, #EC4899 100%)',
        'gradient-cool': 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 50%, #10B981 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
        'gradient-forest': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      },
      
      // Backdrop blur
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px',
        
        // Mobile-specific blur
        'mobile': '8px',
        'mobile-lg': '12px',
      },
      
      // Z-index scale
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        '110': '110',
        '120': '120',
        '130': '130',
        '140': '140',
        '150': '150',
        
        // Mobile-specific z-index
        'mobile-header': '50',
        'mobile-nav': '40',
        'mobile-modal': '30',
        'mobile-overlay': '20',
      },
      
      // Grid templates
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
        '14': 'repeat(14, minmax(0, 1fr))',
        '15': 'repeat(15, minmax(0, 1fr))',
        '16': 'repeat(16, minmax(0, 1fr))',
        
        // Mobile-specific grids
        'mobile-2': 'repeat(2, minmax(0, 1fr))',
        'mobile-3': 'repeat(3, minmax(0, 1fr))',
        'mobile-4': 'repeat(4, minmax(0, 1fr))',
      },
      
      // Grid rows
      gridTemplateRows: {
        '13': 'repeat(13, minmax(0, 1fr))',
        '14': 'repeat(14, minmax(0, 1fr))',
        '15': 'repeat(15, minmax(0, 1fr))',
        '16': 'repeat(16, minmax(0, 1fr))',
        
        // Mobile-specific rows
        'mobile-header': 'auto 1fr auto',
        'mobile-full': '1fr',
      },
      
      // Animation keyframes
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'spin-slow': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        
        // Mobile-specific animations
        'mobile-slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'mobile-slide-down': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'mobile-scale': {
          '0%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      
      // Animation utilities
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        
        // Mobile-specific animations
        'mobile-slide-up': 'mobile-slide-up 0.3s ease-out',
        'mobile-slide-down': 'mobile-slide-down 0.3s ease-out',
        'mobile-scale': 'mobile-scale 0.2s ease-out',
      },
      
      // Drop shadow
      dropShadow: {
        'glow': 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))',
        'glow-lg': 'drop-shadow(0 0 40px rgba(139, 92, 246, 0.8))',
      },
      
      // Transform scale
      scale: {
        '98': '0.98',
        '102': '1.02',
        '105': '1.05',
        '110': '1.1',
        '125': '1.25',
        
        // Mobile-specific scales
        'mobile-95': '0.95',
        'mobile-105': '1.05',
      },
      
      // Letter spacing
      letterSpacing: {
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
        
        // Mobile-specific letter spacing
        'mobile-tight': '-0.025em',
        'mobile-normal': '0',
        'mobile-wide': '0.05em',
      },
      
      // Line height
      lineHeight: {
        'extra-tight': '1.125',
        'extra-loose': '2',
        
        // Mobile-specific line heights
        'mobile-tight': '1.25',
        'mobile-normal': '1.5',
        'mobile-relaxed': '1.75',
      },
      
      // Max widths for responsive content
      maxWidth: {
        'mobile': '375px',
        'tablet': '768px',
        'desktop': '1366px',
        'mobile-lg': '425px',
        'tablet-lg': '1024px',
        'desktop-lg': '1920px',
      },
      
      // Min heights for responsive layouts
      minHeight: {
        'mobile-screen': '100vh',
        'mobile-screen-safe': '100dvh',
        'tablet-screen': '100vh',
        'desktop-screen': '100vh',
      },
      
      // Container sizes
      container: {
        'mobile': '100%',
        'tablet': '100%',
        'desktop': '1200px',
        'center': 'center',
        'padding': '2rem',
        
        // Responsive container padding
        'mobile-padding': '1rem',
        'tablet-padding': '2rem',
        'desktop-padding': '4rem',
      },
    },
  },
  plugins: [
    typography,
    forms,
    aspectRatio,
    
    // Custom plugin for responsive utilities
    function({ addUtilities, theme }) {
      addUtilities({
        // Mobile-first container
        '.container-responsive': {
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          [`@media (min-width: ${theme('screens.tablet')})`]: {
            maxWidth: theme('maxWidth.tablet'),
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          [`@media (min-width: ${theme('screens.desktop')})`]: {
            maxWidth: theme('maxWidth.desktop'),
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
        },
        
        // Mobile-safe padding
        '.mobile-safe-padding': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        
        // Mobile-safe margin
        '.mobile-safe-margin': {
          marginBottom: 'env(safe-area-inset-bottom)',
        },
        
        // Touch-friendly button
        '.button-touch': {
          minHeight: '44px',
          minWidth: '44px',
          padding: '0.75rem 1.5rem',
        },
        
        // Mobile text truncation
        '.mobile-truncate': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
        
        // Mobile multi-line truncation
        '.mobile-truncate-2': {
          display: '-webkit-box',
          '-webkit-line-clamp': '2',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        
        // Mobile-truncate-3
        '.mobile-truncate-3': {
          display: '-webkit-box',
          '-webkit-line-clamp': '3',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },
        
        // Responsive grid
        '.grid-responsive': {
          display: 'grid',
          gap: theme('spacing.4'),
          gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
          [`@media (min-width: ${theme('screens.tablet')})`]: {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          },
          [`@media (min-width: ${theme('screens.desktop')})`]: {
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          },
        },
        
        // Responsive flex
        '.flex-responsive': {
          display: 'flex',
          flexDirection: 'column',
          gap: theme('spacing.4'),
          [`@media (min-width: ${theme('screens.tablet')})`]: {
            flexDirection: 'row',
            alignItems: 'center',
          },
        },
        
        // Mobile navigation
        '.mobile-nav': {
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme('zIndex.mobile-nav'),
          backgroundColor: theme('colors.white'),
          borderTop: `1px solid ${theme('colors.gray.200')}`,
          padding: theme('spacing.2'),
          paddingBottom: 'env(safe-area-inset-bottom)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          [`@media (min-width: ${theme('screens.tablet')})`]: {
            display: 'none',
          },
        },
        
        // Mobile header
        '.mobile-header': {
          position: 'sticky',
          top: 0,
          zIndex: theme('zIndex.mobile-header'),
          backgroundColor: theme('colors.white'),
          borderBottom: `1px solid ${theme('colors.gray.200')}`,
          padding: theme('spacing.4'),
          paddingTop: 'env(safe-area-inset-top)',
        },
        
        // Hide on mobile
        '.hide-mobile': {
          display: 'none',
          [`@media (min-width: ${theme('screens.tablet')})`]: {
            display: 'block',
          },
        },
        
        // Show on mobile only
        '.show-mobile': {
          display: 'block',
          [`@media (min-width: ${theme('screens.tablet')})`]: {
            display: 'none',
          },
        },
        
        // Hide on tablet
        '.hide-tablet': {
          [`@media (min-width: ${theme('screens.tablet')})`]: {
            display: 'none',
          },
          [`@media (min-width: ${theme('screens.desktop')})`]: {
            display: 'block',
          },
        },
        
        // Show on tablet only
        '.show-tablet': {
          display: 'none',
          [`@media (min-width: ${theme('screens.tablet')})`]: {
            display: 'block',
          },
          [`@media (min-width: ${theme('screens.desktop')})`]: {
            display: 'none',
          },
        },
        
        // Hide on desktop
        '.hide-desktop': {
          [`@media (min-width: ${theme('screens.desktop')})`]: {
            display: 'none',
          },
        },
        
        // Show on desktop only
        '.show-desktop': {
          display: 'none',
          [`@media (min-width: ${theme('screens.desktop')})`]: {
            display: 'block',
          },
        },
        
        // Responsive text sizes
        '.text-responsive': {
          fontSize: theme('fontSize.mobile-base'),
          lineHeight: theme('lineHeight.mobile-normal'),
          [`@media (min-width: ${theme('screens.tablet')})`]: {
            fontSize: theme('fontSize.base'),
            lineHeight: theme('lineHeight.normal'),
          },
          [`@media (min-width: ${theme('screens.desktop')})`]: {
            fontSize: theme('fontSize.lg'),
            lineHeight: theme('lineHeight.relaxed'),
          },
        },
        
        // Responsive heading
        '.heading-responsive': {
          fontSize: theme('fontSize.mobile-xl'),
          lineHeight: theme('lineHeight.mobile-tight'),
          [`@media (min-width: ${theme('screens.tablet')})`]: {
            fontSize: theme('fontSize.2xl'),
            lineHeight: theme('lineHeight.tight'),
          },
          [`@media (min-width: ${theme('screens.desktop')})`]: {
            fontSize: theme('fontSize.3xl'),
            lineHeight: theme('lineHeight.tight'),
          },
        },
        
        // Responsive spacing
        '.spacing-responsive': {
          padding: theme('spacing.4'),
          [`@media (min-width: ${theme('screens.tablet')})`]: {
            padding: theme('spacing.6'),
          },
          [`@media (min-width: ${theme('screens.desktop')})`]: {
            padding: theme('spacing.8'),
          },
        },
        
        // Responsive margins
        '.margin-responsive': {
          margin: theme('spacing.4'),
          [`@media (min-width: ${theme('screens.tablet')})`]: {
            margin: theme('spacing.6'),
          },
          [`@media (min-width: ${theme('screens.desktop')})`]: {
            margin: theme('spacing.8'),
          },
        },
      });
    },
  ],
};
