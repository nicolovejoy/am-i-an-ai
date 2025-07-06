'use client';

import { Card } from '@/components/ui';

export function AdminConsole() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="text-center p-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          🔧 Admin Console
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Admin page placeholder - Coming soon!
        </p>
        <p className="text-sm text-slate-500">
          This page will display backend data and system monitoring once Kafka is integrated.
        </p>
      </Card>
    </div>
  );
}