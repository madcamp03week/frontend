'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';


export default function MyChronosPage() {
const { user, wallets, userProfile, logout, createNewWallet } = useAuth();
  const [chronosList, setChronosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [timeUntilNextRefresh, setTimeUntilNextRefresh] = useState(10);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

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
    setTimeUntilNextRefresh(10);
  };

  // 자동 새로고침 설정
  useEffect(() => {
    if (user && activeWallet) {
      // 10초마다 자동 새로고침
      intervalRef.current = setInterval(() => {
        fetchChronosList();
        setTimeUntilNextRefresh(10);
      }, 10000);

      // 카운트다운 타이머
      countdownRef.current = setInterval(() => {
        setTimeUntilNextRefresh(prev => {
          if (prev <= 1) {
            return 10;
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
  }, [user, activeWallet]);

  // 컴포넌트 마운트 시 타임캡슐 목록 가져오기
  useEffect(() => {
    if (user && activeWallet) {
      console.log('🔄 타임캡슐 목록 가져오기 시작:', activeWallet.address);
      fetchChronosList();
    }
  }, [user, activeWallet]);

  // 로그인이 필요한 경우
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

  // 활성 지갑 주소
  const walletAddress = activeWallet ? activeWallet.address : "지갑이 없습니다";


  return (
    <div className="min-h-screen bg-black text-white">
     {/* 네비게이션 */}
      <nav className="w-full flex justify-between items-center px-10 py-6">
        <Link href="/" className="text-2xl font-bold text-white">
        <div className="text-2xl font-bold">
         Chronos
        </div>
        </Link>
        <div className="space-x-8 text-sm text-gray-300 font-light">
          <Link href="/company">Company</Link>
          <Link href="/product">Product</Link>
          <Link href="/new-chronos">New Chronos</Link>
          <Link href="/my-chronos">My Chronos</Link>
          {!loading && (
            user ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                <button
                  onClick={logout}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login">Login</Link>
            )
          )}
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold">My Chronos</h1>
            <div className="flex items-center space-x-4">
              {/* 새로고침 상태 표시 */}
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>자동 새로고침 활성화</span>
                <span className="text-blue-400">
                  ({timeUntilNextRefresh}초 후 새로고침)
                </span>
              </div>
              
              {/* 마지막 새로고침 시간 */}
              <div className="text-xs text-gray-500">
                마지막 업데이트: {lastRefresh.toLocaleTimeString('ko-KR')}
              </div>
            </div>
          </div>
          
          {/* 새로고침 컨트롤 */}
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loading ? '새로고침 중...' : '지금 새로고침'}</span>
            </button>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-300">
              <span className="font-medium">내 지갑 주소:</span> {walletAddress}
            </p>
          </div>
        </div>

        {/* 타임캡슐 리스트 */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">타임캡슐 목록을 불러오는 중...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    순번
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    제목
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    지정된 날짜
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    Chronos 열기
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    내용 보기
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    전송
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    Polyscan에서 확인하기
                  </th>
                </tr>
              </thead>
              <tbody>
                {chronosList.map((chronos, index) => (
                  <tr key={chronos.id || index} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
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
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                          열기
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                        보기
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm">
                        전송
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={chronos.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm inline-block"
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
        {chronosList.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-300 mb-2">타임캡슐이 없습니다</h3>
            <p className="text-gray-400 mb-6">새로운 타임캡슐을 만들어보세요!</p>
            <Link
              href="/new-chronos"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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