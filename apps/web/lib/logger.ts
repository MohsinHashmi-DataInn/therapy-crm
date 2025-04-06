/**
 * Simple logging utility for the application
 * Conditionally logs messages based on environment settings
 */

// Enable/disable auth logging
const AUTH_LOGGING_ENABLED = process.env.NODE_ENV === 'development';

/**
 * Logs authentication-related messages and data
 * Only logs in development mode
 */
export function logAuth(message: string, data?: any): void {
  if (AUTH_LOGGING_ENABLED) {
    if (data) {
      console.log(`[Auth]${message}`, data);
    } else {
      console.log(`[Auth]${message}`);
    }
  }
}

/**
 * Logs API-related messages and data
 * Only logs in development mode
 */
export function logApi(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    if (data) {
      console.log(`[API]${message}`, data);
    } else {
      console.log(`[API]${message}`);
    }
  }
}
