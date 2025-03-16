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
              Am I an AI? is a cutting-edge tool designed to analyze text and
              determine whether it was written by a human or an artificial
              intelligence. In an era where AI-generated content is becoming
              increasingly prevalent and sophisticated, our mission is to
              provide transparency and insight into the nature of digital
              content.
            </p>
            <p className="text-lg mb-4">
              Our advanced algorithms analyze various aspects of the text,
              including patterns, style, complexity, and contextual
              understanding, to make this determination. While no detection
              system is perfect, we strive to provide accurate and helpful
              insights to our users.
            </p>
            <p className="text-lg mb-4">
              Whether you&apos;re a content creator, educator, or simply curious
              about the nature of text you encounter online, Am I an AI? is here
              to help you navigate the evolving landscape of AI-generated
              content.
            </p>
            <h2 className="text-2xl font-bold mt-8 mb-4 neon-text">
              How It Works
            </h2>
            <p className="text-lg mb-4">
              Our system employs a sophisticated multi-layered analysis
              approach:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li className="text-lg mb-2">
                Pattern Analysis: We examine writing patterns that might
                indicate AI generation
              </li>
              <li className="text-lg mb-2">
                Contextual Understanding: We assess how well the text maintains
                context and coherence
              </li>
              <li className="text-lg mb-2">
                Stylistic Markers: We identify subtle stylistic elements that
                often differ between human and AI writers
              </li>
              <li className="text-lg mb-2">
                Statistical Analysis: We utilize advanced statistical models to
                support our determinations
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
