import React from "react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            About Am I an AI?
          </h1>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600 mb-4">
              Am I an AI? is an interactive portal for exploring AI identity and
              communication.
            </p>
            <p className="text-gray-600">
              This project aims to create a space where users can interact with
              AI systems and explore the boundaries between human and artificial
              intelligence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
