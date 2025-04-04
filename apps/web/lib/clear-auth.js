/**
 * Utility script to clear authentication data from localStorage
 * This is needed when the backend port changes to prevent endless API calls
 */

// Clear all authentication data from localStorage
localStorage.removeItem('auth_token');
localStorage.removeItem('auth_user');
localStorage.removeItem('accessToken');

// Reload the page to reinitialize the application
window.location.href = '/login';

console.log('Authentication data cleared successfully. Redirecting to login...');
