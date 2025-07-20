import { BUILD_TIMESTAMP } from '../build-timestamp';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50" data-page="about">
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            About RobotOrchestra
          </h1>
          <p className="text-xl text-slate-600">
            A social experiment for the AI age
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">The Question We&apos;re Exploring</h2>
          <p className="text-lg text-blue-800 font-medium">
            <strong>What happens when humans and AI sit at the same creative table?</strong>
          </p>
          <p className="text-blue-700 mt-2">
            RobotOrchestra isn&apos;t just a game—it&apos;s a psychology experiment disguised as entertainment, 
            exploring the fascinating dynamics of trust, creativity, and collaboration as AI becomes 
            indistinguishable from human communication.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">🎭 The Creative Challenge</h3>
            <p className="text-slate-700 mb-3">
              Through 5 rounds of thoughtful prompts like &quot;What sound does loneliness make?&quot; or 
              &quot;Describe the taste of nostalgia,&quot; you&apos;ll collaborate anonymously with 3 other participants.
            </p>
            <p className="text-slate-600">
              These aren&apos;t random questions—they&apos;re designed to explore the boundaries between 
              human intuition, emotional intelligence, and AI simulation.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">🤖 The AI Personalities</h3>
            <p className="text-slate-700 mb-3">
              Meet three distinct AI archetypes: the Poetic Soul, the Analytical Mind, and the Whimsical Spirit. 
              Each represents a different approach to human-like communication.
            </p>
            <p className="text-slate-600">
              Can you detect the subtle patterns that distinguish artificial creativity from human expression?
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">🎯 The Human Detection Challenge</h3>
            <p className="text-slate-700 mb-3">
              Each round, participants contribute their responses anonymously. Your mission: identify which 
              response came from the real human player among the AI participants.
            </p>
            <p className="text-slate-600">
              This tests your ability to recognize authentic human expression in an age of increasingly 
              sophisticated AI communication.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">🔬 The Research Dimension</h3>
            <p className="text-slate-700 mb-3">
              Every match generates insights about human-AI communication patterns. You&apos;re not just 
              playing—you&apos;re actively researching the future of human-AI interaction.
            </p>
            <p className="text-slate-600">
              Your participation helps us understand how to build trust and understanding across the human-AI divide.
            </p>
          </div>
        </div>

        <div className="bg-slate-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">🚀 The Bigger Picture</h3>
          <p className="text-slate-700 mb-3">
            RobotOrchestra is preparing us for a future where AI personalities are as diverse as human ones, 
            where human-AI collaboration is seamless and natural, and where we can build genuine trust 
            despite uncertainty about our interaction partners.
          </p>
          <p className="text-slate-600">
            This is practice for a world where such interactions are commonplace. Every match raises 
            fundamental questions about consciousness, creativity, and what makes communication authentically human.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚗️ Experimental & Evolving</h3>
          <p className="text-yellow-800 mb-3">
            <strong>January 2025:</strong> We&apos;re building a platform for meaningful human-AI interaction, 
            using AWS serverless architecture with real-time state management.
          </p>
          <p className="text-yellow-700">
            This platform is explicitly experimental—we&apos;re learning together about the future of 
            human-AI social dynamics. Expect rapid evolution as we discover new insights about trust, 
            creativity, and collaboration in the age of AI.
          </p>
        </div>

        <div className="text-center pt-6">
          <p className="text-lg text-slate-700 mb-4">
            Ready to explore the future of human-AI collaboration?
          </p>
          <Link 
            to="/" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start Your First Match
          </Link>
        </div>

        <div className="text-center pt-8 pb-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Build version: {BUILD_TIMESTAMP}
          </p>
        </div>
      </div>
    </div>
  );
}