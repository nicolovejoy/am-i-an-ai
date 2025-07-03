'use client';

import { Card } from './ui';

interface PromptDisplayProps {
  prompt: string;
}

export default function PromptDisplay({ prompt }: PromptDisplayProps) {
  return (
    <Card>
      <div className="text-center py-8">
        <div className="text-4xl mb-4">💭</div>
        <h3 className="text-xl font-semibold mb-4 text-slate-800">
          Round Prompt
        </h3>
        <p className="text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto">
          {prompt}
        </p>
        <div className="mt-6 text-sm text-slate-500">
          Take your time to craft a thoughtful response that sounds human
        </div>
      </div>
    </Card>
  );
}