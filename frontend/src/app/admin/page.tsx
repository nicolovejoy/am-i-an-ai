"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { cognitoService } from '@/services/cognito';

interface ApiHealth {
  endpoint: string;
  status: 'healthy' | 'error' | 'loading';
  responseTime: number;
  data?: unknown;
  error?: string;
}

interface DatabaseStats {
  personas: number;
  conversations: number;
  messages: number;
  users: number;
}

function AdminPageContent() {
  const [healthChecks, setHealthChecks] = useState<ApiHealth[]>([]);
  const [personas, setPersonas] = useState<Record<string, unknown>[]>([]);
  const [conversations, setConversations] = useState<Record<string, unknown>[]>([]);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'personas' | 'conversations' | 'raw'>('overview');

  const LAMBDA_API_BASE = 'https://wygrsdhzg1.execute-api.us-east-1.amazonaws.com/prod';


  const runHealthChecks = useCallback(async () => {
    setLoading(true);
    const results: ApiHealth[] = [];
    
    const endpoints = [
      { name: 'Health Check', url: `${LAMBDA_API_BASE}/api/health` },
      { name: 'Database Status', url: `${LAMBDA_API_BASE}/api/admin/database-status` },
      { name: 'Personas', url: `${LAMBDA_API_BASE}/api/personas` },
      { name: 'Conversations', url: `${LAMBDA_API_BASE}/api/conversations` },
    ];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        const response = await fetch(endpoint.url, {
          headers: { 'Accept': 'application/json' }
        });
        const responseTime = Date.now() - startTime;
        const data = await response.json();
        
        results.push({
          endpoint: endpoint.name,
          status: response.ok ? 'healthy' : 'error',
          responseTime,
          data,
          error: response.ok ? undefined : `HTTP ${response.status}: ${data.error || 'Unknown error'}`
        });

        // Store specific data for display
        if (endpoint.name === 'Personas' && response.ok && data.personas) {
          setPersonas(data.personas);
        }
        if (endpoint.name === 'Conversations' && response.ok && data.conversations) {
          setConversations(data.conversations);
        }
        if (endpoint.name === 'Database Status' && response.ok) {
          setDbStats(data.stats || null);
        }

      } catch (error) {
        const responseTime = Date.now() - startTime;
        results.push({
          endpoint: endpoint.name,
          status: 'error',
          responseTime,
          error: error instanceof Error ? error.message : 'Network error'
        });
      }
    }
    
    setHealthChecks(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    runHealthChecks();
  }, [runHealthChecks]);

  const testAIResponse = async () => {
    if (personas.length === 0) {
      alert('No personas available for AI test');
      return;
    }

    const aiPersona = personas.find(p => p.type === 'ai_agent' || p.type === 'ai_ambiguous');
    if (!aiPersona) {
      alert('No AI personas available for test');
      return;
    }

    try {
      const startTime = Date.now();
      const response = await fetch(`${LAMBDA_API_BASE}/api/ai/generate-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: '550e8400-e29b-41d4-a716-446655440001',
          message: 'Hello, this is an admin test. Please respond briefly.',
          personaId: aiPersona.id,
          personaName: aiPersona.name,
          personaType: aiPersona.type
        }),
      });
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      if (response.ok) {
        alert(`AI Test Successful!\nResponse Time: ${responseTime}ms\nResponse: "${data.response.content.substring(0, 100)}..."`);
      } else {
        alert(`AI Test Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`AI Test Error: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };

  const seedDatabase = async () => {
    if (!confirm('This will clear all existing data and reseed the database with sample data. Are you sure?')) {
      return;
    }

    try {
      setLoading(true);
      const startTime = Date.now();
      
      // Get auth token
      const token = await cognitoService.getIdToken();
      if (!token) {
        alert('Authentication required. Please sign in again.');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${LAMBDA_API_BASE}/api/admin/seed-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      if (response.ok) {
        alert(`Database Seeded Successfully!\nTime: ${responseTime}ms\nRecords: ${JSON.stringify(data.recordsCreated, null, 2)}`);
        // Refresh all data
        await runHealthChecks();
      } else {
        alert(`Database Seeding Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Database Seeding Error: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkDatabaseSetup = async () => {
    try {
      // Get auth token
      const token = await cognitoService.getIdToken();
      if (!token) {
        alert('Authentication required. Please sign in again.');
        return;
      }

      const response = await fetch(`${LAMBDA_API_BASE}/api/admin/setup-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Database Setup Check:\n${data.message}\nTables: ${data.existingTables?.join(', ') || 'None found'}`);
      } else {
        alert(`Database Setup Check Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Database Setup Error: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      loading: 'bg-yellow-100 text-yellow-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`;
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getPersonaTypeIcon = (type: string) => {
    switch (type) {
      case 'human_persona': return '👤';
      case 'ai_agent': return '🤖';
      case 'ai_ambiguous': return '❓';
      default: return '●';
    }
  };

  const getPersonaTypeColor = (type: string) => {
    switch (type) {
      case 'human_persona': return 'bg-blue-100 text-blue-800';
      case 'ai_agent': return 'bg-green-100 text-green-800';
      case 'ai_ambiguous': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F3] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600">Running health checks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Console</h1>
              <p className="mt-2 text-gray-600">
                Database health checks and real-time data visibility
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={testAIResponse}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Test AI Response
              </button>
              <button
                onClick={seedDatabase}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset & Seed Database
              </button>
              <button
                onClick={checkDatabaseSetup}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Check Schema
              </button>
              <button
                onClick={runHealthChecks}
                className="px-4 py-2 bg-[#8B6B4A] text-white rounded-lg hover:bg-[#7A5D42] transition-colors"
              >
                Refresh All
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'personas', label: `Personas (${personas.length})` },
                { id: 'conversations', label: `Conversations (${conversations.length})` },
                { id: 'raw', label: 'Raw API Data' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as 'overview' | 'personas' | 'conversations' | 'raw')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-[#8B6B4A] text-[#8B6B4A]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Health Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">API Health Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {healthChecks.map((check) => (
                  <div key={check.endpoint} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{check.endpoint}</h3>
                      <span className={getStatusBadge(check.status)}>
                        {check.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatResponseTime(check.responseTime)}
                    </p>
                    {check.error && (
                      <p className="text-xs text-red-600 mt-2">{check.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Database Stats */}
            {dbStats && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#8B6B4A]">{dbStats.personas}</div>
                    <div className="text-sm text-gray-600">Personas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#8B6B4A]">{dbStats.conversations}</div>
                    <div className="text-sm text-gray-600">Conversations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#8B6B4A]">{dbStats.messages}</div>
                    <div className="text-sm text-gray-600">Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#8B6B4A]">{dbStats.users}</div>
                    <div className="text-sm text-gray-600">Users</div>
                  </div>
                </div>
              </div>
            )}

            {/* Database Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={seedDatabase}
                  className="p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left"
                >
                  <h3 className="font-medium text-red-900">Reset & Seed Database</h3>
                  <p className="text-sm text-red-600">Clear all data and load fresh test data</p>
                </button>
                <button
                  onClick={checkDatabaseSetup}
                  className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <h3 className="font-medium text-blue-900">Check Schema</h3>
                  <p className="text-sm text-blue-600">Verify database tables exist</p>
                </button>
                <button
                  onClick={testAIResponse}
                  className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
                >
                  <h3 className="font-medium text-purple-900">Test AI Integration</h3>
                  <p className="text-sm text-purple-600">Verify OpenAI API is working</p>
                </button>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Production Database Warning</h4>
                <p className="text-sm text-yellow-800">
                  This system uses a production-only approach. All operations affect the live database. 
                  The "Reset & Seed" operation will permanently delete all existing data.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href="/personas"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">Manage Personas</h3>
                  <p className="text-sm text-gray-600">View and edit personas</p>
                </a>
                <a
                  href="/conversations"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">View Conversations</h3>
                  <p className="text-sm text-gray-600">Browse conversation history</p>
                </a>
                <a
                  href="/conversations/new"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">Start Conversation</h3>
                  <p className="text-sm text-gray-600">Create new conversation</p>
                </a>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'personas' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Personas</h2>
            {personas.length === 0 ? (
              <p className="text-gray-600">No personas found in database</p>
            ) : (
              <div className="space-y-4">
                {personas.map((persona) => (
                  <div key={persona.id as string} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getPersonaTypeIcon(persona.type as string)}</span>
                        <h3 className="font-medium text-gray-900">{persona.name as string}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPersonaTypeColor(persona.type as string)}`}>
                          {(persona.type as string).replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 font-mono">
                        {persona.id as string}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{persona.description as string}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        Knowledge: {(persona.knowledge as string[]).join(', ')}
                      </div>
                      <div>
                        Style: {persona.communicationStyle as string} | Conversations: {persona.conversationCount as number}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'conversations' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Conversations</h2>
            {conversations.length === 0 ? (
              <p className="text-gray-600">No conversations found in database</p>
            ) : (
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <div key={conversation.id as string} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{conversation.title as string}</h3>
                        <p className="text-sm text-gray-600">{conversation.topic as string}</p>
                      </div>
                      <div className="text-sm text-gray-500 font-mono">
                        {conversation.id as string}
                      </div>
                    </div>
                    {(conversation.description as string) && (
                      <p className="text-sm text-gray-600 mb-3">{conversation.description as string}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        Status: {conversation.status as string} | Messages: {(conversation.messageCount as number) || 0}
                      </div>
                      <div>
                        Created: {new Date(conversation.createdAt as string).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'raw' && (
          <div className="space-y-6">
            {healthChecks.map((check) => (
              <div key={check.endpoint} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{check.endpoint} Response</h2>
                  <span className={getStatusBadge(check.status)}>
                    {check.status} ({formatResponseTime(check.responseTime)})
                  </span>
                </div>
                {check.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{check.error}</p>
                  </div>
                ) : (
                  <pre className="bg-gray-50 rounded-lg p-4 overflow-auto text-sm">
                    {JSON.stringify(check.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminPageContent />
    </ProtectedRoute>
  );
}