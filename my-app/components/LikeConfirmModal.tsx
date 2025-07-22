import React from "react";

interface LikeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function LikeConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = "Up 확인",
  message = "Up을 누를까요? 1CR이 소모됩니다.",
  confirmText = "확인",
  cancelText = "취소"
}: LikeConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="backdrop-blur-xl bg-gray-800/90 rounded-2xl p-6 max-w-md w-full mx-4 border-2 border-purple-500/60 shadow-2xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6"
              fill="#b46aff" // tailwind purple-400
              stroke="#b46aff"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.71,9.29l-7-7a1,1,0,0,0-1.42,0l-7,7a1,1,0,0,0,1.42,1.42L11,5.41V21a1,1,0,0,0,2,0V5.41l5.29,5.3a1,1,0,0,0,1.42,0A1,1,0,0,0,19.71,9.29Z"
              />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-bold text-purple-400">
            {title}
          </h3>
        </div>
        <div className="mb-6">
          <p className="text-gray-200 text-base leading-relaxed">
            {message}
          </p>
          {loading && (
            <div className="flex flex-col items-center mt-4 mb-2">
              <div className="w-8 h-8 mb-2 border-4 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-purple-300 text-sm font-medium">블록체인에 Up 기록하는 중...</span>
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
            className="flex-1 px-4 py-2 rounded-lg transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:scale-105 transform bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/30 hover:border-purple-400/50 text-purple-200 hover:text-purple-100 font-semibold"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 