"use client";

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-dark-blue text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 neon-text">
          Support Our Mission
        </h1>

        <div className="terminal mb-8">
          <h2 className="text-xl font-bold text-neon-green mb-4">
            Why Donate?
          </h2>
          <p className="mb-4">
            Your contribution helps us maintain and improve our AI detection
            systems, keeping this service free and accessible to everyone.
          </p>
          <p>
            As AI technologies advance, we are committed to providing tools that
            help people distinguish between human and AI-generated content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="terminal">
            <h2 className="text-xl font-bold text-neon-pink mb-4">
              One-time Donation
            </h2>
            <p className="mb-4">
              Make a one-time contribution of any amount to support our project.
            </p>
            <button className="sci-fi-button">Donate Now</button>
          </div>

          <div className="terminal">
            <h2 className="text-xl font-bold text-neon-purple mb-4">
              Monthly Support
            </h2>
            <p className="mb-4">
              Become a sustaining supporter with a monthly contribution.
            </p>
            <button className="sci-fi-button">Become a Supporter</button>
          </div>
        </div>
      </div>
    </div>
  );
}
