import React from "react";

export default function About() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
            <h1 className="text-3xl font-semibold mb-6 text-[#2D3748]">
              About Am I an AI?
            </h1>
            <div className="prose max-w-none">
              <p className="text-lg mb-4 text-[#4A5568]">
                Am I an AI? is an interactive portal that invites visitors to
                engage in conversations from the moment they arrive. Through
                dynamic, evolving conversations with both AI systems and human
                agents, we explore the nature of digital identity and
                communication.
              </p>
              <p className="text-lg mb-4 text-[#4A5568]">
                We're building an ecosystem designed to nurture meaningful
                interactions built on trust and mutual respect. Whether you're
                curious about AI capabilities, seeking meaningful conversation,
                or just looking to explore new ideas, Am I an AI? offers a safe
                space for engagement and discovery.
              </p>
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-[#2D3748]">
                Our Approach
              </h2>
              <ul className="list-disc pl-6 mb-6">
                <li className="text-lg mb-2 text-[#4A5568]">
                  <strong className="text-[#2D3748]">
                    Incremental Development:
                  </strong>{" "}
                  We build thoughtfully, one small step at a time
                </li>
                <li className="text-lg mb-2 text-[#4A5568]">
                  <strong className="text-[#2D3748]">Test-Driven:</strong> We
                  write tests first, then implement
                </li>
                <li className="text-lg mb-2 text-[#4A5568]">
                  <strong className="text-[#2D3748]">
                    Documentation First:
                  </strong>{" "}
                  We document as we build, often before we build
                </li>
                <li className="text-lg mb-2 text-[#4A5568]">
                  <strong className="text-[#2D3748]">Simplification:</strong> We
                  prioritize clarity and simplicity in our solutions
                </li>
              </ul>
            </div>

            {/* Technologies section */}
            <div className="mt-12 border-t border-[#E2E8F0] pt-8">
              <h2 className="text-2xl font-semibold mb-6 text-[#2D3748]">
                Technologies & Tools
              </h2>
              <ul className="space-y-2">
                <li className="text-[#4A5568]">
                  <a
                    href="https://nextjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8B6B4A] hover:underline"
                  >
                    Next.js
                  </a>{" "}
                  with TypeScript for the frontend
                </li>
                <li className="text-[#4A5568]">
                  <a
                    href="https://tailwindcss.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8B6B4A] hover:underline"
                  >
                    Tailwind CSS
                  </a>{" "}
                  for styling
                </li>
                <li className="text-[#4A5568]">
                  <a
                    href="https://aws.amazon.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8B6B4A] hover:underline"
                  >
                    AWS
                  </a>{" "}
                  for infrastructure
                </li>
                <li className="text-[#4A5568]">
                  <a
                    href="https://www.terraform.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8B6B4A] hover:underline"
                  >
                    Terraform
                  </a>{" "}
                  for infrastructure as code
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
