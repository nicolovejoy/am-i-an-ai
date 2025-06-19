"use client";

import React, { useState } from 'react';

interface CloseConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, status: 'completed' | 'terminated') => void;
  isLoading: boolean;
  conversationTitle: string;
}

export function CloseConversationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  conversationTitle,
}: CloseConversationModalProps) {
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'completed' | 'terminated'>('completed');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason, status);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Close Conversation
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to close "{conversationTitle}"? This action will prevent new messages from being added.
          </p>
          
          {/* Status Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Closing Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'completed' | 'terminated')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="completed">Completed - Natural end of conversation</option>
              <option value="terminated">Terminated - Conversation ended early</option>
            </select>
          </div>
          
          {/* Reason Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter a reason for closing this conversation..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${
                status === 'terminated' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Closing...' : `Close as ${status}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}