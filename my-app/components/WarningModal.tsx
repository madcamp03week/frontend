import React from 'react';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function WarningModal({ isOpen, onClose, onConfirm, loading = false }: WarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-white">
            주의사항
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-300 text-sm leading-relaxed">
            새 지갑을 발급하면 <span className="text-yellow-400 font-semibold">기존의 타임캡슐들을 Chronos에서 조회할 수 없게 됩니다</span>.
          </p>
          <div className="mt-4 p-3 bg-gray-700 rounded-md">
            <p className="text-gray-400 text-xs">
              • 기존 지갑으로 생성한 타임캡슐은 새 지갑에서 접근할 수 없습니다<br/>
              • 타임캡슐 데이터는 기존 지갑 주소와 연결되어 있습니다<br/>
              • 새 지갑 발급 후에는 기존 타임캡슐을 복구할 수 없습니다<br/>
              • 지갑 설정 페이지에서 암호화 방법을 선택할 수 있습니다
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? '처리 중...' : '지갑 생성으로 이동'}
          </button>
        </div>
      </div>
    </div>
  );
} 