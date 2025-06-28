"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/services/apiClient';

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

interface User {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  subscription: string;
  subscriptionExpiresAt: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  personaCount: number;
  conversationCount: number;
}

function AdminPageContent() {
  const [healthChecks, setHealthChecks] = useState<ApiHealth[]>([]);
  const [personas, setPersonas] = useState<Record<string, unknown>[]>([]);
  const [conversations, setConversations] = useState<Record<string, unknown>[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'personas' | 'conversations' | 'raw'>('overview');



  const runHealthChecks = useCallback(async () => {
    setLoading(true);
    const results: ApiHealth[] = [];
    
    const endpoints = [
      { name: 'Health Check', apiCall: () => api.admin.health() },
      { name: 'Database Status', apiCall: () => api.admin.databaseStatus() },
      { name: 'Personas', apiCall: () => api.personas.list() },
      { name: 'Conversations', apiCall: () => api.conversations.list() },
      { name: 'Users', apiCall: () => api.admin.listUsers() },
    ];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        const data = await endpoint.apiCall();
        const responseTime = Date.now() - startTime;
        
        results.push({
          endpoint: endpoint.name,
          status: 'healthy',
          responseTime,
          data,
        });

        // Store specific data for display
        if (endpoint.name === 'Personas' && data.personas) {
          setPersonas(data.personas);
        }
        if (endpoint.name === 'Conversations' && data.conversations) {
          setConversations(data.conversations);
        }
        if (endpoint.name === 'Database Status') {
          setDbStats(data.stats || null);
        }
        if (endpoint.name === 'Users' && data.users) {
          setUsers(data.users);
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
      const data = await api.admin.testAI({
        conversationId: '770e8400-e29b-41d4-a716-446655440001', // Creative Writing Discussion
        message: 'Hello, this is an admin test. Please respond briefly.',
        personaId: aiPersona.id,
        personaName: aiPersona.name,
        personaType: aiPersona.type
      });
      const responseTime = Date.now() - startTime;
      
      alert(`AI Test Successful!\nResponse Time: ${responseTime}ms\nResponse: "${data.message.content.substring(0, 100)}..."`);
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
      
      // First check if schema exists
      try {
        await api.admin.setupDatabase();
      } catch (schemaError) {
        console.warn('Schema setup warning:', schemaError);
      }
      
      const data = await api.admin.seedDatabase();
      const responseTime = Date.now() - startTime;
      
      if (data.success && data.recordsCreated) {
        const message = `Database Seeded Successfully!\n\nTime: ${responseTime}ms\n\nRecords Created:\n` +
          `• Users: ${data.recordsCreated.users}\n` +
          `• Personas: ${data.recordsCreated.personas}\n` +
          `• Conversations: ${data.recordsCreated.conversations}\n` +
          `• Messages: ${data.recordsCreated.messages}`;
        alert(message);
        
        // Refresh all data
        await runHealthChecks();
      } else {
        alert('Database seeding completed but with unexpected response format');
      }
    } catch (error) {
      console.error('Database seeding error:', error);
      const errorMessage = error instanceof Error 
        ? `Database Seeding Error:\n\n${error.message}\n\nCheck the browser console for more details.`
        : 'Network error during database seeding';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkDatabaseSetup = async () => {
    try {
      const data = await api.admin.setupDatabase();
      alert(`Database Setup Check:\n${data.message}\nTables: ${data.existingTables?.join(', ') || 'None found'}`);
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
                { id: 'users', label: `Users (${users.length})` },
                { id: 'personas', label: `Personas (${personas.length})` },
                { id: 'conversations', label: `Conversations (${conversations.length})` },
                { id: 'raw', label: 'Raw API Data' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as 'overview' | 'users' | 'personas' | 'conversations' | 'raw')}
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

        {selectedTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Registered Users</h2>
            {users.length === 0 ? (
              <p className="text-gray-600">No users found in database</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personas</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversations</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.email}
                          {user.isEmailVerified && (
                            <span className="ml-2 text-green-600" title="Email verified">✓</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.displayName || '—'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : user.role === 'premium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.subscription === 'premium' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : user.subscription === 'basic'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.subscription}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLoginAt 
                            ? new Date(user.lastLoginAt).toLocaleString() 
                            : <span className="text-gray-400">Never</span>
                          }
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.personaCount}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.conversationCount}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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