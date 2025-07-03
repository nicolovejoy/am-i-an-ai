'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Button, Input } from '@/components/ui';

interface UserStats {
  gamesPlayed: number;
  averageAccuracy: number;
  bestAccuracy: number;
  totalCorrectGuesses: number;
  favoriteMode: 'production' | 'testing';
}

export function UserProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] || '');

  // Mock stats for now - will be replaced with real data
  const [stats] = useState<UserStats>({
    gamesPlayed: 12,
    averageAccuracy: 73,
    bestAccuracy: 100,
    totalCorrectGuesses: 18,
    favoriteMode: 'production'
  });

  const handleSaveProfile = () => {
    // TODO: Save to backend
    setIsEditing(false);
    console.log('Saving profile:', { displayName });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Info */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Profile</h2>
          <Button
            variant={isEditing ? 'primary' : 'secondary'}
            onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
          >
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <div className="text-slate-900 bg-slate-50 p-3 rounded-lg">
              {user.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Display Name
            </label>
            {isEditing ? (
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name"
              />
            ) : (
              <div className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                {displayName || 'Not set'}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Game Stats */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">
          🎮 Game Statistics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.gamesPlayed}
            </div>
            <div className="text-sm text-slate-600">Games Played</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.averageAccuracy}%
            </div>
            <div className="text-sm text-slate-600">Avg Accuracy</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {stats.bestAccuracy}%
            </div>
            <div className="text-sm text-slate-600">Best Game</div>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalCorrectGuesses}
            </div>
            <div className="text-sm text-slate-600">AIs Caught</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Favorite Mode:</span>
            <span className="font-semibold text-slate-900">
              {stats.favoriteMode === 'production' ? '🎯 Game Mode (2H+2AI)' : '🧪 Testing Mode (1H+3AI)'}
            </span>
          </div>
        </div>
      </Card>

      {/* Game Preferences */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">
          ⚙️ Preferences
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <div className="font-medium text-slate-900">Sound Effects</div>
              <div className="text-sm text-slate-600">Play sounds during the game</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <div className="font-medium text-slate-900">Email Notifications</div>
              <div className="text-sm text-slate-600">Receive game invites and updates</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Account Actions */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-4">
          🔧 Account
        </h3>

        <div className="space-y-3">
          <Button variant="secondary" fullWidth>
            📧 Change Email
          </Button>
          <Button variant="secondary" fullWidth>
            🔒 Change Password
          </Button>
          <Button variant="danger" fullWidth>
            ⚠️ Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
}