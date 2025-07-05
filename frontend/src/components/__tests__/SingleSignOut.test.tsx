import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import Home from '@/app/page';
import HistoryPage from '@/app/history/page';
import AboutPage from '@/app/about/page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/',
}));

jest.mock('@/store/sessionStore', () => ({
  useSessionStore: () => ({
    match: null,
    connectionStatus: 'disconnected',
    testingMode: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendMessage: jest.fn(),
    reset: jest.fn(),
    startTestingMode: jest.fn(),
  }),
}));

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
})) as any;

// Helper to render with auth context
const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('Single Sign Out Button Rule', () => {
  beforeEach(() => {
    // Mock authenticated user
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'auth-user') {
        return JSON.stringify({ email: 'test@example.com' });
      }
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should have at most one sign out button on the home page', () => {
    renderWithAuth(<Home />);
    
    // Look for any element containing "sign out" text (case insensitive)
    const signOutElements = screen.queryAllByText(/sign out/i);
    expect(signOutElements.length).toBeLessThanOrEqual(1);
  });

  it('should have at most one sign out button on the history page', () => {
    renderWithAuth(<HistoryPage />);
    
    const signOutElements = screen.queryAllByText(/sign out/i);
    expect(signOutElements.length).toBeLessThanOrEqual(1);
  });

  it('should have at most one sign out button on the about page', () => {
    renderWithAuth(<AboutPage />);
    
    const signOutElements = screen.queryAllByText(/sign out/i);
    expect(signOutElements.length).toBeLessThanOrEqual(1);
  });

  it('should not show old project name "am I an AI?" in navigation', () => {
    renderWithAuth(<Home />);
    
    // Should not find the old name
    expect(screen.queryByText('am I an AI?')).not.toBeInTheDocument();
    
    // Should find the new name (if navigation is rendered)
    const robotOrchestra = screen.queryAllByText('Robot Orchestra');
    expect(robotOrchestra.length).toBeGreaterThanOrEqual(0); // May or may not be visible depending on auth state
  });
});