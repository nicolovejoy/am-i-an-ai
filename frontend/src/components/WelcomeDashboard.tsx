"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useSessionStore } from "@/store/sessionStore";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Card, Button, Input } from "./ui";

export default function WelcomeDashboard() {
  const { user } = useAuth();
  const { connect, createRealMatch, connectionStatus } = useSessionStore();
  const router = useRouter();
  const [playerName, setPlayerName] = useState(user?.email?.split('@')[0] || '');
  const [showRealMatchForm, setShowRealMatchForm] = useState(false);

  const handleJoinTestMatch = () => {
    connect();
    router.push('/match');
  };

  const handleJoinRealMatch = async () => {
    if (!playerName.trim()) {
      alert('Please enter a player name');
      return;
    }
    
    try {
      await createRealMatch(playerName.trim());
      router.push('/match');
    } catch (error) {
      console.error('Failed to create real match:', error);
      alert('Failed to create match. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome to RobotOrchestra
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto mb-4">
            An experimental game where humans and AI collaborate anonymously. 
            Can you guess who&apos;s human?
          </p>
          <p className="text-sm text-slate-500">
            Thank you for trying out our experimental platform!
          </p>
        </Card>

        {/* Main Action */}
        <Card className="text-center">
          <h2 className="text-xl font-semibold mb-4">Start Playing</h2>
          
          {!showRealMatchForm ? (
            <div className="space-y-4">
              <Button
                onClick={() => setShowRealMatchForm(true)}
                size="lg"
                className="w-full md:w-auto px-8 mr-3"
                variant="primary"
              >
                🎮 Create Real Match
              </Button>
              <Button
                onClick={handleJoinTestMatch}
                size="lg"
                className="w-full md:w-auto px-8"
                variant="secondary"
              >
                🧪 Test Mode
              </Button>
              <p className="text-sm text-slate-600 mt-3">
                Real matches generate authentic data and contribute to match history
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <label htmlFor="playerName" className="block text-sm font-medium text-slate-700 mb-2">
                  Player Name
                </label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleJoinRealMatch}
                  disabled={connectionStatus === "connecting" || !playerName.trim()}
                  className="flex-1"
                  variant="primary"
                >
                  {connectionStatus === "connecting" ? "Creating..." : "Create Match"}
                </Button>
                <Button
                  onClick={() => setShowRealMatchForm(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
              
              <p className="text-sm text-slate-600">
                You&apos;ll play with 3 AI participants. Try to guess who&apos;s human!
              </p>
            </div>
          )}
        </Card>

        {/* Quick Links */}
        <Card>
          <h3 className="text-lg font-semibold mb-3">Explore</h3>
          <div className="space-y-2">
            <Link 
              href="/history" 
              className="block p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span className="text-blue-600 hover:text-blue-800 font-medium">
                📊 Match History
              </span>
              <p className="text-sm text-slate-600 mt-1">
                View past matches and statistics
              </p>
            </Link>
            
            <Link 
              href="/about" 
              className="block p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span className="text-blue-600 hover:text-blue-800 font-medium">
                ℹ️ About
              </span>
              <p className="text-sm text-slate-600 mt-1">
                Learn how to play and strategies for identifying humans vs AI
              </p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
