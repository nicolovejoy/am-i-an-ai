"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePersonaStore } from '@/store';
import type { Persona } from '@/types/personas';

declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string;
  };
};

const LAMBDA_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://wygrsdhzg1.execute-api.us-east-1.amazonaws.com/prod';

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
        const response = await fetch(`${LAMBDA_API_BASE}/api/personas`);
        if (!response.ok) throw new Error('Failed to fetch personas');
        
        const data = await response.json();
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
      const response = await fetch(`${LAMBDA_API_BASE}/api/personas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPersona)
      });
      
      if (!response.ok) throw new Error('Failed to create persona');
      
      const data = await response.json();
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
      const response = await fetch(`${LAMBDA_API_BASE}/api/personas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) throw new Error('Failed to update persona');
      
      const data = await response.json();
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
      const response = await fetch(`${LAMBDA_API_BASE}/api/personas/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete persona');
      
      const data = await response.json();
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