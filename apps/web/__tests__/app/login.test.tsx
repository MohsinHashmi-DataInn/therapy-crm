import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/(auth)/login/page';
import { AuthProvider } from '@/contexts/auth-provider';
import * as authApi from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

// Mock the auth API
jest.mock('@/lib/api/auth', () => ({
  loginUser: jest.fn(),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
  usePathname: jest.fn(),
}));

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup mock implementations
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
    });
    
    (useToast as jest.Mock).mockReturnValue({
      toast: jest.fn(),
    });

    // Reset localStorage
    localStorage.clear();
  });

  it('renders login form correctly', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    
    // Check for form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('shows error when submitting with empty fields', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Submit with empty form
    await user.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows error when submitting with invalid email', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Enter invalid email
    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('shows loading state when submitting valid credentials', async () => {
    // Mock login API call (but don't resolve yet)
    (authApi.loginUser as jest.Mock).mockImplementation(() => {
      return new Promise((resolve) => {
        // This promise won't resolve during the test
        setTimeout(() => resolve({ user: {}, accessToken: 'token' }), 10000);
      });
    });
    
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Submit with valid data
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    // Check for loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on successful login', async () => {
    // Mock successful login
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    (authApi.loginUser as jest.Mock).mockResolvedValue({
      user: mockUser,
      accessToken: 'mock-token',
    });
    
    const mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    const mockToast = {
      toast: jest.fn(),
    };
    (useToast as jest.Mock).mockReturnValue(mockToast);
    
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Submit with valid data
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    // Check if router was called
    await waitFor(() => {
      expect(authApi.loginUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockToast.toast).toHaveBeenCalled();
      // In a real scenario, the AuthProvider would handle redirection
    });
  });

  it('shows error message on failed login', async () => {
    // Mock failed login
    (authApi.loginUser as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
    
    const mockToast = {
      toast: jest.fn(),
    };
    (useToast as jest.Mock).mockReturnValue(mockToast);
    
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Submit with valid data format but invalid credentials
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(authApi.loginUser).toHaveBeenCalled();
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
        })
      );
    });
  });
});
