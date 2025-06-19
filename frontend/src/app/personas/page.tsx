"use client";

import React, { useState, useEffect } from 'react';
import { PersonaList } from '@/components/PersonaList';
import { PersonaForm } from '@/components/PersonaForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { api } from '@/services/apiClient';
import type { Persona } from '@/types/personas';

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For static export, always use mock data since API routes aren't available
      if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
        // Static export detected, use mock data
        const { getMockPersonas } = await import('@/lib/mockData');
        const mockPersonas = await getMockPersonas();
        setPersonas(mockPersonas);
        setError('Demo mode: Showing sample personas. Database connection will be restored soon.');
        return;
      }
      
      const data = await api.personas.list();
      setPersonas(data.personas || []);
      
      // Show warning if database returned an error but still gave us data
      if (data.error) {
        setError(data.error);
      }
      
    } catch (err) {
      // If database is completely unavailable, fall back to mock data
      if (err instanceof Error && (
        err.name === 'AbortError' || 
        err.message.includes('Database temporarily unavailable') ||
        err.message.includes('Failed to fetch') ||
        err.message.includes('fetch is not defined')
      )) {
        // Database unavailable, loading mock data
        const { getMockPersonas } = await import('@/lib/mockData');
        const mockPersonas = await getMockPersonas();
        setPersonas(mockPersonas);
        setError('Demo mode: Showing sample personas. Database connection will be restored soon.');
        return;
      }
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. The database may be experiencing issues. Please try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to load personas');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePersona = async (personaData: unknown) => {
    try {
      // In static export mode, show demo message
      if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
        setError('Demo mode: Creating personas is not available in the static demo. Please visit the full application.');
        return;
      }
      
      await api.personas.create(personaData);

      setShowCreateForm(false);
      setEditingPersona(null);
      await loadPersonas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create persona');
    }
  };

  const handleEditPersona = (persona: Persona) => {
    setEditingPersona(persona);
    setShowCreateForm(true);
  };

  const handleDeletePersona = async (personaId: string) => {
    try {
      // In static export mode, show demo message
      if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
        setError('Demo mode: Deleting personas is not available in the static demo. Please visit the full application.');
        return;
      }
      
      await api.personas.delete(personaId);

      await loadPersonas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete persona');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600">Loading personas...</p>
          <p className="mt-2 text-sm text-gray-500">This may take a moment while we connect to the database</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center">
        <div className="text-center">
          {error?.includes('Demo mode') ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Demo Mode Active</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={loadPersonas}
                  className="px-4 py-2 bg-[#8B6B4A] text-white rounded-lg hover:bg-[#7A5D42] transition-colors"
                >
                  Retry Connection
                </button>
                <button
                  onClick={() => setError(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Continue with Demo
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Personas</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadPersonas}
                className="px-4 py-2 bg-[#8B6B4A] text-white rounded-lg hover:bg-[#7A5D42] transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-[#F8F6F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Demo Mode Banner */}
          {personas.length > 0 && personas[0]?.id?.startsWith('mock-') && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900">Demo Mode Active</h3>
                  <p className="text-xs text-blue-700">You're viewing sample personas. Database connection will be restored soon.</p>
                </div>
                <button
                  onClick={loadPersonas}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Personas</h1>
                <p className="mt-2 text-gray-600">
                  Create and manage conversation personas for richer interactions
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-[#8B6B4A] text-white rounded-lg hover:bg-[#7A5D42] transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Persona
              </button>
            </div>
          </div>

          {/* Main Content */}
          {showCreateForm ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPersona ? 'Edit Persona' : 'Create New Persona'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingPersona(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <PersonaForm
                persona={editingPersona}
                onSubmit={handleCreatePersona}
                onCancel={() => {
                  setShowCreateForm(false);
                  setEditingPersona(null);
                }}
              />
            </div>
          ) : (
            <PersonaList
              personas={personas}
              onEdit={handleEditPersona}
              onDelete={handleDeletePersona}
            />
          )}
        </div>
      </main>
    </ErrorBoundary>
  );
}