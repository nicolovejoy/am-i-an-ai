import { useAuth } from "@/contexts/useAuth";
import { useCreateMatch } from "@/store/server-state/match.mutations";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, Button, Input } from "./ui";

export default function WelcomeDashboard() {
  const { user } = useAuth();
  const createMatch = useCreateMatch();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState(
    user?.email?.split("@")[0] || ""
  );

  const handleStartMatch = async () => {
    if (!playerName.trim()) {
      alert("Please enter a player name");
      return;
    }

    try {
      await createMatch.mutateAsync(playerName.trim());
      // Navigate to match page
      navigate("/match");
    } catch (error) {
      console.error("Failed to create match:", error);
      alert("Failed to create match. Please try again.");
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
            Join an experimental ecosystem where humans and AI work together on
            simple sample problems with an eye towards exploring how we think
            about trust and identity in a world of increasingly sophisticated
            agentic ai interfacing with humans in more and more ways. At this
            point this is a very early stage project, with one type of
            interaction, a "match". Through 5 rounds of creative prompts, each
            of us try to identify who&apos;s human while discussing some topic.
            The intention for this project is to make it fun, interactive, and
            surprising, while also being a safe space for humans (and
            agentic-AI) to explore what it means to trust in this brave new
            world.
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
              disabled={createMatch.isPending || !playerName.trim()}
              size="lg"
              className="w-full"
              variant="primary"
            >
              {createMatch.isPending ? "Starting..." : "Start Match"}
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
