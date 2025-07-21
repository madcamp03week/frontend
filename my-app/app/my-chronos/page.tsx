'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import LoginRequired from '../../components/LoginRequired';
import Navigation from '../../components/Navigation';
import { openTimeCapsule } from '../../lib/blockchain';
import { decryptFile } from '../../lib/crypto';

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
  // 기존 Hook들
  const { user, wallets, userProfile, logout, createNewWallet, loading: authLoading, dataLoaded } = useAuth();
  const [cachedUserInfo, setCachedUserInfo] = useState(getCachedUserInfo());
  const [chronosList, setChronosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openingTokenId, setOpeningTokenId] = useState<string | null>(null);
  const [openResult, setOpenResult] = useState<any>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [timeUntilNextRefresh, setTimeUntilNextRefresh] = useState(60);
  const [isClient, setIsClient] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [transferingId, setTransferingId] = useState<string | null>(null);
  const [transferError, setTransferError]   = useState<string | null>(null);
  const [transferResult, setTransferResult] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [modalTokenId, setModalTokenId] = useState<string>('');
  const [modalContractAddress, setModalContractAddress] = useState<string>('');
  const [modalToAddress, setModalToAddress] = useState<string>('');
  const [sendByEmail, setSendByEmail] = useState(false);
  const [modalEmail, setModalEmail] = useState<string>('');
  const [fromAddress, setFromAddress] = useState<string>('');
  // 파일 모달 관련 Hook들 (최상단에 위치)
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileModalLoading, setFileModalLoading] = useState(false);
  const [fileModalTokenId, setFileModalTokenId] = useState<string>('');
  const [fileModalFiles, setFileModalFiles] = useState<any[]>([]);
  const [fileModalIsEncrypted, setFileModalIsEncrypted] = useState<boolean>(false);
  const [fileModalPassword, setFileModalPassword] = useState<string>('');
  const [fileModalPasswordStep, setFileModalPasswordStep] = useState<'input'|'list'>('input');
  const [fileModalError, setFileModalError] = useState<string|null>(null);

  const activeWallet = (cachedUserInfo?.wallets || wallets).find(
    (w: any) => w.isActive
  );
// 페이지 상단에 선언되어 있는 handleTransfer
const handleTransfer = async (
  tokenId: string,
  contractAddress: string,
  toAddress?: string,
  email?: string
) => {
  // 유효성 검사
  if (sendByEmail) {
    if (!modalEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setTransferError('유효한 이메일을 입력해주세요.');
      return;
    }
  } else {
    if (!toAddress) {
      setTransferError('보내는 주소를 입력해주세요.');
      return;
    }
    if (!toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setTransferError('유효한 지갑 주소를 입력해주세요.');
      return;
    }
  }

  setTransferingId(tokenId);
  setTransferError(null);
  setTransferResult(null);

  try {
const idToken = user ? await user.getIdToken() : null;

const res = await fetch('/api/my-chronos/send', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    ...(idToken && { 'Authorization': `Bearer ${idToken}` })
  },
  body: JSON.stringify({
    // fromAddress 는 서버에서 실제 소유자 검증 시에만 필요하므로
    // 서버 코드가 UID 검증 이후에 직접 조회하도록 변경했다면
    // 클라이언트에서는 tokenId, contractAddress, toAddress/email 만 보내면 됩니다.
    tokenId,
    contractAddress,
    ...(sendByEmail 
       ? { email: modalEmail } 
       : { toAddress })
  })
});

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || '전송 실패');
    setTransferResult(json.txHashes?.[0] || json.txHash);
    fetchChronosList();
  } catch (err: any) {
    setTransferError(err.message);
  } finally {
    setTransferingId(null);
  }
};

useEffect(() => {
   if (activeWallet?.address) {
     setFromAddress(activeWallet.address);   }
 }, [activeWallet]);

  // 클라이언트 사이드 렌더링 확인
  useEffect(() => {
    setIsClient(true);
    setCachedUserInfo(getCachedUserInfo());
  }, []);

  // 개선된 로그인 상태 확인 로직
  const isUserLoggedIn = isClient && (
    user || // Firebase 사용자 객체가 있거나
    (cachedUserInfo && cachedUserInfo.userProfile && cachedUserInfo.wallets.length > 0) || // localStorage에 유효한 정보가 있거나
    (userProfile && wallets.length > 0) // AuthContext에서 로드된 정보가 있거나
  );

  // 로딩 상태 개선 - localStorage에 정보가 있으면 즉시 로딩 완료로 처리
  const shouldShowLoading = isClient && authLoading && !cachedUserInfo && !userProfile && !user;

  // 활성 지갑 주소 - localStorage 우선 사용

  // 타임캡슐 목록 가져오기
  const fetchChronosList = async () => {
    // Firebase 사용자가 있으면 Firebase 토큰 사용, 없으면 localStorage 정보만 사용
    if (!activeWallet) {
      console.log('활성 지갑이 없습니다.');
      return;
    }
    
    setLoading(true);
    try {
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Firebase 사용자가 있으면 토큰 추가
      if (user) {
        try {
          const idToken = await user.getIdToken();
          headers['Authorization'] = `Bearer ${idToken}`;
          console.log('🔑 Firebase 토큰 추가됨');
        } catch (tokenError) {
          console.log('⚠️ Firebase 토큰 가져오기 실패, localStorage 기반 인증 사용');
        }
      } else {
        console.log('📱 Firebase 사용자 없음, localStorage 기반 인증 사용');
      }
      
      console.log('🌐 API 호출 시작:', {
        url: `/api/my-chronos?walletAddress=${activeWallet.address}`,
        hasAuthHeader: !!headers['Authorization'],
        walletAddress: activeWallet.address
      });
      
      const response = await fetch(`/api/my-chronos?walletAddress=${activeWallet.address}`, {
        headers,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ 타임캡슐 목록 조회 성공:', result.data?.length || 0);
        setChronosList(result.data || []);
        setLastRefresh(new Date());
      } else {
        console.error('❌ 타임캡슐 목록 조회 실패:', result.error);
        console.error('📊 응답 상태:', response.status, response.statusText);
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

  // 타임캡슐 열기 함수
  const handleOpenTimeCapsule = async (tokenId: string) => {
    if (!isUserLoggedIn) {
      setOpenError('로그인이 필요합니다.');
      return;
    }

    if (!tokenId) {
      setOpenError('Token ID가 필요합니다.');
      return;
    }

    setOpeningTokenId(tokenId);
    setOpenError(null);
    setOpenResult(null);

    try {
      let firebaseToken: string | null = null;
      
      // Firebase 사용자가 있으면 토큰 가져오기
      if (user) {
        try {
          firebaseToken = await user.getIdToken();
          console.log('🔑 타임캡슐 열기: Firebase 토큰 가져옴');
        } catch (tokenError) {
          console.log('⚠️ 타임캡슐 열기: Firebase 토큰 가져오기 실패');
        }
      } else {
        console.log('📱 타임캡슐 열기: Firebase 사용자 없음');
      }
      
      // 타임캡슐 열기 API 호출
      const response = await openTimeCapsule(tokenId, firebaseToken || '');
      
      if (response.success) {
        setOpenResult(response);
        // 성공 시 목록 새로고침
        setTimeout(() => {
          fetchChronosList();
        }, 2000);
      } else {
        setOpenError(response.error || '타임캡슐 열기에 실패했습니다.');
      }
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setOpeningTokenId(null);
    }
  };

  // 자동 새로고침 설정
  useEffect(() => {
    if (isUserLoggedIn && activeWallet && isClient) {
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
  }, [isUserLoggedIn, activeWallet, isClient]);

  // 컴포넌트 마운트 시 타임캡슐 목록 가져오기
  useEffect(() => {
    if (isUserLoggedIn && activeWallet && isClient) {
      console.log('🔄 타임캡슐 목록 가져오기 시작:', activeWallet.address);
      fetchChronosList();
    }
  }, [isUserLoggedIn, activeWallet, isClient]);

  // 로딩 중이거나 로그인이 필요한 경우
  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white animate-spin-reverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-300 text-lg">인증 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 로그인이 필요한 경우
  if (!isUserLoggedIn) {
    return <LoginRequired />;
  }

  // 활성 지갑 주소
  const walletAddress = activeWallet ? activeWallet.address : "지갑이 없습니다";

  // 파일 보기 버튼 클릭 핸들러
  const handleViewFiles = async (tokenId: string) => {
    setFileModalTokenId(tokenId);
    setShowFileModal(true);
    setFileModalLoading(true);
    setFileModalFiles([]);
    setFileModalIsEncrypted(false);
    setFileModalPassword('');
    setFileModalPasswordStep('input');
    setFileModalError(null);
    try {
      const res = await fetch(`/api/chronos/${tokenId}/view`);
      if (!res.ok) throw new Error('파일 정보를 불러오지 못했습니다.');
      const data = await res.json();
      setFileModalIsEncrypted(!!data.isEncrypted);
      setFileModalFiles(data.uploadedFileInfos || []);
      if (!data.isEncrypted) {
        setFileModalPasswordStep('list');
      } else {
        setFileModalPasswordStep('input');
      }
    } catch (e: any) {
      setFileModalError(e.message || '파일 정보를 불러오지 못했습니다.');
    } finally {
      setFileModalLoading(false);
    }
  };

  // 파일 다운로드 핸들러
  const handleDownloadFile = async (fileInfo: any) => {
    const cid = fileInfo.ipfsUrl.split('/').pop();
    try {
      if (!fileModalIsEncrypted) {
        // 암호화 안된 파일: 바로 다운로드
        const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
        console.log('url', url);
        const response = await fetch(url);
        if (!response.ok) throw new Error('파일 다운로드 실패');
        const blob = await response.blob();
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = fileInfo.name || 'file';
        a.click();
      } else {
        // 암호화된 파일: 다운로드 후 복호화
        if (!fileModalPassword || fileModalPassword.length < 6) {
          setFileModalError('비밀번호를 입력하세요.');
          return;
        }
        const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
          return new Promise((resolve, reject) => {
            const blob = new Blob([buffer]);
            const reader = new FileReader();
            reader.onload = function (e) {
              const target = e.target as FileReader | null;
              if (!target) {
                reject(new Error("FileReader target is null"));
                return;
              }
              const dataUrl = target.result;
              if (typeof dataUrl !== "string") {
                reject(new Error("FileReader result is not a string"));
                return;
              }
              const base64 = dataUrl.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }

        const base64String = await arrayBufferToBase64(arrayBuffer);
        console.log('base64String', base64String);

        const { file } = await decryptFile(base64String, fileModalPassword);
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(file);
        a.download = file.name;
        a.click();
      }
    } catch (e: any) {
      setFileModalError(e.message || '다운로드 실패');
    }
  };

  // 암호 입력 후 파일 리스트로 전환
  const handlePasswordSubmit = () => {
    if (!fileModalPassword || fileModalPassword.length < 6) {
      setFileModalError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    setFileModalPasswordStep('list');
    setFileModalError(null);
  };

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
                  <svg className={`w-5 h-5 ${loading ? 'animate-spin-reverse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <svg className="w-8 h-8 text-white animate-spin-reverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    열린 날짜
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
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {chronos.openedAt ? new Date(chronos.openedAt).toLocaleDateString('ko-KR') : '열리지 않음'}
                    </td>
                    <td className="px-6 py-4">
                      {chronos.openDate && new Date(chronos.openDate) > new Date() ? (
                        <button className="px-4 py-2 bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 text-gray-400 rounded-xl transition-all duration-300 text-sm shadow-lg cursor-not-allowed">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>잠김</span>
                          </div>
                        </button>
                      ) : chronos.status === 'opened' ? (
                        <button className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 text-green-400 rounded-xl transition-all duration-300 text-sm shadow-lg cursor-not-allowed">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>열림</span>
                          </div>
                        </button>
                      ) : (
                        <div>
                          <button 
                            onClick={() => handleOpenTimeCapsule(chronos.tokenId)}
                            disabled={loading || openingTokenId === chronos.tokenId}
                            className={`px-4 py-2 rounded-xl transition-all duration-300 text-sm shadow-lg ${
                              openingTokenId === chronos.tokenId 
                                ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-300 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/30 text-white hover:shadow-white/10'
                            }`}
                          >
                            {openingTokenId === chronos.tokenId ? (
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 animate-spin-reverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>열기 중...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span>열기</span>
                              </div>
                            )}
                          </button>
                          
                          {openError && openingTokenId === chronos.tokenId && (
                            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <p className="text-red-400 text-xs">{openError}</p>
                            </div>
                          )}
                          
                          {openResult && openingTokenId === chronos.tokenId && (
                            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                              <p className="text-green-400 text-xs font-medium">✅ 타임캡슐 열기 성공!</p>
                              <p className="text-green-300 text-xs mt-1">
                                TX: {openResult.data?.transactionHash?.slice(0, 10)}...
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewFiles(chronos.tokenId)}
                        disabled={chronos.status !== 'opened'}
                        className={`px-4 py-2 rounded-xl transition-all duration-300 text-sm shadow-lg ${
                          chronos.status === 'opened'
                            ? 'bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/30 text-white hover:shadow-white/10'
                            : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        보기
                      </button>
                    </td>
                    {/* 테이블 각 행의 전송 버튼만 */}
<td className="px-6 py-4">
  <button
    onClick={() => {
      setModalTokenId(chronos.tokenId);
      setModalContractAddress(chronos.contractAddress);
      setModalToAddress('');
      setShowTransferModal(true);
    }}
    className="px-4 py-2 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white rounded-xl text-sm transition duration-200 shadow-lg"
  >
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
{showTransferModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* 그라데이션 테두리 */}
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-black/80 to-indigo-900/80 backdrop-blur-xl" onClick={() => setShowTransferModal(false)} />
    <div className="relative max-w-lg w-full mx-4 p-1">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-indigo-500/30 p-[3px]">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-indigo-500/40 animate-pulse"></div>
      </div>
      <div className="relative backdrop-blur-xl bg-gray-900/95 rounded-2xl p-8 border border-cyan-500/20 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Chronos 전송</h3>
              <p className="text-gray-400 text-xs">NFT를 다른 주소 또는 이메일로 전송합니다</p>
            </div>
          </div>
          <button onClick={() => setShowTransferModal(false)} className="w-8 h-8 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* 주소/이메일 선택 */}
        <div className="flex justify-center space-x-4 mb-4 text-sm text-white">
          <label className="space-x-2">
            <input type="radio" checked={!sendByEmail} onChange={() => setSendByEmail(false)} />
            <span>지갑 주소</span>
          </label>
          <label className="space-x-2">
            <input type="radio" checked={sendByEmail} onChange={() => setSendByEmail(true)} />
            <span>이메일</span>
          </label>
        </div>
        {/* 입력 필드 */}
        <div className="mb-6">
          {!sendByEmail ? (
            <input
              type="text"
              placeholder="0x로 시작하는 지갑 주소"
              value={modalToAddress}
              onChange={e => setModalToAddress(e.target.value.trim())}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          ) : (
            <input
              type="email"
              placeholder="받는 사람 이메일"
              value={modalEmail}
              onChange={e => setModalEmail(e.target.value.trim())}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          )}
        </div>
        {/* 안내/경고 */}
        <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-start space-x-3">
          <div className="w-5 h-5 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-300 text-sm leading-relaxed">정확한 주소/이메일을 입력하세요. 잘못 입력 시 복구가 불가합니다.</p>
          </div>
        </div>
        {/* 버튼 */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowTransferModal(false)}
            className="px-5 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-400 hover:to-gray-500 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50"
          >취소</button>
          <button
            onClick={async () => {
              await handleTransfer(
                modalTokenId,
                modalContractAddress,
                modalToAddress,
                modalEmail
              );
              setShowTransferModal(false);
            }}
            disabled={
              transferingId === modalTokenId ||
              (sendByEmail
                ? !modalEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
                : !modalToAddress.match(/^0x[a-fA-F0-9]{40}$/))
            }
            className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center"
          >
            {transferingId === modalTokenId ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin-reverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8 8 0 004.582 9M9 9h5m-1-1v6m0 0h.01" />
                </svg>
                전송중…
              </>
            ) : (
              '전송하기'
            )}
          </button>
        </div>
        {/* 결과/에러 */}
        {transferError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400 text-sm">{transferError}</span>
          </div>
        )}
        {transferResult && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-400 text-sm">✔︎ 전송 완료!</span>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{/* 파일 보기 모달 */}
{showFileModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-black/80 to-indigo-900/80 backdrop-blur-xl" onClick={() => setShowFileModal(false)} />
    <div className="relative max-w-lg w-full mx-4 p-1">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/30 via-cyan-500/30 to-indigo-500/30 p-[3px]">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/40 via-cyan-500/40 to-indigo-500/40 animate-pulse"></div>
      </div>
      <div className="relative backdrop-blur-xl bg-gray-900/95 rounded-2xl p-8 border border-purple-500/20 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">타임캡슐 파일 보기</h3>
              <p className="text-gray-400 text-xs">첨부된 파일을 확인하고 다운로드할 수 있습니다</p>
            </div>
          </div>
          <button onClick={() => setShowFileModal(false)} className="w-8 h-8 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* 본문 */}
        {fileModalLoading ? (
          <div className="text-white">불러오는 중...</div>
        ) : fileModalError ? (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{fileModalError}</span>
          </div>
        ) : fileModalIsEncrypted && fileModalPasswordStep === 'input' ? (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="파일 암호 입력 (최소 6자)"
              value={fileModalPassword}
              onChange={e => setFileModalPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
            <button
              onClick={handlePasswordSubmit}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-purple-500/30 hover:border-purple-400/50 text-purple-300 hover:text-purple-200 font-medium rounded-lg transition-all duration-300"
            >확인</button>
          </div>
        ) : (
          <div>
            {fileModalFiles.length === 0 ? (
              <div className="text-gray-400">첨부된 파일이 없습니다.</div>
            ) : (
              <ul className="space-y-3">
                {fileModalFiles.map((file: any, idx: number) => (
                  <li key={file.cid || idx} className="flex items-center justify-between bg-gray-800 border border-white/10 rounded-lg px-4 py-2">
                    <span className="text-white text-sm">{file.name || file.cid}</span>
                    <button
                      onClick={() => {handleDownloadFile(file); console.log('file', file)}}
                      className="ml-4 px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-400/30 hover:to-purple-400/30 text-white rounded-lg text-xs transition-all duration-300"
                    >다운로드</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <button
          onClick={() => setShowFileModal(false)}
          className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-400 hover:to-gray-500 text-white font-medium rounded-lg transition-all duration-300"
        >닫기</button>
      </div>
    </div>
  </div>
)}


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