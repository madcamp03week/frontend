"use client";

import { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";
import { useAuth } from '../../contexts/AuthContext';
import WarningModal from "../../components/WarningModal";
import LikeConfirmModal from "../../components/LikeConfirmModal";
import LoginRequired from '../../components/LoginRequired';

export default function CommunityPage() {
  const [topChronos, setTopChronos] = useState<any[]>([]);
  const [latestChronos, setLatestChronos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent animate-pulse">
          Community
        </h1>

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
                <p className="text-base text-cyan-300 mb-2 font-semibold tracking-wide">보유 토큰</p>
                <p className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">
                  {tokenBalance.toLocaleString()}<span className="text-lg text-cyan-400 font-bold ml-2">CR</span>
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
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                인기 Chronos
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
                      <div key={chronos.id || idx} className="relative bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row gap-3 hover:scale-[1.02] transition-transform">
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
                            onClick={() => handleNameClick(chronos.userId)}
                          >
                            {displayName}
                          </span>
                          <span>생성일: {createdAtStr}</span>
                          <span>오픈일: {openDateStr}</span>
                          <button
                            className="flex items-center gap-1 mt-3 px-2 py-1 rounded-full border-none focus:outline-none transition"
                            disabled={isMine || alreadyLiked}
                            onClick={() => openLikeModal(chronos.id, 'top')}
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
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                최신 Chronos
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
                      <div key={chronos.id || idx} className="relative bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row gap-3 hover:scale-[1.02] transition-transform">
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
                            onClick={() => handleNameClick(chronos.userId)}
                          >
                            {displayName}
                          </span>
                          <span>생성: {createdAtStr}</span>
                          <span>열림: {openDateStr}</span>
                          <button
                            className="flex items-center gap-1 mt-3 px-2 py-1 rounded-full border-none focus:outline-none transition"
                            disabled={isMine || alreadyLiked}
                            onClick={() => openLikeModal(chronos.id, 'latest')}
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