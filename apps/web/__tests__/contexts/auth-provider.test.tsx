import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/auth-provider';
import { AUTH, ROUTES } from '@/lib/constants';
import * as authApi from '@/lib/api/auth';

// Mock the auth API
jest.mock('@/lib/api/auth', () => ({
  loginUser: jest.fn(),
  registerUser: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  verifyEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
}));

// Test component that uses auth context
const TestComponent = () => {
  const { user, login, logout, isAuthenticated, register, hasRole } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated() ? 'Authenticated' : 'Not Authenticated'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button data-testid="login-button" onClick={() => login({ email: 'test@example.com', password: 'password123' })}>
        Login
      </button>
      <button data-testid="logout-button" onClick={() => logout()}>
        Logout
      </button>
      <button 
        data-testid="register-button" 
        onClick={() => register({ 
          firstName: 'Test', 
          lastName: 'User', 
          email: 'test@example.com', 
          password: 'password123' 
        })}
      >
        Register
      </button>
      {user && <div data-testid="has-admin-role">{hasRole('ADMIN') ? 'Is Admin' : 'Not Admin'}</div>}
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should provide initial unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
  });

  it('should authenticate user on successful login', async () => {
    // Setup mock response
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      isEmailVerified: true
    };
    
    (authApi.loginUser as jest.Mock).mockResolvedValue({
      accessToken: 'mock-token',
      user: mockUser
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Perform login
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));
    
    // Assert authentication state
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
    
    // Check localStorage
    expect(localStorage.getItem(AUTH.TOKEN_KEY)).toBe('mock-token');
    expect(localStorage.getItem(AUTH.USER_KEY)).toBeTruthy();
  });

  it('should handle login failure', async () => {
    // Setup mock response for failure
    (authApi.loginUser as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Perform login
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));
    
    // Assert still unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });
    
    // Check localStorage remains empty
    expect(localStorage.getItem(AUTH.TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH.USER_KEY)).toBeNull();
  });

  it('should register and authenticate user on successful registration', async () => {
    // Setup mock response
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      isEmailVerified: false
    };
    
    (authApi.registerUser as jest.Mock).mockResolvedValue({
      accessToken: 'mock-token',
      user: mockUser
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Perform registration
    const user = userEvent.setup();
    await user.click(screen.getByTestId('register-button'));
    
    // Assert authentication state
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  it('should logout user', async () => {
    // Setup initial authenticated state
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      isEmailVerified: true
    };
    
    (authApi.loginUser as jest.Mock).mockResolvedValue({
      accessToken: 'mock-token',
      user: mockUser
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Login first
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));
    
    // Verify authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Perform logout
    await user.click(screen.getByTestId('logout-button'));
    
    // Assert unauthenticated state
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    });
    
    // Check localStorage is cleared
    expect(localStorage.getItem(AUTH.TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH.USER_KEY)).toBeNull();
  });

  it('should correctly identify user roles', async () => {
    // Setup mock response with admin role
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isEmailVerified: true
    };
    
    (authApi.loginUser as jest.Mock).mockResolvedValue({
      accessToken: 'mock-token',
      user: mockUser
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Login as admin
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));
    
    // Assert admin role
    await waitFor(() => {
      expect(screen.getByTestId('has-admin-role')).toHaveTextContent('Is Admin');
    });
  });
});
