import Image from "next/image";
import React from "react";

export default function Home() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        {/* Dog photo container */}
        <div className="mb-6 bg-medium-blue p-4 border border-neon-blue rounded-lg flex flex-col items-center justify-center">
          <Image
            src="/images/dog-or-cat.jpg"
            alt="A dog looking confused"
            width={500}
            height={300}
            className="w-full max-w-md rounded-md"
            priority
          />
          <p className="text-sm text-gray-400 mt-2 font-mono">
            <span className="text-neon-blue">&gt;</span> Dog photo loaded with
            next/image
          </p>
        </div>

        {/* Quote */}
        <div className="terminal p-6">
          <blockquote className="text-xl sm:text-2xl font-mono leading-relaxed mb-4">
            <span className="text-neon-blue">&quot;</span>
            <span className="text-neon-pink">Am I a Dog? Or a Cat?</span>{" "}
            <span className="text-white">on the internet, nobody</span>{" "}
            <span className="text-neon-purple">nose.</span>
            <span className="text-neon-blue">&quot;</span>
          </blockquote>
          <cite className="text-neon-green block text-right font-mono">
            — Fritzy Kitty
          </cite>
        </div>
      </div>
    </div>
  );
}
