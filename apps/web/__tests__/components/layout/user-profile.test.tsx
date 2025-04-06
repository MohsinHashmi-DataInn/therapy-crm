import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from '@/components/layout/user-profile';
import * as authContext from '@/contexts/auth-provider';
import * as authApi from '@/lib/api/auth';

// Mock the auth API
jest.mock('@/lib/api/auth', () => ({
  sendVerificationEmail: jest.fn(),
}));

// Mock the useAuth hook
jest.mock('@/contexts/auth-provider', () => ({
  ...jest.requireActual('@/contexts/auth-provider'),
  useAuth: jest.fn(),
}));

describe('UserProfile', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders user dropdown when user is available', async () => {
    // Mock useAuth to return a user
    const mockUseAuth = jest.fn().mockReturnValue({
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        isEmailVerified: true,
      },
      logout: jest.fn(),
      hasRole: jest.fn().mockReturnValue(false),
      sendVerificationEmail: jest.fn(),
    });
    
    (authContext.useAuth as jest.Mock).mockImplementation(mockUseAuth);

    render(<UserProfile />);
    
    // Get the avatar button (can't rely on name as it's not explicitly set in aria-label)
    const userButton = screen.getByRole('button');
    
    // Setup user event
    const user = userEvent.setup();
    
    // Open dropdown
    await user.click(userButton);
    
    // Check dropdown content
    const profileLink = screen.getByText(/profile/i);
    const logoutButton = screen.getByText(/log out/i);
    
    expect(profileLink).toBeInTheDocument();
    expect(logoutButton).toBeInTheDocument();
    
    // Verify email option should not be visible for verified users
    const verifyEmail = screen.queryByText(/verify email/i);
    expect(verifyEmail).not.toBeInTheDocument();
  });

  it('shows verify email option for unverified users', async () => {
    // Mock useAuth to return an unverified user
    const mockSendVerificationEmail = jest.fn().mockResolvedValue(true);
    
    const mockUseAuth = jest.fn().mockReturnValue({
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        isEmailVerified: false,
      },
      logout: jest.fn(),
      hasRole: jest.fn().mockReturnValue(false),
      sendVerificationEmail: mockSendVerificationEmail,
    });
    
    (authContext.useAuth as jest.Mock).mockImplementation(mockUseAuth);

    render(<UserProfile />);
    
    // Setup user event
    const user = userEvent.setup();
    
    // Open dropdown
    const userButton = screen.getByRole('button');
    await user.click(userButton);
    
    // Check for verify email option
    const verifyEmailButton = screen.getByText(/verify email/i);
    expect(verifyEmailButton).toBeInTheDocument();
    
    // Test clicking the verify email button
    await user.click(verifyEmailButton);
    
    // Verify sendVerificationEmail was called
    expect(mockSendVerificationEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('shows loading state when sending verification email', async () => {
    // Mock useAuth to return an unverified user with delayed sendVerificationEmail
    const mockSendVerificationEmail = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(true), 500))
    );
    
    const mockUseAuth = jest.fn().mockReturnValue({
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        isEmailVerified: false,
      },
      logout: jest.fn(),
      hasRole: jest.fn().mockReturnValue(false),
      sendVerificationEmail: mockSendVerificationEmail,
    });
    
    (authContext.useAuth as jest.Mock).mockImplementation(mockUseAuth);

    render(<UserProfile />);
    
    // Setup user event
    const user = userEvent.setup();
    
    // Open dropdown
    const userButton = screen.getByRole('button');
    await user.click(userButton);
    
    // Click verify email button
    const verifyEmailButton = screen.getByText(/verify email/i);
    await user.click(verifyEmailButton);
    
    // Check for loading state
    expect(screen.getByText(/sending/i)).toBeInTheDocument();
    
    // Wait for operation to complete
    await waitFor(() => {
      expect(screen.queryByText(/sending/i)).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('handles error when sending verification email fails', async () => {
    // Mock useAuth to return an unverified user with failing sendVerificationEmail
    const mockSendVerificationEmail = jest.fn().mockRejectedValue(
      new Error('Failed to send verification email')
    );
    
    const mockUseAuth = jest.fn().mockReturnValue({
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        isEmailVerified: false,
      },
      logout: jest.fn(),
      hasRole: jest.fn().mockReturnValue(false),
      sendVerificationEmail: mockSendVerificationEmail,
    });
    
    (authContext.useAuth as jest.Mock).mockImplementation(mockUseAuth);
    
    // Mock console.error to track error logging
    const originalConsoleError = console.error;
    const mockConsoleError = jest.fn();
    console.error = mockConsoleError;

    render(<UserProfile />);
    
    // Setup user event
    const user = userEvent.setup();
    
    // Open dropdown
    const userButton = screen.getByRole('button');
    await user.click(userButton);
    
    // Click verify email button
    const verifyEmailButton = screen.getByText(/verify email/i);
    await user.click(verifyEmailButton);
    
    // Wait for error to be logged
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to send verification email:',
        expect.any(Error)
      );
    });
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('calls logout when clicking logout button', async () => {
    // Mock useAuth to return a user
    const mockLogout = jest.fn();
    
    const mockUseAuth = jest.fn().mockReturnValue({
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        isEmailVerified: true,
      },
      logout: mockLogout,
      hasRole: jest.fn().mockReturnValue(false),
      sendVerificationEmail: jest.fn(),
    });
    
    (authContext.useAuth as jest.Mock).mockImplementation(mockUseAuth);

    // Mock console.log to verify it's called
    const originalConsoleLog = console.log;
    const mockConsoleLog = jest.fn();
    console.log = mockConsoleLog;

    render(<UserProfile />);
    
    // Setup user event
    const user = userEvent.setup();
    
    // Open dropdown
    const userButton = screen.getByRole('button');
    await user.click(userButton);
    
    // Click logout button
    const logoutButton = screen.getByText(/log out/i);
    await user.click(logoutButton);
    
    // Verify console.log and logout were called
    expect(mockConsoleLog).toHaveBeenCalledWith('Logout clicked');
    expect(mockLogout).toHaveBeenCalled();
    
    // Restore console.log
    console.log = originalConsoleLog;
  });
});
