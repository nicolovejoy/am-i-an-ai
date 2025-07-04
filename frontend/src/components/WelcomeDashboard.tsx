"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useSessionStore } from "@/store/sessionStore";
import { Card, Button } from "./ui";

// Mock data for MVP phase
const MOCK_AVAILABLE_PERFORMANCES = [
  {
    id: "performance-1",
    name: "Ensemble #1",
    musicians: ["Alice", "Bob", "Charlie"],
    status: "waiting" as const,
    waitingFor: "1 more musician",
  },
  {
    id: "performance-2",
    name: "Ensemble #2",
    musicians: ["Emma", "David"],
    status: "active" as const,
    currentMovement: 3,
  },
];

const MOCK_RECENT_PERFORMANCES = [
  {
    id: "recent-1",
    name: "Last Performance",
    completedAt: "2 hours ago",
    harmony: "3/5",
    result: "In Tune",
  },
  {
    id: "recent-2",
    name: "Previous Performance",
    completedAt: "Yesterday",
    harmony: "2/5",
    result: "Off Key",
  },
];

export default function WelcomeDashboard() {
  const { user } = useAuth();
  const { startTestingMode } = useSessionStore();

  const handleStartTestPerformance = () => {
    startTestingMode();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.email?.split("@")[0] || "Musician"}!
          </h1>
          <h2 className="text-xl text-slate-700 mb-4">RobotOrchestra</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Join the ensemble and discover who&apos;s human and who&apos;s AI in anonymous performances.
          </p>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-xl font-semibold mb-4">Quick Start</h3>
            <Button
              onClick={handleStartTestPerformance}
              size="lg"
              className="w-full mb-4"
            >
              🎵 Start Test Performance
            </Button>
            <p className="text-sm text-slate-600">
              Join a practice ensemble. Perfect for learning to harmonize!
            </p>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold mb-4">Create Live Performance</h3>
            <Button
              disabled
              size="lg"
              className="w-full mb-4"
              variant="secondary"
            >
              🎼 Create Live Performance
            </Button>
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <span className="text-xs text-orange-700 font-medium">
                Not Implemented Yet
              </span>
              <p className="text-xs text-orange-600 mt-1">
                Coming soon: Perform with other humans online
              </p>
            </div>
          </Card>
        </div>

        {/* Available Matches */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">Available Performances</h3>
          <div className="space-y-3">
            {MOCK_AVAILABLE_PERFORMANCES.map((performance) => (
              <div
                key={performance.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{performance.name}</h4>
                  <p className="text-sm text-slate-600">
                    {performance.musicians.join(", ")}
                    {performance.status === "waiting" && ` • ${performance.waitingFor}`}
                    {performance.status === "active" &&
                      ` • Movement ${performance.currentMovement}/5`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    Not Implemented
                  </span>
                  <Button size="sm" disabled variant="secondary">
                    {performance.status === "waiting" ? "Join" : "Listen"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Matches */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">Recent Performances</h3>
          <div className="space-y-3">
            {MOCK_RECENT_PERFORMANCES.map((performance) => (
              <div
                key={performance.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{performance.name}</h4>
                  <p className="text-sm text-slate-600">
                    {performance.completedAt} • {performance.harmony} harmony •{" "}
                    {performance.result}
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
            🎼 About RobotOrchestra
          </a>
          <p className="text-sm text-slate-600 mt-2">
            Learn how to harmonize and strategies for identifying human musicians vs AI
          </p>
        </Card>
      </div>
    </div>
  );
}
