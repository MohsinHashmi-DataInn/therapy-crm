/**
 * Enhanced logging utility for the application
 * Provides different log levels and conditional logging based on environment
 */

// Enable/disable different types of logging
const LOG_LEVELS = {
  // Set to true to enable that type of logging in development
  AUTH: process.env.NODE_ENV === 'development' && false, // Disabled by default to reduce noise
  AUTH_ERROR: process.env.NODE_ENV === 'development', // Always log auth errors
  API: process.env.NODE_ENV === 'development',
  PERFORMANCE: process.env.NODE_ENV === 'development',
};

// Enable detailed logging for more verbose output
// Set to false to only log essential information
const DETAILED_LOGGING = false;

/**
 * Logs authentication-related messages and data
 * Only logs in development mode based on LOG_LEVELS
 */
export function logAuth(message: string, data?: any): void {
  if (LOG_LEVELS.AUTH) {
    if (data && DETAILED_LOGGING) {
      console.log(`[Auth]${message}`, data);
    } else {
      console.log(`[Auth]${message}`);
    }
  } else if (message.includes('error') || message.includes('failed') || message.includes('loop')) {
    // Always log auth errors regardless of log level
    console.log(`[Auth Error]${message}`, data ? data : '');
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
