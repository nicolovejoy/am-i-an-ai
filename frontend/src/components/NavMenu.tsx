"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes } from "react-icons/fa";
import Image from "next/image";

const NavMenu: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActive = (path: string) => {
    return pathname === path;
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
            </div>
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
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavMenu;
