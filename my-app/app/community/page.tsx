"use client";

import { useState, useEffect } from "react";
import Navigation from "../../components/Navigation";

export default function CommunityPage() {
  const [topChronos, setTopChronos] = useState<any[]>([]);
  const [latestChronos, setLatestChronos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [topRes, latestRes] = await Promise.all([
          fetch("/api/community/top-chronos"),
          fetch("/api/community/latest-chronos")
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
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900 text-white relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      {/* 네비게이션 */}
      <Navigation />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent animate-pulse">
          Community
        </h1>

        {loading ? (
          <div className="text-center py-16 text-lg text-gray-300">데이터를 불러오는 중...</div>
        ) : error ? (
          <div className="text-center py-16 text-lg text-red-400">{error}</div>
        ) : (
          <>
            {/* 상단: 인기 Chronos */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="mr-2">🔥</span>인기 Chronos (Top 5)
              </h2>
              {topChronos.length === 0 ? (
                <div className="text-gray-400">공개된 인기 Chronos가 없습니다.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {topChronos.map((chronos, idx) => (
                    <div key={chronos.id || idx} className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 shadow-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold">{chronos.name}</div>
                        <div className="flex items-center gap-1 text-pink-300 font-semibold">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                          {chronos.likeCount}
                        </div>
                      </div>
                      <div className="text-gray-300 text-sm mb-2">{chronos.description}</div>
                      <div className="text-xs text-gray-400">생성일: {chronos.createdAt ? (new Date(chronos.createdAt.seconds ? chronos.createdAt.seconds * 1000 : chronos.createdAt).toLocaleDateString('ko-KR')) : '-'}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 하단: 최신 Chronos */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <span className="mr-2">🕒</span>최신 Chronos (10개)
              </h2>
              {latestChronos.length === 0 ? (
                <div className="text-gray-400">공개된 최신 Chronos가 없습니다.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {latestChronos.map((chronos, idx) => (
                    <div key={chronos.id || idx} className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 shadow-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold">{chronos.name}</div>
                        <div className="flex items-center gap-1 text-pink-300 font-semibold">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>
                          {chronos.likeCount}
                        </div>
                      </div>
                      <div className="text-gray-300 text-sm mb-2">{chronos.description}</div>
                      <div className="text-xs text-gray-400">생성일: {chronos.createdAt ? (new Date(chronos.createdAt.seconds ? chronos.createdAt.seconds * 1000 : chronos.createdAt).toLocaleDateString('ko-KR')) : '-'}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
} 