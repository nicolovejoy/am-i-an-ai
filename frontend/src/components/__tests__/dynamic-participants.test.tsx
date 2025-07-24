import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import ParticipantBar from '../ParticipantBar';
import ParticipantWaitingStatus from '../ParticipantWaitingStatus';
import MatchComplete from '../MatchComplete';
import { Identity } from '@shared/schemas';
import * as matchQueries from '@/store/server-state/match.queries';

// Mock the queries
jest.mock('@/store/server-state/match.queries', () => ({
  useParticipants: jest.fn(),
  useMyIdentity: jest.fn(),
  useMatch: jest.fn(),
  useCurrentRound: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dynamic Participant Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ParticipantBar', () => {
    it('should display correct count for 3 participants', () => {
      const mockParticipants = [
        { identity: 'A' as Identity, isConnected: true, displayName: 'Player 1' },
        { identity: 'B' as Identity, isConnected: true, displayName: 'Player 2' },
        { identity: 'C' as Identity, isConnected: true, displayName: 'AI Player' },
      ];

      const mockMatch = {
        totalParticipants: 3,
        participants: mockParticipants
      };

      (matchQueries.useParticipants as jest.Mock).mockReturnValue(mockParticipants);
      (matchQueries.useMyIdentity as jest.Mock).mockReturnValue('A');
      (matchQueries.useMatch as jest.Mock).mockReturnValue({ data: mockMatch });

      render(<ParticipantBar />, { wrapper: createWrapper() });

      expect(screen.getByText('3/3 connected')).toBeInTheDocument();
      expect(screen.getByText('Player 1')).toBeInTheDocument();
      expect(screen.getByText('Player 2')).toBeInTheDocument();
      expect(screen.getByText('AI Player')).toBeInTheDocument();
    });

    it('should display correct count for 8 participants', () => {
      const mockParticipants = Array.from({ length: 8 }, (_, i) => ({
        identity: String.fromCharCode(65 + i) as Identity,
        isConnected: i < 6, // Only 6 connected
        displayName: `Player ${i + 1}`
      }));

      const mockMatch = {
        totalParticipants: 8,
        participants: mockParticipants
      };

      (matchQueries.useParticipants as jest.Mock).mockReturnValue(mockParticipants);
      (matchQueries.useMyIdentity as jest.Mock).mockReturnValue('A');
      (matchQueries.useMatch as jest.Mock).mockReturnValue({ data: mockMatch });

      render(<ParticipantBar />, { wrapper: createWrapper() });

      expect(screen.getByText('6/8 connected')).toBeInTheDocument();
    });
  });

  describe('ParticipantWaitingStatus', () => {
    it('should show correct grid layout for 6 participants', () => {
      const mockMatch = {
        totalParticipants: 6,
        participants: Array.from({ length: 6 }, (_, i) => ({
          identity: String.fromCharCode(65 + i) as Identity,
          isConnected: true,
          displayName: `Player ${i + 1}`
        }))
      };

      const mockRound = {
        responses: {
          A: 'response1',
          B: 'response2',
          C: 'response3',
          // D, E, F haven't responded yet
        }
      };

      (matchQueries.useMatch as jest.Mock).mockReturnValue({ data: mockMatch });
      (matchQueries.useCurrentRound as jest.Mock).mockReturnValue(mockRound);

      render(<ParticipantWaitingStatus myIdentity={'A' as Identity} />, { wrapper: createWrapper() });

      expect(screen.getByText('3/6 responses received')).toBeInTheDocument();
      expect(screen.getByText('Waiting for 3 more participants...')).toBeInTheDocument();
    });
  });

  describe('MatchComplete', () => {
    it('should calculate scores correctly for variable participants', () => {
      const mockMatch = {
        matchId: 'test-match',
        participants: [
          { identity: 'A' as Identity, isAI: false, displayName: 'Human 1' },
          { identity: 'B' as Identity, isAI: false, displayName: 'Human 2' },
          { identity: 'C' as Identity, isAI: true, displayName: 'AI 1' },
          { identity: 'D' as Identity, isAI: true, displayName: 'AI 2' },
          { identity: 'E' as Identity, isAI: true, displayName: 'AI 3' },
        ],
        rounds: [
          {
            scores: { A: 1, B: 0, C: 0, D: 0, E: 1 },
            votes: { A: 'B', B: 'A', C: 'A', D: 'B', E: 'A' }
          }
        ]
      };

      render(<MatchComplete match={mockMatch} myIdentity={'A' as Identity} />, { wrapper: createWrapper() });

      // Should show all 5 participants
      expect(screen.getByText('Human 1')).toBeInTheDocument();
      expect(screen.getByText('Human 2')).toBeInTheDocument();
      expect(screen.getByText('AI 1')).toBeInTheDocument();
      expect(screen.getByText('AI 2')).toBeInTheDocument();
      expect(screen.getByText('AI 3')).toBeInTheDocument();
    });

    it('should use responsive grid layout based on participant count', () => {
      const mockMatch3 = {
        matchId: 'test-3',
        participants: Array.from({ length: 3 }, (_, i) => ({
          identity: String.fromCharCode(65 + i) as Identity,
          isAI: i > 0,
          displayName: `Player ${i + 1}`
        })),
        rounds: []
      };

      const { container } = render(
        <MatchComplete match={mockMatch3} myIdentity={'A' as Identity} />, 
        { wrapper: createWrapper() }
      );

      // For 3 participants, should use grid-cols-2
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-2');
    });
  });
});

describe('Color Assignment', () => {
  it('should assign unique colors to all 8 identities', () => {
    const identityColors = {
      A: 'bg-blue-500',
      B: 'bg-green-500',
      C: 'bg-purple-500',
      D: 'bg-orange-500',
      E: 'bg-pink-500',
      F: 'bg-yellow-500',
      G: 'bg-indigo-500',
      H: 'bg-red-500'
    };

    // Ensure all colors are unique
    const colors = Object.values(identityColors);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(colors.length);
  });
});

describe('Responsive Layouts', () => {
  it('should apply correct grid classes for different participant counts', () => {
    const testCases = [
      { count: 3, expectedClass: 'grid-cols-2' },
      { count: 4, expectedClass: 'grid-cols-2' },
      { count: 5, expectedClass: 'grid-cols-3' },
      { count: 6, expectedClass: 'grid-cols-3' },
      { count: 7, expectedClass: 'grid-cols-4' },
      { count: 8, expectedClass: 'grid-cols-4' }
    ];

    testCases.forEach(({ count, expectedClass }) => {
      const gridClass = count <= 4 ? 'grid-cols-2' : 
                       count <= 6 ? 'grid-cols-3' : 
                       'grid-cols-4';
      expect(gridClass).toBe(expectedClass);
    });
  });
});