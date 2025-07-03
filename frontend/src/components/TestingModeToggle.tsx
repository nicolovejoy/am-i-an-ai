'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { mockAIService } from '@/services/mockAI';

interface TestingModeToggleProps {
  onActivate?: () => void;
}

export function TestingModeToggle({ onActivate }: TestingModeToggleProps) {
  const startTesting = () => {
    onActivate?.();
  };

  return (
    <Card className="p-6 text-center">
      <h3 className="text-lg font-semibold mb-2">🧪 Test Player System</h3>
      <p className="text-slate-600 mb-4">
        Test the 4-player UI with mock AI responses
      </p>
      <Button onClick={startTesting} variant="primary">
        Start Testing Mode
      </Button>
    </Card>
  );
}