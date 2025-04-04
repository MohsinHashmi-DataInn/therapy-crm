import axios from 'axios';

// Determine the base URL based on the environment
// In development, it might point to your NestJS backend locally.
// In production, it should point to your deployed backend API URL.
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api'; // Default to localhost:3001/api

const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Include credentials (like cookies) if your API uses session-based auth
  // or requires cookies for other reasons (e.g., CSRF protection)
  // withCredentials: true, 
});

// Optional: Add a request interceptor to include the JWT token
apiClient.interceptors.request.use(
  (config) => {
    // Assuming you store the token in localStorage or manage it via context/state
    const token = localStorage.getItem('accessToken'); // Adjust based on where you store the token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add a response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // You can add global error handling here, e.g., redirect to login on 401
    if (error.response && error.response.status === 401) {
      // Example: Handle unauthorized errors (e.g., redirect to login)
      console.error('Unauthorized access - redirecting to login.');
      // window.location.href = '/login'; // Or use Next.js router if appropriate context exists
    }
    return Promise.reject(error);
  }
);


export { apiClient };
