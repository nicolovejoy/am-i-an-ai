
import { Card } from './ui';

interface PromptDisplayProps {
  prompt: string;
}

export default function PromptDisplay({ prompt }: PromptDisplayProps) {
  return (
    <Card>
      <div className="py-4">
        <h3 className="text-sm font-semibold mb-2 text-slate-700">
          Round Prompt
        </h3>
        <p className="text-base text-slate-800 leading-relaxed">
          {prompt}
        </p>
        <div className="mt-3 text-xs text-slate-500">
          Take your time to craft a thoughtful response that sounds human
        </div>
      </div>
    </Card>
  );
}