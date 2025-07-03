'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';

interface SessionData {
  sessionId: string;
  mode: 'production' | 'testing';
  participantCount: number;
  messageCount: number;
  status: 'active' | 'ended' | 'waiting';
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
}

interface UserData {
  email: string;
  displayName: string;
  gamesPlayed: number;
  averageAccuracy: number;
  lastActive: string;
  isOnline: boolean;
}

export function AdminConsole() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'users' | 'settings'>('overview');

  // Mock data - will be replaced with real API calls
  const [sessions] = useState<SessionData[]>([
    {
      sessionId: 'session-123',
      mode: 'production',
      participantCount: 4,
      messageCount: 18,
      status: 'active',
      startTime: '2025-07-02T14:30:00Z',
      duration: 240
    },
    {
      sessionId: 'session-124',
      mode: 'testing',
      participantCount: 2,
      messageCount: 12,
      status: 'ended',
      startTime: '2025-07-02T14:15:00Z',
      endTime: '2025-07-02T14:18:00Z',
      duration: 180
    }
  ]);

  const [users] = useState<UserData[]>([
    {
      email: 'user1@example.com',
      displayName: 'GameMaster',
      gamesPlayed: 25,
      averageAccuracy: 78,
      lastActive: '2025-07-02T14:35:00Z',
      isOnline: true
    },
    {
      email: 'user2@example.com', 
      displayName: 'AIHunter',
      gamesPlayed: 12,
      averageAccuracy: 85,
      lastActive: '2025-07-02T14:20:00Z',
      isOnline: false
    }
  ]);

  const tabs = [
    { id: 'overview', label: '📊 Overview', count: null },
    { id: 'sessions', label: '🎮 Sessions', count: sessions.length },
    { id: 'users', label: '👥 Users', count: users.length },
    { id: 'settings', label: '⚙️ Settings', count: null }
  ];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          🛠️ Admin Console
        </h1>
        <p className="text-slate-600">
          Monitor and manage AmIAnAI game sessions
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-slate-100 text-slate-600 py-1 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sessions.filter(s => s.status === 'active').length}
                </div>
                <div className="text-sm text-slate-600">Active Sessions</div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.isOnline).length}
                </div>
                <div className="text-sm text-slate-600">Online Users</div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {sessions.reduce((sum, s) => sum + s.messageCount, 0)}
                </div>
                <div className="text-sm text-slate-600">Total Messages</div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(users.reduce((sum, u) => sum + u.averageAccuracy, 0) / users.length)}%
                </div>
                <div className="text-sm text-slate-600">Avg Accuracy</div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              📈 Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">New session started</span>
                <span className="text-sm text-slate-500">{formatTime('2025-07-02T14:30:00Z')}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">User completed game with 100% accuracy</span>
                <span className="text-sm text-slate-500">{formatTime('2025-07-02T14:25:00Z')}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Session ended after reaching message limit</span>
                <span className="text-sm text-slate-500">{formatTime('2025-07-02T14:18:00Z')}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'sessions' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Game Sessions
            </h3>
            <Button variant="secondary" size="sm">
              🔄 Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Session ID</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Mode</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Participants</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Messages</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Duration</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Status</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.sessionId} className="border-b border-slate-100">
                    <td className="p-3 text-sm font-mono">{session.sessionId.slice(-8)}</td>
                    <td className="p-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.mode === 'production' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {session.mode === 'production' ? 'Game' : 'Test'}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{session.participantCount}/4</td>
                    <td className="p-3 text-sm">{session.messageCount}</td>
                    <td className="p-3 text-sm">{formatDuration(session.duration)}</td>
                    <td className="p-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.status === 'active' ? 'bg-green-100 text-green-800' :
                        session.status === 'ended' ? 'bg-slate-100 text-slate-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm">
                        👁️ View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Users
            </h3>
            <Button variant="secondary" size="sm">
              🔄 Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">User</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Games Played</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Avg Accuracy</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Last Active</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Status</th>
                  <th className="text-left p-3 text-sm font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.email} className="border-b border-slate-100">
                    <td className="p-3">
                      <div>
                        <div className="text-sm font-medium text-slate-900">{user.displayName}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{user.gamesPlayed}</td>
                    <td className="p-3 text-sm">{user.averageAccuracy}%</td>
                    <td className="p-3 text-sm">{formatTime(user.lastActive)}</td>
                    <td className="p-3">
                      <span className={`flex items-center text-xs font-medium ${
                        user.isOnline ? 'text-green-600' : 'text-slate-500'
                      }`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          user.isOnline ? 'bg-green-500' : 'bg-slate-300'
                        }`}></span>
                        {user.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm">
                        👁️ View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              🎮 Game Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">Enable Testing Mode</div>
                  <div className="text-sm text-slate-600">Allow 1H+3AI sessions for testing</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">Auto-match Users</div>
                  <div className="text-sm text-slate-600">Automatically pair users for games</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              ⚙️ System Settings
            </h3>
            <div className="space-y-3">
              <Button variant="secondary" fullWidth>
                📊 Export Session Data
              </Button>
              <Button variant="secondary" fullWidth>
                🧹 Clear Old Sessions
              </Button>
              <Button variant="danger" fullWidth>
                🔧 Restart System
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}