import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  
  // Modal states
  activeModal: string | null;
  modalData: any;
  
  // General UI states
  isOnline: boolean;
  isMobile: boolean;
  
  // Preferences
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  
  setOnlineStatus: (online: boolean) => void;
  setMobileStatus: (mobile: boolean) => void;
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCompactMode: (compact: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      activeModal: null,
      modalData: null,
      isOnline: true,
      isMobile: false,
      theme: 'system',
      compactMode: false,
      
      // Actions
      setSidebarOpen: (open) => set(() => ({ sidebarOpen: open })),
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      openModal: (modalId, data) => set(() => ({
        activeModal: modalId,
        modalData: data
      })),
      
      closeModal: () => set(() => ({
        activeModal: null,
        modalData: null
      })),
      
      setOnlineStatus: (online) => set(() => ({ isOnline: online })),
      
      setMobileStatus: (mobile) => set(() => ({ isMobile: mobile })),
      
      setTheme: (theme) => set(() => ({ theme })),
      
      setCompactMode: (compact) => set(() => ({ compactMode: compact }))
    }),
    {
      name: 'ui-store'
    }
  )
);