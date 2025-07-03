"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui";

export function Navigation() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">am I an AI?</h1>
            {/* <span className="text-sm text-slate-500">nobody nose</span> */}
          </Link>

          <div className="flex space-x-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🎮 Play
            </Link>
            <Link
              href="/history"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/history"
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📊 History
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}
