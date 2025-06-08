"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { FullPageLoader } from '@/components/LoadingSpinner';

interface Persona {
  id: string;
  name: string;
  description: string;
  type: 'human' | 'ai_agent' | 'ai_ambiguous';
  modelConfig?: {
    modelProvider: 'openai' | 'anthropic';
    modelName: string;
    temperature: number;
  };
  knowledge: string[];
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    creativity: number;
    assertiveness: number;
    empathy: number;
  };
  communicationStyle: string;
  isActive: boolean;
  createdBy: string;
}

interface ConversationFormData {
  title: string;
  topic: string;
  description: string;
  goals: string;
  selectedPersonas: string[];
  isPrivate: boolean;
  topicTags: string[];
}

export default function NewConversationPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState<ConversationFormData>({
    title: '',
    topic: '',
    description: '',
    goals: '',
    selectedPersonas: [],
    isPrivate: true,
    topicTags: []
  });
  
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentTagInput, setCurrentTagInput] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    
    if (isAuthenticated) {
      fetchPersonas();
    }
  }, [isAuthenticated, authLoading, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Mock personas data that matches our database schema
      const mockPersonas: Persona[] = [
        {
          id: '01234567-2222-2222-2222-012345678901',
          name: 'The Philosopher',
          description: 'A thoughtful individual who enjoys deep discussions about consciousness, ethics, and the meaning of existence.',
          type: 'human',
          knowledge: ['philosophy', 'ethics', 'consciousness', 'existentialism'],
          personality: {
            openness: 85,
            conscientiousness: 70,
            extraversion: 45,
            agreeableness: 75,
            neuroticism: 35,
            creativity: 80,
            assertiveness: 60,
            empathy: 85
          },
          communicationStyle: 'academic',
          isActive: true,
          createdBy: 'system'
        },
        {
          id: '01234567-3333-3333-3333-012345678901',
          name: 'Deep Thinker',
          description: 'An AI with sophisticated reasoning capabilities and a passion for exploring complex philosophical questions.',
          type: 'ai_agent',
          modelConfig: {
            modelProvider: 'openai',
            modelName: 'gpt-4',
            temperature: 0.7
          },
          knowledge: ['philosophy', 'logic', 'cognitive-science', 'artificial-intelligence'],
          personality: {
            openness: 95,
            conscientiousness: 85,
            extraversion: 40,
            agreeableness: 70,
            neuroticism: 20,
            creativity: 90,
            assertiveness: 65,
            empathy: 75
          },
          communicationStyle: 'analytical',
          isActive: true,
          createdBy: 'system'
        },
        {
          id: '01234567-5555-5555-5555-012345678901',
          name: 'Creative Writer',
          description: 'Someone who loves crafting stories and exploring the boundaries of imagination through collaborative writing.',
          type: 'human',
          knowledge: ['creative-writing', 'literature', 'storytelling', 'character-development'],
          personality: {
            openness: 95,
            conscientiousness: 60,
            extraversion: 65,
            agreeableness: 80,
            neuroticism: 45,
            creativity: 95,
            assertiveness: 55,
            empathy: 85
          },
          communicationStyle: 'creative',
          isActive: true,
          createdBy: 'system'
        },
        {
          id: '01234567-6666-6666-6666-012345678901',
          name: 'Story Weaver',
          description: 'An AI specialized in collaborative storytelling with a knack for building compelling narratives.',
          type: 'ai_ambiguous',
          modelConfig: {
            modelProvider: 'openai',
            modelName: 'gpt-4',
            temperature: 0.8
          },
          knowledge: ['creative-writing', 'narrative-structure', 'character-development', 'world-building'],
          personality: {
            openness: 90,
            conscientiousness: 65,
            extraversion: 70,
            agreeableness: 85,
            neuroticism: 30,
            creativity: 95,
            assertiveness: 60,
            empathy: 80
          },
          communicationStyle: 'creative',
          isActive: true,
          createdBy: 'system'
        },
        {
          id: '01234567-8888-8888-8888-012345678901',
          name: 'Tech Enthusiast',
          description: 'A technology-focused individual passionate about innovation, AI development, and the future of human-computer interaction.',
          type: 'human',
          knowledge: ['technology', 'artificial-intelligence', 'innovation', 'computer-science'],
          personality: {
            openness: 85,
            conscientiousness: 80,
            extraversion: 75,
            agreeableness: 70,
            neuroticism: 25,
            creativity: 85,
            assertiveness: 75,
            empathy: 65
          },
          communicationStyle: 'technical',
          isActive: true,
          createdBy: 'system'
        }
      ];
      
      setPersonas(mockPersonas.filter(p => p.isActive));
    } catch (error) {
      addToast('error', 'Failed to load personas');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ConversationFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePersonaToggle = (personaId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPersonas: prev.selectedPersonas.includes(personaId)
        ? prev.selectedPersonas.filter(id => id !== personaId)
        : [...prev.selectedPersonas, personaId]
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTagInput.trim()) {
      e.preventDefault();
      const newTag = currentTagInput.trim().toLowerCase();
      if (!formData.topicTags.includes(newTag)) {
        handleInputChange('topicTags', [...formData.topicTags, newTag]);
      }
      setCurrentTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('topicTags', formData.topicTags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      addToast('error', 'Please enter a conversation title');
      return;
    }
    
    if (!formData.topic.trim()) {
      addToast('error', 'Please enter a conversation topic');
      return;
    }
    
    if (formData.selectedPersonas.length === 0) {
      addToast('error', 'Please select at least one persona to participate');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In demo mode, redirect to an existing conversation as an example
      // In production, this would create a real conversation and return the ID
      const demoConversationId = '01234567-1111-1111-1111-012345678901';
      
      addToast('success', 'Conversation created successfully! Redirecting to demo conversation...');
      router.push(`/conversations/${demoConversationId}`);
    } catch (error) {
      addToast('error', 'Failed to create conversation');
    } finally {
      setSubmitting(false);
    }
  };

  const getPersonaTypeIcon = (type: string) => {
    switch (type) {
      case 'human':
        return '👤';
      case 'ai_agent':
        return '🤖';
      case 'ai_ambiguous':
        return '❓';
      default:
        return '●';
    }
  };

  const getPersonaTypeColor = (type: string) => {
    switch (type) {
      case 'human':
        return 'bg-blue-100 text-blue-800';
      case 'ai_agent':
        return 'bg-green-100 text-green-800';
      case 'ai_ambiguous':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return <FullPageLoader text="Setting up conversation creation..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-semibold text-[#2D3748]">Start New Conversation</h1>
          <Link
            href="/"
            className="text-[#4A5568] hover:text-[#8B6B4A] transition-colors"
          >
            ← Back to Conversations
          </Link>
        </div>
        <p className="text-[#4A5568]">
          Create a new conversation by setting the topic, selecting participants, and defining your goals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-medium text-[#2D3748] mb-4">Conversation Details</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-[#2D3748] mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Give your conversation a descriptive title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-[#2D3748] mb-2">
                Main Topic *
              </label>
              <input
                type="text"
                id="topic"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                placeholder="What is the main focus of this conversation?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[#2D3748] mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide more context about what you'd like to explore"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="goals" className="block text-sm font-medium text-[#2D3748] mb-2">
                Conversation Goals
              </label>
              <textarea
                id="goals"
                value={formData.goals}
                onChange={(e) => handleInputChange('goals', e.target.value)}
                placeholder="What do you hope to achieve or learn from this conversation?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="topicTags" className="block text-sm font-medium text-[#2D3748] mb-2">
                Topic Tags
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  id="topicTags"
                  value={currentTagInput}
                  onChange={(e) => setCurrentTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type a tag and press Enter"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:border-transparent"
                />
                {formData.topicTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.topicTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-[#8B6B4A] text-white text-sm rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-white hover:text-gray-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Persona Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-medium text-[#2D3748] mb-4">Select Participants</h2>
          <p className="text-sm text-[#4A5568] mb-4">
            Choose personas to participate in your conversation. You can select multiple participants.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personas.map((persona) => (
              <div
                key={persona.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  formData.selectedPersonas.includes(persona.id)
                    ? 'border-[#8B6B4A] bg-[#8B6B4A]/5'
                    : 'border-gray-200 hover:border-[#8B6B4A]/50'
                }`}
                onClick={() => handlePersonaToggle(persona.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getPersonaTypeIcon(persona.type)}</span>
                    <h3 className="font-medium text-[#2D3748]">{persona.name}</h3>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.selectedPersonas.includes(persona.id)}
                    onChange={() => handlePersonaToggle(persona.id)}
                    className="text-[#8B6B4A] focus:ring-[#8B6B4A]"
                  />
                </div>
                
                <p className="text-sm text-[#4A5568] mb-3">{persona.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPersonaTypeColor(persona.type)}`}>
                    {persona.type.replace('_', ' ')}
                  </span>
                  <div className="text-xs text-[#4A5568]">
                    {persona.knowledge.slice(0, 2).join(', ')}
                    {persona.knowledge.length > 2 && ' +more'}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {formData.selectedPersonas.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                {formData.selectedPersonas.length} persona{formData.selectedPersonas.length > 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-medium text-[#2D3748] mb-4">Privacy Settings</h2>
          
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
              className="mt-1 text-[#8B6B4A] focus:ring-[#8B6B4A]"
            />
            <div>
              <label htmlFor="isPrivate" className="block font-medium text-[#2D3748]">
                Private Conversation
              </label>
              <p className="text-sm text-[#4A5568]">
                Only you and selected participants will be able to see this conversation
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="px-4 py-2 text-[#4A5568] hover:text-[#8B6B4A] transition-colors"
          >
            Cancel
          </Link>
          
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-[#8B6B4A] text-white font-medium rounded-md hover:bg-[#7A5A3A] focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Start Conversation'}
          </button>
        </div>
      </form>
    </div>
  );
}