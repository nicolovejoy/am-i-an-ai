export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50" data-page="about">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">
          About Robot Orchestra
        </h1>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
          <p className="text-lg text-blue-800 font-medium">
            An experimental platform exploring trust and collaboration between
            humans and AI. As of July 2025 we are just getting rolling and our
            first approach is to set up anonymized matches where participants
            try and determine who is human and who is a robot (AI). Today (7/6)
            we are moving to a Kafka implementation (from DDB after RDS. faster
            better stronger)
          </p>
        </div>
      </div>
    </div>
  );
}
