'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import LoginRequired from '../../components/LoginRequired';
import Navigation from '../../components/Navigation';

// localStorage에서 사용자 정보를 확인하는 함수
const getCachedUserInfo = () => {
  if (typeof window === 'undefined') return null;
  try {
    const userProfile = localStorage.getItem('chronos_user_profile');
    const wallets = localStorage.getItem('chronos_wallets');
    return userProfile && wallets ? { userProfile: JSON.parse(userProfile), wallets: JSON.parse(wallets) } : null;
  } catch (error) {
    console.error('캐시된 사용자 정보 파싱 오류:', error);
    return null;
  }
};

export default function MyChronosPage() {
  const { user, wallets, userProfile, logout, createNewWallet, loading: authLoading } = useAuth();
  const [cachedUserInfo, setCachedUserInfo] = useState(getCachedUserInfo());
  const [chronosList, setChronosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [timeUntilNextRefresh, setTimeUntilNextRefresh] = useState(60);
  const [isClient, setIsClient] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // 클라이언트 사이드 렌더링 확인
  useEffect(() => {
    setIsClient(true);
    setCachedUserInfo(getCachedUserInfo());
  }, []);

  // 사용자 로그인 상태 확인 (캐시된 정보 우선 사용)
  const isUserLoggedIn = isClient && (user || cachedUserInfo);
  const shouldShowLoading = authLoading && !cachedUserInfo && isClient;

  // 활성 지갑 주소
  const activeWallet = wallets.find(wallet => wallet.isActive);

  // 타임캡슐 목록 가져오기
  const fetchChronosList = async () => {
    if (!user || !activeWallet) return;
    
    setLoading(true);
    try {
      // Firebase ID 토큰 가져오기
      const idToken = await user.getIdToken();
      
      const response = await fetch(`/api/my-chronos?walletAddress=${activeWallet.address}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ 타임캡슐 목록 조회 성공:', result.data?.length || 0);
        setChronosList(result.data || []);
        setLastRefresh(new Date());
      } else {
        console.error('❌ 타임캡슐 목록 조회 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 타임캡슐 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 수동 새로고침 함수
  const handleManualRefresh = () => {
    fetchChronosList();
    setTimeUntilNextRefresh(60);
  };

  // 자동 새로고침 설정
  useEffect(() => {
    if (user && activeWallet && isClient) {
      // 60초마다 자동 새로고침
      intervalRef.current = setInterval(() => {
        fetchChronosList();
        setTimeUntilNextRefresh(60);
      }, 60000);

      // 카운트다운 타이머
      countdownRef.current = setInterval(() => {
        setTimeUntilNextRefresh(prev => {
          if (prev <= 1) {
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [user, activeWallet, isClient]);

  // 컴포넌트 마운트 시 타임캡슐 목록 가져오기
  useEffect(() => {
    if (user && activeWallet && isClient) {
      console.log('🔄 타임캡슐 목록 가져오기 시작:', activeWallet.address);
      fetchChronosList();
    }
  }, [user, activeWallet, isClient]);

  // 로그인이 필요한 경우
  if (!isUserLoggedIn) {
    return <LoginRequired />;
  }

  // 활성 지갑 주소
  const walletAddress = activeWallet ? activeWallet.address : "지갑이 없습니다";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900 text-white relative overflow-hidden">
      {/* 배경 그라데이션 오브 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      {/* 네비게이션 */}
      <Navigation />

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent animate-pulse">
                My Chronos
              </h1>
              <div className="h-1 w-32 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"></div>
            </div>
            <div className="flex items-center space-x-4">
              {/* 마지막 새로고침 시간 */}
              <div className="text-sm text-gray-400">
                마지막 업데이트: {isClient && lastRefresh ? lastRefresh.toLocaleTimeString('ko-KR') : '로딩 중...'}
              </div>
            </div>
          </div>
          
          {/* 새로고침 컨트롤 */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-6 shadow-2xl mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleManualRefresh}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 disabled:from-gray-500/20 disabled:to-gray-600/20 border border-white/20 hover:border-white/30 text-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-white/10"
                >
                  <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="font-medium">{loading ? '새로고침 중...' : '지금 새로고침'}</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>자동 새로고침 활성화</span>
                </div>
                <div className="text-blue-400 font-medium">
                  {isClient ? `${timeUntilNextRefresh}초 후 새로고침` : '로딩 중...'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300 text-sm font-medium">내 지갑 주소</span>
            </div>
            <div className="group/address relative">
              <p className="text-sm font-mono text-white break-all pl-5 bg-black/30 p-4 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300">
                {walletAddress}
              </p>
              <button 
                onClick={() => navigator.clipboard.writeText(walletAddress)}
                className="absolute top-2 right-2 p-2 opacity-0 group-hover/address:opacity-100 transition-opacity duration-300 hover:bg-white/10 rounded-lg"
                title="주소 복사"
              >
                <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 타임캡슐 리스트 */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <p className="text-gray-300 text-lg">타임캡슐 목록을 불러오는 중...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gradient-to-r from-white/10 to-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border-b border-white/20">
                    순번
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border-b border-white/20">
                    제목
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border-b border-white/20">
                    지정된 날짜
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border-b border-white/20">
                    Chronos 열기
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border-b border-white/20">
                    내용 보기
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border-b border-white/20">
                    전송
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-white border-b border-white/20">
                    Polyscan에서 확인하기
                  </th>
                </tr>
              </thead>
              <tbody>
                {chronosList.map((chronos, index) => (
                  <tr key={chronos.id || index} className="border-b border-white/10 hover:bg-white/5 transition-all duration-300">
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      <div className="flex items-center space-x-3">
                        {chronos.imageUrl && (
                          <img 
                            src={chronos.imageUrl} 
                            alt={chronos.name}
                            className="w-8 h-8 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <div>{chronos.name}</div>
                          {chronos.tokenId && (
                            <div className="text-xs text-gray-400">Token ID: {chronos.tokenId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      <div>
                        <div>{chronos.openDate ? new Date(chronos.openDate).toLocaleString('ko-KR') : '날짜 미정'}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {chronos.openDate ? (() => {
                            const today = new Date();
                            const openDate = new Date(chronos.openDate);
                            const diffTime = openDate.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (diffDays > 0) {
                              return `D-${diffDays}`;
                            } else if (diffDays === 0) {
                              return 'D-Day';
                            } else {
                              return `D+${Math.abs(diffDays)}`;
                            }
                          })() : '날짜 미정'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {chronos.openDate && new Date(chronos.openDate) > new Date() ? (
                        <span className="text-gray-400 text-sm">잠김</span>
                      ) : (
                        <button className="px-4 py-2 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl transition-all duration-300 text-sm shadow-lg hover:shadow-white/10">
                          열기
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="px-4 py-2 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl transition-all duration-300 text-sm shadow-lg hover:shadow-white/10">
                        보기
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button className="px-4 py-2 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl transition-all duration-300 text-sm shadow-lg hover:shadow-white/10">
                        전송
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={chronos.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl transition-all duration-300 text-sm shadow-lg hover:shadow-white/10 inline-block"
                      >
                        OpenSea
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* 빈 상태 메시지 */}
        {chronosList.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">타임캡슐이 없습니다</h3>
            <p className="text-gray-400 mb-8 text-lg">새로운 타임캡슐을 만들어보세요!</p>
            <Link
              href="/new-chronos"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-white/10"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              새로운 타임캡슐 만들기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}