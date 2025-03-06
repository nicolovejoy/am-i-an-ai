import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { retroIcons } from '../designSystem';

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
          <div className="flex items-center">
            {/* Logo/Brand */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold neon-text">Am I an AI?</h1>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                  isActive('/')
                    ? 'text-neon-blue border-b-2 border-neon-blue'
                    : 'text-gray-300 hover:text-neon-blue hover:border-b-2 hover:border-neon-blue'
                }`}
              >
                <span className="mr-1">{retroIcons.homeIcon}</span> Home
              </Link>
              <Link
                to="/analysis"
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                  isActive('/analysis')
                    ? 'text-neon-purple border-b-2 border-neon-purple'
                    : 'text-gray-300 hover:text-neon-purple hover:border-b-2 hover:border-neon-purple'
                }`}
              >
                <span className="mr-1">{retroIcons.analysisIcon}</span> Text Analysis
              </Link>
              <Link
                to="/about"
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                  isActive('/about')
                    ? 'text-neon-green border-b-2 border-neon-green'
                    : 'text-gray-300 hover:text-neon-green hover:border-b-2 hover:border-neon-green'
                }`}
              >
                <span className="mr-1">{retroIcons.aboutIcon}</span> About
              </Link>
              <Link
                to="/donate"
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                  isActive('/donate')
                    ? 'text-neon-pink border-b-2 border-neon-pink'
                    : 'text-gray-300 hover:text-neon-pink hover:border-b-2 hover:border-neon-pink'
                }`}
              >
                <span className="mr-1">{retroIcons.donateIcon}</span> Donate
              </Link>
              <Link
                to="/account"
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                  isActive('/account')
                    ? 'text-neon-yellow border-b-2 border-neon-yellow'
                    : 'text-gray-300 hover:text-neon-yellow hover:border-b-2 hover:border-neon-yellow'
                }`}
              >
                <span className="mr-1">{retroIcons.accountIcon}</span> Account
              </Link>
            </div>
          </div>

          {/* Login/Logout buttons */}
          <div className="flex items-center">
            {isLoggedIn ? (
              <button
                onClick={onLogout}
                className="sci-fi-button border-neon-pink text-neon-pink hover:text-neon-pink"
              >
                Logout
              </button>
            ) : (
              <button onClick={onLogin} className="sci-fi-button">
                Login
              </button>
            )}

            {/* Mobile menu button */}
            <div className="ml-2 sm:hidden">
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
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-medium-blue bg-opacity-95 border-t border-neon-blue">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 text-base font-medium flex items-center ${
                isActive('/')
                  ? 'text-neon-blue border-l-4 border-neon-blue'
                  : 'text-gray-300 hover:text-neon-blue hover:border-l-4 hover:border-neon-blue'
              }`}
            >
              <span className="mr-2">{retroIcons.homeIcon}</span> Home
            </Link>
            <Link
              to="/analysis"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 text-base font-medium flex items-center ${
                isActive('/analysis')
                  ? 'text-neon-purple border-l-4 border-neon-purple'
                  : 'text-gray-300 hover:text-neon-purple hover:border-l-4 hover:border-neon-purple'
              }`}
            >
              <span className="mr-2">{retroIcons.analysisIcon}</span> Text Analysis
            </Link>
            <Link
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 text-base font-medium flex items-center ${
                isActive('/about')
                  ? 'text-neon-green border-l-4 border-neon-green'
                  : 'text-gray-300 hover:text-neon-green hover:border-l-4 hover:border-neon-green'
              }`}
            >
              <span className="mr-2">{retroIcons.aboutIcon}</span> About
            </Link>
            <Link
              to="/donate"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 text-base font-medium flex items-center ${
                isActive('/donate')
                  ? 'text-neon-pink border-l-4 border-neon-pink'
                  : 'text-gray-300 hover:text-neon-pink hover:border-l-4 hover:border-neon-pink'
              }`}
            >
              <span className="mr-2">{retroIcons.donateIcon}</span> Donate
            </Link>
            <Link
              to="/account"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 text-base font-medium flex items-center ${
                isActive('/account')
                  ? 'text-neon-yellow border-l-4 border-neon-yellow'
                  : 'text-gray-300 hover:text-neon-yellow hover:border-l-4 hover:border-neon-yellow'
              }`}
            >
              <span className="mr-2">{retroIcons.accountIcon}</span> Account
            </Link>

            {/* Login/Logout in mobile menu */}
            {isLoggedIn ? (
              <button
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-neon-pink hover:text-neon-pink hover:border-l-4 hover:border-neon-pink"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  onLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-neon-blue hover:text-neon-blue hover:border-l-4 hover:border-neon-blue"
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
