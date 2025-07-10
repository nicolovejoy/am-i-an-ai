
import { useAuth } from "@/contexts/useAuth";
import { useSessionStore } from "@/store/sessionStore";
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input } from "./ui";

export default function WelcomeDashboard() {
  const { user } = useAuth();
  const { createRealMatch, connectionStatus } = useSessionStore();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState(user?.email?.split('@')[0] || '');

  const handleStartMatch = async () => {
    if (!playerName.trim()) {
      alert('Please enter a player name');
      return;
    }
    
    try {
      await createRealMatch(playerName.trim());
      // Navigate to match page
      navigate('/match');
    } catch (error) {
      console.error('Failed to create match:', error);
      alert('Failed to create match. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            RobotOrchestra
          </h1>
          <p className="text-lg text-slate-700 mb-3">
            A social experiment for the AI age
          </p>
          <p className="text-slate-600 max-w-xl mx-auto">
            Join an anonymous creative collaboration where humans and AI work together. 
            Through 5 rounds of creative prompts, try to identify who&apos;s human while 
            exploring the fascinating dynamics of trust, creativity, and connection 
            in our AI-integrated future.
          </p>
        </Card>

        {/* Start Match */}
        <Card className="text-center">
          <div className="space-y-4 max-w-sm mx-auto">
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full text-center"
            />
            
            <Button
              onClick={handleStartMatch}
              disabled={connectionStatus === "connecting" || !playerName.trim()}
              size="lg"
              className="w-full"
              variant="primary"
            >
              {connectionStatus === "connecting" ? "Starting..." : "Start Match"}
            </Button>
          </div>
        </Card>

        {/* Quick Links */}
        <div className="flex gap-4 text-center">
          <Link 
            to="/history" 
            className="flex-1 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span className="text-blue-600 hover:text-blue-800 font-medium">
              📊 History
            </span>
          </Link>
          
          <Link 
            to="/about" 
            className="flex-1 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span className="text-blue-600 hover:text-blue-800 font-medium">
              ℹ️ About
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
