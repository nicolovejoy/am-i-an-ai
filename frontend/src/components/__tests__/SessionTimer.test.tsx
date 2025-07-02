import { render, screen } from '@testing-library/react';
import SessionTimer from '../SessionTimer';
import { useSessionStore } from '@/store/sessionStore';

// Mock the session store
jest.mock('@/store/sessionStore');

describe('SessionTimer', () => {
  const mockUseSessionStore = useSessionStore as jest.MockedFunction<typeof useSessionStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when session is not active', () => {
    mockUseSessionStore.mockReturnValue({
      isSessionActive: false,
      timeRemaining: null,
    } as any);

    const { container } = render(<SessionTimer />);
    expect(container.firstChild).toBeNull();
  });

  it('renders time remaining when session is active', () => {
    mockUseSessionStore.mockReturnValue({
      isSessionActive: true,
      timeRemaining: 125, // 2:05
    } as any);

    render(<SessionTimer />);
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('renders "0:00" when time is up', () => {
    mockUseSessionStore.mockReturnValue({
      isSessionActive: true,
      timeRemaining: 0,
    } as any);

    render(<SessionTimer />);
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });
});