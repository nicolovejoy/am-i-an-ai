import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Re-export everything from testing library for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

/**
 * Custom render function that can be extended with providers
 * Currently just wraps the standard render, but provides a place
 * to add providers like React Query, Zustand, etc. in the future
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, options);
}

/**
 * Wait for a specific number of milliseconds
 * Useful for testing loading states and timeouts
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Factory functions for creating test data
 */
export const createMockPersona = (overrides?: Partial<Record<string, unknown>>) => ({
  id: `persona-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Persona',
  avatar: '/avatars/default.png',
  bio: 'A test persona for unit tests',
  type: 'human' as const,
  personalityTraits: ['friendly', 'curious'],
  knowledgeDomains: ['general'],
  communicationStyle: 'casual',
  aiConfig: null,
  visibility: 'public' as const,
  isActive: true,
  userId: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createMockMessage = (overrides?: Partial<Record<string, unknown>>) => ({
  id: `msg-${Math.random().toString(36).substr(2, 9)}`,
  conversationId: 'conv-1',
  authorPersonaId: 'persona-1',
  content: 'Test message content',
  type: 'text' as const,
  timestamp: new Date().toISOString(),
  sequenceNumber: 1,
  metadata: {
    wordCount: 3,
    characterCount: 20,
    readingTime: 1,
    complexity: 0.5
  },
  moderationStatus: 'approved' as const,
  isVisible: true,
  isArchived: false,
  ...overrides
});

export const createMockConversation = (overrides?: Partial<Record<string, unknown>>) => ({
  id: `conv-${Math.random().toString(36).substr(2, 9)}`,
  title: 'Test Conversation',
  topic: 'Testing',
  description: 'A test conversation',
  status: 'active' as const,
  participants: [],
  messageCount: 0,
  totalCharacters: 0,
  topicTags: ['test'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  startedAt: new Date().toISOString(),
  ...overrides
});

export const createMockParticipant = (overrides?: Partial<Record<string, unknown>>) => ({
  personaId: 'persona-1',
  role: 'initiator' as const,
  isRevealed: false,
  joinedAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
  ...overrides
});

/**
 * Mock API response factory functions
 */
export const createApiSuccessResponse = <T>(data: T) => ({
  success: true,
  ...data
});

export const createApiErrorResponse = (error: string, statusCode = 400) => ({
  success: false,
  error,
  statusCode
});

/**
 * Setup mock fetch responses
 */
export interface MockFetchConfig {
  url: string | RegExp;
  response: unknown;
  options?: {
    status?: number;
    delay?: number;
    method?: string;
  };
}

export const setupMockFetch = (configs: MockFetchConfig[]) => {
  const mockFetch = jest.fn();
  
  mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
    const config = configs.find(c => {
      const urlMatches = typeof c.url === 'string' ? url.includes(c.url) : c.url.test(url);
      const methodMatches = !c.options?.method || options?.method === c.options.method;
      return urlMatches && methodMatches;
    });

    if (!config) {
      return Promise.reject(new Error(`No mock configured for ${url}`));
    }

    if (config.options?.delay) {
      await delay(config.options.delay);
    }

    return {
      ok: config.options?.status ? config.options.status < 400 : true,
      status: config.options?.status || 200,
      json: async () => config.response
    };
  });

  global.fetch = mockFetch as jest.MockedFunction<typeof fetch>;
  return mockFetch;
};

/**
 * Common test setup for conversations
 */
export const setupConversationTest = () => {
  const mockConversationId = 'test-conv-1';
  const mockPersona1 = createMockPersona({ id: 'persona-1', name: 'User 1', type: 'human' });
  const mockPersona2 = createMockPersona({ id: 'persona-2', name: 'AI Agent', type: 'ai_agent' });
  
  const mockConversation = createMockConversation({
    id: mockConversationId,
    participants: [
      createMockParticipant({ personaId: mockPersona1.id, role: 'initiator' }),
      createMockParticipant({ personaId: mockPersona2.id, role: 'responder' })
    ],
    messageCount: 2
  });

  const mockMessages = [
    createMockMessage({ 
      id: 'msg-1', 
      authorPersonaId: mockPersona1.id,
      content: 'Hello',
      sequenceNumber: 1
    }),
    createMockMessage({ 
      id: 'msg-2', 
      authorPersonaId: mockPersona2.id,
      content: 'Hi there!',
      sequenceNumber: 2
    })
  ];

  const mockFetch = setupMockFetch([
    {
      url: `/api/conversations/${mockConversationId}`,
      response: createApiSuccessResponse({ conversation: mockConversation })
    },
    {
      url: `/api/personas/${mockPersona1.id}`,
      response: createApiSuccessResponse({ persona: mockPersona1 })
    },
    {
      url: `/api/personas/${mockPersona2.id}`,
      response: createApiSuccessResponse({ persona: mockPersona2 })
    },
    {
      url: `/api/conversations/${mockConversationId}/messages`,
      response: createApiSuccessResponse({ messages: mockMessages })
    }
  ]);

  return {
    mockConversationId,
    mockConversation,
    mockPersona1,
    mockPersona2,
    mockMessages,
    mockFetch
  };
};

/**
 * Assert element visibility helpers
 */
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementNotToBeVisible = (element: HTMLElement | null) => {
  if (element) {
    expect(element).not.toBeVisible();
  } else {
    expect(element).not.toBeInTheDocument();
  }
};

/**
 * Accessibility testing helpers
 */
export const expectNoAccessibilityViolations = async (container: HTMLElement) => {
  const { axe, toHaveNoViolations } = require('jest-axe');
  expect.extend(toHaveNoViolations);
  const results = await axe(container);
  // @ts-expect-error - jest-axe extends expect with toHaveNoViolations
  expect(results).toHaveNoViolations();
};

/**
 * Form testing helpers
 */
export const fillForm = async (user: ReturnType<typeof import('@testing-library/user-event').default.setup>, formData: Record<string, string>) => {
  for (const [name, value] of Object.entries(formData)) {
    // Use screen to find elements instead of direct DOM access
    const { screen } = require('@testing-library/react');
    const input = screen.getByRole('textbox', { name: new RegExp(name, 'i') });
    if (input) {
      await user.clear(input);
      await user.type(input, value);
    }
  }
};

/**
 * Mock timer helpers for components that use intervals/timeouts
 */
export const useMockTimers = () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  return {
    advanceTime: (ms: number) => jest.advanceTimersByTime(ms),
    runAllTimers: () => jest.runAllTimers(),
    runPendingTimers: () => jest.runOnlyPendingTimers()
  };
};

/**
 * React Query test helpers (for future use)
 */
export const createQueryClient = () => {
  // Placeholder for React Query client creation
  // Will be implemented when React Query is added
  return null;
};

/**
 * Zustand test helpers (for future use)
 */
export const createMockStore = () => {
  // Placeholder for Zustand store mocking
  // Will be implemented based on actual store structure
  return null;
};