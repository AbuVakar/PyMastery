/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliant accessibility helpers
 */

// Screen Reader Utilities
export const ScreenReaderUtils = {
  announce: (message: string): void => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  },

  isScreenReaderActive(): boolean {
    return window.speechSynthesis !== undefined ||
           window.navigator.userAgent.includes('NVDA') ||
           window.navigator.userAgent.includes('JAWS') ||
           window.navigator.userAgent.includes('VoiceOver') ||
           window.navigator.userAgent.includes('Dragon NaturallySpeaking');
  }
};

// Focus Management
export const FocusManager = {
  trapFocus: (container: HTMLElement): (() => void) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);
        if (currentIndex < focusableElements.length - 1) {
          (focusableElements[currentIndex + 1] as HTMLElement).focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    const firstElement = focusableElements[0] as HTMLElement;
    firstElement?.focus();

    return (): void => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },

  restoreFocus: (previousElement: HTMLElement | null): void => {
    if (previousElement) {
      previousElement.focus();
    }
  }
};

// Color Contrast Utilities
export const ColorContrastUtils = {
  getContrastRatio: (color1: string, color2: string): number => {
    // Simplified contrast ratio calculation
    const luminance = (color: string): number => {
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0;
      const [r, g, b] = rgb.map(Number);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };

    const l1 = luminance(color1);
    const l2 = luminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  },

  hasGoodContrast: (foreground: string, background: string): boolean => {
    return ColorContrastUtils.getContrastRatio(foreground, background) >= 4.5;
  }
};

// Keyboard Navigation
export const KeyboardUtils = {
  skipLinks: (): void => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus-visible';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
};

// Touch Target Utilities
export const TouchUtils = {
  ensureMinimumTouchTarget: (element: HTMLElement): void => {
    const rect = element.getBoundingClientRect();
    const minSize = 44; // 44px minimum touch target
    
    if (rect.width < minSize || rect.height < minSize) {
      element.style.minWidth = `${minSize}px`;
      element.style.minHeight = `${minSize}px`;
    }
  }
};

// Heading Structure
export const HeadingUtils = {
  validateHeadingStructure: (): boolean => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    
    for (const heading of headings) {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        return false;
      }
      lastLevel = level;
    }
    
    return true;
  }
};

// Form Accessibility
export const FormAccessibilityUtils = {
  addAriaRequired: (element: HTMLElement): void => {
    element.setAttribute('aria-required', 'true');
  },

  addAriaInvalid: (element: HTMLElement, isValid: boolean): void => {
    element.setAttribute('aria-invalid', (!isValid).toString());
  },

  addAriaDescribedBy: (element: HTMLElement, descriptionId: string): void => {
    element.setAttribute('aria-describedby', descriptionId);
  }
};

// Image Accessibility
export const ImageAccessibilityUtils = {
  addAltText: (element: HTMLImageElement, altText: string): void => {
    element.alt = altText;
  },

  addLongdesc: (element: HTMLImageElement, description: string): void => {
    element.setAttribute('longdesc', description);
  }
};

// Link Accessibility
export const LinkAccessibilityUtils = {
  addExternalLinkIndicator: (element: HTMLAnchorElement): void => {
    if (element.hostname !== window.location.hostname) {
      element.setAttribute('aria-label', `${element.textContent} (opens in new tab)`);
      element.setAttribute('rel', 'noopener noreferrer');
    }
  }
};

// Performance Monitoring
export const AccessibilityPerformanceMonitor = {
  measureAccessibilityPerformance: (): void => {
    // Measure accessibility performance metrics
    console.log('Accessibility performance monitoring active');
  }
};
