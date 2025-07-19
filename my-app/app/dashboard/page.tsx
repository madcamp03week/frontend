'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import WarningModal from '../../components/WarningModal';

export default function DashboardPage() {
  const { user, userProfile, wallets, logout, createNewWallet } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const handleCreateNewWallet = async () => {
    if (!user) return;
    
    // 이미 활성 지갑이 있는 경우 경고 모달 표시
    const hasActiveWallet = wallets.some(wallet => wallet.isActive);
    if (hasActiveWallet) {
      setShowWarningModal(true);
      return;
    }
    
    // 활성 지갑이 없는 경우 바로 생성
    await createWallet();
  };

  const createWallet = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await createNewWallet();
      alert('새로운 지갑이 생성되었습니다!');
    } catch (error) {
      console.error('지갑 생성 중 오류:', error);
      alert('지갑 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
      setShowWarningModal(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
          <a href="/login" className="text-blue-400 hover:text-blue-300">
            로그인 페이지로 이동
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* 네비게이션 */}
      <nav className="w-full flex justify-between items-center px-10 py-6 border-b border-gray-800">
        <div className="text-2xl font-bold">
          <a href="/">Chronos</a>
        </div>
        <div className="text-sm text-gray-300">
          Dashboard
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">대시보드</h1>
        </div>

        {/* 사용자 정보 */}
        <div className="mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-300">
              <span className="font-medium">이메일:</span> {user.email}
            </p>
            <p className="text-gray-300 mt-2">
              <span className="font-medium">사용자 ID:</span> {user.uid}
            </p>
            <p className="text-gray-300 mt-2">
              <span className="font-medium">가입일:</span> {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ko-KR') : '알 수 없음'}
            </p>
            {userProfile && (
              <p className="text-gray-300 mt-2">
                <span className="font-medium">프로필 생성일:</span> {userProfile.createdAt.toLocaleDateString('ko-KR')}
              </p>
            )}
          </div>
        </div>

        {/* 폴리곤 지갑 정보 */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">폴리곤 지갑</h2>
            {wallets.length > 0 ? (
              <div className="space-y-4">
                {/* 활성 지갑만 표시 */}
                {wallets.filter(wallet => wallet.isActive).map((wallet, index) => (
                  <div key={wallet.id} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-blue-400">{wallet.label || `지갑 ${index + 1}`}</h3>
                      <span className="text-xs text-green-500 font-semibold">활성</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-gray-400 text-sm">지갑 주소:</p>
                        <p className="font-mono text-sm break-all bg-gray-700 p-2 rounded">
                          {wallet.address}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">생성일:</p>
                        <p className="text-sm">{wallet.createdAt.toLocaleDateString('ko-KR')}</p>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={`https://polygonscan.com/address/${wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm rounded-md transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          Polygonscan 보기
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 비활성 지갑이 있는 경우 표시 */}
                {wallets.filter(wallet => !wallet.isActive).length > 0 && (
                  <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
                    <p className="text-gray-400 text-sm">
                      <span className="text-yellow-400 font-semibold">비활성 지갑 {wallets.filter(wallet => !wallet.isActive).length}개</span>가 있습니다.
                      <br />
                      새 지갑을 발급하면 기존 타임캡슐에 접근할 수 없게 됩니다.
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handleCreateNewWallet}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-md disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? '생성 중...' : '새 지갑 발급'}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">지갑 정보를 찾을 수 없습니다</p>
                <button
                  onClick={handleCreateNewWallet}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-md disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? '생성 중...' : '폴리곤 지갑 발급'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 폴리곤 네트워크 정보 */}
        <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">폴리곤 네트워크 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-sm">네트워크</p>
                <p className="font-semibold">Polygon Mainnet</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">체인 ID</p>
                <p className="font-mono">137</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">네이티브 토큰</p>
                <p className="font-semibold">MATIC</p>
              </div>
            </div>
            {wallets.filter(wallet => !wallet.isActive).length > 0 && (
              <div className="mt-4">
                <p className="text-gray-400 text-sm">비활성 지갑 수</p>
                <p className="text-lg font-bold text-yellow-400">{wallets.filter(wallet => !wallet.isActive).length}개</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 경고 모달 */}
      <WarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={createWallet}
        loading={loading}
      />
    </div>
  );
} 