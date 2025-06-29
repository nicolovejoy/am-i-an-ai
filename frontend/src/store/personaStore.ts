import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Persona } from '@/types/personas';

interface PersonaState {
  // All personas
  personas: Persona[];
  
  // Selected personas for new conversation
  selectedPersonas: string[];
  
  // Loading states
  loadingPersonas: boolean;
  
  // Error states
  personaError: string | null;
  
  // Actions
  setPersonas: (personas: Persona[]) => void;
  addPersona: (persona: Persona) => void;
  updatePersona: (personaId: string, updates: Partial<Persona>) => void;
  deletePersona: (personaId: string) => void;
  
  // Selection management
  selectPersona: (personaId: string) => void;
  deselectPersona: (personaId: string) => void;
  clearSelectedPersonas: () => void;
  setSelectedPersonas: (personaIds: string[]) => void;
  
  // Loading and errors
  setLoadingPersonas: (loading: boolean) => void;
  setPersonaError: (error: string | null) => void;
  
  // Utility
  clearAllData: () => void;
}

export const usePersonaStore = create<PersonaState>()(
  devtools(
    (set) => ({
      // Initial state
      personas: [],
      selectedPersonas: [],
      loadingPersonas: false,
      personaError: null,
      
      // Actions
      setPersonas: (personas) =>
        set(() => ({
          personas,
          personaError: null
        })),
      
      addPersona: (persona) =>
        set((state) => ({
          personas: [...state.personas, persona]
        })),
      
      updatePersona: (personaId, updates) =>
        set((state) => ({
          personas: state.personas.map(p =>
            p.id === personaId ? { ...p, ...updates } : p
          )
        })),
      
      deletePersona: (personaId) =>
        set((state) => ({
          personas: state.personas.filter(p => p.id !== personaId),
          selectedPersonas: state.selectedPersonas.filter(id => id !== personaId)
        })),
      
      selectPersona: (personaId) =>
        set((state) => ({
          selectedPersonas: state.selectedPersonas.includes(personaId)
            ? state.selectedPersonas
            : [...state.selectedPersonas, personaId]
        })),
      
      deselectPersona: (personaId) =>
        set((state) => ({
          selectedPersonas: state.selectedPersonas.filter(id => id !== personaId)
        })),
      
      clearSelectedPersonas: () =>
        set(() => ({ selectedPersonas: [] })),
      
      setSelectedPersonas: (personaIds) =>
        set(() => ({ selectedPersonas: personaIds })),
      
      setLoadingPersonas: (loading) =>
        set(() => ({ loadingPersonas: loading })),
      
      setPersonaError: (error) =>
        set(() => ({ personaError: error })),
      
      clearAllData: () =>
        set(() => ({
          personas: [],
          selectedPersonas: [],
          loadingPersonas: false,
          personaError: null
        }))
    }),
    {
      name: 'persona-store'
    }
  )
);