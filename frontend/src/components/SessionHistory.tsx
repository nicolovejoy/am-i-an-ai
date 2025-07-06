'use client';

import Link from 'next/link';
import { Card, Button } from '@/components/ui';

export function SessionHistory() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="text-center p-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          📊 Match History
        </h1>
        <div className="text-6xl mb-6">🚧</div>
        <p className="text-lg text-slate-600 mb-8">
          Coming Soon!
        </p>
        <p className="text-sm text-slate-500 mb-8">
          This page will display your match history and statistics once our Kafka infrastructure is implemented.
        </p>
        <Link href="/dashboard">
          <Button variant="primary">
            ← Back to Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
}