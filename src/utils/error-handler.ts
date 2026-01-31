import { logger } from './logger';

// React Native global error handler types
declare const global: typeof globalThis & {
  ErrorUtils?: {
    getGlobalHandler: () => (error: Error, isFatal: boolean) => void;
    setGlobalHandler: (handler: (error: Error, isFatal: boolean) => void) => void;
  };
};

type ErrorInfo = {
  code?: string | number;
  message: string;
  details?: unknown;
  isOperational?: boolean;
  statusCode?: number;
};

class AppError extends Error {
  public readonly code: string | number;
  public readonly details: unknown;
  public readonly isOperational: boolean;
  public readonly statusCode: number;

  constructor(info: ErrorInfo) {
    super(info.message);

    this.name = this.constructor.name;
    this.code = info.code || 'UNKNOWN_ERROR';
    this.details = info.details;
    this.isOperational = info.isOperational ?? true;
    this.statusCode = info.statusCode || 500;

    // Capture stack trace, excluding constructor call from it
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      details,
      statusCode: 400,
    });
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super({
      code: 'AUTHENTICATION_ERROR',
      message,
      statusCode: 401,
    });
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Not authorized') {
    super({
      code: 'AUTHORIZATION_ERROR',
      message,
      statusCode: 403,
    });
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super({
      code: 'NOT_FOUND',
      message: `${resource} not found`,
      statusCode: 404,
    });
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super({
      code: 'RATE_LIMIT_EXCEEDED',
      message,
      statusCode: 429,
    });
  }
}

class NetworkError extends AppError {
  constructor(message = 'Network request failed') {
    super({
      code: 'NETWORK_ERROR',
      message,
      isOperational: false,
      statusCode: 503,
    });
  }
}

class ServerError extends AppError {
  constructor(message = 'Internal server error') {
    super({
      code: 'INTERNAL_SERVER_ERROR',
      message,
      isOperational: false,
      statusCode: 500,
    });
  }
}

const errorHandler = {
  /**
   * Handles errors in async functions
   */
  asyncHandler: <T extends any[]>(fn: (...args: T) => Promise<any>) => {
    return async (...args: T) => {
      try {
        return await fn(...args);
      } catch (error) {
        return errorHandler.handleError(error);
      }
    };
  },

  /**
   * Centralized error handling
   */
  handleError: (error: unknown): { error: AppError } => {
    // Handle AppError instances
    if (error instanceof AppError) {
      // Log operational errors that we've thrown ourselves
      if (!error.isOperational) {
        logger.error(error.message, error);
      } else {
        logger.warn(`Operational error: ${error.message}`, error);
      }

      return { error };
    }

    // Handle native Error instances
    if (error instanceof Error) {
      const appError = new ServerError(error.message);
      logger.error('Unhandled error:', error);
      return { error: appError };
    }

    // Handle string errors
    if (typeof error === 'string') {
      const appError = new ServerError(error);
      logger.error('Unhandled string error:', error);
      return { error: appError };
    }

    // Handle unknown error types
    const appError = new ServerError('An unknown error occurred');
    logger.error('Unknown error type:', error);
    return { error: appError };
  },

  /**
   * Handles uncaught exceptions
   */
  handleUncaughtException: (error: Error) => {
    logger.error('Uncaught Exception:', error);
    // In a real app, you might want to perform cleanup here
    process.exit(1); // Mandatory (as per the Node.js docs)
  },

  /**
   * Handles unhandled promise rejections
   */
  handleUnhandledRejection: (reason: {} | null | undefined, _promise: Promise<any>) => {
    logger.error('Unhandled Rejection - reason:', reason);
    // In a real app, you might want to log this to an error tracking service
  },

  /**
   * Sets up global error handlers
   */
  setupGlobalHandlers: () => {
    process.on('uncaughtException', errorHandler.handleUncaughtException);
    process.on('unhandledRejection', errorHandler.handleUnhandledRejection);

    // Handle React Native's global error handler
    if (typeof global.ErrorUtils !== 'undefined') {
      const defaultHandler = global.ErrorUtils.getGlobalHandler();

      global.ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
        logger.error('React Native Global Error:', { error, isFatal });
        defaultHandler(error, isFatal);
      });
    }
  },
};

export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  NetworkError,
  ServerError,
  errorHandler,
};

export default errorHandler;
