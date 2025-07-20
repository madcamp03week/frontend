'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import WarningModal from '../../components/WarningModal';
import PrivateKeyWarningModal from '../../components/PrivateKeyWarningModal';
import PrivateKeyDisplayModal from '../../components/PrivateKeyDisplayModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginRequired from '../../components/LoginRequired';
import Navigation from '../../components/Navigation';

// 날짜를 안전하게 처리하는 함수
const formatDate = (date: any): string => {
  if (!date) return '날짜 없음';
  
  try {
    // Firestore Timestamp인 경우
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('ko-KR');
    }
    
    // Date 객체인 경우
    if (date instanceof Date) {
      return date.toLocaleDateString('ko-KR');
    }
    
    // 문자열인 경우 Date로 변환
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('ko-KR');
    }
    
    // 숫자 타임스탬프인 경우
    if (typeof date === 'number') {
      return new Date(date).toLocaleDateString('ko-KR');
    }
    
    return '날짜 형식 오류';
  } catch (error) {
    console.error('날짜 변환 오류:', error, date);
    return '날짜 변환 실패';
  }
};

export default function DashboardPage() {
  const { user, userProfile, wallets, logout, hasWallet, loading: authLoading, dataLoaded, updateDisplayName } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showPrivateKeyWarningModal, setShowPrivateKeyWarningModal] = useState(false);
  const [showPrivateKeyDisplayModal, setShowPrivateKeyDisplayModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [privateKeyData, setPrivateKeyData] = useState<any>(null);
  const [privateKeyLoading, setPrivateKeyLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [showInactiveWallets, setShowInactiveWallets] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionStats, setTransactionStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    nftMints: 0,
    nftTransfers: 0,
    tokenTransfers: 0,
    contractInteractions: 0,
  });
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const router = useRouter();

  // 사용자 프로필이 로드되면 닉네임 상태 초기화
  useEffect(() => {
    if (userProfile?.displayName) {
      setNickname(userProfile.displayName);
    }
  }, [userProfile?.displayName]);

  // 로그인한 사용자가 지갑이 없으면 자동으로 지갑 설정 페이지로 이동
  useEffect(() => {
    if (user && !authLoading && dataLoaded && !hasWallet) {
      console.log('대시보드: 사용자가 지갑을 보유하지 않음. 지갑 설정 페이지로 이동합니다.');
      router.push('/wallet-setup');
    }
  }, [user, authLoading, dataLoaded, hasWallet, router]);

  const handleCreateNewWallet = async () => {
    if (!user) return;
    
    // 이미 활성 지갑이 있는 경우 경고 모달 표시
    const hasActiveWallet = wallets.some(wallet => wallet.isActive);
    if (hasActiveWallet) {
      setShowWarningModal(true);
      return;
    }
    
    // 활성 지갑이 없는 경우 바로 지갑 설정 페이지로 이동
    router.push('/wallet-setup');
  };

  const handleConfirmNewWallet = () => {
    // 모달에서 확인 버튼 클릭 시 지갑 설정 페이지로 이동
    setShowWarningModal(false);
    router.push('/wallet-setup');
  };

  const handleNicknameSave = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    setNicknameLoading(true);
    try {
      await updateDisplayName(nickname.trim());
      setIsEditingNickname(false);
      alert('닉네임이 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('닉네임 저장 오류:', error);
      alert('닉네임 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setNicknameLoading(false);
    }
  };

  const handleNicknameCancel = () => {
    setNickname(userProfile?.displayName || '');
    setIsEditingNickname(false);
  };

  // Private Key 확인 처리
  const handlePrivateKeyConfirm = async () => {
    if (!selectedWallet || !user) return;
    
    setPrivateKeyLoading(true);
    setShowPrivateKeyWarningModal(false);
    
    try {
      // Firebase ID 토큰 가져오기
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/wallet/private-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          walletAddress: selectedWallet.address,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPrivateKeyData(data.data);
        setShowPrivateKeyDisplayModal(true);
      } else {
        alert(data.error || 'Private Key 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('Private Key 조회 오류:', error);
      alert('Private Key 조회 중 오류가 발생했습니다.');
    } finally {
      setPrivateKeyLoading(false);
    }
  };

  const handlePrivateKeyRequest = (wallet: any) => {
    setSelectedWallet(wallet);
    setShowPrivateKeyWarningModal(true);
  };

  // 트랜잭션 데이터 가져오기
  const fetchTransactions = async () => {
    if (!user) return;
    
    setTransactionsLoading(true);
    try {
      // Firebase ID 토큰 가져오기
      const idToken = await user.getIdToken();
      
      console.log('🔍 트랜잭션 API 호출 시작...');
      
      const response = await fetch('/api/transactions?limit=20', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const data = await response.json();
      
      console.log('📊 트랜잭션 API 응답:', {
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (response.ok) {
        console.log('✅ 트랜잭션 데이터 설정:', {
          transactionsCount: data.data?.length || 0,
          stats: data.stats
        });
        setTransactions(data.data || []);
        setTransactionStats(data.stats || {
          total: 0,
          success: 0,
          failed: 0,
          nftMints: 0,
          nftTransfers: 0,
          tokenTransfers: 0,
          contractInteractions: 0,
        });
      } else {
        console.error('❌ 트랜잭션 조회 실패:', data.error);
      }
    } catch (error) {
      console.error('❌ 트랜잭션 조회 오류:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 트랜잭션 데이터 가져오기
  useEffect(() => {
    console.log('🔄 useEffect 실행:', { user: !!user, hasWallet, dataLoaded });
    if (user && hasWallet) {
      console.log('🚀 트랜잭션 데이터 가져오기 시작');
      fetchTransactions();
    }
  }, [user, hasWallet]);

  // 트랜잭션 상태 디버깅
  useEffect(() => {
    console.log('📈 트랜잭션 상태 업데이트:', {
      transactionsCount: transactions.length,
      transactionsLoading,
      transactionStats
    });
  }, [transactions, transactionsLoading, transactionStats]);

  if (!user) {
    return <LoginRequired />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900 text-white relative overflow-hidden">
      {/* 배경 그라데이션 오브 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      
      {/* 네비게이션 */}
      <Navigation />

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent animate-pulse">
            대시보드
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"></div>
        </div>

        {/* 사용자 정보 카드 */}
        <div className="mb-8 group">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 hover:border-cyan-500/50 transform hover:scale-[1.02]">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center mr-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                  내 정보
                </h3>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm">이메일</span>
                </div>
                <p className="text-lg font-medium pl-5">{user.email || '이메일 정보 없음'}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm">사용자 ID</span>
                </div>
                <p className="text-sm font-mono pl-5 text-gray-300 break-all">{user.uid}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm">가입일</span>
                </div>
                <p className="text-lg font-medium pl-5">
                  {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ko-KR') : '알 수 없음'}
                </p>
              </div>
              
              {userProfile && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 text-sm">프로필 생성일</span>
                  </div>
                  <p className="text-lg font-medium pl-5">
                    {userProfile.createdAt ? formatDate(userProfile.createdAt) : '알 수 없음'}
                  </p>
                </div>
              )}
            </div>

            {/* 닉네임 설정 섹션 */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm font-medium">닉네임</span>
                </div>
                {!isEditingNickname && (
                  <button
                    onClick={() => setIsEditingNickname(true)}
                    className="flex items-center px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 text-sm rounded-lg transition-all duration-300"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    수정
                  </button>
                )}
              </div>
              
              {isEditingNickname ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="닉네임을 입력하세요"
                      className="flex-1 px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                      maxLength={20}
                    />
                    <button
                      onClick={handleNicknameSave}
                      disabled={nicknameLoading || !nickname.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center"
                    >
                      {nicknameLoading ? (
                        <>
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          저장 중...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          저장
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleNicknameCancel}
                      disabled={nicknameLoading}
                      className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-400 hover:to-gray-500 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50"
                    >
                      취소
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    최대 20자까지 입력 가능합니다. ({nickname.length}/20)
                  </p>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <p className="text-lg font-medium pl-5">
                    {userProfile?.displayName ? (
                      <span className="text-blue-300">{userProfile.displayName}</span>
                    ) : (
                      <span className="text-gray-400 italic">닉네임이 설정되지 않았습니다</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 폴리곤 지갑 정보 */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl overflow-hidden shadow-2xl mb-8">
          <div className="p-8">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  내 지갑
                </h2>
              </div>
            </div>
            
            {wallets.length > 0 ? (
              <div className="space-y-6">
                {/* 활성 지갑만 표시 */}
                {wallets.filter(wallet => wallet.isActive).map((wallet, index) => (
                  <div 
                    key={wallet.id || wallet.address || index} 
                    className="group relative backdrop-blur-sm bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 hover:border-green-400/50 transition-all duration-500 hover:shadow-green-500/25 hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        활성
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-green-400 mb-2">
                        {'활성 지갑'}
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          지갑 주소
                        </p>
                        <div className="group/address relative">
                          <p className="font-mono text-sm break-all bg-black/30 p-4 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300">
                            {wallet.address}
                          </p>
                          <button 
                            onClick={() => navigator.clipboard.writeText(wallet.address)}
                            className="absolute top-2 right-2 p-2 opacity-0 group-hover/address:opacity-100 transition-opacity duration-300 hover:bg-white/10 rounded-lg"
                            title="주소 복사"
                          >
                            <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-400 text-sm mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          생성일
                        </p>
                        <p className="text-sm font-medium">{wallet.createdAt ? formatDate(wallet.createdAt) : '알 수 없음'}</p>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-2">
                        <a
                          href={`https://polygonscan.com/address/${wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/link flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 hover:border-indigo-400/50 text-indigo-300 hover:text-indigo-200 text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-indigo-500/25 transform hover:scale-105"
                        >
                          <svg className="w-4 h-4 mr-2 group-hover/link:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Polygonscan 탐색
                        </a>
                        <button
                          onClick={() => handlePrivateKeyRequest(wallet)}
                          className="group/private flex items-center px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 hover:border-red-400/50 text-red-300 hover:text-red-200 text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-red-500/25 transform hover:scale-105"
                        >
                          <svg className="w-4 h-4 mr-2 group-hover/private:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          Private key 확인
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 비활성 지갑이 있는 경우 표시 */}
                {wallets.filter(wallet => !wallet.isActive).length > 0 && (
                  <div className="backdrop-blur-sm bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <svg className="w-6 h-6 text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.314 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-yellow-400 font-semibold text-lg">
                          비활성 지갑 {wallets.filter(wallet => !wallet.isActive).length}개 감지됨
                        </span>
                      </div>
                      <button
                        onClick={() => setShowInactiveWallets(!showInactiveWallets)}
                        className="flex items-center px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 hover:border-yellow-400/50 text-yellow-300 hover:text-yellow-200 text-sm rounded-lg transition-all duration-300"
                      >
                        <svg 
                          className={`w-4 h-4 mr-1 transition-transform duration-300 ${showInactiveWallets ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {showInactiveWallets ? '숨기기' : '보기'}
                      </button>
                    </div>
                    
                    {showInactiveWallets && (
                      <div className="mt-4 space-y-3">
                        {wallets.filter(wallet => !wallet.isActive).map((wallet, index) => (
                          <div 
                            key={wallet.id || wallet.address || index}
                            className="group/address relative backdrop-blur-sm bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-500/30 rounded-xl p-4 hover:border-gray-400/50 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-gray-400 text-sm mb-2 flex items-center">
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                  비활성 지갑 {index + 1}
                                </p>
                                <div className="group/address relative">
                                  <p className="font-mono text-sm break-all bg-black/30 p-3 rounded-lg border border-white/10 hover:border-gray-400/50 transition-all duration-300">
                                    {wallet.address}
                                  </p>
                                  <button 
                                    onClick={() => navigator.clipboard.writeText(wallet.address)}
                                    className="absolute top-2 right-2 p-2 opacity-0 group-hover/address:opacity-100 transition-opacity duration-300 hover:bg-white/10 rounded-lg"
                                    title="주소 복사"
                                  >
                                    <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  생성일: {wallet.createdAt ? formatDate(wallet.createdAt) : '알 수 없음'}
                                </p>
                              </div>
                              <div className="ml-4">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                                  비활성
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-gray-300 leading-relaxed mt-4">
                      새로운 지갑을 발급하면 기존 타임캡슐에 대한 접근 권한이 완전히 소실됩니다. 
                      이 작업은 되돌릴 수 없습니다.
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handleCreateNewWallet}
                  disabled={loading}
                  className="group w-full px-6 py-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-300 hover:text-emerald-200 font-semibold rounded-2xl disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-[1.02] relative overflow-hidden"
                >
                  <div className="flex items-center justify-center">
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 mr-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        지갑 생성 중...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-3 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        새로운 지갑 발급
                      </>
                    )}
                  </div>
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-full flex items-center justify-center border border-gray-500/30">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-300">지갑이 없습니다</h3>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  폴리곤 네트워크에서 타임캡슐을 사용하려면 먼저 지갑을 생성해야 합니다.
                </p>
                <button
                  onClick={handleCreateNewWallet}
                  disabled={loading}
                  className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold rounded-2xl disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 mr-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      지갑 생성 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-3 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      폴리곤 지갑 생성하기
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>



        {/* 폴리곤 네트워크 정보 */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl overflow-hidden shadow-2xl mb-8">
          <div className="p-8">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center mr-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
                  네트워크 정보
                </h2>
                <p className="text-gray-400">폴리곤 메인넷 상태</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group backdrop-blur-sm bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300 hover:shadow-purple-500/25 transform hover:scale-105">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                  <p className="text-gray-300 text-sm font-medium">네트워크</p>
                </div>
                <p className="text-xl font-bold text-purple-300">Polygon Mainnet</p>
              </div>
              
              <div className="group backdrop-blur-sm bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-cyan-500/25 transform hover:scale-105">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
                  <p className="text-gray-300 text-sm font-medium">체인 ID</p>
                </div>
                <p className="text-xl font-bold font-mono text-cyan-300">137</p>
              </div>
              
              <div className="group backdrop-blur-sm bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 hover:border-green-400/50 transition-all duration-300 hover:shadow-green-500/25 transform hover:scale-105">
                <div className="flex items-center mb-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                  <p className="text-gray-300 text-sm font-medium">네이티브 토큰</p>
                </div>
                <p className="text-xl font-bold text-green-300">MATIC</p>
              </div>
              
              {wallets.filter(wallet => !wallet.isActive).length > 0 && (
                <div className="group backdrop-blur-sm bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-400/50 transition-all duration-300 hover:shadow-yellow-500/25 transform hover:scale-105">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3 animate-pulse"></div>
                    <p className="text-gray-300 text-sm font-medium">비활성 지갑</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">
                    {wallets.filter(wallet => !wallet.isActive).length}개
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 내 트랜잭션들 */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center mr-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                    내 트랜잭션들
                  </h2>
                  <p className="text-gray-400">지갑의 모든 블록체인 활동</p>
                </div>
              </div>
                             <div className="flex items-center space-x-3">
                 <button 
                   onClick={fetchTransactions}
                   disabled={transactionsLoading}
                   className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 border border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 disabled:opacity-50"
                 >
                   {transactionsLoading ? (
                     <>
                       <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                       </svg>
                       로딩 중...
                     </>
                   ) : (
                     <>
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                       </svg>
                       새로고침
                     </>
                   )}
                 </button>
                 {wallets.filter(wallet => wallet.isActive).length > 0 && (
                   <a
                     href={`https://polygonscan.com/address/${wallets.filter(wallet => wallet.isActive)[0].address}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 hover:border-green-400/50 text-green-300 hover:text-green-200 text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
                   >
                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                     </svg>
                     Polygonscan
                   </a>
                 )}
               </div>
            </div>
            
                         {/* 트랜잭션 통계 카드 */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
               <div className="group backdrop-blur-sm bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-2xl p-6 hover:border-blue-400/50 transition-all duration-300 hover:shadow-blue-500/25 transform hover:scale-105">
                 <div className="flex items-center mb-4">
                   <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
                   <p className="text-gray-300 text-sm font-medium">총 Chronos</p>
                 </div>
                 <p className="text-2xl font-bold text-blue-300">{transactionStats.total}</p>
                 <p className="text-xs text-gray-400 mt-2">전체 NFT 활동</p>
               </div>
               
               <div className="group backdrop-blur-sm bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-400/50 transition-all duration-300 hover:shadow-purple-500/25 transform hover:scale-105">
                 <div className="flex items-center mb-4">
                   <div className="w-3 h-3 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                   <p className="text-gray-300 text-sm font-medium">생성</p>
                 </div>
                 <p className="text-2xl font-bold text-purple-300">{transactions.filter(tx => tx.methodName === 'Chronos 생성').length}</p>
                 <p className="text-xs text-gray-400 mt-2">생성한 Chronos</p>
               </div>
               
               <div className="group backdrop-blur-sm bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-cyan-500/25 transform hover:scale-105">
                 <div className="flex items-center mb-4">
                   <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
                   <p className="text-gray-300 text-sm font-medium">전송</p>
                 </div>
                 <p className="text-2xl font-bold text-cyan-300">{transactions.filter(tx => tx.methodName === 'Chronos 보냄' || tx.methodName === 'Chronos 받음').length}</p>
                 <p className="text-xs text-gray-400 mt-2">전송/수신 활동</p>
               </div>
               
               <div className="group backdrop-blur-sm bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-2xl p-6 hover:border-red-400/50 transition-all duration-300 hover:shadow-red-500/25 transform hover:scale-105">
                 <div className="flex items-center mb-4">
                   <div className="w-3 h-3 bg-red-400 rounded-full mr-3 animate-pulse"></div>
                   <p className="text-gray-300 text-sm font-medium">실패</p>
                 </div>
                 <p className="text-2xl font-bold text-red-300">{transactionStats.failed}</p>
                 <p className="text-xs text-gray-400 mt-2">실패한 트랜잭션</p>
               </div>
             </div>
            
                         {/* 트랜잭션 목록 */}
             <div className="space-y-4">
               {transactionsLoading ? (
                 <div className="text-center py-12">
                   <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center border border-blue-500/30 animate-pulse">
                     <svg className="w-10 h-10 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                     </svg>
                   </div>
                   <h3 className="text-2xl font-bold mb-4 text-blue-300">트랜잭션 로딩 중...</h3>
                   <p className="text-gray-400">블록체인에서 트랜잭션을 가져오는 중입니다.</p>
                 </div>
               ) : transactions.length === 0 ? (
                 <div className="text-center py-12">
                   <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-full flex items-center justify-center border border-gray-500/30">
                     <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                   </div>
                   <h3 className="text-2xl font-bold mb-4 text-gray-300">트랜잭션이 없습니다</h3>
                   <p className="text-gray-400 mb-8 max-w-md mx-auto">
                     아직 블록체인에서 활동한 기록이 없습니다. 타임캡슐을 생성하거나 관리하면 여기에 표시됩니다.
                   </p>
                   <div className="flex justify-center space-x-4">
                     <Link href="/new-chronos" className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/30 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-white/10">
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                       </svg>
                       새 타임캡슐 생성
                     </Link>
                     <Link href="/my-chronos" className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/30 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-white/10">
                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                       </svg>
                       내 타임캡슐 보기
                     </Link>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {transactions.map((tx, index) => (
                     <div 
                       key={tx.hash} 
                       className={`group backdrop-blur-sm border rounded-xl p-4 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] ${
                         tx.status === 'success' 
                           ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 hover:border-green-400/50 hover:shadow-green-500/25'
                           : 'bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/30 hover:border-red-400/50 hover:shadow-red-500/25'
                       }`}
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-4">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                             tx.methodName === 'Chronos 생성' 
                               ? 'bg-purple-500/50'
                               : tx.methodName === 'Chronos 보냄'
                               ? 'bg-cyan-500/50'
                               : tx.methodName === 'Chronos 받음'
                               ? 'bg-cyan-500/50'
                               : 'bg-gray-500/20'
                           }`}>
                             {tx.methodName === 'Chronos 생성' ? (
                               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                               </svg>
                             ) : tx.methodName === 'Chronos 보냄' ? (
                               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                               </svg>
                             ) : tx.methodName === 'Chronos 받음' ? (
                               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                               </svg>
                             ) : (
                               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                               </svg>
                             )}
                           </div>
                           <div>
                             <p className={`font-semibold ${
                               tx.status === 'success' ? 'text-green-300' : 'text-red-300'
                             }`}>
                               {tx.methodName || 'NFT Transfer'}
                             </p>
                             <p className="text-sm text-gray-400">
                               {tx.relativeTime || new Date(tx.timestamp).toLocaleString('ko-KR')}
                             </p>
                             {tx.tokenName && tx.tokenId && (
                               <p className="text-xs text-gray-500">
                                 {tx.tokenName} #{tx.tokenId} {tx.tokenSymbol && `(${tx.tokenSymbol})`}
                               </p>
                             )}
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-mono text-gray-300">
                             {tx.hash.substring(0, 6)}...{tx.hash.substring(tx.hash.length - 4)}
                           </p>
                           <a 
                             href={`https://polygonscan.com/tx/${tx.hash}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                           >
                             Polygonscan 보기
                           </a>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
              
              
            </div>
          </div>
        </div>
      
      {/* 경고 모달 */}
      <WarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleConfirmNewWallet}
        title="주의사항"
        message="새 지갑을 발급하면 기존의 타임캡슐들을 Chronos에서 조회할 수 없게 됩니다."
        confirmText="지갑 생성으로 이동"
        cancelText="취소"
        details={
          <p className="text-gray-400 text-xs">
            • 기존 지갑으로 생성한 타임캡슐은 새 지갑에서 접근할 수 없습니다<br/>
            • 타임캡슐 데이터는 기존 지갑 주소와 연결되어 있습니다<br/>
            • 새 지갑 발급 후에는 기존 타임캡슐을 복구할 수 없습니다<br/>
            • 지갑 설정 페이지에서 암호화 방법을 선택할 수 있습니다
          </p>
        }
        loading={loading}
      />
      
      {/* Private Key 경고 모달 */}
      <PrivateKeyWarningModal
        isOpen={showPrivateKeyWarningModal}
        onClose={() => setShowPrivateKeyWarningModal(false)}
        onConfirm={handlePrivateKeyConfirm}
        title="Private Key 확인 경고"
        message="Private key가 노출되면 지갑의 모든 타임캡슐을 잃을 수 있습니다."
        confirmText="확인"
        cancelText="취소"
        details={
          <p className="text-red-300 text-xs">
            • Private key는 지갑의 모든 권한을 가집니다<br/>
            • 노출된 Private key로 누구나 지갑에 접근할 수 있습니다<br/>
            • 타임캡슐 데이터가 완전히 손실될 수 있습니다<br/>
            • 이 작업은 되돌릴 수 없습니다
          </p>
        }
        loading={privateKeyLoading}
      />

      {/* Private Key 표시 모달 */}
      {privateKeyData && (
        <PrivateKeyDisplayModal
          isOpen={showPrivateKeyDisplayModal}
          onClose={() => {
            setShowPrivateKeyDisplayModal(false);
            setPrivateKeyData(null);
            setSelectedWallet(null);
          }}
          userMade={privateKeyData.userMade}
          encryptedPrivateKey={privateKeyData.privateKey}
          walletAddress={selectedWallet?.address || ''}
        />
      )}
    </div>
  );
}