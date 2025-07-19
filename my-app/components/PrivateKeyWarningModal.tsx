import React from 'react';

interface PrivateKeyWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function PrivateKeyWarningModal({ isOpen, onClose, onConfirm, loading = false }: PrivateKeyWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="backdrop-blur-xl bg-gray-800/80 rounded-2xl p-6 max-w-md w-full mx-4 border border-red-500/30">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-white">
            Private Key 확인 경고
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-300 text-sm leading-relaxed">
            Private key가 노출되면 <span className="text-red-400 font-semibold">지갑의 모든 타임캡슐을 잃을 수 있습니다</span>.
          </p>
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-red-300 text-xs">
              • Private key는 지갑의 모든 권한을 가집니다<br/>
              • 노출된 Private key로 누구나 지갑에 접근할 수 있습니다<br/>
              • 타임캡슐 데이터가 완전히 손실될 수 있습니다<br/>
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-500/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-600/30 border border-gray-500/30 hover:border-gray-400/50 text-gray-300 hover:text-gray-200 rounded-lg transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:scale-105 transform"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 hover:border-red-400/50 text-red-300 hover:text-red-200 rounded-lg transition-all duration-300 disabled:opacity-50 hover:shadow-lg hover:scale-105 transform"
          >
            {loading ? '처리 중...' : '확인'}
          </button>
        </div>
      </div>
    </div>
  );
} 