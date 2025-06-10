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
      const LAMBDA_API_BASE = 'https://rovxzccsl3.execute-api.us-east-1.amazonaws.com/prod';
      const response = await fetch(`${LAMBDA_API_BASE}/api/personas`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch personas');
      }
      
      const data = await response.json();
      console.log('Personas fetched from API:', data);
      
      if (data.success && Array.isArray(data.personas)) {
        setPersonas(data.personas);
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
      
      // Create conversation via Lambda API
      const LAMBDA_API_BASE = 'https://rovxzccsl3.execute-api.us-east-1.amazonaws.com/prod';
      
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

  const calculatePersonalityDistance = (persona1: Persona, persona2: Persona): number => {
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism', 'creativity', 'assertiveness', 'empathy'] as const;
    let totalDistance = 0;
    
    traits.forEach(trait => {
      const diff = Math.abs(persona1.personality[trait] - persona2.personality[trait]);
      totalDistance += diff;
    });
    
    return totalDistance / traits.length;
  };

  const getCompatibilityScore = (persona1: Persona, persona2: Persona): number => {
    const personalityDistance = calculatePersonalityDistance(persona1, persona2);
    const knowledgeOverlap = persona1.knowledge.filter(k => persona2.knowledge.includes(k)).length;
    const maxKnowledge = Math.max(persona1.knowledge.length, persona2.knowledge.length);
    const knowledgeScore = maxKnowledge > 0 ? (knowledgeOverlap / maxKnowledge) * 100 : 0;
    
    // Convert personality distance (0-100) to compatibility (100-0)
    const personalityCompatibility = 100 - personalityDistance;
    
    // Weight: 70% personality, 30% knowledge overlap
    return Math.round(personalityCompatibility * 0.7 + knowledgeScore * 0.3);
  };

  const getCompatibilityScores = (selectedPersonas: string[]): { [key: string]: number } => {
    const scores: { [key: string]: number } = {};
    
    personas.forEach(persona => {
      if (selectedPersonas.length === 0) {
        scores[persona.id] = 0;
        return;
      }
      
      const selectedPersonaObjects = personas.filter(p => selectedPersonas.includes(p.id));
      let totalScore = 0;
      
      selectedPersonaObjects.forEach(selectedPersona => {
        if (persona.id !== selectedPersona.id) {
          totalScore += getCompatibilityScore(persona, selectedPersona);
        }
      });
      
      scores[persona.id] = selectedPersonaObjects.length > 0 ? Math.round(totalScore / selectedPersonaObjects.length) : 0;
    });
    
    return scores;
  };

  const getCompatibilityColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCompatibilityLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getSuggestedPairs = (): Array<{ persona1: Persona; persona2: Persona; score: number }> => {
    const pairs: Array<{ persona1: Persona; persona2: Persona; score: number }> = [];
    
    for (let i = 0; i < personas.length; i++) {
      for (let j = i + 1; j < personas.length; j++) {
        const score = getCompatibilityScore(personas[i], personas[j]);
        pairs.push({ persona1: personas[i], persona2: personas[j], score });
      }
    }
    
    return pairs.sort((a, b) => b.score - a.score).slice(0, 3);
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

    // Filter suggestions based on selected personas' knowledge areas
    if (formData.selectedPersonas.length > 0) {
      const selectedPersonaObjects = personas.filter(p => formData.selectedPersonas.includes(p.id));
      const combinedKnowledge = [...new Set(selectedPersonaObjects.flatMap(p => p.knowledge))];
      
      const relevantSuggestions = allSuggestions.filter(suggestion => {
        const suggestionLower = suggestion.toLowerCase();
        return combinedKnowledge.some(knowledge => 
          suggestionLower.includes(knowledge.toLowerCase()) || 
          knowledge.toLowerCase().includes(suggestionLower.split(' ')[0])
        );
      });
      
      return relevantSuggestions.length > 0 ? relevantSuggestions.slice(0, 6) : allSuggestions.slice(0, 6);
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

    // Customize based on selected personas
    if (formData.selectedPersonas.length > 0) {
      const selectedPersonaObjects = personas.filter(p => formData.selectedPersonas.includes(p.id));
      const hasCreativePersona = selectedPersonaObjects.some(p => p.personality.creativity > 70);
      const hasAnalyticalPersona = selectedPersonaObjects.some(p => p.personality.conscientiousness > 70);
      const hasPhilosophicalPersona = selectedPersonaObjects.some(p => p.knowledge.includes('philosophy'));
      
      const customSuggestions = [];
      
      if (hasCreativePersona) {
        customSuggestions.push('Collaborate on a creative project', 'Brainstorm innovative approaches');
      }
      if (hasAnalyticalPersona) {
        customSuggestions.push('Analyze the topic systematically', 'Break down complex concepts');
      }
      if (hasPhilosophicalPersona) {
        customSuggestions.push('Explore the philosophical implications', 'Question fundamental assumptions');
      }
      
      return [...customSuggestions, ...baseSuggestions].slice(0, 8);
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

            <div className="relative">
              <label htmlFor="topic" className="block text-sm font-medium text-[#2D3748] mb-2">
                Main Topic *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
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
                    {formData.selectedPersonas.length > 0 ? 'Suggestions based on selected personas:' : 'Popular conversation topics:'}
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
                    {formData.selectedPersonas.length > 0 ? 'Goals tailored to your personas:' : 'Suggested conversation goals:'}
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
          <h2 className="text-xl font-medium text-[#2D3748] mb-4">Select Participants</h2>
          <p className="text-sm text-[#4A5568] mb-6">
            Choose personas to participate in your conversation. Compatibility scores help identify personas that work well together.
          </p>

          {/* Suggested Pairs */}
          {formData.selectedPersonas.length === 0 && getSuggestedPairs().length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-[#2D3748] mb-3">💡 Suggested Compatible Pairs</h3>
              <div className="space-y-2">
                {getSuggestedPairs().slice(0, 2).map((pair, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span>{getPersonaTypeIcon(pair.persona1.type)}</span>
                      <span className="font-medium">{pair.persona1.name}</span>
                      <span className="text-[#4A5568]">+</span>
                      <span>{getPersonaTypeIcon(pair.persona2.type)}</span>
                      <span className="font-medium">{pair.persona2.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${getCompatibilityColor(pair.score)}`}>
                        {pair.score}% compatible
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            selectedPersonas: [pair.persona1.id, pair.persona2.id]
                          }));
                        }}
                        className="text-xs px-2 py-1 bg-[#8B6B4A] text-white rounded hover:bg-[#7A5A3A] transition-colors"
                      >
                        Select Both
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personas.map((persona) => {
              const compatibilityScores = getCompatibilityScores(formData.selectedPersonas);
              const score = compatibilityScores[persona.id];
              const isSelected = formData.selectedPersonas.includes(persona.id);
              
              return (
                <div
                  key={persona.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#8B6B4A] bg-[#8B6B4A]/5'
                      : 'border-gray-200 hover:border-[#8B6B4A]/50'
                  }`}
                  onClick={() => handlePersonaToggle(persona.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getPersonaTypeIcon(persona.type)}</span>
                      <h3 className="font-medium text-[#2D3748]">{persona.name}</h3>
                      {formData.selectedPersonas.length > 0 && !isSelected && score > 0 && (
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            score >= 80 ? 'bg-green-500' : 
                            score >= 60 ? 'bg-yellow-500' : 
                            score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                          }`}></div>
                          <span className={`text-xs font-medium ${getCompatibilityColor(score)}`}>
                            {score}%
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
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

                  {formData.selectedPersonas.length > 0 && !isSelected && score > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#4A5568]">Compatibility:</span>
                        <span className={`font-medium ${getCompatibilityColor(score)}`}>
                          {getCompatibilityLabel(score)} ({score}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {formData.selectedPersonas.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                {formData.selectedPersonas.length} persona{formData.selectedPersonas.length > 1 ? 's' : ''} selected
                {formData.selectedPersonas.length > 1 && (
                  <span className="ml-2">
                    • Average compatibility: {Math.round(
                      Object.values(getCompatibilityScores(formData.selectedPersonas))
                        .filter(score => score > 0)
                        .reduce((sum, score) => sum + score, 0) / 
                      Math.max(1, Object.values(getCompatibilityScores(formData.selectedPersonas)).filter(score => score > 0).length)
                    )}%
                  </span>
                )}
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