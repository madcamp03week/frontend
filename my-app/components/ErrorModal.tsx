import React from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string;
}

export default function ErrorModal({ isOpen, onClose, errorMessage }: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600 shadow-2xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-white">
            로그인 오류
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-300 text-sm leading-relaxed">
            {errorMessage}
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
} 