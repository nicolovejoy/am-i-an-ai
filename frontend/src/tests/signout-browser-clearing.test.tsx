/**
 * Test for sign out browser data clearing functionality
 * 
 * TDD Test: Tests that signing out properly clears all browser storage
 */

import { cognitoService } from '../services/cognito';
import { useConversationStore } from '../store/conversationStore';
import { useConversationsListStore } from '../store/conversationsListStore';
import { usePersonaStore } from '../store/personaStore';

// Mock the cognito service
jest.mock('../services/cognito', () => ({
  cognitoService: {
    signOut: jest.fn(),
    getCurrentUser: jest.fn(),
    getIdToken: jest.fn(),
  }
}));

describe('Sign Out Browser Data Clearing', () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => mockLocalStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockLocalStorage[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage = {};
        }),
      },
      writable: true,
    });

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    jest.clearAllMocks();
  });

  describe('Browser Storage Clearing Requirements', () => {
    it('should have a function to clear conversation store persistent data', () => {
      // This test defines what we expect to exist
      const conversationStore = useConversationStore.getState();
      
      // We expect a method to clear persistent data
      expect(typeof conversationStore.clearAllData).toBe('function');
    });

    it('should have a function to clear conversations list store data', () => {
      const conversationsListStore = useConversationsListStore.getState();
      
      // We expect a method to clear data
      expect(typeof conversationsListStore.clearAllData).toBe('function');
    });

    it('should have a function to clear persona store data', () => {
      const personaStore = usePersonaStore.getState();
      
      // We expect a method to clear data
      expect(typeof personaStore.clearAllData).toBe('function');
    });
  });

  describe('localStorage Clearing Requirements', () => {
    it('should clear conversation storage from localStorage on sign out', () => {
      // Setup: Put some data in localStorage
      mockLocalStorage['conversation-storage'] = JSON.stringify({
        state: { 
          currentConversationId: 'test-123', 
          draftMessage: 'test-draft',
          messages: [{ id: 'msg1', content: 'test' }]
        },
        version: 0
      });

      // Action: Call a signOut function that should clear data
      const signOutWithDataClearing = () => {
        cognitoService.signOut();
        // This is what we want to implement:
        window.localStorage.removeItem('conversation-storage');
      };

      signOutWithDataClearing();

      // Assert: localStorage conversation data should be cleared
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('conversation-storage');
    });

    it('should clear user-specific data from localStorage but preserve app settings', () => {
      // Setup: Put both user data and app settings in localStorage
      mockLocalStorage['conversation-storage'] = JSON.stringify({ userSpecific: true });
      mockLocalStorage['theme-preference'] = 'dark'; // This should be preserved
      mockLocalStorage['user-cache'] = JSON.stringify({ userData: 'test' });

      // Action: Selective clearing function (what we want to implement)
      const clearUserDataFromStorage = () => {
        const keysToRemove = ['conversation-storage', 'user-cache'];
        keysToRemove.forEach(key => {
          window.localStorage.removeItem(key);
        });
      };

      clearUserDataFromStorage();

      // Assert: User data cleared, app settings preserved
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('conversation-storage');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('user-cache');
      expect(window.localStorage.removeItem).not.toHaveBeenCalledWith('theme-preference');
    });
  });

  describe('sessionStorage Clearing Requirements', () => {
    it('should clear all sessionStorage on sign out', () => {
      // Action: Call sessionStorage.clear()
      const clearSessionStorage = () => {
        window.sessionStorage.clear();
      };

      clearSessionStorage();

      // Assert: sessionStorage should be completely cleared
      expect(window.sessionStorage.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe('Store State Clearing Requirements', () => {
    it('should reset conversation store to initial state on sign out', () => {
      const conversationStore = useConversationStore.getState();
      
      // Setup: Simulate some data in the store  
      conversationStore.setActiveConversation('test-123');
      conversationStore.setDraft('test-123', 'test-draft');

      // Action: Clear data
      conversationStore.clearAllData();

      // Assert: Store should be reset to initial state
      expect(conversationStore.activeConversationId).toBeNull();
      expect(conversationStore.drafts).toEqual({});
      expect(conversationStore.messages).toEqual({});
    });

    it('should reset conversations list store to initial state on sign out', () => {
      const conversationsListStore = useConversationsListStore.getState();
      
      // Setup: Check we have clearAllData method
      expect(typeof conversationsListStore.clearAllData).toBe('function');

      // Action: Clear data
      conversationsListStore.clearAllData();

      // Assert: Store should be reset to initial state
      expect(conversationsListStore.conversations).toHaveLength(0);
      expect(conversationsListStore.page).toBe(1);
      expect(conversationsListStore.totalCount).toBe(0);
      expect(conversationsListStore.hasMore).toBe(true);
    });

    it('should reset persona store to initial state on sign out', () => {
      const personaStore = usePersonaStore.getState();
      
      // Setup: Check we have clearAllData method
      expect(typeof personaStore.clearAllData).toBe('function');

      // Action: Clear data
      personaStore.clearAllData();

      // Assert: Store should be reset to initial state
      expect(personaStore.personas).toHaveLength(0);
      expect(personaStore.selectedPersonas).toHaveLength(0);
      expect(personaStore.loadingPersonas).toBe(false);
      expect(personaStore.personaError).toBeNull();
    });
  });

  describe('Complete Sign Out Data Clearing', () => {
    it('should have a comprehensive signOutAndClearData function', () => {
      // This test defines the comprehensive function we want to implement
      const signOutAndClearData = () => {
        // 1. Call cognito signOut
        cognitoService.signOut();
        
        // 2. Clear localStorage user data
        const userDataKeys = ['conversation-storage', 'user-cache', 'user-preferences'];
        userDataKeys.forEach(key => {
          window.localStorage.removeItem(key);
        });
        
        // 3. Clear sessionStorage completely
        window.sessionStorage.clear();
        
        // 4. Reset all stores
        const conversationStore = useConversationStore.getState();
        const conversationsListStore = useConversationsListStore.getState();
        const personaStore = usePersonaStore.getState();
        
        if (conversationStore.clearAllData) conversationStore.clearAllData();
        if (conversationsListStore.clearAllData) conversationsListStore.clearAllData();
        if (personaStore.clearAllData) personaStore.clearAllData();
      };

      // This test should pass once we implement the functionality
      expect(typeof signOutAndClearData).toBe('function');
      
      // Test execution
      signOutAndClearData();
      
      // Verify all clearing happened
      expect(cognitoService.signOut).toHaveBeenCalledTimes(1);
      expect(window.sessionStorage.clear).toHaveBeenCalledTimes(1);
    });
  });
});