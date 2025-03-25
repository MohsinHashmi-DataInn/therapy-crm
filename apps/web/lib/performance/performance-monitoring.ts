/**
 * Performance monitoring utilities implementing section 17 requirements
 * For capturing and reporting frontend performance metrics
 */

// Web Vitals metrics interface
interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Constants for performance thresholds based on best practices
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 },   // First Input Delay (ms)
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift (unitless)
  TTFB: { good: 800, poor: 1800 }  // Time to First Byte (ms)
};

/**
 * Reports performance metrics to monitoring service
 */
export const reportPerformanceMetric = (metric: PerformanceMetric): void => {
  // In production, send to monitoring service (e.g., Google Analytics, custom APM)
  console.info(`Performance metric: ${metric.name}`, {
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta
  });

  // Example implementation for sending to a monitoring backend
  if (process.env.NODE_ENV === 'production') {
    // This would be replaced with actual API call
    /*
    fetch('/api/performance-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    }).catch(err => console.error('Failed to report performance metric:', err));
    */
  }
};

/**
 * Measures API call performance
 */
export const measureApiPerformance = async <T>(
  apiCallFn: () => Promise<T>,
  apiName: string
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await apiCallFn();
    const duration = performance.now() - startTime;
    
    // Log the performance data
    console.info(`API call: ${apiName}`, {
      duration: `${duration.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Log error with performance context
    console.error(`API call failed: ${apiName}`, {
      duration: `${duration.toFixed(2)}ms`,
      error,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
};

/**
 * Custom hook for measuring component render performance
 * To be used with React's useEffect
 */
export const measureComponentPerformance = (componentName: string): (() => void) | undefined => {
  if (typeof window !== 'undefined') {
    const startTime = performance.now();
    
    // Return cleanup function to measure when component unmounts
    return () => {
      const duration = performance.now() - startTime;
      console.info(`Component lifecycle: ${componentName}`, {
        duration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
    };
  }
  
  return undefined;
};

/**
 * Initialize core performance monitoring
 * Call this in the root layout or app initialization
 */
export const initPerformanceMonitoring = (): void => {
  if (typeof window !== 'undefined') {
    // Monitor page load time
    window.addEventListener('load', () => {
      setTimeout(() => {
        const pageLoadTime = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (pageLoadTime) {
          console.info('Page load performance', {
            loadTime: `${pageLoadTime.loadEventEnd - pageLoadTime.startTime}ms`,
            domContentLoaded: `${pageLoadTime.domContentLoadedEventEnd - pageLoadTime.startTime}ms`,
            firstByte: `${pageLoadTime.responseStart - pageLoadTime.requestStart}ms`,
            domInteractive: `${pageLoadTime.domInteractive - pageLoadTime.startTime}ms`,
            redirectTime: `${pageLoadTime.redirectEnd - pageLoadTime.redirectStart}ms`,
            url: window.location.href
          });
        }
      }, 0);
    });
    
    // Set up PerformanceObserver for paint timing
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((entries) => {
          entries.getEntries().forEach((entry) => {
            const metricName = entry.name;
            const time = entry.startTime;
            
            console.info(`Paint metric: ${metricName}`, {
              value: `${time.toFixed(0)}ms`,
              timestamp: new Date().toISOString()
            });
          });
        });
        
        paintObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.error('PerformanceObserver for paint failed:', e);
      }
    }
  }
};
