import { useCallback, useEffect, useState } from 'react';

interface SecurityConfig {
  // Content Security Policy
  csp: {
    enabled: boolean;
    directives: Record<string, string[]>;
  };
  
  // XSS Protection
  xss: {
    enabled: boolean;
    sanitizeInput: boolean;
    sanitizeOutput: boolean;
  };
  
  // CSRF Protection
  csrf: {
    enabled: boolean;
    tokenHeader: string;
  };
  
  // Authentication Security
  auth: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordRequirements: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
  };
  
  // Data Protection
  data: {
    encryptLocalStorage: boolean;
    encryptSessionStorage: boolean;
    maskSensitiveData: boolean;
  };
  
  // Network Security
  network: {
    enforceHTTPS: boolean;
    validateCertificates: boolean;
    timeout: number;
  };
}

interface SecurityAudit {
  score: number;
  vulnerabilities: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    category: string;
  }>;
  compliance: {
    gdpr: boolean;
    ccpa: boolean;
    hipaa: boolean;
    sox: boolean;
  };
}

class SecurityHardening {
  private config: SecurityConfig;
  private auditResults: SecurityAudit | null = null;
  private securityEventListeners: Array<(event: SecurityEvent) => void> = [];

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      csp: {
        enabled: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'https:'],
          'font-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'frame-ancestors': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"]
        }
      },
      xss: {
        enabled: true,
        sanitizeInput: true,
        sanitizeOutput: true
      },
      csrf: {
        enabled: true,
        tokenHeader: 'X-CSRF-Token'
      },
      auth: {
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        passwordRequirements: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true
        }
      },
      data: {
        encryptLocalStorage: true,
        encryptSessionStorage: true,
        maskSensitiveData: true
      },
      network: {
        enforceHTTPS: true,
        validateCertificates: true,
        timeout: 10000
      },
      ...config
    };

    this.initializeSecurity();
  }

  private initializeSecurity() {
    this.setupContentSecurityPolicy();
    this.setupXSSProtection();
    this.setupCSRFProtection();
    this.setupDataProtection();
    this.setupNetworkSecurity();
    this.setupSecurityMonitoring();
  }

  private setupContentSecurityPolicy() {
    if (!this.config.csp.enabled) return;

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    
    const directives = Object.entries(this.config.csp.directives)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');
    
    meta.content = directives;
    document.head.appendChild(meta);
  }

  private setupXSSProtection() {
    if (!this.config.xss.enabled) return;

    // XSS Protection header
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-XSS-Protection';
    meta.content = '1; mode=block';
    document.head.appendChild(meta);

    // Input sanitization
    if (this.config.xss.sanitizeInput) {
      this.setupInputSanitization();
    }

    // Output sanitization
    if (this.config.xss.sanitizeOutput) {
      this.setupOutputSanitization();
    }
  }

  private setupInputSanitization() {
    // Override form submissions to sanitize input
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const inputs = form.querySelectorAll('input, textarea');
      
      inputs.forEach(input => {
        const element = input as HTMLInputElement | HTMLTextAreaElement;
        if (element.value) {
          element.value = this.sanitizeString(element.value);
        }
      });
    }, true);
  }

  private setupOutputSanitization() {
    // Sanitize dynamically inserted content
    const originalInsertAdjacentHTML = Element.prototype.insertAdjacentHTML;
    Element.prototype.insertAdjacentHTML = function(position, html) {
      if (typeof html === 'string') {
        html = SecurityHardening.sanitizeHTML(html);
      }
      return originalInsertAdjacentHTML.call(this, position, html);
    };
  }

  private setupCSRFProtection() {
    if (!this.config.csrf.enabled) return;

    // Generate and store CSRF token
    const token = this.generateCSRFToken();
    sessionStorage.setItem('csrf-token', token);

    // Add token to all forms and AJAX requests
    this.addCSRFTokenToForms(token);
    this.addCSRFTokenToFetch(token);
  }

  private addCSRFTokenToForms(token: string) {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const existingToken = form.querySelector(`input[name="${this.config.csrf.tokenHeader}"]`);
      if (!existingToken) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = this.config.csrf.tokenHeader;
        input.value = token;
        form.appendChild(input);
      }
    });
  }

  private addCSRFTokenToFetch(token: string) {
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const headers = new Headers(init?.headers);
      
      if (init?.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(init.method)) {
        headers.set(this.config.csrf.tokenHeader, token);
      }
      
      return originalFetch.call(this, input, { ...init, headers });
    }.bind(this);
  }

  private setupDataProtection() {
    if (this.config.data.encryptLocalStorage) {
      this.setupStorageEncryption('localStorage');
    }
    
    if (this.config.data.encryptSessionStorage) {
      this.setupStorageEncryption('sessionStorage');
    }
  }

  private setupStorageEncryption(storageType: 'localStorage' | 'sessionStorage') {
    const storage = window[storageType];
    const originalSetItem = storage.setItem.bind(storage);
    const originalGetItem = storage.getItem.bind(storage);
    const originalRemoveItem = storage.removeItem.bind(storage);

    storage.setItem = function(key: string, value: string) {
      const encrypted = SecurityHardening.encrypt(value);
      return originalSetItem(key, encrypted);
    };

    storage.getItem = function(key: string) {
      const encrypted = originalGetItem(key);
      if (!encrypted) return null;
      try {
        return SecurityHardening.decrypt(encrypted);
      } catch {
        return encrypted; // Fallback for non-encrypted data
      }
    };

    storage.removeItem = function(key: string) {
      return originalRemoveItem(key);
    };
  }

  private setupNetworkSecurity() {
    // Enforce HTTPS
    if (this.config.network.enforceHTTPS && location.protocol !== 'https:') {
      location.replace(`https:${location.href.substring(location.protocol.length)}`);
    }

    // Set secure cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure`;
      }
    });
  }

  private setupSecurityMonitoring() {
    // Monitor security events
    window.addEventListener('error', (event) => {
      this.reportSecurityEvent({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now()
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.reportSecurityEvent({
        type: 'unhandled_promise_rejection',
        reason: event.reason,
        timestamp: Date.now()
      });
    });
  }

  // Utility methods
  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }

  static sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  static encrypt(data: string): string {
    // Simple XOR encryption (in production, use proper encryption)
    const key = 'pymastery-secure-key';
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(encrypted);
  }

  static decrypt(encrypted: string): string {
    const key = 'pymastery-secure-key';
    let decrypted = '';
    try {
      const data = atob(encrypted);
      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(
          data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
    } catch {
      throw new Error('Invalid encrypted data');
    }
    return decrypted;
  }

  private reportSecurityEvent(event: SecurityEvent) {
    this.securityEventListeners.forEach(listener => listener(event));
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.warn('Security Event:', event);
    }
  }

  // Public API
  public audit(): SecurityAudit {
    const vulnerabilities: SecurityAudit['vulnerabilities'] = [];
    let score = 100;

    // Check for common vulnerabilities
    if (!this.config.csp.enabled) {
      vulnerabilities.push({
        severity: 'high',
        description: 'Content Security Policy is disabled',
        recommendation: 'Enable CSP to prevent XSS attacks',
        category: 'Content Security'
      });
      score -= 20;
    }

    if (!this.config.xss.enabled) {
      vulnerabilities.push({
        severity: 'critical',
        description: 'XSS protection is disabled',
        recommendation: 'Enable XSS protection and input sanitization',
        category: 'XSS Protection'
      });
      score -= 30;
    }

    if (!this.config.csrf.enabled) {
      vulnerabilities.push({
        severity: 'high',
        description: 'CSRF protection is disabled',
        recommendation: 'Enable CSRF tokens for state-changing operations',
        category: 'CSRF Protection'
      });
      score -= 20;
    }

    if (location.protocol !== 'https:') {
      vulnerabilities.push({
        severity: 'medium',
        description: 'Application is not using HTTPS',
        recommendation: 'Migrate to HTTPS to encrypt all communications',
        category: 'Network Security'
      });
      score -= 15;
    }

    this.auditResults = {
      score: Math.max(0, score),
      vulnerabilities,
      compliance: {
        gdpr: this.config.data.encryptLocalStorage,
        ccpa: this.config.data.maskSensitiveData,
        hipaa: false, // Would need additional implementation
        sox: false // Would need additional implementation
      }
    };

    return this.auditResults;
  }

  public validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const req = this.config.auth.passwordRequirements;

    if (password.length < req.minLength) {
      errors.push(`Password must be at least ${req.minLength} characters long`);
    }

    if (req.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (req.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (req.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (req.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public addSecurityEventListener(listener: (event: SecurityEvent) => void) {
    this.securityEventListeners.push(listener);
  }

  public removeSecurityEventListener(listener: (event: SecurityEvent) => void) {
    const index = this.securityEventListeners.indexOf(listener);
    if (index > -1) {
      this.securityEventListeners.splice(index, 1);
    }
  }

  public getConfig(): SecurityConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<SecurityConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.initializeSecurity(); // Reinitialize with new config
  }
}

interface SecurityEvent {
  type: string;
  message?: string;
  timestamp: number;
  [key: string]: unknown;
}

// React hook for security hardening
export const useSecurityHardening = (config?: Partial<SecurityConfig>) => {
  const [security] = useState(() => new SecurityHardening(config));
  const [audit, setAudit] = useState<SecurityAudit | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    if (config) {
      security.updateConfig(config);
    }
  }, [config, security]);

  useEffect(() => {
    const handleSecurityEvent = (event: SecurityEvent) => {
      setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events
    };

    security.addSecurityEventListener(handleSecurityEvent);

    return () => {
      security.removeSecurityEventListener(handleSecurityEvent);
    };
  }, [security]);

  const runAudit = useCallback(() => {
    const auditResult = security.audit();
    setAudit(auditResult);
    return auditResult;
  }, [security]);

  const validatePassword = useCallback((password: string) => {
    return security.validatePassword(password);
  }, [security]);

  return {
    security,
    audit,
    events,
    runAudit,
    validatePassword
  };
};

export default SecurityHardening;
