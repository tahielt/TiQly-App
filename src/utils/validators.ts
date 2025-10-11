/**
 * Validates an email address
 */
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validates a password (at least 8 characters, 1 uppercase, 1 lowercase, 1 number)
 */
export const isValidPassword = (password: string): boolean => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return re.test(password);
};

/**
 * Validates a phone number (supports international formats)
 */
export const isValidPhone = (phone: string): boolean => {
  const re = /^\+?[1-9]\d{1,14}$/; // E.164 format
  return re.test(phone);
};

/**
 * Validates a URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates a date string (YYYY-MM-DD)
 */
export const isValidDate = (dateString: string): boolean => {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Validates a credit card number using Luhn algorithm
 */
export const isValidCreditCard = (cardNumber: string): boolean => {
  let sum = 0;
  let shouldDouble = false;
  
  // Remove all non-digit characters
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  // Check if the number is empty or too short
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }
  
  // Luhn algorithm
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit = (digit % 10) + 1;
      }
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return sum % 10 === 0;
};

/**
 * Validates a CVV (3 or 4 digits)
 */
export const isValidCVV = (cvv: string): boolean => {
  const re = /^\d{3,4}$/;
  return re.test(cvv);
};

/**
 * Validates an expiration date (MM/YY or MM/YYYY format)
 */
export const isValidExpirationDate = (expDate: string): boolean => {
  const re = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/;
  if (!re.test(expDate)) return false;
  
  const [month, year] = expDate.split('/');
  const expYear = parseInt(year.length === 2 ? `20${year}` : year, 10);
  const expMonth = parseInt(month, 10) - 1; // JS months are 0-indexed
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;
  
  return true;
};

/**
 * Validates a DNI (Argentinian ID)
 */
export const isValidDni = (dni: string): boolean => {
  const re = /^\d{7,8}$/;
  return re.test(dni);
};

/**
 * Validates a CUIT/CUIL (Argentinian tax ID)
 */
export const isValidCuit = (cuit: string): boolean => {
  // Remove all non-digit characters
  const cleanCuit = cuit.replace(/[\s-]/g, '');
  
  // Check length and format
  if (cleanCuit.length !== 11) return false;
  
  // Validate check digit
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCuit[i], 10) * multipliers[i];
  }
  
  const remainder = sum % 11;
  const checkDigit = 11 - remainder;
  const calculatedDigit = checkDigit === 11 ? 0 : checkDigit === 10 ? 9 : checkDigit;
  
  return parseInt(cleanCuit[10], 10) === calculatedDigit;
};

/**
 * Validates if a string contains only letters and spaces
 */
export const isAlphaWithSpaces = (str: string): boolean => {
  const re = /^[a-zA-Z\s]+$/;
  return re.test(str);
};

/**
 * Validates if a string contains only alphanumeric characters and spaces
 */
export const isAlphanumericWithSpaces = (str: string): boolean => {
  const re = /^[a-zA-Z0-9\s]+$/;
  return re.test(str);
};

/**
 * Validates if a string is a valid zip code (for Argentina)
 */
export const isValidZipCode = (zip: string): boolean => {
  const re = /^[A-Z]?\d{4,8}[A-Z]{0,3}$/i;
  return re.test(zip);
};

/**
 * Validates if a string is a valid IBAN
 */
export const isValidIban = (iban: string): boolean => {
  // Remove all whitespace and convert to uppercase
  const cleanIban = iban.replace(/\s+/g, '').toUpperCase();
  
  // Check length (min 15, max 34 characters)
  if (cleanIban.length < 15 || cleanIban.length > 34) {
    return false;
  }
  
  // Move first 4 characters to the end
  const rearranged = cleanIban.substring(4) + cleanIban.substring(0, 4);
  
  // Convert letters to numbers (A=10, B=11, ..., Z=35)
  let numeric = '';
  for (const char of rearranged) {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) { // A-Z
      numeric += (code - 55).toString();
    } else if (code >= 48 && code <= 57) { // 0-9
      numeric += char;
    } else {
      return false; // Invalid character
    }
  }
  
  // Check if numeric value mod 97 is 1
  let remainder = '';
  for (const digit of numeric) {
    const num = parseInt(remainder + digit, 10);
    remainder = (num % 97).toString();
  }
  
  return parseInt(remainder, 10) === 1;
};

/**
 * Validates if a string is a valid SWIFT/BIC code
 */
export const isValidSwiftBic = (bic: string): boolean => {
  const re = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  return re.test(bic);
};

/**
 * Validates if a string is a valid IP address
 */
export const isValidIpAddress = (ip: string): boolean => {
  const re = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return re.test(ip);
};

/**
 * Validates if a string is a valid MAC address
 */
export const isValidMacAddress = (mac: string): boolean => {
  const re = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return re.test(mac);
};

/**
 * Validates if a string is a valid hex color code
 */
export const isValidHexColor = (color: string): boolean => {
  const re = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return re.test(color);
};

/**
 * Validates if a string is a valid base64 encoded string
 */
export const isValidBase64 = (str: string): boolean => {
  try {
    return btoa(atob(str)) === str;
  } catch (e) {
    return false;
  }
};

/**
 * Validates if a string is a valid JSON
 */
export const isValidJson = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Creates a validation function that checks if a value is required
 */
export const required = (message = 'Este campo es requerido') => {
  return (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    return undefined;
  };
};

/**
 * Creates a validation function that checks minimum length
 */
export const minLength = (min: number, message = `Debe tener al menos ${min} caracteres`) => {
  return (value: string) => {
    if (value && value.length < min) {
      return message;
    }
    return undefined;
  };
};

/**
 * Creates a validation function that checks maximum length
 */
export const maxLength = (max: number, message = `No debe superar los ${max} caracteres`) => {
  return (value: string) => {
    if (value && value.length > max) {
      return message;
    }
    return undefined;
  };
};

/**
 * Composes multiple validation functions into a single function
 */
export const composeValidators = (...validators: Array<(value: any) => string | undefined>) => {
  return (value: any) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  };
};
