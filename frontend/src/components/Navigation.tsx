
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { Button } from "@/components/ui";

export function Navigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;

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
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">
              <span className="text-blue-600">🤖</span> RobotOrchestra
            </h1>
          </Link>

          <div className="flex space-x-1">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🏠 Dashboard
            </Link>
            <Link
              to="/history"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/history"
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📊 Match History
            </Link>
            <Link
              to="/about"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === "/about"
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📖 About
            </Link>
            {user.email === "nlovejoy@me.com" && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === "/admin"
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🔧 Admin
              </Link>
            )}
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
