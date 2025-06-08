"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes } from "react-icons/fa";
import Image from "next/image";
import { useAuth } from "../contexts/AuthContext";

const NavMenu: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, signOut } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path: string) => {
    // Handle conversations route specially - active for /, /conversations, /conversations/*
    if (path === '/') {
      return pathname === '/' || pathname.startsWith('/conversations');
    }
    return pathname === path;
  };

  const handleSignOut = () => {
    signOut();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-[#E2E8F0]">
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
              <h1 className="text-xl font-semibold text-[#2D3748]">
                Am I an AI?
              </h1>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                href="/about"
                className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                  isActive("/about")
                    ? "text-[#8B6B4A] border-b-2 border-[#8B6B4A]"
                    : "text-[#4A5568] hover:text-[#8B6B4A] hover:border-b-2 hover:border-[#8B6B4A]"
                }`}
              >
                About
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href="/"
                    className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                      isActive("/")
                        ? "text-[#8B6B4A] border-b-2 border-[#8B6B4A]"
                        : "text-[#4A5568] hover:text-[#8B6B4A] hover:border-b-2 hover:border-[#8B6B4A]"
                    }`}
                  >
                    Conversations
                  </Link>
                  <Link
                    href="/personas"
                    className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                      isActive("/personas")
                        ? "text-[#8B6B4A] border-b-2 border-[#8B6B4A]"
                        : "text-[#4A5568] hover:text-[#8B6B4A] hover:border-b-2 hover:border-[#8B6B4A]"
                    }`}
                  >
                    Personas
                  </Link>
                  <Link
                    href="/profile"
                    className={`px-3 py-2 text-sm font-medium transition-colors flex items-center ${
                      isActive("/profile")
                        ? "text-[#8B6B4A] border-b-2 border-[#8B6B4A]"
                        : "text-[#4A5568] hover:text-[#8B6B4A] hover:border-b-2 hover:border-[#8B6B4A]"
                    }`}
                  >
                    Profile
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Desktop Auth Links */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="px-3 py-2 text-sm font-medium text-[#4A5568] hover:text-[#8B6B4A] transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isActive("/auth/signin")
                      ? "text-[#8B6B4A] border-b-2 border-[#8B6B4A]"
                      : "text-[#4A5568] hover:text-[#8B6B4A] hover:border-b-2 hover:border-[#8B6B4A]"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-3 py-2 text-sm font-medium text-white bg-[#8B6B4A] rounded-md hover:bg-[#6B4A2A] transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center">
            <div className="ml-2 sm:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-[#4A5568] hover:text-[#8B6B4A] focus:outline-none"
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
        <div
          role="navigation"
          aria-label="Mobile menu"
          className="sm:hidden bg-white border-t border-[#E2E8F0]"
        >
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 text-base font-medium flex items-center ${
                isActive("/about")
                  ? "text-[#8B6B4A] border-l-4 border-[#8B6B4A]"
                  : "text-[#4A5568] hover:text-[#8B6B4A] hover:border-l-4 hover:border-[#8B6B4A]"
              }`}
            >
              About
            </Link>
{isAuthenticated && (
              <>
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium flex items-center ${
                    isActive("/")
                      ? "text-[#8B6B4A] border-l-4 border-[#8B6B4A]"
                      : "text-[#4A5568] hover:text-[#8B6B4A] hover:border-l-4 hover:border-[#8B6B4A]"
                  }`}
                >
                  Conversations
                </Link>
                <Link
                  href="/personas"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium flex items-center ${
                    isActive("/personas")
                      ? "text-[#8B6B4A] border-l-4 border-[#8B6B4A]"
                      : "text-[#4A5568] hover:text-[#8B6B4A] hover:border-l-4 hover:border-[#8B6B4A]"
                  }`}
                >
                  Personas
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium flex items-center ${
                    isActive("/profile")
                      ? "text-[#8B6B4A] border-l-4 border-[#8B6B4A]"
                      : "text-[#4A5568] hover:text-[#8B6B4A] hover:border-l-4 hover:border-[#8B6B4A]"
                  }`}
                >
                  Profile
                </Link>
              </>
            )}
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-base font-medium text-[#4A5568] hover:text-[#8B6B4A] hover:bg-gray-50"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium ${
                    isActive("/auth/signin")
                      ? "text-[#8B6B4A] border-l-4 border-[#8B6B4A]"
                      : "text-[#4A5568] hover:text-[#8B6B4A] hover:border-l-4 hover:border-[#8B6B4A]"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-[#4A5568] hover:text-[#8B6B4A] hover:bg-gray-50"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavMenu;
