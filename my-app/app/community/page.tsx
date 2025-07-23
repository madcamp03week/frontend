"use client";

import { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";
import { useAuth } from '../../contexts/AuthContext';
import WarningModal from "../../components/WarningModal";
import LikeConfirmModal from "../../components/LikeConfirmModal";
import LoginRequired from '../../components/LoginRequired';
import { decryptFile } from '../../lib/crypto';

export default function CommunityPage() {
  const [topChronos, setTopChronos] = useState<any[]>([]);
  const [latestChronos, setLatestChronos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTop, setLoadingTop] = useState(false);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, wallets } = useAuth();
  // 잔고 관련 상태
  const [tokenBalance, setTokenBalance] = useState<number>(0);      // CHRONOS 토큰 잔액
  const [loadingBalances, setLoadingBalances] = useState(false);
  // userMap, displayName fetch 관련 코드 제거

  // 지갑 주소 모달 상태
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // 파일 모달 관련 Hook들 (my-chronos에서 가져온 기능)
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileModalLoading, setFileModalLoading] = useState(false);
  const [fileModalTokenId, setFileModalTokenId] = useState<string>('');
  const [fileModalFiles, setFileModalFiles] = useState<any[]>([]);
  const [fileModalIsEncrypted, setFileModalIsEncrypted] = useState<boolean>(false);
  const [fileModalPassword, setFileModalPassword] = useState<string>('');
  const [fileModalPasswordStep, setFileModalPasswordStep] = useState<'input'|'list'>('input');
  const [fileModalError, setFileModalError] = useState<string|null>(null);
  const [fileModalTextContent, setFileModalTextContent] = useState<string>('');
  const [fileModalShowText, setFileModalShowText] = useState<boolean>(false);
  const [fileModalChronosInfo, setFileModalChronosInfo] = useState<any>(null);

  // 닉네임 클릭 시 지갑 주소 fetch
  const handleNameClick = async (userId: string) => {
    setWalletLoading(true);
    setWalletError(null);
    setSelectedWallet(null);
    try {
      const res = await fetch(`/api/user/wallet-address?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.address) {
        setSelectedWallet(data.address);
      } else {
        setWalletError(data.error || '지갑 주소를 불러올 수 없습니다.');
      }
    } catch {
      setWalletError('네트워크 오류');
    } finally {
      setWalletLoading(false);
    }
  };

  // 텍스트 파일인지 확인하는 함수 (첫 번째 파일은 항상 .txt)
  const isTextFile = (fileName: string): boolean => {
    return fileName.toLowerCase().endsWith('.txt');
  };

  // 텍스트 파일 내용을 가져오는 함수
  const fetchTextFileContent = async (fileInfo: any): Promise<string> => {
    const cid = fileInfo.ipfsUrl.split('/').pop();
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
    const url = `${gateway}${cid}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('파일을 불러올 수 없습니다.');
    return await response.text();
  };

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
    setFileModalTextContent('');
    setFileModalShowText(false);
    setFileModalChronosInfo(null);
    
    try {
      const res = await fetch(`/api/chronos/${tokenId}/view`);
      if (!res.ok) throw new Error('파일 정보를 불러오지 못했습니다.');
      const data = await res.json();
      
      // 검사 1: status가 opened가 아니면 열리지 않은 타임캡슐로 간주
      if (data.status !== 'opened') {
        setFileModalError('아직 열리지 않은 타임캡슐입니다.');
        setFileModalLoading(false);
        return;
      }
      
      // 검사 2: isEncrypted가 true인지 확인
      if (data.isEncrypted) {
        setFileModalError('암호화된 타인의 타임캡슐은 확인할 수 없습니다.');
        setFileModalLoading(false);
        return;
      }
      
      setFileModalChronosInfo({
        name: data.name,
        description: data.description,
        openDate: data.openDate
      });
      setFileModalIsEncrypted(!!data.isEncrypted);
      setFileModalFiles(data.uploadedFileInfos || []);
      
      if (!data.isEncrypted) {
        setFileModalPasswordStep('list');
        // 암호화되지 않은 파일이고 첫 번째 파일이 .txt 파일인 경우 내용을 미리 가져오기
        if (data.uploadedFileInfos && data.uploadedFileInfos.length > 0) {
          const firstFile = data.uploadedFileInfos[0];
          try {
            const textContent = await fetchTextFileContent(firstFile);
            setFileModalTextContent(textContent);
            setFileModalShowText(true);
          } catch (e: any) {
            console.log('텍스트 파일 내용 가져오기 실패:', e.message);
            setFileModalShowText(false);
          }
        }
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
        const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
        const url = `${gateway}${cid}`;
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
        const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
        const url = `${gateway}${cid}`;
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
  const handlePasswordSubmit = async () => {
    if (!fileModalPassword || fileModalPassword.length < 6) {
      setFileModalError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    
    // 실제 파일 복호화 테스트로 비밀번호 검증
    try {
      if (fileModalFiles.length > 0) {
        const testFile = fileModalFiles[0];
        const cid = testFile.ipfsUrl.split('/').pop();
        const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
        const url = `${gateway}${cid}`;
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
        await decryptFile(base64String, fileModalPassword);
        
        // 복호화 성공 시 파일 리스트로 전환
        setFileModalPasswordStep('list');
        setFileModalError(null);
      }
    } catch (e: any) {
      setFileModalError('비밀번호가 틀렸습니다. 다시 입력해주세요.');
      setFileModalPassword(''); // 비밀번호 입력창 초기화
    }
  };

  // 잔고 조회 함수
  const fetchBalances = async () => {
    const active = wallets?.find(w => w.isActive);
    if (!active) return;
    setLoadingBalances(true);
    try {
      // CHRONOS 토큰 잔액 조회
      const resToken = await fetch('/api/dao/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: active.address }),
      });
      const dataToken = await resToken.json();
      if (dataToken.success) {
        const amount = Number(dataToken.balance);
        setTokenBalance(amount);
      }
      // POL 잔액 조회
      const resPol = await fetch('/api/wallet/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: active.address }),
      });
      const dataPol = await resPol.json();
      if (dataPol.success) {
      }
    } catch (err) {
      console.error('잔액 조회 오류:', err);
    } finally {
      setLoadingBalances(false);
    }
  };

  // 마운트 시 잔고 조회
  useEffect(() => {
    if (user && wallets && wallets.length > 0) {
      fetchBalances();
    }
  }, [user, wallets]);

  // 인기 Chronos 데이터 새로고침 함수
  const refreshTopChronos = async () => {
    setLoadingTop(true);
    setError(null);
    try {
      let headers: any = {};
      if (user) {
        const idToken = await user.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      }
      const res = await fetch("/api/community/top-chronos", { headers });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTopChronos(data.data || []);
        } else {
          setError(data.error || '인기 Chronos 데이터를 불러오는 중 오류가 발생했습니다.');
        }
      } else {
        setError('인기 Chronos 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoadingTop(false);
    }
  };

  // 최신 Chronos 데이터 새로고침 함수
  const refreshLatestChronos = async () => {
    setLoadingLatest(true);
    setError(null);
    try {
      let headers: any = {};
      if (user) {
        const idToken = await user.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      }
      const res = await fetch("/api/community/latest-chronos", { headers });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLatestChronos(data.data || []);
        } else {
          setError(data.error || '최신 Chronos 데이터를 불러오는 중 오류가 발생했습니다.');
        }
      } else {
        setError('최신 Chronos 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoadingLatest(false);
    }
  };

  // API fetch 시 Authorization 헤더 추가
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        let headers: any = {};
        if (user) {
          const idToken = await user.getIdToken();
          headers['Authorization'] = `Bearer ${idToken}`;
        }
        const [topRes, latestRes] = await Promise.all([
          fetch("/api/community/top-chronos", { headers }),
          fetch("/api/community/latest-chronos", { headers })
        ]);
        const topJson = await topRes.json();
        const latestJson = await latestRes.json();
        if (!topJson.success) throw new Error(topJson.error || "인기 chronos 불러오기 실패");
        if (!latestJson.success) throw new Error(latestJson.error || "최신 chronos 불러오기 실패");
        setTopChronos(topJson.data || []);
        setLatestChronos(latestJson.data || []);
      } catch (e: any) {
        setError(e.message || "데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // 좋아요 모달 상태
  const [likeModalOpen, setLikeModalOpen] = useState(false);
  const [likeTargetId, setLikeTargetId] = useState<string | null>(null);
  const [likeTargetType, setLikeTargetType] = useState<'top' | 'latest' | null>(null);
  const [likeLoading, setLikeLoading] = useState(false);

  // 좋아요 버튼 클릭 시 모달 오픈
  const openLikeModal = (chronosId: string, type: 'top' | 'latest') => {
    setLikeTargetId(chronosId);
    setLikeTargetType(type);
    setLikeModalOpen(true);
  };

  // 모달에서 확인 시 실제 좋아요 처리
  const handleLikeConfirm = async () => {
    if (!likeTargetId || !likeTargetType) return;
    setLikeLoading(true);
    await handleLike(likeTargetId, likeTargetType);
    // Like 처리 후 보유 토큰 API 다시 호출
    await fetchBalances();
    setLikeLoading(false);
    setLikeModalOpen(false);
  };

  // 좋아요 버튼 클릭 핸들러 (기존 handleLike는 내부에서만 사용)
  const handleLike = async (chronosId: string, type: 'top' | 'latest') => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/community/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ chronosId, likerAddress: wallets?.find(w => w.isActive)?.address }),
      });
      const data = await res.json();
      if (res.ok) {
        setTopChronos(list =>
          list.map(item =>
            item.id === chronosId
              ? { ...item, likeCount: (item.likeCount || 0) + 1, likedByMe: true }
              : item
          )
        );
        setLatestChronos(list =>
          list.map(item =>
            item.id === chronosId
              ? { ...item, likeCount: (item.likeCount || 0) + 1, likedByMe: true }
              : item
          )
        );
      } else {
        alert(data.error || '오류 발생');
      }
    } catch (e) {
      alert('네트워크 오류');
    }
  };

  if (!user) {
    return <LoginRequired />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900 text-white relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      {/* 네비게이션 */}
      <Navigation />

      {/* 지갑 주소 모달 */}
      {(selectedWallet || walletLoading || walletError) && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 backdrop-blur-md bg-black/10" />
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-6 shadow-2xl min-w-[540px] max-w-[800px] relative">
            <div className="group/address flex min-h-[80px] items-center justify-center">
              {walletLoading ? (
                <p className="text-white p-4 w-full text-center">지갑 주소 불러오는 중...</p>
              ) : walletError ? (
                <p className="text-red-500 p-4 w-full text-center">{walletError}</p>
              ) : (
                <div className="relative w-full">
                  <span className="block text-sm font-mono text-white break-all pl-5 pr-12 bg-black/30 p-4 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300 w-full">
                    {selectedWallet}
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(selectedWallet!)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 p-2 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-all duration-300"
                    title="주소 복사"
                  >
                    <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <button
              className="mt-6 w-28 py-2 text-xs bg-gradient-to-r from-gray-500/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-600/30 border border-gray-500/30 hover:border-gray-400/50 text-gray-300 hover:text-gray-200 rounded-lg transition-all duration-300 mx-auto block"
              onClick={() => { setSelectedWallet(null); setWalletError(null); }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 좋아요 확인 모달 */}
      <LikeConfirmModal
        isOpen={likeModalOpen}
        onClose={() => { if (!likeLoading) setLikeModalOpen(false); }}
        onConfirm={handleLikeConfirm}
        loading={likeLoading}
        title="Up 확인"
        message="Chronos 주인에게 1CR이 전송됩니다."
        confirmText={"확인"}
        cancelText="취소"
      />

             {/* 파일 보기 모달 */}
       {showFileModal && (
         <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-gray-800/80 border border-purple-500/60 rounded-2xl p-8 max-w-lg w-full mx-4">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center space-x-3">
                 <div className="w-7 h-7 bg-purple-400/20 border border-purple-500/60 shadow-[0_0_8px_0_rgba(168,85,247,0.15)] rounded-xl flex items-center justify-center">
                   <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                   </svg>
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-white">타임캡슐 내용 보기</h3>
                   <p className="text-purple-200/80 text-xs">첨부된 파일을 확인하고 다운로드할 수 있습니다</p>
                 </div>
               </div>
               <button onClick={() => setShowFileModal(false)} className="w-8 h-8 border border-purple-500/60 rounded-lg flex items-center justify-center transition-colors hover:border-purple-400 hover:text-purple-200">
                 <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
             
             {/* 타임캡슐 정보 표시 */}
             {fileModalChronosInfo && (
               <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                 <h4 className="text-lg font-semibold text-white mb-2">{fileModalChronosInfo.name}</h4>
                 <p className="text-purple-200 text-sm mb-2">{fileModalChronosInfo.description}</p>
                 <p className="text-purple-200 text-xs">오픈일: {fileModalChronosInfo.openDate ? new Date(fileModalChronosInfo.openDate).toLocaleDateString('ko-KR') : '없음'}</p>
               </div>
             )}
             
             {/* 본문 */}
             {fileModalLoading ? (
               <div className="flex flex-col items-center justify-center py-12">
                 <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-full flex items-center justify-center">
                   <svg className="w-8 h-8 text-white animate-spin-reverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                   </svg>
                 </div>
                 <p className="text-gray-300 text-lg">블록체인에서 정보 가져오는 중...</p>
               </div>
             ) : fileModalError === '아직 열리지 않은 타임캡슐입니다.' ? (
               <div className="w-full p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm flex items-center space-x-2 justify-center min-h-[40px]">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <span>{fileModalError}</span>
               </div>
             ) : fileModalIsEncrypted && fileModalPasswordStep === 'input' ? (
               <div className="space-y-4 flex flex-col items-center">
                 {fileModalError && (
                   <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center space-x-2">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     <span>{fileModalError}</span>
                   </div>
                 )}
                 <input
                   type="password"
                   placeholder="파일 암호 입력 (최소 6자)"
                   value={fileModalPassword}
                   onChange={e => setFileModalPassword(e.target.value)}
                   className="w-full px-4 py-3 bg-gray-800 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                 />
                 <button
                   onClick={handlePasswordSubmit}
                   className="w-24 h-10 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-purple-500/20 hover:from-purple-500/30 hover:to-purple-500/30 border border-purple-500/30 hover:border-purple-400/50 text-purple-300 hover:text-purple-200 font-medium rounded-lg transition-all duration-300 flex items-center justify-center"
                 >확인</button>
               </div>
             ) : (
               <div>
                 {fileModalError && (
                   <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center space-x-2 mb-4">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     <span>{fileModalError}</span>
                   </div>
                 )}
                 
                 {fileModalFiles.length === 0 ? (
                   <div className="text-gray-400">첨부된 파일이 없습니다.</div>
                 ) : (
                   <div className="space-y-4">
                     {/* 첫 번째 파일이 .txt 파일이고 내용을 표시하는 경우 */}
                     {fileModalShowText && fileModalFiles.length > 0 && (
                       <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                         <div 
                           className="max-h-32 overflow-y-auto"
                           style={{
                             scrollbarWidth: 'thin',
                             scrollbarColor: '#4B5563 #1F2937'
                           }}
                         >
                           <pre className="text-sm text-gray-300 whitespace-pre-wrap break-words">{fileModalTextContent}</pre>
                           <style jsx>{`
                             div::-webkit-scrollbar {
                               width: 6px;
                             }
                             div::-webkit-scrollbar-track {
                               background: #1F2937;
                               border-radius: 3px;
                             }
                             div::-webkit-scrollbar-thumb {
                               background: #4B5563;
                               border-radius: 3px;
                             }
                             div::-webkit-scrollbar-thumb:hover {
                               background: #6B7280;
                             }
                           `}</style>
                         </div>
                       </div>
                     )}
                     
                     {/* 파일 리스트 */}
                     <ul className="space-y-3 text-base">
                       {fileModalFiles.map((file: any, idx: number) => (
                         // 암호화되지 않은 경우 첫 번째 파일(.txt)은 리스트에서 제외
                         !(!fileModalIsEncrypted && idx === 0) && (
                           <li key={file.cid || idx} className="flex items-center justify-between bg-gray-800 border border-white/10 rounded-lg px-10 py-4">
                             <div className="flex-1 min-w-0 text-white text-base whitespace-nowrap truncate mr-4" title={file.name || file.cid}>{file.name || file.cid}</div>
                             <div className="flex items-center space-x-2">
                               <button
                                 onClick={() => {handleDownloadFile(file); console.log('file', file)}}
                                 className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/30 hover:border-purple-400/50 text-purple-300 hover:text-purple-200 rounded-lg transition-all duration-300 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 text-xs flex items-center"
                               >
                                 <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4" />
                                 </svg>
                                 다운로드
                               </button>
                             </div>
                           </li>
                         )
                       ))}
                     </ul>
                   </div>
                 )}
               </div>
             )}
           </div>
         </div>
       )}

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent animate-pulse">
          Chronos DAO
        </h1>
        <div className="h-1 w-32 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mb-8"></div>

        {/* 내 지갑 주소 + Up 횟수 카드 */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl overflow-hidden shadow-2xl mb-12 w-full">
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8 w-full">
              {/* 내 지갑 주소 (왼쪽) */}
              <div className="flex-1 w-full">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-gray-300 text-sm font-medium">내 지갑 주소</span>
                </div>
                <div className="relative w-full">
                  <span className="block text-base font-mono text-white break-all pl-5 pr-16 bg-black/30 p-5 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300 w-full">
                    {wallets && wallets.find(w => w.isActive)?.address || '지갑이 없습니다'}
                  </span>
                  {wallets && wallets.find(w => w.isActive) && (
                    <button
                      onClick={() => navigator.clipboard.writeText(wallets.find(w => w.isActive)!.address)}
                      className="absolute top-1/2 right-6 -translate-y-1/2 p-2 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-all duration-300"
                      title="주소 복사"
                    >
                      <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {/* 가능한 Up 횟수 (오른쪽) */}
              <div className="flex flex-col items-center justify-center min-w-[180px] mt-8 md:mt-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-base text-cyan-300 font-semibold tracking-wide">보유 토큰</p>
                  <button
                    onClick={fetchBalances}
                    disabled={loadingBalances}
                    className="p-1.5 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="잔액 새로고침"
                  >
                    <svg 
                      className={`w-4 h-4 text-gray-400 hover:text-cyan-400 transition-colors ${loadingBalances ? 'animate-spin' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <p className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">
                  {loadingBalances ? (
                    <span className="text-2xl text-cyan-400"> </span>
                  ) : (
                    <>
                      {tokenBalance.toLocaleString()}<span className="text-lg text-cyan-400 font-bold ml-2">CR</span>
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">(보유 토큰 1CR = Up 1회)</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-lg text-gray-300">데이터를 불러오는 중...</div>
        ) : error ? (
          <div className="text-center py-16 text-lg text-red-400">{error}</div>
        ) : (
          <>
            {/* 상단: 인기 Chronos */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                인기 Chronos
                <button
                  onClick={refreshTopChronos}
                  disabled={loadingTop}
                  className="p-1.5 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="인기 Chronos 새로고침"
                >
                  <svg 
                    className={`w-4 h-4 text-gray-400 hover:text-cyan-400 transition-colors ${loadingTop ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </h2>
              {topChronos.length === 0 ? (
                <div className="text-gray-400">공개된 인기 Chronos가 없습니다.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {topChronos.map((chronos, idx) => {
                    const isMine = !!user && String(chronos.userId) === String(user.uid);
                    const alreadyLiked = chronos.likedByMe;
                    const displayName = chronos.displayName || (chronos.userId?.slice(0, 6) + '...');
                    const createdAtStr = chronos.createdAt ? (new Date(chronos.createdAt.seconds ? chronos.createdAt.seconds * 1000 : chronos.createdAt).toLocaleDateString('ko-KR').replace(/\./g, '.').replace(/\s/g, '')) : '-';
                    const openDateStr = chronos.openDate ? (new Date(chronos.openDate.seconds ? chronos.openDate.seconds * 1000 : chronos.openDate).toLocaleDateString('ko-KR').replace(/\./g, '.').replace(/\s/g, '')) : '-';
                    return (
                      <div 
                        key={chronos.id || idx} 
                        className="relative bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row gap-3 hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => handleViewFiles(chronos.tokenId)}
                      >
                        {/* 왼쪽: 제목, 태그, 설명 */}
                        <div className="flex-1 flex flex-col justify-between">
                          {/* 제목 */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold text-white">{chronos.name}</span>
                          </div>
                          {/* 설명 */}
                          <div className="text-gray-200 text-sm mb-2">{chronos.description}</div>
                          {/* 태그: 카드 하단에 #태그 형태로 표시 */}
                          {Array.isArray(chronos.tags) && chronos.tags.length > 0 && (
                            <div className="text-xs text-cyan-300 mt-2">
                              {chronos.tags.map((tag: string) => `#${tag}`).join(' ')}
                            </div>
                          )}
                        </div>
                        {/* 오른쪽: 닉네임, 날짜 정보, 좋아요 버튼 */}
                        <div className="flex flex-col items-end justify-start min-w-[120px] text-xs text-gray-300 gap-1 md:ml-6">
                          <span
                            className="font-semibold cursor-pointer underline hover:text-cyan-400"
                            title="지갑 주소 보기"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNameClick(chronos.userId);
                            }}
                          >
                            {displayName}
                          </span>
                          <span>생성일: {createdAtStr}</span>
                          <span>오픈일: {openDateStr}</span>
                          <button
                            className="flex items-center gap-1 mt-3 px-2 py-1 rounded-full border-none focus:outline-none transition"
                            disabled={isMine || alreadyLiked}
                            onClick={(e) => {
                              e.stopPropagation();
                              openLikeModal(chronos.id, 'top');
                            }}
                            aria-label="좋아요"
                          >
                            <svg
                              className="w-6 h-6 drop-shadow"
                              fill={alreadyLiked ? '#06b6d4' : '#fff'}
                              stroke="none"
                              strokeWidth="1.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.71,9.29l-7-7a1,1,0,0,0-1.42,0l-7,7a1,1,0,0,0,1.42,1.42L11,5.41V21a1,1,0,0,0,2,0V5.41l5.29,5.3a1,1,0,0,0,1.42,0A1,1,0,0,0,19.71,9.29Z"
                              />
                            </svg>
                            <span className="ml-1 text-base font-semibold text-white">{chronos.likeCount}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 하단: 최신 Chronos */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                최신 Chronos
                <button
                  onClick={refreshLatestChronos}
                  disabled={loadingLatest}
                  className="p-1.5 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="최신 Chronos 새로고침"
                >
                  <svg 
                    className={`w-4 h-4 text-gray-400 hover:text-cyan-400 transition-colors ${loadingLatest ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </h2>
              {latestChronos.length === 0 ? (
                <div className="text-gray-400">공개된 최신 Chronos가 없습니다.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {latestChronos.map((chronos, idx) => {
                    const isMine = !!user && String(chronos.userId) === String(user.uid);
                    const alreadyLiked = chronos.likedByMe;
                    const displayName = chronos.displayName || (chronos.userId?.slice(0, 6) + '...');
                    const createdAtStr = chronos.createdAt ? (new Date(chronos.createdAt.seconds ? chronos.createdAt.seconds * 1000 : chronos.createdAt).toLocaleDateString('ko-KR').replace(/\./g, '.').replace(/\s/g, '')) : '-';
                    const openDateStr = chronos.openDate ? (new Date(chronos.openDate.seconds ? chronos.openDate.seconds * 1000 : chronos.openDate).toLocaleDateString('ko-KR').replace(/\./g, '.').replace(/\s/g, '')) : '-';
                    return (
                      <div 
                        key={chronos.id || idx} 
                        className="relative bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row gap-3 hover:scale-[1.02] transition-transform cursor-pointer"
                        onClick={() => handleViewFiles(chronos.tokenId)}
                      >
                        {/* 왼쪽: 제목, 태그, 설명 */}
                        <div className="flex-1 flex flex-col justify-between">
                          {/* 제목 */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold text-white">{chronos.name}</span>
                          </div>
                          {/* 설명 */}
                          <div className="text-gray-200 text-sm mb-2">{chronos.description}</div>
                          {/* 태그: 카드 하단에 #태그 형태로 표시 */}
                          {Array.isArray(chronos.tags) && chronos.tags.length > 0 && (
                            <div className="text-xs text-cyan-300 mt-2">
                              {chronos.tags.map((tag: string) => `#${tag}`).join(' ')}
                            </div>
                          )}
                        </div>
                        {/* 오른쪽: 닉네임, 날짜 정보, 좋아요 버튼 */}
                        <div className="flex flex-col items-end justify-start min-w-[120px] text-xs text-gray-300 gap-1 md:ml-6">
                          <span
                            className="font-semibold cursor-pointer underline hover:text-cyan-400"
                            title="지갑 주소 보기"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNameClick(chronos.userId);
                            }}
                          >
                            {displayName}
                          </span>
                          <span>생성: {createdAtStr}</span>
                          <span>열림: {openDateStr}</span>
                          <button
                            className="flex items-center gap-1 mt-3 px-2 py-1 rounded-full border-none focus:outline-none transition"
                            disabled={isMine || alreadyLiked}
                            onClick={(e) => {
                              e.stopPropagation();
                              openLikeModal(chronos.id, 'latest');
                            }}
                            aria-label="좋아요"
                          >
                            <svg
                              className="w-6 h-6 drop-shadow"
                              fill={alreadyLiked ? '#06b6d4' : '#fff'}
                              stroke="none"
                              strokeWidth="1.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.71,9.29l-7-7a1,1,0,0,0-1.42,0l-7,7a1,1,0,0,0,1.42,1.42L11,5.41V21a1,1,0,0,0,2,0V5.41l5.29,5.3a1,1,0,0,0,1.42,0A1,1,0,0,0,19.71,9.29Z"
                              />
                            </svg>
                            <span className="ml-1 text-base font-semibold text-white">{chronos.likeCount}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
} 