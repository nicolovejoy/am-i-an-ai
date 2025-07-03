"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useSessionStore } from "@/store/sessionStore";
import { Card, Button } from "./ui";

// Mock data for MVP phase
const MOCK_AVAILABLE_MATCHES = [
  {
    id: "match-1",
    name: "Match #1",
    participants: ["Alice", "Bob", "Charlie"],
    status: "waiting" as const,
    waitingFor: "1 more player",
  },
  {
    id: "match-2",
    name: "Match #2",
    participants: ["Emma", "David"],
    status: "active" as const,
    currentRound: 3,
  },
];

const MOCK_RECENT_MATCHES = [
  {
    id: "recent-1",
    name: "Last Match",
    completedAt: "2 hours ago",
    accuracy: "3/5",
    result: "Won",
  },
  {
    id: "recent-2",
    name: "Previous Match",
    completedAt: "Yesterday",
    accuracy: "2/5",
    result: "Lost",
  },
];

export default function WelcomeDashboard() {
  const { user } = useAuth();
  const { startTestingMode } = useSessionStore();

  const handleStartTestMatch = () => {
    startTestingMode();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.email?.split("@")[0] || "Player"}!
          </h1>
          <h2 className="text-xl text-slate-700 mb-4">am I an AI?</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Try and figure out who&apos;s the other human in this short match.
          </p>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-xl font-semibold mb-4">Quick Start</h3>
            <Button
              onClick={handleStartTestMatch}
              size="lg"
              className="w-full mb-4"
            >
              🎮 Start Test Match
            </Button>
            <p className="text-sm text-slate-600">
              Jump into a practice matchfro. Perfect for learning the game!
            </p>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold mb-4">Create Live Match</h3>
            <Button
              disabled
              size="lg"
              className="w-full mb-4"
              variant="secondary"
            >
              🚀 Create Live Match
            </Button>
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <span className="text-xs text-orange-700 font-medium">
                Not Implemented Yet
              </span>
              <p className="text-xs text-orange-600 mt-1">
                Coming soon: Play with other humans online
              </p>
            </div>
          </Card>
        </div>

        {/* Available Matches */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">Available Matches</h3>
          <div className="space-y-3">
            {MOCK_AVAILABLE_MATCHES.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{match.name}</h4>
                  <p className="text-sm text-slate-600">
                    {match.participants.join(", ")}
                    {match.status === "waiting" && ` • ${match.waitingFor}`}
                    {match.status === "active" &&
                      ` • Round ${match.currentRound}/5`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    Not Implemented
                  </span>
                  <Button size="sm" disabled variant="secondary">
                    {match.status === "waiting" ? "Join" : "Watch"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Matches */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">Recent Matches</h3>
          <div className="space-y-3">
            {MOCK_RECENT_MATCHES.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{match.name}</h4>
                  <p className="text-sm text-slate-600">
                    {match.completedAt} • {match.accuracy} correct •{" "}
                    {match.result}
                  </p>
                </div>
                <Button size="sm" variant="ghost">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* About */}
        <Card className="text-center">
          <a
            href="/about"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            📖 About the Game
          </a>
          <p className="text-sm text-slate-600 mt-2">
            Learn how to play and strategies for identifying humans vs AI
          </p>
        </Card>
      </div>
    </div>
  );
}
