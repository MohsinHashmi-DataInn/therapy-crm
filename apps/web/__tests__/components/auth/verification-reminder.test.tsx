import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerificationReminder } from '@/components/auth/verification-reminder';
import { AuthProvider } from '@/contexts/auth-provider';
import * as authApi from '@/lib/api/auth';

// Mock the auth API
jest.mock('@/lib/api/auth', () => ({
  sendVerificationEmail: jest.fn(),
}));

describe('VerificationReminder', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage
    localStorage.clear();
  });

  it('renders verification reminder correctly', () => {
    render(
      <AuthProvider>
        <VerificationReminder email="test@example.com" />
      </AuthProvider>
    );
    
    // Check for main elements
    expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    expect(screen.getByText(/we've sent a verification link to/i)).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
  });

  it('shows loading state when sending verification email', async () => {
    // Mock sendVerificationEmail to not resolve immediately
    (authApi.sendVerificationEmail as jest.Mock).mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 10000);
      });
    });
    
    render(
      <AuthProvider>
        <VerificationReminder email="test@example.com" />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const resendButton = screen.getByRole('button', { name: /resend verification email/i });
    
    // Click the resend button
    await user.click(resendButton);
    
    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText(/sending/i)).toBeInTheDocument();
      expect(resendButton).toBeDisabled();
    });
  });

  it('shows success message after successful verification email resend', async () => {
    // Mock successful API call
    (authApi.sendVerificationEmail as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Verification email sent',
    });
    
    render(
      <AuthProvider>
        <VerificationReminder email="test@example.com" />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const resendButton = screen.getByRole('button', { name: /resend verification email/i });
    
    // Click the resend button
    await user.click(resendButton);
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/verification email sent/i)).toBeInTheDocument();
    });
    
    // Verify API call was made with correct email
    expect(authApi.sendVerificationEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('shows error message when verification email fails to send', async () => {
    // Mock failed API call
    const errorMessage = 'Failed to send verification email';
    (authApi.sendVerificationEmail as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    render(
      <AuthProvider>
        <VerificationReminder email="test@example.com" />
      </AuthProvider>
    );
    
    const user = userEvent.setup();
    const resendButton = screen.getByRole('button', { name: /resend verification email/i });
    
    // Click the resend button
    await user.click(resendButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
