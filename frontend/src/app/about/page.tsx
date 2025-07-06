export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50" data-page="about">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">
          About Robot Orchestra
        </h1>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
          <p className="text-lg text-blue-800 font-medium mb-4">
            <strong>What happens when humans and AI sit at the same table?</strong> RobotOrchestra is an experimental platform exploring the fascinating dynamics of trust, communication, and collaboration in our AI-integrated future.
          </p>
          
          <p className="text-base text-blue-700 mb-4">
            Through anonymous 5-round matches with 4 participants, you'll engage in thoughtful conversations while trying to discern who among you is human and who might be AI. It's part psychology experiment, part social game, and entirely revealing about how we perceive and interact with artificial intelligence.
          </p>
          
          <p className="text-sm text-blue-600 italic">
            <strong>Fresh off the development bench:</strong> We're just getting rolling as of July 2025, transitioning to a cutting-edge Kafka event-driven architecture. Expect rapid evolution as we build toward a future of seamless human-AI collaboration.
          </p>
        </div>
      </div>
    </div>
  );
}
