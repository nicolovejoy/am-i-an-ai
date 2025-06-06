"use client";

import React, { useState, forwardRef } from "react";
import { FieldError } from "react-hook-form";

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

interface PasswordInputProps {
  name: string;
  placeholder?: string;
  error?: FieldError;
  showStrength?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
}

const getPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  if (score <= 2) return { score, label: "Weak", color: "red" };
  if (score <= 4) return { score, label: "Good", color: "yellow" };
  return { score, label: "Strong", color: "green" };
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ name, placeholder, error, showStrength = false, value = "", className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const hasError = !!error;
    
    const baseClasses = `
      mt-1 block w-full rounded-md shadow-sm pr-10
      ${hasError 
        ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500" 
        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
      }
      ${className}
    `;

    const strength = showStrength && value ? getPasswordStrength(value) : null;

    return (
      <div className="relative">
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          className={baseClasses.trim()}
          value={value}
          {...props}
        />
        
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.5 8.5m1.378 1.378l4.242 4.242M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>

        {showStrength && strength && value.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Password strength:</span>
              <span className={`font-medium text-${strength.color}-600`}>
                {strength.label}
              </span>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-${strength.color}-500 transition-all duration-300`}
                style={{ width: `${(strength.score / 6) * 100}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <p>Password should contain:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li className={/^.{8,}$/.test(value) ? "text-green-600" : "text-gray-400"}>
                  At least 8 characters
                </li>
                <li className={/[a-z]/.test(value) ? "text-green-600" : "text-gray-400"}>
                  One lowercase letter
                </li>
                <li className={/[A-Z]/.test(value) ? "text-green-600" : "text-gray-400"}>
                  One uppercase letter
                </li>
                <li className={/[0-9]/.test(value) ? "text-green-600" : "text-gray-400"}>
                  One number
                </li>
                <li className={/[^A-Za-z0-9]/.test(value) ? "text-green-600" : "text-gray-400"}>
                  One special character
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";