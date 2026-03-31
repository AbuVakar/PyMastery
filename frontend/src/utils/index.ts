import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Format date
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj);
};

// Format time ago
export const formatTimeAgo = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateObj);
};

// Debounce function
export const debounce = <TArgs extends unknown[], TResult>(
  func: (...args: TArgs) => TResult,
  wait: number
): ((...args: TArgs) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: TArgs) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
export const throttle = <TArgs extends unknown[], TResult>(
  func: (...args: TArgs) => TResult,
  limit: number
): ((...args: TArgs) => void) => {
  let inThrottle = false;
  
  return (...args: TArgs) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Generate random ID
export const generateId = (length = 8): string => {
  return Math.random().toString(36).substring(2, 2 + length);
};

// Capitalize first letter
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Truncate text
export const truncate = (str: string, length: number, suffix = '...'): string => {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Get initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

// Download file
export const downloadFile = (data: string, filename: string, type = 'text/plain'): void => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Local storage utilities
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Session storage utilities
export const sessionStorage = {
  get: <T>(key: string): T | null => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  },
  
  clear: (): void => {
    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  },
};

// Array utilities
export const arrayUtils = {
  // Remove duplicates
  unique: <T>(array: T[]): T[] => [...new Set(array)],
  
  // Group by key
  groupBy: <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },
  
  // Sort by key
  sortBy: <T, K extends keyof T>(array: T[], key: K, direction: 'asc' | 'desc' = 'asc'): T[] => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },
  
  // Filter by key
  filterBy: <T, K extends keyof T>(array: T[], key: K, value: T[K]): T[] => {
    return array.filter(item => item[key] === value);
  },
  
  // Paginate
  paginate: <T>(array: T[], page: number, limit: number): T[] => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return array.slice(start, end);
  },
};

// Object utilities
export const objectUtils = {
  // Deep clone
  deepClone: <T>(obj: T): T => JSON.parse(JSON.stringify(obj)),
  
  // Pick keys
  pick: <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    return keys.reduce((result, key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
      return result;
    }, {} as Pick<T, K>);
  },
  
  // Omit keys
  omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  },
  
  // Check if empty
  isEmpty: (obj: unknown): boolean => {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    if (typeof obj === 'object') {
      return Object.keys(obj).length === 0;
    }
    return false;
  },
};

// Number utilities
export const numberUtils = {
  // Format number with commas
  format: (num: number): string => {
    return new Intl.NumberFormat().format(num);
  },
  
  // Round to decimal places
  round: (num: number, decimals: number): number => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },
  
  // Clamp number between min and max
  clamp: (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
  },
  
  // Check if number is in range
  inRange: (num: number, min: number, max: number): boolean => {
    return num >= min && num <= max;
  },
};
