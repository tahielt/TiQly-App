import { Platform } from 'react-native';
import { format, parseISO, formatDistanceToNow, isDate } from 'date-fns';
import { es as esLocale } from 'date-fns/locale';

type DateFormat =
  | 'short'
  | 'medium'
  | 'long'
  | 'full'
  | 'date'
  | 'time'
  | 'datetime'
  | 'relative'
  | 'iso'
  | string;

/**
 * Formats a date string or Date object
 */
export const formatDate = (
  date: string | Date | number | null | undefined,
  formatStr: DateFormat = 'medium',
  locale = esLocale
): string => {
  if (!date) return '';

  let dateObj: Date;

  if (typeof date === 'string') {
    // Handle ISO strings or timestamps
    dateObj = date.includes('T') || date.includes(' ') ? parseISO(date) : new Date(parseInt(date, 10));
  } else if (typeof date === 'number') {
    // Handle timestamps
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  // Check if the date is valid
  if (Number.isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  // Handle different format presets
  switch (formatStr) {
    case 'short':
      return dateObj.toLocaleDateString('es-AR', {
        year: '2-digit',
        month: 'short',
        day: 'numeric',
      });

    case 'medium':
      return dateObj.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    case 'long':
      return dateObj.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    case 'full':
      return dateObj.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

    case 'date':
      return dateObj.toLocaleDateString('es-AR');

    case 'time':
      return dateObj.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });

    case 'datetime':
      return `${dateObj.toLocaleDateString('es-AR')} ${dateObj.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;

    case 'relative':
      return formatDistanceToNow(dateObj, {
        addSuffix: true,
        locale: locale
      });

    case 'iso':
      return dateObj.toISOString();

    default:
      // Handle custom format strings
      return format(dateObj, formatStr, { locale });
  }
};

/**
 * Formats a number as currency
 */
export const formatCurrency = (
  value: number | string,
  currency: string = 'ARS',
  locale: string = 'es-AR',
  options: Intl.NumberFormatOptions = {}
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return 'Precio no disponible';
  }

  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  };

  // Special case for Argentine Peso (ARS) - use symbol display
  if (currency === 'ARS') {
    defaultOptions.currencyDisplay = 'symbol';
  }

  return new Intl.NumberFormat(locale, {
    ...defaultOptions,
    ...options
  }).format(numValue);
};

/**
 * Formats a number with thousands separators
 */
export const formatNumber = (
  value: number | string,
  locale: string = 'es-AR',
  options: Intl.NumberFormatOptions = {}
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return '0';
  }

  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  };

  return new Intl.NumberFormat(locale, {
    ...defaultOptions,
    ...options
  }).format(numValue);
};

/**
 * Formats a file size in bytes to a human-readable string
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Formats a phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const cleaned = `${phoneNumber}`.replace(/\D/g, '');

  // Check if the number has a country code (assume Argentina +54)
  if (cleaned.length === 10) {
    // Format as AR number: (XXX) XXX-XXXX
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  } else if (cleaned.length > 10) {
    // Format with country code: +XX (XXX) XXX-XXXX
    const countryCode = cleaned.substring(0, cleaned.length - 10);
    const areaCode = cleaned.substring(cleaned.length - 10, cleaned.length - 7);
    const firstPart = cleaned.substring(cleaned.length - 7, cleaned.length - 4);
    const secondPart = cleaned.substring(cleaned.length - 4);

    return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
  }

  // Return original if format doesn't match
  return phoneNumber;
};

/**
 * Formats a credit card number with spaces
 */
export const formatCreditCardNumber = (cardNumber: string): string => {
  // Remove all non-digit characters
  const cleaned = `${cardNumber}`.replace(/\D/g, '');

  // Add a space every 4 digits
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

/**
 * Masks sensitive information like emails or credit card numbers
 */
export const maskSensitiveInfo = (str: string, type?: 'email' | 'phone' | 'credit-card' | 'ssn'): string => {
  if (!str) return '';

  switch (type) {
    case 'email':
      const [username, domain] = str.split('@');
      if (!username || !domain) return str;

      const maskedUsername = `${username.substring(0, 2)}${'*'.repeat(Math.max(0, username.length - 2))}`;
      const [domainName, tld] = domain.split('.');
      const maskedDomain = `${domainName?.substring(0, 2)}${'*'.repeat(Math.max(0, domainName?.length - 2 || 0))}`;

      return `${maskedUsername}@${maskedDomain}.${tld}`;

    case 'phone':
      const cleaned = str.replace(/\D/g, '');
      const lastFour = cleaned.slice(-4);
      return `••• ••• ${lastFour}`;

    case 'credit-card':
      const cardCleaned = str.replace(/\D/g, '');
      const lastFourDigits = cardCleaned.slice(-4);
      return `•••• •••• •••• ${lastFourDigits}`;

    case 'ssn':
      const ssnCleaned = str.replace(/\D/g, '');
      return `•••-••-${ssnCleaned.slice(-4)}`;

    default:
      const length = str.length;
      if (length <= 2) return '*'.repeat(length);
      return `${str.substring(0, 2)}${'*'.repeat(Math.max(0, length - 4))}${str.substring(length - 2)}`;
  }
};

/**
 * Truncates text to a specified length and adds an ellipsis
 */
export const truncateText = (text: string, maxLength: number, ellipsis: string = '...'): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}${ellipsis}`;
};

/**
 * Converts a string to title case
 */
export const toTitleCase = (str: string): string => {
  if (!str) return '';

  return str.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Converts a string to kebab-case
 */
export const toKebabCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

/**
 * Converts a string to camelCase
 */
export const toCamelCase = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/[\s-]+/g, '');
};

/**
 * Converts a string to PascalCase
 */
export const toPascalCase = (str: string): string => {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map(x => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
    .join('') || '';
};

/**
 * Converts a string to snake_case
 */
export const toSnakeCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
};

/**
 * Generates initials from a name
 */
export const getInitials = (name: string, maxLength: number = 2): string => {
  if (!name) return '';

  return name
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase())
    .filter((char, index) => index < maxLength)
    .join('');
};

export default {
  formatDate,
  formatCurrency,
  formatNumber,
  formatFileSize,
  formatPhoneNumber,
  formatCreditCardNumber,
  maskSensitiveInfo,
  truncateText,
  toTitleCase,
  toKebabCase,
  toCamelCase,
  toPascalCase,
  toSnakeCase,
  getInitials,
};
