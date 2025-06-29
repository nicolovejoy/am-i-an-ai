"use client";

import React, { useState, useEffect } from 'react';
import type { 
  Persona, 
  PersonaCreate, 
  PersonaType, 
  KnowledgeDomain, 
  CommunicationStyle
} from '@/types/personas';

interface PersonaFormUserProps {
  persona?: Persona | null;
  onSubmit: (data: PersonaCreate) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  description?: string;
  knowledge?: string;
}

const KNOWLEDGE_DOMAINS: { value: KnowledgeDomain; label: string }[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'science', label: 'Science' },
  { value: 'arts', label: 'Arts' },
  { value: 'business', label: 'Business' },
  { value: 'philosophy', label: 'Philosophy' },
  { value: 'history', label: 'History' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'health', label: 'Health' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'politics', label: 'Politics' },
  { value: 'education', label: 'Education' },
  { value: 'general', label: 'General Knowledge' }
];

const COMMUNICATION_STYLES: { value: CommunicationStyle; label: string }[] = [
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'academic', label: 'Academic' },
  { value: 'creative', label: 'Creative' },
  { value: 'technical', label: 'Technical' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'analytical', label: 'Analytical' },
  { value: 'humorous', label: 'Humorous' }
];

const USER_PERSONA_TYPES: { value: PersonaType; label: string; description: string }[] = [
  { 
    value: 'human_persona', 
    label: 'Human Persona', 
    description: 'A roleplay character or professional persona for conversations' 
  },
  { 
    value: 'ai_ambiguous', 
    label: 'AI Ambiguous', 
    description: 'An ambiguous persona where it\'s unclear if human or AI' 
  }
];

export function PersonaFormUser({ persona, onSubmit, onCancel }: PersonaFormUserProps) {
  const [formData, setFormData] = useState<PersonaCreate>({
    name: '',
    type: 'human_persona',
    description: '',
    personality: {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
      creativity: 50,
      assertiveness: 50,
      empathy: 50
    },
    knowledge: [],
    communicationStyle: 'casual',
    isPublic: false,
    allowedInteractions: ['casual_chat']
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (persona) {
      setFormData({
        name: persona.name,
        type: persona.type,
        description: persona.description,
        personality: persona.personality,
        knowledge: persona.knowledge,
        communicationStyle: persona.communicationStyle,
        isPublic: persona.isPublic,
        allowedInteractions: persona.allowedInteractions
      });
    }
  }, [persona]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (formData.knowledge.length === 0) {
      newErrors.knowledge = 'At least one knowledge area is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling could be improved here
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleKnowledgeDomain = (domain: KnowledgeDomain) => {
    setFormData(prev => ({
      ...prev,
      knowledge: prev.knowledge.includes(domain)
        ? prev.knowledge.filter(k => k !== domain)
        : [...prev.knowledge, domain]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create Conversation Persona</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label htmlFor="persona-name" className="block text-sm font-medium text-gray-700 mb-1">
                Persona Name *
              </label>
              <input
                id="persona-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B6B4A] focus:border-[#8B6B4A] transition-colors ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Creative Writer, Data Scientist, Marketing Expert"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Type */}
            <div>
              <label htmlFor="persona-type" className="block text-sm font-medium text-gray-700 mb-1">
                Persona Type *
              </label>
              <select
                id="persona-type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PersonaType }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B6B4A] focus:border-[#8B6B4A] transition-colors"
              >
                {USER_PERSONA_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-600">
                {USER_PERSONA_TYPES.find(t => t.value === formData.type)?.description}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <label htmlFor="persona-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="persona-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B6B4A] focus:border-[#8B6B4A] transition-colors ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe this persona's background, expertise, and role in conversations..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Communication Style */}
          <div className="mt-4">
            <label htmlFor="communication-style" className="block text-sm font-medium text-gray-700 mb-1">
              Communication Style *
            </label>
            <select
              id="communication-style"
              value={formData.communicationStyle}
              onChange={(e) => setFormData(prev => ({ ...prev, communicationStyle: e.target.value as CommunicationStyle }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B6B4A] focus:border-[#8B6B4A] transition-colors"
            >
              {COMMUNICATION_STYLES.map(style => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-600">
              How this persona communicates in conversations
            </p>
          </div>
        </div>
      </div>

      {/* Knowledge Areas */}
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-2">Knowledge Areas *</h4>
          <p className="text-sm text-gray-600 mb-4">
            Select areas where this persona has expertise or interests
          </p>
          {errors.knowledge && <p className="mb-2 text-sm text-red-600">{errors.knowledge}</p>}
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {KNOWLEDGE_DOMAINS.map(domain => (
              <label key={domain.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.knowledge.includes(domain.value)}
                  onChange={() => toggleKnowledgeDomain(domain.value)}
                  className="rounded border-gray-300 text-[#8B6B4A] focus:ring-[#8B6B4A]"
                />
                <span className="text-sm text-gray-700">{domain.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-2">Visibility</h4>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="rounded border-gray-300 text-[#8B6B4A] focus:ring-[#8B6B4A]"
            />
            <span className="text-sm text-gray-700">
              Make this persona available for others to use in conversations
            </span>
          </label>
        </div>
      </div>

      {/* Submit buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B6B4A] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-[#8B6B4A] border border-transparent rounded-lg hover:bg-[#7A5B3D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B6B4A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating...' : persona ? 'Update Persona' : 'Create Persona'}
        </button>
      </div>
    </form>
  );
}