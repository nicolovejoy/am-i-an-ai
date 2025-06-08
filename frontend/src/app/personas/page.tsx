"use client";

import React, { useState, useEffect } from 'react';
import { PersonaList } from '@/components/PersonaList';
import { PersonaForm } from '@/components/PersonaForm';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
      
      const response = await fetch('/api/personas?public=true');
      if (!response.ok) {
        throw new Error('Failed to fetch personas');
      }
      
      const data = await response.json();
      setPersonas(data.personas || []);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load personas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePersona = async (personaData: any) => {
    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personaData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create persona');
      }

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
      const response = await fetch(`/api/personas/${personaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete persona');
      }

      await loadPersonas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete persona');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Personas</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadPersonas}
            className="px-4 py-2 bg-[#8B6B4A] text-white rounded-lg hover:bg-[#7A5D42] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-[#F8F6F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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