"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { FullPageLoader } from '@/components/LoadingSpinner';
import { Persona, PersonaType, KnowledgeDomain } from '@/types/personas';

interface ConversationFormData {
  title: string;
  topic: string;
  description: string;
  goals: string;
  selectedPersona: string; // Changed to single persona
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
    selectedPersona: '', // Changed to single persona
    isPrivate: true,
    topicTags: []
  });
  
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentTagInput, setCurrentTagInput] = useState('');
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const [showGoalSuggestions, setShowGoalSuggestions] = useState(false);

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
      
      // Fetch personas from Lambda API
      // eslint-disable-next-line no-undef
      const LAMBDA_API_BASE = process.env.NEXT_PUBLIC_API_URL as string || 'https://rovxzccsl3.execute-api.us-east-1.amazonaws.com/prod';
      
      // Add timeout for better UX
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`${LAMBDA_API_BASE}/api/personas`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch personas');
      }
      
      const data = await response.json();
      console.log('Personas fetched from API:', data);
      
      if (data.success && Array.isArray(data.personas)) {
        setPersonas(data.personas);
        
        // Set default AI persona selection (first AI persona)
        const firstAiPersona = data.personas.find((p: Persona) => p.type !== 'human_persona');
        if (firstAiPersona && !formData.selectedPersona) {
          setFormData(prev => ({
            ...prev,
            selectedPersona: firstAiPersona.id
          }));
        }
      } else {
        throw new Error('Invalid personas response format');
      }
      
    } catch (error) {
      console.error('Error fetching personas, using mock data:', error);
      
      // Fallback to mock personas if API fails
      const mockPersonas: Persona[] = [
        {
          id: '01234567-2222-2222-2222-012345678901',
          name: 'The Philosopher',
          description: 'A thoughtful individual who enjoys deep discussions about consciousness, ethics, and the meaning of existence.',
          type: 'human_persona' as PersonaType,
          knowledge: ['philosophy', 'psychology', 'general'] as KnowledgeDomain[],
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
          isPublic: true,
          allowedInteractions: ['casual_chat', 'debate', 'brainstorm'],
          conversationCount: 0,
          totalMessages: 0,
          averageRating: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '01234567-3333-3333-3333-012345678901',
          name: 'Deep Thinker',
          description: 'An AI with sophisticated reasoning capabilities and a passion for exploring complex philosophical questions.',
          type: 'ai_agent' as PersonaType,
          modelConfig: {
            modelProvider: 'openai' as const,
            modelName: 'gpt-4',
            temperature: 0.7,
            maxTokens: 2000
          },
          knowledge: ['philosophy', 'science', 'technology'] as KnowledgeDomain[],
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
          isPublic: true,
          allowedInteractions: ['casual_chat', 'debate', 'brainstorm'],
          conversationCount: 0,
          totalMessages: 0,
          averageRating: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '01234567-5555-5555-5555-012345678901',
          name: 'Creative Writer',
          description: 'Someone who loves crafting stories and exploring the boundaries of imagination through collaborative writing.',
          type: 'human_persona' as PersonaType,
          knowledge: ['arts', 'entertainment', 'general'] as KnowledgeDomain[],
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
          isPublic: true,
          allowedInteractions: ['casual_chat', 'roleplay', 'storytelling'],
          conversationCount: 0,
          totalMessages: 0,
          averageRating: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '01234567-6666-6666-6666-012345678901',
          name: 'Story Weaver',
          description: 'An AI specialized in collaborative storytelling with a knack for building compelling narratives.',
          type: 'ai_ambiguous' as PersonaType,
          modelConfig: {
            modelProvider: 'openai' as const,
            modelName: 'gpt-4',
            temperature: 0.8,
            maxTokens: 2000
          },
          knowledge: ['arts', 'entertainment', 'psychology'] as KnowledgeDomain[],
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
          isPublic: true,
          allowedInteractions: ['casual_chat', 'roleplay', 'storytelling'],
          conversationCount: 0,
          totalMessages: 0,
          averageRating: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '01234567-8888-8888-8888-012345678901',
          name: 'Tech Enthusiast',
          description: 'A technology-focused individual passionate about innovation, AI development, and the future of human-computer interaction.',
          type: 'human_persona' as PersonaType,
          knowledge: ['technology', 'science', 'business'] as KnowledgeDomain[],
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
          isPublic: true,
          allowedInteractions: ['casual_chat', 'debate', 'interview'],
          conversationCount: 0,
          totalMessages: 0,
          averageRating: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      setPersonas(mockPersonas);
      
      // Set default AI persona selection (first AI persona)
      const firstAiPersona = mockPersonas.find((p: Persona) => p.type !== 'human_persona');
      if (firstAiPersona && !formData.selectedPersona) {
        setFormData(prev => ({
          ...prev,
          selectedPersona: firstAiPersona.id
        }));
      }
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

  const handlePersonaSelect = (personaId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPersona: personaId
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Check if required fields are filled
      if (formData.title.trim() && formData.topic.trim() && formData.selectedPersona) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    }
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
    
    if (!formData.selectedPersona) {
      addToast('error', 'Please select a persona to chat with');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create conversation via Lambda API
      // eslint-disable-next-line no-undef
      const LAMBDA_API_BASE = process.env.NEXT_PUBLIC_API_URL as string || 'https://rovxzccsl3.execute-api.us-east-1.amazonaws.com/prod';
      
      console.log('Creating conversation with data:', {
        ...formData,
        createdBy: 'demo-user'
      });
      
      const response = await fetch(`${LAMBDA_API_BASE}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          selectedPersonas: [
            personas.find(p => p.type === 'human_persona')?.id || '660e8400-e29b-41d4-a716-446655440001', // First human persona
            formData.selectedPersona    // Selected AI persona
          ],
          createdBy: 'demo-user' // In production, this would come from auth context
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response (raw):', errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('API error response (parsed):', errorData);
          throw new Error(errorData.error || errorData.message || 'Failed to create conversation');
        } catch (parseError) {
          console.error('Could not parse error response as JSON');
          throw new Error(`Server error ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('API success response:', data);
      
      if (data.success && data.conversation) {
        addToast('success', 'Conversation created successfully!');
        console.log('Redirecting to conversation:', data.conversation.id);
        router.push(`/conversations/${data.conversation.id}`);
      } else {
        // This shouldn't happen if API is working correctly
        console.error('Unexpected API response format:', data);
        addToast('error', 'Unexpected response format from server');
        const demoConversationId = '01234567-1111-1111-1111-012345678901';
        router.push(`/conversations/${demoConversationId}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      
      // Fallback to demo mode
      addToast('info', 'Using demo mode. Redirecting to sample conversation...');
      const demoConversationId = '01234567-1111-1111-1111-012345678901';
      router.push(`/conversations/${demoConversationId}`);
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







  const getTopicSuggestions = (): string[] => {
    const allSuggestions = [
      'The nature of consciousness and free will',
      'Building collaborative stories',
      'The future of AI and humanity',
      'Exploring philosophical paradoxes',
      'Creative writing workshop',
      'Problem-solving in complex scenarios',
      'Discussing ethical dilemmas',
      'Brainstorming innovative solutions',
      'Analyzing literature and poetry',
      'Examining technological innovation',
      'Understanding human psychology',
      'Exploring cultural differences',
      'Debating current events',
      'Creative collaboration',
      'Learning from diverse perspectives'
    ];

    // Filter suggestions based on selected persona's knowledge areas
    if (formData.selectedPersona) {
      const selectedPersonaObject = personas.find(p => p.id === formData.selectedPersona);
      if (selectedPersonaObject) {
        const knowledge = selectedPersonaObject.knowledge;
        
        const relevantSuggestions = allSuggestions.filter(suggestion => {
          const suggestionLower = suggestion.toLowerCase();
          return knowledge.some(k => 
            suggestionLower.includes(k.toLowerCase()) || 
            k.toLowerCase().includes(suggestionLower.split(' ')[0])
          );
        });
        
        return relevantSuggestions.length > 0 ? relevantSuggestions.slice(0, 6) : allSuggestions.slice(0, 6);
      }
    }
    
    return allSuggestions.slice(0, 6);
  };

  const getGoalSuggestions = (): string[] => {
    const baseSuggestions = [
      'Reach a mutual understanding on the topic',
      'Generate creative ideas together',
      'Learn from different perspectives',
      'Solve a complex problem collaboratively',
      'Create something new together',
      'Challenge each other\'s assumptions',
      'Explore multiple viewpoints thoroughly',
      'Find common ground on disagreements',
      'Develop a deeper understanding of the subject',
      'Practice respectful debate and discussion'
    ];

    // Customize based on selected persona
    if (formData.selectedPersona) {
      const selectedPersonaObject = personas.find(p => p.id === formData.selectedPersona);
      if (selectedPersonaObject) {
        const customSuggestions = [];
        
        if (selectedPersonaObject.personality.creativity > 70) {
          customSuggestions.push('Collaborate on a creative project', 'Brainstorm innovative approaches');
        }
        if (selectedPersonaObject.personality.conscientiousness > 70) {
          customSuggestions.push('Analyze the topic systematically', 'Break down complex concepts');
        }
        if (selectedPersonaObject.knowledge.includes('philosophy')) {
          customSuggestions.push('Explore the philosophical implications', 'Question fundamental assumptions');
        }
        
        return [...customSuggestions, ...baseSuggestions].slice(0, 8);
      }
    }
    
    return baseSuggestions.slice(0, 6);
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
                Conversation Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Give your conversation a descriptive title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:border-transparent"
                required
              />
            </div>

            <div className="relative">
              <label htmlFor="topic" className="block text-sm font-medium text-[#2D3748] mb-2">
                Topic *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowTopicSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTopicSuggestions(false), 200)}
                  placeholder="What is the main focus of this conversation?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowTopicSuggestions(!showTopicSuggestions)}
                  className="absolute right-2 top-2 text-[#4A5568] hover:text-[#8B6B4A] transition-colors"
                >
                  💡
                </button>
              </div>
              
              {showTopicSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-2 text-xs font-medium text-[#4A5568] border-b border-gray-100">
                    {formData.selectedPersona ? 'Suggestions based on selected persona:' : 'Popular conversation topics:'}
                  </div>
                  {getTopicSuggestions().map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        handleInputChange('topic', suggestion);
                        setShowTopicSuggestions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-[#2D3748] hover:bg-[#8B6B4A]/5 border-b border-gray-50 last:border-b-0"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
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

            <div className="relative">
              <label htmlFor="goals" className="block text-sm font-medium text-[#2D3748] mb-2">
                Conversation Goals
              </label>
              <div className="relative">
                <textarea
                  id="goals"
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  onFocus={() => setShowGoalSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowGoalSuggestions(false), 200)}
                  placeholder="What do you hope to achieve or learn from this conversation?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowGoalSuggestions(!showGoalSuggestions)}
                  className="absolute right-2 top-2 text-[#4A5568] hover:text-[#8B6B4A] transition-colors"
                >
                  🎯
                </button>
              </div>
              
              {showGoalSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-2 text-xs font-medium text-[#4A5568] border-b border-gray-100">
                    {formData.selectedPersona ? 'Goals tailored to your selected persona:' : 'Suggested conversation goals:'}
                  </div>
                  {getGoalSuggestions().map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        const currentGoals = formData.goals.trim();
                        const newGoals = currentGoals ? `${currentGoals}\n• ${suggestion}` : `• ${suggestion}`;
                        handleInputChange('goals', newGoals);
                        setShowGoalSuggestions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-[#2D3748] hover:bg-[#8B6B4A]/5 border-b border-gray-50 last:border-b-0"
                    >
                      • {suggestion}
                    </button>
                  ))}
                </div>
              )}
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
          <h2 className="text-xl font-medium text-[#2D3748] mb-4">Choose Your Chat Partner</h2>
          <p className="text-sm text-[#4A5568] mb-6">
            You'll be chatting as <strong>"{personas.find(p => p.type === 'human_persona')?.name || 'Creative Writer Alice'}"</strong> - {personas.find(p => p.type === 'human_persona')?.description || 'a passionate creative writer who loves crafting stories'}. Select an AI persona to chat with:
          </p>

          <div>
            <label htmlFor="persona-select" className="block text-sm font-medium text-[#2D3748] mb-2">
              AI Chat Partner
            </label>
            <select
              id="persona-select"
              value={formData.selectedPersona}
              onChange={(e) => handlePersonaSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] focus:border-transparent"
              required
            >
              <option value="">Select an AI persona to chat with...</option>
              {personas.filter(p => p.type !== 'human_persona').map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {getPersonaTypeIcon(persona.type)} {persona.name} - {persona.description.slice(0, 60)}...
                </option>
              ))}
            </select>
          </div>

          {/* Show selected persona details */}
          {formData.selectedPersona && (
            <div className="mt-4 p-4 bg-[#8B6B4A]/5 border border-[#8B6B4A]/20 rounded-lg">
              {(() => {
                const selectedPersonaData = personas.find(p => p.id === formData.selectedPersona);
                if (!selectedPersonaData) return null;
                
                return (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getPersonaTypeIcon(selectedPersonaData.type)}</span>
                      <h3 className="font-medium text-[#2D3748]">{selectedPersonaData.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPersonaTypeColor(selectedPersonaData.type)}`}>
                        {selectedPersonaData.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-[#4A5568] mb-2">{selectedPersonaData.description}</p>
                    <div className="text-xs text-[#4A5568]">
                      <strong>Expertise:</strong> {selectedPersonaData.knowledge.join(', ')}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          
          {formData.selectedPersona && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                <strong>Conversation Setup:</strong> {personas.find(p => p.type === 'human_persona')?.name || 'Creative Writer Alice'} (you) will chat with {personas.find(p => p.id === formData.selectedPersona)?.name}
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