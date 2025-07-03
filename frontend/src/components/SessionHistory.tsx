'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';

interface HistorySession {
  sessionId: string;
  mode: 'production' | 'testing';
  accuracy: number;
  correctGuesses: number;
  totalAIs: number;
  messageCount: number;
  duration: number; // in seconds
  endTime: string;
  myIdentity: 'A' | 'B' | 'C' | 'D';
}

export function SessionHistory() {
  // Mock data - will be replaced with real API call
  const [sessions] = useState<HistorySession[]>([
    {
      sessionId: 'session-123',
      mode: 'production',
      accuracy: 100,
      correctGuesses: 2,
      totalAIs: 2,
      messageCount: 18,
      duration: 240,
      endTime: '2025-07-02T14:25:00Z',
      myIdentity: 'A'
    },
    {
      sessionId: 'session-122',
      mode: 'testing',
      accuracy: 67,
      correctGuesses: 2,
      totalAIs: 3,
      messageCount: 10,
      duration: 180,
      endTime: '2025-07-02T13:45:00Z',
      myIdentity: 'A'
    },
    {
      sessionId: 'session-121',
      mode: 'production',
      accuracy: 50,
      correctGuesses: 1,
      totalAIs: 2,
      messageCount: 20,
      duration: 300,
      endTime: '2025-07-02T13:15:00Z',
      myIdentity: 'C'
    }
  ]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy === 100) return 'text-green-600 bg-green-100';
    if (accuracy >= 75) return 'text-blue-600 bg-blue-100';
    if (accuracy >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy === 100) return '🎉';
    if (accuracy >= 75) return '🎯';
    if (accuracy >= 50) return '👍';
    return '😅';
  };

  const averageAccuracy = sessions.length > 0 
    ? Math.round(sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length)
    : 0;

  const totalGames = sessions.length;
  const perfectGames = sessions.filter(s => s.accuracy === 100).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Summary Stats */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          📊 Your Game History
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {totalGames}
            </div>
            <div className="text-sm text-slate-600">Games Played</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {averageAccuracy}%
            </div>
            <div className="text-sm text-slate-600">Average Accuracy</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {perfectGames}
            </div>
            <div className="text-sm text-slate-600">Perfect Games</div>
          </div>
        </div>
      </Card>

      {/* Session List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-900">
            Recent Sessions
          </h3>
          <Button variant="secondary" size="sm">
            🔄 Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.sessionId}
              className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {getAccuracyIcon(session.accuracy)}
                  </span>
                  <div>
                    <div className="font-medium text-slate-900">
                      {session.mode === 'production' ? '🎯 Game Mode' : '🧪 Testing Mode'}
                    </div>
                    <div className="text-sm text-slate-500">
                      {formatDate(session.endTime)} • {formatDuration(session.duration)}
                    </div>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getAccuracyColor(session.accuracy)}`}>
                  {session.accuracy}% accuracy
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-slate-600">Correct Guesses</div>
                  <div className="font-medium text-slate-900">
                    {session.correctGuesses} / {session.totalAIs} AIs
                  </div>
                </div>

                <div>
                  <div className="text-slate-600">Messages</div>
                  <div className="font-medium text-slate-900">
                    {session.messageCount}
                  </div>
                </div>

                <div>
                  <div className="text-slate-600">Your Role</div>
                  <div className="font-medium text-slate-900">
                    Participant {session.myIdentity}
                  </div>
                </div>

                <div className="text-right">
                  <Button variant="ghost" size="sm">
                    👁️ View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <div className="text-xl font-medium text-slate-900 mb-2">
              No games played yet
            </div>
            <div className="text-slate-600 mb-6">
              Join a session to start playing and building your history!
            </div>
            <Link href="/">
              <Button variant="primary">
                🚀 Start Your First Game
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}