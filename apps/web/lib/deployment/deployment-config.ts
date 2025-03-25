/**
 * Deployment configuration and environment utilities
 * Implements Deployment Strategies (Section 18)
 */

// Environment types for CI/CD pipeline
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

// Feature flag interface
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  rolloutPercentage?: number;
}

// Application version information
export interface AppVersion {
  version: string;
  buildNumber: string;
  commitHash: string;
  buildDate: string;
  environment: Environment;
}

/**
 * Current environment detection
 */
export const getCurrentEnvironment = (): Environment => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  if (process.env.NODE_ENV === 'development' || hostname === 'localhost') {
    return Environment.DEVELOPMENT;
  }
  
  if (hostname.includes('staging') || hostname.includes('test')) {
    return Environment.STAGING;
  }
  
  return Environment.PRODUCTION;
};

/**
 * Get application version info
 */
export const getAppVersion = (): AppVersion => {
  return {
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    buildNumber: process.env.NEXT_PUBLIC_BUILD_NUMBER || '0',
    commitHash: process.env.NEXT_PUBLIC_COMMIT_HASH || 'unknown',
    buildDate: process.env.NEXT_PUBLIC_BUILD_DATE || new Date().toISOString(),
    environment: getCurrentEnvironment(),
  };
};

/**
 * Get API base URL based on current environment
 */
export const getApiBaseUrl = (): string => {
  const environment = getCurrentEnvironment();
  
  switch (environment) {
    case Environment.DEVELOPMENT:
      return process.env.NEXT_PUBLIC_API_BASE_URL_DEV || 'http://localhost:5000';
    case Environment.STAGING:
      return process.env.NEXT_PUBLIC_API_BASE_URL_STAGING || 'https://api-staging.therapycrm.com';
    case Environment.PRODUCTION:
      return process.env.NEXT_PUBLIC_API_BASE_URL_PROD || 'https://api.therapycrm.com';
    default:
      return 'http://localhost:5000';
  }
};

/**
 * Feature flag management
 */
export const getFeatureFlags = async (): Promise<FeatureFlag[]> => {
  try {
    // In production, this would fetch from a feature flag service
    // For now, we'll just return some predefined flags
    return [
      {
        name: 'advanced_reporting',
        enabled: getCurrentEnvironment() !== Environment.PRODUCTION,
        description: 'Enable advanced reporting features',
      },
      {
        name: 'telehealth_integration',
        enabled: true,
        description: 'Enable telehealth integration',
      },
      {
        name: 'beta_client_portal',
        enabled: getCurrentEnvironment() === Environment.DEVELOPMENT,
        description: 'Enable beta client portal features',
        rolloutPercentage: 50,
      },
    ];
  } catch (error) {
    console.error('Failed to fetch feature flags:', error);
    return [];
  }
};

/**
 * Check if a specific feature flag is enabled
 */
export const isFeatureEnabled = async (featureName: string): Promise<boolean> => {
  try {
    const flags = await getFeatureFlags();
    const feature = flags.find(flag => flag.name === featureName);
    
    if (!feature) {
      return false;
    }
    
    // Check rollout percentage if defined
    if (feature.rolloutPercentage !== undefined) {
      const userIdentifier = getUserIdentifierForRollout();
      const hash = simpleHash(userIdentifier + featureName);
      const normalizedHash = hash % 100;
      
      return feature.enabled && normalizedHash < feature.rolloutPercentage;
    }
    
    return feature.enabled;
  } catch (error) {
    console.error(`Failed to check if feature '${featureName}' is enabled:`, error);
    return false;
  }
};

/**
 * Get a consistent user identifier for feature rollout
 */
const getUserIdentifierForRollout = (): string => {
  // In a real app, this would be a user ID or other persistent identifier
  // For now, we'll use localStorage if available, or a random value
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedId = localStorage.getItem('user_rollout_id');
    
    if (storedId) {
      return storedId;
    }
    
    const newId = Math.random().toString(36).substring(2);
    localStorage.setItem('user_rollout_id', newId);
    return newId;
  }
  
  return Math.random().toString(36).substring(2);
};

/**
 * Simple hash function for feature flag rollouts
 */
const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};
