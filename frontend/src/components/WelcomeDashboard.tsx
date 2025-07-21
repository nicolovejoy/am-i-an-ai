import { useAuth } from "@/contexts/useAuth";
import { useCreateMatchWithTemplate } from "@/store/server-state/match.mutations";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, Input } from "./ui";

export default function WelcomeDashboard() {
  const { user } = useAuth();
  const createMatchWithTemplate = useCreateMatchWithTemplate();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState(
    user?.email?.split("@")[0] || ""
  );

  const handleSelectTemplate = async (template: "classic_1v3" | "duo_2v2") => {
    if (!playerName.trim()) {
      alert("Please enter a player name");
      return;
    }

    try {
      const result = await createMatchWithTemplate.mutateAsync({
        templateType: template,
        creatorName: playerName.trim(),
        creatorUserId: user?.sub
      });

      // Navigate based on match status
      if (result.match.status === 'waiting_for_players') {
        // Navigate to waiting room
        navigate("/waiting");
      } else {
        // Navigate to match page
        navigate("/match");
      }
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

        {/* Player Name */}
        <Card className="text-center">
          <div className="space-y-4 max-w-sm mx-auto">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Enter Your Name
            </h2>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full text-center"
            />
          </div>
        </Card>

        {/* Match Type Selection */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-800 mb-4 text-center">
            Choose Match Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Solo Match */}
            <button
              onClick={() => handleSelectTemplate("classic_1v3")}
              disabled={createMatchWithTemplate.isPending || !playerName.trim()}
              className="p-6 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="space-y-2">
                <div className="text-3xl mb-2">🎭</div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Play Solo
                </h3>
                <p className="text-sm text-slate-600">
                  1 Human + 3 AI Players
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Try to blend in with AI companions
                </p>
              </div>
            </button>

            {/* Duo Match */}
            <button
              onClick={() => handleSelectTemplate("duo_2v2")}
              disabled={createMatchWithTemplate.isPending || !playerName.trim()}
              className="p-6 border-2 border-slate-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="space-y-2">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Play with Friend
                </h3>
                <p className="text-sm text-slate-600">
                  2 Humans + 2 AI Players
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Invite a friend to join you
                </p>
              </div>
            </button>
          </div>

          {createMatchWithTemplate.isPending && (
            <p className="text-center mt-4 text-slate-600">Starting match...</p>
          )}
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
