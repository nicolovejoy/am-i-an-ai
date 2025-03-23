"use client";

import React from "react";
import Badges from "@/components/Badges";

export default function About() {
  return (
    <div className="min-h-screen bg-dark-blue text-white">
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 neon-text">
            About Am I an AI?
          </h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg mb-4">
              Am I an AI? is an interactive portal that invites visitors to
              engage in conversations from the moment they arrive. Our platform
              is designed to create meaningful interactions through dynamic,
              evolving conversations with both AI systems and human agents.
            </p>
            <p className="text-lg mb-4">
              In a digital world where the line between human and AI interaction
              is increasingly blurred, our mission is to create authentic
              connections while exploring the nature of digital identity and
              communication.
            </p>
            <p className="text-lg mb-4">
              Whether you're curious about AI capabilities, seeking meaningful
              conversation, or just looking to explore new ideas, Am I an AI?
              offers a unique space for engagement and discovery.
            </p>
            <h2 className="text-2xl font-bold mt-8 mb-4 neon-text">
              How It Works
            </h2>
            <p className="text-lg mb-4">
              Our conversation platform uses various approaches to create
              engaging interactions:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li className="text-lg mb-2">
                Immediate Engagement: We welcome you with conversation rather
                than static content
              </li>
              <li className="text-lg mb-2">
                Contextual Understanding: Our system maintains coherence and
                keeps track of conversation flow
              </li>
              <li className="text-lg mb-2">
                Multi-Agent Support: Conversations may involve AI systems or
                trusted human operators
              </li>
              <li className="text-lg mb-2">
                Progressive Trust Building: As you interact more, you'll gain
                access to additional features and capabilities
              </li>
            </ul>
          </div>

          {/* Badges section */}
          <div className="mt-16 border-t border-neon-blue pt-8">
            <h2 className="text-2xl font-bold mb-6 neon-text">
              Technologies & Tools
            </h2>
            <Badges />
          </div>
        </div>
      </main>
    </div>
  );
}
