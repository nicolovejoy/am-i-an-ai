"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = "", 
  width = "100%", 
  height = "1rem" 
}) => (
  <div 
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    style={{ width, height }}
    data-testid="skeleton"
  />
);

export const ProfileSkeleton: React.FC = () => (
  <div className="max-w-2xl mx-auto p-6">
    <Skeleton height="2.25rem" width="8rem" className="mb-8" />
    
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton height="1.5rem" width="10rem" />
        <Skeleton height="2.5rem" width="4rem" />
      </div>
      
      <div className="space-y-4">
        <div>
          <Skeleton height="1rem" width="3rem" className="mb-2" />
          <Skeleton height="1.25rem" width="15rem" />
        </div>
        <div>
          <Skeleton height="1rem" width="4rem" className="mb-2" />
          <Skeleton height="1.25rem" width="20rem" />
        </div>
      </div>
    </div>
  </div>
);

export const ChatSkeleton: React.FC = () => (
  <div className="py-8 px-4 sm:px-6 lg:px-8">
    <div className="max-w-3xl mx-auto">
      <Skeleton height="2.25rem" width="12rem" className="mx-auto mb-8" />
      
      <div className="space-y-4">
        {/* User message skeleton */}
        <div className="flex justify-end">
          <div className="max-w-xs lg:max-w-md bg-gray-200 rounded-lg p-3">
            <Skeleton height="1rem" width="100%" className="mb-2" />
            <Skeleton height="1rem" width="70%" />
          </div>
        </div>
        
        {/* AI response skeleton */}
        <div className="flex justify-start">
          <div className="max-w-xs lg:max-w-md bg-gray-200 rounded-lg p-3">
            <Skeleton height="1rem" width="100%" className="mb-2" />
            <Skeleton height="1rem" width="90%" className="mb-2" />
            <Skeleton height="1rem" width="60%" />
          </div>
        </div>
        
        {/* Input skeleton */}
        <div className="mt-8">
          <Skeleton height="3rem" width="100%" />
        </div>
      </div>
    </div>
  </div>
);

export const NavSkeleton: React.FC = () => (
  <nav className="bg-white shadow-sm border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <Skeleton width="2.5rem" height="2.5rem" className="mr-2 rounded-full" />
          <Skeleton width="8rem" height="1.5rem" />
        </div>
        
        <div className="flex items-center space-x-4">
          <Skeleton width="4rem" height="1.25rem" />
          <Skeleton width="5rem" height="1.25rem" />
          <Skeleton width="6rem" height="2rem" className="rounded-md" />
        </div>
      </div>
    </div>
  </nav>
);

export const FormSkeleton: React.FC = () => (
  <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
    <Skeleton height="2rem" width="8rem" className="mx-auto mb-6" />
    
    <div className="space-y-4">
      <div>
        <Skeleton height="1rem" width="3rem" className="mb-2" />
        <Skeleton height="2.5rem" width="100%" />
      </div>
      <div>
        <Skeleton height="1rem" width="4rem" className="mb-2" />
        <Skeleton height="2.5rem" width="100%" />
      </div>
      <Skeleton height="2.5rem" width="100%" className="mt-6" />
    </div>
  </div>
);