import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Identity } from '@shared/schemas';

// UI-only state that doesn't need server sync
interface UIState {
  // Response selection UI
  selectedResponse: Identity | null;
  focusedIndex: number;
  
  // Menu/Modal states
  isMenuOpen: boolean;
  activeModal: 'settings' | 'help' | 'leave' | null;
  
  // Keyboard navigation
  isKeyboardNavEnabled: boolean;
  
  // Local preferences (could be persisted to localStorage)
  soundEnabled: boolean;
  animationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  
  // Typing indicators (local only, not synced)
  localIsTyping: boolean;
  typingTimeout: NodeJS.Timeout | null;
  
  // Actions
  setSelectedResponse: (identity: Identity | null) => void;
  setFocusedIndex: (index: number) => void;
  toggleMenu: () => void;
  setActiveModal: (modal: UIState['activeModal']) => void;
  setKeyboardNavEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setTheme: (theme: UIState['theme']) => void;
  setLocalTyping: (isTyping: boolean) => void;
  resetUI: () => void;
}

const initialState = {
  selectedResponse: null,
  focusedIndex: 0,
  isMenuOpen: false,
  activeModal: null,
  isKeyboardNavEnabled: true,
  soundEnabled: true,
  animationsEnabled: true,
  theme: 'light' as const,
  localIsTyping: false,
  typingTimeout: null,
};

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setSelectedResponse: (identity) => set({ selectedResponse: identity }),
      
      setFocusedIndex: (index) => set({ focusedIndex: index }),
      
      toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
      
      setActiveModal: (modal) => set({ activeModal: modal, isMenuOpen: false }),
      
      setKeyboardNavEnabled: (enabled) => {
        set({ isKeyboardNavEnabled: enabled });
        // Persist to localStorage
        localStorage.setItem('keyboardNavEnabled', String(enabled));
      },
      
      setSoundEnabled: (enabled) => {
        set({ soundEnabled: enabled });
        localStorage.setItem('soundEnabled', String(enabled));
      },
      
      setAnimationsEnabled: (enabled) => {
        set({ animationsEnabled: enabled });
        localStorage.setItem('animationsEnabled', String(enabled));
      },
      
      setTheme: (theme) => {
        set({ theme });
        localStorage.setItem('theme', theme);
        
        // Apply theme to document
        if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      
      setLocalTyping: (isTyping) => {
        const state = get();
        
        // Clear existing timeout
        if (state.typingTimeout) {
          clearTimeout(state.typingTimeout);
        }
        
        if (isTyping) {
          // Set typing indicator and auto-clear after 3 seconds
          const timeout = setTimeout(() => {
            set({ localIsTyping: false, typingTimeout: null });
          }, 3000);
          
          set({ localIsTyping: true, typingTimeout: timeout });
        } else {
          set({ localIsTyping: false, typingTimeout: null });
        }
      },
      
      resetUI: () => {
        const state = get();
        if (state.typingTimeout) {
          clearTimeout(state.typingTimeout);
        }
        
        set({
          selectedResponse: null,
          focusedIndex: 0,
          isMenuOpen: false,
          activeModal: null,
          localIsTyping: false,
          typingTimeout: null,
        });
      },
    }),
    {
      name: 'ui-store',
    }
  )
);

// Initialize from localStorage on load
if (typeof window !== 'undefined') {
  const store = useUIStore.getState();
  
  const savedKeyboardNav = localStorage.getItem('keyboardNavEnabled');
  if (savedKeyboardNav !== null) {
    store.setKeyboardNavEnabled(savedKeyboardNav === 'true');
  }
  
  const savedSound = localStorage.getItem('soundEnabled');
  if (savedSound !== null) {
    store.setSoundEnabled(savedSound === 'true');
  }
  
  const savedAnimations = localStorage.getItem('animationsEnabled');
  if (savedAnimations !== null) {
    store.setAnimationsEnabled(savedAnimations === 'true');
  }
  
  const savedTheme = localStorage.getItem('theme') as UIState['theme'];
  if (savedTheme) {
    store.setTheme(savedTheme);
  }
}