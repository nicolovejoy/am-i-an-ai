"use client";

import React, { useState } from 'react';
import { cognitoService } from '@/services/cognito';
import { api } from '@/services/apiClient';

export default function DebugAuthPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAuthToken = async () => {
    setIsLoading(true);
    addLog('🔍 Testing authentication token...');
    
    try {
      const token = await cognitoService.getIdToken();
      addLog(`Token result: ${token ? `${token.substring(0, 30)}...` : 'null'}`);
    } catch (error) {
      addLog(`Token error: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testCurrentUser = async () => {
    setIsLoading(true);
    addLog('👤 Testing current user...');
    
    try {
      const user = await cognitoService.getCurrentUser();
      addLog(`Current user: ${user ? JSON.stringify(user, null, 2) : 'null'}`);
    } catch (error) {
      addLog(`Current user error: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testMessageAPI = async () => {
    setIsLoading(true);
    addLog('📨 Testing message API call...');
    
    try {
      const conversationId = 'd2d344f0-370d-496f-8c8f-00a56454fa65'; // From your error
      const result = await api.messages.create(conversationId, {
        conversationId,
        authorPersonaId: 'test-persona',
        content: 'Test message from debug page',
        type: 'text'
      });
      addLog(`Message API success: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      addLog(`Message API error: ${error}`);
    }
    
    setIsLoading(false);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Page</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testAuthToken}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Auth Token
          </button>
          
          <button
            onClick={testCurrentUser}
            disabled={isLoading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-2"
          >
            Test Current User
          </button>
          
          <button
            onClick={testMessageAPI}
            disabled={isLoading}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50 ml-2"
          >
            Test Message API
          </button>
          
          <button
            onClick={clearLogs}
            disabled={isLoading}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50 ml-2"
          >
            Clear Logs
          </button>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click a button above to start testing.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800">Instructions:</h3>
          <ol className="list-decimal list-inside text-yellow-700 mt-2">
            <li>Open your browser's Developer Tools (F12)</li>
            <li>Go to the Console tab</li>
            <li>Click the buttons above and watch both the logs here and the console</li>
            <li>Look for the 🔑 Cognito Debug and 🔐 API Client Debug messages</li>
            <li>This will help us see exactly what's happening with your authentication</li>
          </ol>
        </div>
      </div>
    </div>
  );
}