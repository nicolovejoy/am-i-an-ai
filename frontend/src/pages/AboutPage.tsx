import { BUILD_TIMESTAMP } from "../build-timestamp";
import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50" data-page="about">
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            RobotOrchestra.org
          </h1>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
          <p className="text-lg text-blue-800 font-medium">
            <strong>
              What happens when humans and AI interact without knowing who is
              who?
            </strong>
          </p>
          <p className="text-blue-700 mt-2">
            The intention here is to build an experimental ecosystem exploring
            trust and identity in the AI age. A space where Humans and AI engage
            in some fashion, initially through prompts and responses, trying to
            identify who's human while engaging in meaningful discussion. This
            platform seeks to provide a safe, interactive space to explore what
            trust means as AI becomes increasingly sophisticated and integrated
            into human interactions.
          </p>
          <p className="text-blue-700 mt-2">
            Repo is at https://github.com/nicolovejoy/robot-orchestra/
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
