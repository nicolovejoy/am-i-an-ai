"use client";

import React, { useState, useEffect } from 'react';
import type { 
  Persona, 
  PersonaCreate, 
  PersonaType, 
  KnowledgeDomain, 
  CommunicationStyle, 
  InteractionType,
  PersonalityTraits,
  AIModelConfig
} from '@/types/personas';

interface PersonaFormProps {
  persona?: Persona | null;
  onSubmit: (data: PersonaCreate) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  description?: string;
  knowledge?: string;
  allowedInteractions?: string;
  personality?: string;
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

const INTERACTION_TYPES: { value: InteractionType; label: string }[] = [
  { value: 'casual_chat', label: 'Casual Chat' },
  { value: 'debate', label: 'Debate' },
  { value: 'roleplay', label: 'Roleplay' },
  { value: 'interview', label: 'Interview' },
  { value: 'brainstorm', label: 'Brainstorming' },
  { value: 'storytelling', label: 'Storytelling' }
];

const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'custom', label: 'Custom' }
];

export function PersonaForm({ persona, onSubmit, onCancel }: PersonaFormProps) {
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

  const [aiConfig, setAiConfig] = useState<AIModelConfig>({
    modelProvider: 'openai',
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000
  });

  const [systemPrompt, setSystemPrompt] = useState('');
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

      if (persona.modelConfig) {
        setAiConfig(persona.modelConfig);
      }

      if (persona.systemPrompt) {
        setSystemPrompt(persona.systemPrompt);
      }
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
      newErrors.knowledge = 'At least one knowledge domain is required';
    }

    if (formData.allowedInteractions.length === 0) {
      newErrors.allowedInteractions = 'At least one interaction type is required';
    }

    // Validate personality traits are within range
    const traits = formData.personality;
    if (Object.values(traits).some(value => value < 0 || value > 100)) {
      newErrors.personality = 'Personality traits must be between 0 and 100';
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
      const submitData: PersonaCreate = {
        ...formData,
        ...(formData.type !== 'human_persona' && {
          modelConfig: aiConfig,
          systemPrompt: systemPrompt.trim() || undefined
        })
      };

      await onSubmit(submitData);
    } catch (error) {
      // Error handling is delegated to the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePersonalityChange = (trait: keyof PersonalityTraits, value: number) => {
    setFormData(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        [trait]: value
      }
    }));
  };

  const toggleKnowledgeDomain = (domain: KnowledgeDomain) => {
    setFormData(prev => ({
      ...prev,
      knowledge: prev.knowledge.includes(domain)
        ? prev.knowledge.filter(d => d !== domain)
        : [...prev.knowledge, domain]
    }));
  };

  const toggleInteractionType = (type: InteractionType) => {
    setFormData(prev => ({
      ...prev,
      allowedInteractions: prev.allowedInteractions.includes(type)
        ? prev.allowedInteractions.filter(t => t !== type)
        : [...prev.allowedInteractions, type]
    }));
  };

  const renderPersonalitySlider = (trait: keyof PersonalityTraits, label: string) => (
    <div key={trait} className="space-y-2">
      <div className="flex justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-500">{formData.personality[trait]}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={formData.personality[trait]}
        onChange={(e) => handlePersonalityChange(trait, parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          
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
                placeholder="e.g., Creative Writer, Data Scientist"
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
                <option value="human_persona">Human Persona</option>
                <option value="ai_agent">AI Agent</option>
                <option value="ai_ambiguous">AI Ambiguous</option>
              </select>
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
              placeholder="Describe this persona's background, expertise, and personality..."
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
          </div>
        </div>
      </div>

      {/* Knowledge Domains */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Knowledge Domains *</h3>
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
        {errors.knowledge && <p className="mt-2 text-sm text-red-600">{errors.knowledge}</p>}
      </div>

      {/* Interaction Types */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Allowed Interactions *</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {INTERACTION_TYPES.map(type => (
            <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowedInteractions.includes(type.value)}
                onChange={() => toggleInteractionType(type.value)}
                className="rounded border-gray-300 text-[#8B6B4A] focus:ring-[#8B6B4A]"
              />
              <span className="text-sm text-gray-700">{type.label}</span>
            </label>
          ))}
        </div>
        {errors.allowedInteractions && <p className="mt-2 text-sm text-red-600">{errors.allowedInteractions}</p>}
      </div>

      {/* Personality Traits */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personality Traits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderPersonalitySlider('openness', 'Openness to Experience')}
          {renderPersonalitySlider('conscientiousness', 'Conscientiousness')}
          {renderPersonalitySlider('extraversion', 'Extraversion')}
          {renderPersonalitySlider('agreeableness', 'Agreeableness')}
          {renderPersonalitySlider('neuroticism', 'Neuroticism')}
          {renderPersonalitySlider('creativity', 'Creativity')}
          {renderPersonalitySlider('assertiveness', 'Assertiveness')}
          {renderPersonalitySlider('empathy', 'Empathy')}
        </div>
        {errors.personality && <p className="mt-2 text-sm text-red-600">{errors.personality}</p>}
      </div>

      {/* AI Configuration (for AI personas only) */}
      {formData.type !== 'human_persona' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">AI Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Model Provider */}
            <div>
              <label htmlFor="model-provider" className="block text-sm font-medium text-gray-700 mb-1">
                Model Provider
              </label>
              <select
                id="model-provider"
                value={aiConfig.modelProvider}
                onChange={(e) => setAiConfig(prev => ({ ...prev, modelProvider: e.target.value as 'openai' | 'anthropic' | 'google' | 'custom' }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B6B4A] focus:border-[#8B6B4A] transition-colors"
              >
                {AI_PROVIDERS.map(provider => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Name */}
            <div>
              <label htmlFor="model-name" className="block text-sm font-medium text-gray-700 mb-1">
                Model Name
              </label>
              <input
                id="model-name"
                type="text"
                value={aiConfig.modelName}
                onChange={(e) => setAiConfig(prev => ({ ...prev, modelName: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B6B4A] focus:border-[#8B6B4A] transition-colors"
                placeholder="e.g., gpt-4, claude-3"
              />
            </div>

            {/* Temperature */}
            <div>
              <label htmlFor="temperature-slider" className="block text-sm font-medium text-gray-700 mb-1">
                Temperature ({aiConfig.temperature})
              </label>
              <input
                id="temperature-slider"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={aiConfig.temperature}
                onChange={(e) => setAiConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="block w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Max Tokens */}
            <div>
              <label htmlFor="max-tokens" className="block text-sm font-medium text-gray-700 mb-1">
                Max Tokens
              </label>
              <input
                id="max-tokens"
                type="number"
                value={aiConfig.maxTokens}
                onChange={(e) => setAiConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B6B4A] focus:border-[#8B6B4A] transition-colors"
                min="1"
                max="4000"
              />
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label htmlFor="system-prompt" className="block text-sm font-medium text-gray-700 mb-1">
              System Prompt (Optional)
            </label>
            <textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B6B4A] focus:border-[#8B6B4A] transition-colors"
              placeholder="Provide specific instructions for how this AI persona should behave..."
            />
          </div>
        </div>
      )}

      {/* Visibility Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Visibility Settings</h3>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isPublic}
            onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
            className="rounded border-gray-300 text-[#8B6B4A] focus:ring-[#8B6B4A]"
          />
          <span className="text-sm text-gray-700">
            Make this persona public (other users can discover and use it)
          </span>
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-[#8B6B4A] rounded-lg hover:bg-[#7A5D42] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : persona ? 'Update Persona' : 'Create Persona'}
        </button>
      </div>
    </form>
  );
}