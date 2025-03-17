import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-blue text-white flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-6xl font-bold mb-4 neon-text">404</h1>
      <h2 className="text-2xl mb-8 text-neon-pink">Page Not Found</h2>
      <div className="terminal max-w-lg mb-8 p-6">
        <p className="mb-4">The requested resource could not be located.</p>
        <p className="mb-6 text-neon-green font-mono">
          ERROR: File not in system database
        </p>
        <div className="font-mono text-gray-400 mb-4">
          <div>&gt; System scan complete</div>
          <div>&gt; Location status: MISSING</div>
          <div>&gt; Recommended action: Return to secure area</div>
        </div>
      </div>
      <Link href="/" className="sci-fi-button">
        Return to Home Base
      </Link>
    </div>
  );
}
