"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePersonaStore } from '@/store';
import type { Persona } from '@/types/personas';
import { api } from '@/services/apiClient';

export function usePersonas() {
  const queryClient = useQueryClient();
  const {
    personas,
    setPersonas,
    addPersona,
    updatePersona,
    deletePersona,
    setLoadingPersonas,
    setPersonaError
  } = usePersonaStore();

  // Fetch personas
  const personasQuery = useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      setLoadingPersonas(true);
      try {
        const data = await api.personas.list();
        if (data.success && data.personas) {
          const transformedPersonas: Persona[] = data.personas.map((p: {
            id: string;
            name: string;
            type: string;
            isAnonymous?: boolean;
            description?: string;
            avatarUrl?: string;
            traits?: string[];
            interests?: string[];
            conversationStyle?: Record<string, unknown>;
            aiConfig?: Record<string, unknown> | null;
            userId: string;
            status?: string;
            createdAt: string;
            updatedAt: string;
            metadata?: Record<string, unknown>;
          }) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            isAnonymous: p.isAnonymous || false,
            description: p.description,
            avatarUrl: p.avatarUrl,
            traits: p.traits || [],
            interests: p.interests || [],
            conversationStyle: p.conversationStyle || {},
            aiConfig: p.aiConfig || null,
            userId: p.userId,
            status: p.status || 'active',
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
            metadata: p.metadata || {}
          }));
          
          setPersonas(transformedPersonas);
          return transformedPersonas;
        }
        throw new Error(data.error || 'Failed to fetch personas');
      } catch (error) {
        setPersonaError(error instanceof Error ? error.message : 'Unknown error');
        throw error;
      } finally {
        setLoadingPersonas(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create persona mutation
  const createPersonaMutation = useMutation({
    mutationFn: async (newPersona: Partial<Persona>) => {
      const data = await api.personas.create(newPersona);
      
      if (!data.success) throw new Error(data.error || 'Failed to create persona');
      
      return data.persona;
    },
    onSuccess: (persona) => {
      addPersona(persona);
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
    onError: (error) => {
      setPersonaError(error instanceof Error ? error.message : 'Failed to create persona');
    }
  });

  // Update persona mutation
  const updatePersonaMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Persona> }) => {
      const data = await api.personas.update(id, updates);
      
      if (!data.success) throw new Error(data.error || 'Failed to update persona');
      
      return data.persona;
    },
    onSuccess: (persona) => {
      updatePersona(persona.id, persona);
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
    onError: (error) => {
      setPersonaError(error instanceof Error ? error.message : 'Failed to update persona');
    }
  });

  // Delete persona mutation
  const deletePersonaMutation = useMutation({
    mutationFn: async (id: string) => {
      const data = await api.personas.delete(id);
      
      if (!data.success) throw new Error(data.error || 'Failed to delete persona');
      
      return id;
    },
    onSuccess: (id) => {
      deletePersona(id);
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
    onError: (error) => {
      setPersonaError(error instanceof Error ? error.message : 'Failed to delete persona');
    }
  });

  return {
    personas,
    isLoading: personasQuery.isLoading,
    error: personasQuery.error,
    createPersona: createPersonaMutation.mutate,
    updatePersona: updatePersonaMutation.mutate,
    deletePersona: deletePersonaMutation.mutate,
    refetch: personasQuery.refetch
  };
}