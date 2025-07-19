import React from 'react';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  confirmButtonColor?: 'blue' | 'red' | 'green' | 'yellow';
  details?: React.ReactNode;
}

export default function WarningModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading = false,
  title = "주의사항",
  message = "새 지갑을 발급하면 기존의 타임캡슐들을 Chronos에서 조회할 수 없게 됩니다.",
  confirmText = "지갑 생성으로 이동",
  cancelText = "취소",
  icon,
  confirmButtonColor = 'blue',
  details
}: WarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="backdrop-blur-xl bg-gray-800/80 rounded-2xl p-6 max-w-md w-full mx-4 border border-yellow-700/50">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            {icon || (
              <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
          </div>
          <h3 className="ml-3 text-lg font-medium text-white">
            {title}
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-300 text-sm leading-relaxed">
            {message}
          </p>
          {details && (
            <div className="mt-4 p-3 bg-gray-700 rounded-md">
              {details}
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-500/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-600/30 border border-gray-500/30 hover:border-gray-400/50 text-gray-300 hover:text-gray-200 rounded-lg transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:scale-105 transform"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:scale-105 transform ${
              confirmButtonColor === 'blue' 
                ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 border border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200'
                : confirmButtonColor === 'red'
                ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 hover:border-red-400/50 text-red-300 hover:text-red-200'
                : confirmButtonColor === 'green'
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 hover:border-green-400/50 text-green-300 hover:text-green-200'
                : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 hover:border-yellow-400/50 text-yellow-300 hover:text-yellow-200'
            }`}
          >
            {loading ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 