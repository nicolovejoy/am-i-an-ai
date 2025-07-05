export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50" data-page="about">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">About Robot Orchestra</h1>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
          <p className="text-lg text-blue-800 font-medium">
            An experimental platform exploring trust and collaboration between humans and AI through anonymized matches where participants try and determine who is human and who is a robot (AI).
          </p>
        </div>
        
        <div className="space-y-6 text-slate-700">
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">How to Play</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Join a game session with 4 participants total</li>
              <li>You&apos;ll be randomly assigned as Player 1, 2, 3, or 4</li>
              <li>2 players are human, 2 are AI - but you won&apos;t know which is which</li>
              <li>Chat naturally about any topic for multiple rounds</li>
              <li>At the end, vote on who you think is human or AI</li>
              <li>See the reveal and find out if you guessed correctly!</li>
            </ol>
          </section>

          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Game Rules</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Be respectful and keep conversations appropriate</li>
              <li>Don&apos;t explicitly state whether you&apos;re human or AI</li>
              <li>Try to have natural conversations</li>
              <li>Each message has a 280 character limit</li>
              <li>Games typically last 3-5 rounds</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Tips</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>AI players have unique personalities - learn to spot their patterns</li>
              <li>Humans might try to act like AI to throw you off</li>
              <li>Pay attention to response timing and natural flow</li>
              <li>Look for subtle cues in language and reasoning</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}