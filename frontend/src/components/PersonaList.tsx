"use client";

import React, { useState, useMemo } from 'react';
import { PersonaCard } from './PersonaCard';
import type { Persona, PersonaType, KnowledgeDomain, CommunicationStyle } from '@/types/personas';

interface PersonaListProps {
  personas: Persona[];
  onEdit: (persona: Persona) => void;
  onDelete: (personaId: string) => void;
}

type SortOption = 'name' | 'created' | 'rating' | 'usage';
type FilterType = 'all' | PersonaType;

export function PersonaList({ personas, onEdit, onDelete }: PersonaListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeDomain | ''>('');
  const [selectedStyle, setSelectedStyle] = useState<CommunicationStyle | ''>('');

  // Filter and sort personas
  const filteredAndSortedPersonas = useMemo(() => {
    let filtered = personas.filter(persona => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        persona.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        persona.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = filterType === 'all' || persona.type === filterType;

      // Knowledge domain filter
      const matchesKnowledge = selectedKnowledge === '' || 
        persona.knowledge.includes(selectedKnowledge);

      // Communication style filter
      const matchesStyle = selectedStyle === '' || 
        persona.communicationStyle === selectedStyle;

      return matchesSearch && matchesType && matchesKnowledge && matchesStyle;
    });

    // Sort personas
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'usage':
          return b.conversationCount - a.conversationCount;
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [personas, searchTerm, sortBy, filterType, selectedKnowledge, selectedStyle]);

  const uniqueKnowledgeDomains = useMemo(() => {
    const domains = new Set<KnowledgeDomain>();
    personas.forEach(persona => {
      persona.knowledge.forEach(domain => domains.add(domain));
    });
    return Array.from(domains).sort();
  }, [personas]);

  const uniqueStyles = useMemo(() => {
    const styles = new Set<CommunicationStyle>();
    personas.forEach(persona => styles.add(persona.communicationStyle));
    return Array.from(styles).sort();
  }, [personas]);

  if (personas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No personas yet</h3>
        <p className="text-gray-600 mb-4 max-w-md mx-auto">
          Create your first persona to start having more engaging conversations with distinct personalities and perspectives.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B6B4A] focus:border-[#8B6B4A] transition-colors"
              placeholder="Search personas by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label htmlFor="persona-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="persona-type-filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B6B4A] focus:border-[#8B6B4A] transition-colors"
              >
                <option value="all">All Types</option>
                <option value="human_persona">Human Persona</option>
                <option value="ai_agent">AI Agent</option>
                <option value="ai_ambiguous">AI Ambiguous</option>
              </select>
            </div>

            {/* Knowledge Domain Filter */}
            <div>
              <label htmlFor="knowledge-domain-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Knowledge Domain
              </label>
              <select
                id="knowledge-domain-filter"
                value={selectedKnowledge}
                onChange={(e) => setSelectedKnowledge(e.target.value as KnowledgeDomain | '')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B6B4A] focus:border-[#8B6B4A] transition-colors"
              >
                <option value="">All Domains</option>
                {uniqueKnowledgeDomains.map(domain => (
                  <option key={domain} value={domain}>
                    {domain.charAt(0).toUpperCase() + domain.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Communication Style Filter */}
            <div>
              <label htmlFor="communication-style-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Communication Style
              </label>
              <select
                id="communication-style-filter"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value as CommunicationStyle | '')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B6B4A] focus:border-[#8B6B4A] transition-colors"
              >
                <option value="">All Styles</option>
                {uniqueStyles.map(style => (
                  <option key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label htmlFor="sort-by-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sort-by-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B6B4A] focus:border-[#8B6B4A] transition-colors"
              >
                <option value="created">Recently Created</option>
                <option value="name">Name (A-Z)</option>
                <option value="rating">Highest Rated</option>
                <option value="usage">Most Used</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredAndSortedPersonas.length} of {personas.length} personas
            </span>
            {(searchTerm || filterType !== 'all' || selectedKnowledge || selectedStyle) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setSelectedKnowledge('');
                  setSelectedStyle('');
                }}
                className="text-[#8B6B4A] hover:text-[#7A5D42] transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Personas Grid */}
      {filteredAndSortedPersonas.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No personas match your filters</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or filters to find more personas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedPersonas.map(persona => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onEdit={() => onEdit(persona)}
              onDelete={() => onDelete(persona.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}