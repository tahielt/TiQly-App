import { Platform } from 'react-native';
import { format, parseISO, isToday, isYesterday, isThisYear } from 'date-fns';
import { es } from 'date-fns/locale';

type Nullable<T> = T | null | undefined;

/**
 * Formats a date to a relative time string (e.g., "hace 2 horas", "ayer", "hace 3 días")
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
  const now = new Date();
  
  const diffInSeconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 60) {
    return 'Ahora mismo';
  } else if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  } else if (diffInHours < 24) {
    return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  } else if (isYesterday(parsedDate)) {
    return 'Ayer';
  } else if (diffInDays < 7) {
    return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  } else if (isThisYear(parsedDate)) {
    return format(parsedDate, 'd MMM', { locale: es });
  } else {
    return format(parsedDate, 'd MMM yyyy', { locale: es });
  }
};

/**
 * Formats a date to a readable string
 */
export const formatDate = (date: Date | string | number, formatStr = 'PPP'): string => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    return format(parsedDate, formatStr, { locale: es });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Checks if the platform is iOS
 */
export const isIOS = (): boolean => Platform.OS === 'ios';

/**
 * Checks if the platform is Android
 */
export const isAndroid = (): boolean => Platform.OS === 'android';

/**
 * Checks if the platform is web
 */
export const isWeb = (): boolean => Platform.OS === 'web';

/**
 * Capitalizes the first letter of a string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Truncates a string to a specified length and adds an ellipsis
 */
export const truncate = (str: string, length: number, ellipsis = '...'): string => {
  if (!str || str.length <= length) return str;
  return `${str.substring(0, length)}${ellipsis}`;
};

/**
 * Formats a number as a currency string
 */
export const formatCurrency = (
  value: number, 
  currency: string = 'ARS', 
  locale: string = 'es-AR'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formats a number with thousands separators
 */
export const formatNumber = (value: number, locale: string = 'es-AR'): string => {
  return new Intl.NumberFormat(locale).format(value);
};

/**
 * Safely parses a JSON string
 */
export const safeJsonParse = <T>(str: string, fallback: T): T => {
  try {
    return JSON.parse(str) as T;
  } catch (e) {
    return fallback;
  }
};

/**
 * Safely stringifies an object
 */
export const safeJsonStringify = (obj: unknown, fallback = ''): string => {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return fallback;
  }
};

/**
 * Debounces a function
 */
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number
): ((...args: Parameters<F>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<F>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttles a function
 */
export const throttle = <F extends (...args: any[]) => any>(
  func: F,
  limit: number
): ((...args: Parameters<F>) => void) => {
  let inThrottle = false;
  
  return function executedFunction(...args: Parameters<F>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Generates a unique ID
 */
export const generateId = (length = 8): string => {
  return Math.random().toString(36).substring(2, length + 2);
};

/**
 * Checks if a value is empty
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Deep clones an object
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (obj instanceof Object) {
    const cloned: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, value]) => {
      cloned[key] = deepClone(value);
    });
    return cloned as T;
  }
  
  return obj;
};

/**
 * Merges two objects deeply
 */
export const deepMerge = <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key as keyof T] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
};

/**
 * Checks if a value is an object
 */
export const isObject = (item: unknown): item is Record<string, unknown> => {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Creates a function that can only be called once
 */
export const once = <F extends (...args: any[]) => any>(func: F): ((...args: Parameters<F>) => ReturnType<F> | undefined) => {
  let called = false;
  let result: ReturnType<F>;
  
  return function (...args: Parameters<F>): ReturnType<F> | undefined {
    if (!called) {
      called = true;
      result = func(...args);
      return result;
    }
  };
};

/**
 * Pipes multiple functions together
 */
export const pipe = <T>(...fns: Array<(arg: T) => T>) => (value: T): T => {
  return fns.reduce((acc, fn) => fn(acc), value);
};

/**
 * Composes multiple functions from right to left
 */
export const compose = <T>(...fns: Array<(arg: T) => T>) => (value: T): T => {
  return fns.reduceRight((acc, fn) => fn(acc), value);
};
