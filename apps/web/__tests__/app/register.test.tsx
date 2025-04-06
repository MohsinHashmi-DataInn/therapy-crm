import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '@/app/(auth)/register/page';
import { AuthProvider } from '@/contexts/auth-provider';
import * as authApi from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

// Mock the auth API
jest.mock('@/lib/api/auth', () => ({
  registerUser: jest.fn(),
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

describe('RegisterPage', () => {
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

  it('renders registration form correctly', () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    
    // Check for form elements
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Submit with empty form
    await user.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Enter invalid email
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Enter short password
    await user.type(passwordInput, 'short');
    await user.click(submitButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Fill form with mismatched passwords
    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'john.doe@example.com');
    await user.type(passwordInput, 'securePassword123');
    await user.type(confirmPasswordInput, 'differentPassword123');
    await user.click(submitButton);
    
    // Check for password mismatch error
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('shows loading state when submitting valid form', async () => {
    // Mock registration API call that doesn't resolve immediately
    (authApi.registerUser as jest.Mock).mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ user: {}, accessToken: 'token' }), 10000);
      });
    });
    
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Fill form with valid data
    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'john.doe@example.com');
    await user.type(passwordInput, 'securePassword123');
    await user.type(confirmPasswordInput, 'securePassword123');
    await user.click(submitButton);
    
    // Check for loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    });
  });

  it('handles successful registration', async () => {
    // Mock successful registration
    const mockUser = {
      id: '1',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      isEmailVerified: false
    };
    
    (authApi.registerUser as jest.Mock).mockResolvedValue({
      user: mockUser,
      accessToken: 'mock-token'
    });
    
    const mockRouter = {
      push: jest.fn(),
      replace: jest.fn()
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    const mockToast = {
      toast: jest.fn()
    };
    (useToast as jest.Mock).mockReturnValue(mockToast);
    
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Fill form with valid data
    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'john.doe@example.com');
    await user.type(passwordInput, 'securePassword123');
    await user.type(confirmPasswordInput, 'securePassword123');
    await user.click(submitButton);
    
    // Wait for registration to complete
    await waitFor(() => {
      expect(authApi.registerUser).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'securePassword123'
      });
      expect(mockToast.toast).toHaveBeenCalled();
    });
  });

  it('handles registration error', async () => {
    // Mock failed registration
    const errorMessage = 'Email already in use';
    (authApi.registerUser as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const mockToast = {
      toast: jest.fn()
    };
    (useToast as jest.Mock).mockReturnValue(mockToast);
    
    render(
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Fill form with valid data
    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'john.doe@example.com');
    await user.type(passwordInput, 'securePassword123');
    await user.type(confirmPasswordInput, 'securePassword123');
    await user.click(submitButton);
    
    // Check for error handling
    await waitFor(() => {
      expect(authApi.registerUser).toHaveBeenCalled();
      expect(mockToast.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          description: errorMessage
        })
      );
    });
  });
});
