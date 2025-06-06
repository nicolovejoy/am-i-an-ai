"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "blue" | "gray" | "white";
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const colorClasses = {
  blue: "border-blue-500",
  gray: "border-gray-500", 
  white: "border-white",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "blue",
  text,
  className = "",
}) => {
  const spinnerClasses = `animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`;

  if (text) {
    return (
      <div className="flex items-center gap-3">
        <div className={spinnerClasses} data-testid="loading-spinner" />
        <span className="text-sm text-gray-600">{text}</span>
      </div>
    );
  }

  return <div className={spinnerClasses} data-testid="loading-spinner" />;
};

export const FullPageLoader: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="xl" text={text} />
    </div>
  </div>
);

export const CenterLoader: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

export const ButtonLoader: React.FC = () => (
  <LoadingSpinner size="sm" color="white" />
);