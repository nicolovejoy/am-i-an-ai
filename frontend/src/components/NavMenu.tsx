import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface NavMenuProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const NavMenu: React.FC<NavMenuProps> = ({ isLoggedIn, onLogin, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-opacity-90 bg-medium-blue shadow-md border-b border-neon-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold neon-text">
                Am I an AI?
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`nav-link inline-flex items-center px-1 pt-1 border-b-2 ${
                  isActive("/")
                    ? "active border-neon-blue"
                    : "border-transparent"
                }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`nav-link inline-flex items-center px-1 pt-1 border-b-2 ${
                  isActive("/about")
                    ? "active border-neon-blue"
                    : "border-transparent"
                }`}
              >
                About
              </Link>
              <Link
                to="/donate"
                className={`nav-link inline-flex items-center px-1 pt-1 border-b-2 ${
                  isActive("/donate")
                    ? "active border-neon-blue"
                    : "border-transparent"
                }`}
              >
                Donate
              </Link>
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/account"
                  className={`nav-link inline-flex items-center px-3 py-1 border rounded-md ${
                    isActive("/account")
                      ? "border-neon-blue"
                      : "border-transparent"
                  }`}
                >
                  Terminal Access
                </Link>
                <button
                  onClick={onLogout}
                  className="sci-fi-button border-neon-pink text-neon-pink hover:text-neon-pink"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={onLogin} className="sci-fi-button">
                Login
              </button>
            )}
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-neon-blue focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-medium-blue bg-opacity-95 border-t border-neon-blue">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`nav-link block pl-3 pr-4 py-2 border-l-4 ${
                isActive("/")
                  ? "border-neon-blue bg-opacity-30 bg-blue-900"
                  : "border-transparent hover:border-neon-blue hover:bg-opacity-10 hover:bg-blue-900"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`nav-link block pl-3 pr-4 py-2 border-l-4 ${
                isActive("/about")
                  ? "border-neon-blue bg-opacity-30 bg-blue-900"
                  : "border-transparent hover:border-neon-blue hover:bg-opacity-10 hover:bg-blue-900"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/donate"
              className={`nav-link block pl-3 pr-4 py-2 border-l-4 ${
                isActive("/donate")
                  ? "border-neon-blue bg-opacity-30 bg-blue-900"
                  : "border-transparent hover:border-neon-blue hover:bg-opacity-10 hover:bg-blue-900"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Donate
            </Link>
            {isLoggedIn && (
              <Link
                to="/account"
                className={`nav-link block pl-3 pr-4 py-2 border-l-4 ${
                  isActive("/account")
                    ? "border-neon-blue bg-opacity-30 bg-blue-900"
                    : "border-transparent hover:border-neon-blue hover:bg-opacity-10 hover:bg-blue-900"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Terminal Access
              </Link>
            )}
            {isLoggedIn ? (
              <button
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent nav-link text-neon-pink hover:border-neon-pink"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  onLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent nav-link text-neon-blue hover:border-neon-blue"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavMenu;
