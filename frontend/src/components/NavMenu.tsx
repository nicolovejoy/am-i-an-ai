"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { FaBars, FaTimes } from "react-icons/fa";
import Image from "next/image";

const NavMenu: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Use the auth store
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-opacity-90 bg-dark-blue shadow-md border-b border-neon-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo/Brand */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Image
                src="/logo.svg"
                alt="Am I an AI?"
                width={40}
                height={40}
                className="w-10 h-10 mr-2"
              />
              <h1 className="text-xl font-bold neon-text">Am I an AI?</h1>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                  isActive("/")
                    ? "text-neon-blue border-b-2 border-neon-blue"
                    : "text-gray-300 hover:text-neon-blue hover:border-b-2 hover:border-neon-blue"
                }`}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                  isActive("/about")
                    ? "text-neon-green border-b-2 border-neon-green"
                    : "text-gray-300 hover:text-neon-green hover:border-b-2 hover:border-neon-green"
                }`}
              >
                About
              </Link>
            </div>
          </div>

          {/* Login/Logout buttons */}
          <div className="flex items-center">
            {isAuthenticated && user ? (
              <>
                <Link
                  href="/account"
                  className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                    isActive("/account")
                      ? "text-neon-yellow border-b-2 border-neon-yellow"
                      : "text-gray-300 hover:text-neon-yellow hover:border-b-2 hover:border-neon-yellow"
                  }`}
                >
                  Account
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="sci-fi-button border-neon-pink text-neon-pink hover:text-white ml-4"
                >
                  {isLoading ? "..." : "Logout"}
                </button>
              </>
            ) : (
              <Link href="/login" className="sci-fi-button ml-4">
                Login
              </Link>
            )}

            {/* Mobile menu button */}
            <div className="ml-2 sm:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-neon-blue focus:outline-none"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <FaTimes className="h-6 w-6" />
                ) : (
                  <FaBars className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-dark-blue bg-opacity-95 border-t border-neon-blue">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 text-base font-medium flex items-center ${
                isActive("/")
                  ? "text-neon-blue border-l-4 border-neon-blue"
                  : "text-gray-300 hover:text-neon-blue hover:border-l-4 hover:border-neon-blue"
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 text-base font-medium flex items-center ${
                isActive("/about")
                  ? "text-neon-green border-l-4 border-neon-green"
                  : "text-gray-300 hover:text-neon-green hover:border-l-4 hover:border-neon-green"
              }`}
            >
              About
            </Link>
            {isAuthenticated && user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium flex items-center ${
                    isActive("/account")
                      ? "text-neon-yellow border-l-4 border-neon-yellow"
                      : "text-gray-300 hover:text-neon-yellow hover:border-l-4 hover:border-neon-yellow"
                  }`}
                >
                  Account
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-neon-pink hover:text-pink-400 hover:border-l-4 hover:border-neon-pink"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-neon-blue hover:text-blue-300 hover:border-l-4 hover:border-neon-blue"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavMenu;
