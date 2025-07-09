'use client';

export default function DebugEnv() {
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 text-xs max-w-md">
      <h3 className="font-bold mb-2">Environment Debug</h3>
      <div>MATCH_SERVICE_API: {process.env.NEXT_PUBLIC_MATCH_SERVICE_API || 'NOT SET'}</div>
      <div>MATCH_HISTORY_API: {process.env.NEXT_PUBLIC_MATCH_HISTORY_API || 'NOT SET'}</div>
      <div>COGNITO_USER_POOL: {process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'NOT SET'}</div>
      <div>COGNITO_CLIENT: {process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || 'NOT SET'}</div>
      <div className="mt-2 text-yellow-300">
        Fallback URL: https://api.robotorchestra.org
      </div>
    </div>
  );
}