"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useSessionStore } from "@/store/sessionStore";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button } from "./ui";

export default function WelcomeDashboard() {
  const { user } = useAuth();
  const { connect } = useSessionStore();
  const router = useRouter();

  const handleJoinRealMatch = () => {
    connect();
    router.push('/match');
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
          <h2 className="text-xl font-semibold mb-4">Join a Match</h2>
          <Button
            onClick={handleJoinRealMatch}
            size="lg"
            className="w-full md:w-auto px-8"
            variant="primary"
          >
            🎮 Join Real Match
          </Button>
          <p className="text-sm text-slate-600 mt-3">
            Play with 3 AI participants powered by OpenAI
          </p>
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
