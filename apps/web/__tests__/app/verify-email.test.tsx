import { render, screen, waitFor } from '@testing-library/react';
import VerifyEmailPage from '@/app/(auth)/verify-email/page';
import { AuthProvider } from '@/contexts/auth-provider';
import * as authApi from '@/lib/api/auth';
import { useSearchParams } from 'next/navigation';

// Mock the auth API
jest.mock('@/lib/api/auth', () => ({
  verifyEmail: jest.fn(),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock search params with token
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('token=valid-token'));
    
    render(
      <AuthProvider>
        <VerifyEmailPage />
      </AuthProvider>
    );
    
    // Check for loading state
    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
  });

  it('handles successful email verification', async () => {
    // Mock search params with token
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('token=valid-token'));
    
    // Mock successful verification
    (authApi.verifyEmail as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Email verified successfully',
    });
    
    render(
      <AuthProvider>
        <VerifyEmailPage />
      </AuthProvider>
    );
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/your email has been verified/i)).toBeInTheDocument();
    });
    
    // Check for next steps guidance
    expect(screen.getByText(/what's next/i)).toBeInTheDocument();
    expect(screen.getByText(/go to dashboard/i)).toBeInTheDocument();
    
    // Verify API call was made with correct token
    expect(authApi.verifyEmail).toHaveBeenCalledWith({ token: 'valid-token' });
  });

  it('handles verification error', async () => {
    // Mock search params with token
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('token=invalid-token'));
    
    // Mock failed verification
    const errorMessage = 'Invalid or expired token';
    (authApi.verifyEmail as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    render(
      <AuthProvider>
        <VerifyEmailPage />
      </AuthProvider>
    );
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Check for retry option
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
  });

  it('handles missing token', async () => {
    // Mock search params without token
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    
    render(
      <AuthProvider>
        <VerifyEmailPage />
      </AuthProvider>
    );
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
      expect(screen.getByText(/missing verification token/i)).toBeInTheDocument();
    });
  });
});
