'use client';

import { motion } from 'framer-motion';
import MadeForSection from '@/components/MadeForSection'
import SubscribeFooter from '../components/SubscribeFooter';
import CompanyPage from './company/page';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function Home() {
  const { user, loading, logout, userProfile, wallets, hasWallet, dataLoaded } = useAuth();
  const [showUserInfo, setShowUserInfo] = useState(true);
  const router = useRouter();

  // 로그인한 사용자가 지갑이 없으면 자동으로 지갑 설정 페이지로 이동
  useEffect(() => {
    console.log('홈페이지 useEffect 실행:', { 
      user: user ? '있음' : '없음', 
      loading, 
      dataLoaded, 
      hasWallet,
      walletsCount: wallets.length,
      activeWallets: wallets.filter(w => w.isActive).length
    });
    
    if (user && !loading && dataLoaded && !hasWallet) {
      console.log('홈페이지: 사용자가 지갑을 보유하지 않음. 지갑 설정 페이지로 이동합니다.');
      router.push('/wallet-setup');
    }
  }, [user, loading, dataLoaded, hasWallet, router, wallets]);

  // 사용자 로그인 상태 확인
  const isUserLoggedIn = user;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900 text-white font-sans relative overflow-hidden">
      {/* 배경 그라데이션 오브 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      
      {/* 네비게이션 */}
      <Navigation />

      {/* 로그인한 사용자 정보 섹션 */}
      {isUserLoggedIn && showUserInfo && (
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="px-10 py-6 relative"
        >
          {/* 닫기 버튼 */}
          <button
            onClick={() => setShowUserInfo(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            aria-label="사용자 정보 섹션 닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
              <div>
                <h2 className="text-xl font-semibold text-blue-400">
                  Chronos에 오신 것을 환영합니다{userProfile?.displayName ? `, ${userProfile.displayName}님!` : ''}
                </h2>
                {wallets.filter(wallet => wallet.isActive).length > 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    내 지갑:
                    {wallets.filter(wallet => wallet.isActive)[0] && (
                      <span className="ml-2">
                        ({wallets.filter(wallet => wallet.isActive)[0].address.slice(0, 8)}...{wallets.filter(wallet => wallet.isActive)[0].address.slice(-6)})
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex space-x-4">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 border border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 rounded-md text-sm transition-all duration-300 backdrop-blur-sm"
                >
                  대시보드 보기
                </Link>
                {wallets.filter(wallet => wallet.isActive).length > 0 && (
                  <a
                    href={`https://polygonscan.com/address/${wallets.filter(wallet => wallet.isActive)[0].address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 hover:border-purple-400/50 text-purple-300 hover:text-purple-200 rounded-md text-sm transition-all duration-300 backdrop-blur-sm"
                  >
                    Polyscan에서 확인하기
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* 사용자 정보가 숨겨졌을 때 다시 보이게 하는 버튼 */}
      {isUserLoggedIn && !showUserInfo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="px-10 py-2"
        >
          <div className="max-w-6xl mx-auto flex justify-center">
            <button
              onClick={() => setShowUserInfo(true)}
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>사용자 정보 보기</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* 메인 텍스트 */}
      <section className="relative z-10 flex flex-col items-center justify-center mt-28 px-4 text-center">
        <p className="text-lg italic text-gray-300 mb-2">당신의 기억을 영원히</p>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          Blockchain of Memories
        </h1>
        <Link
          href="/new-chronos"
          className="mt-8 inline-block px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg
            bg-gradient-to-r from-cyan-400/60 via-blue-500/60 to-purple-500/60
            hover:from-cyan-400/80 hover:via-blue-500/80 hover:to-purple-500/80
            text-white relative overflow-hidden
            border border-white/40 hover:border-white/60
            backdrop-blur-sm hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25"
        >
          <span className="relative z-10 tracking-wide flex items-center">
        
            Chrons 만들러 가기
          </span>
        </Link>
      </section>
      

{/* 체인 이미지 애니메이션 */}
      <section className="relative z-10 mt-24 relative h-[300px] w-full flex items-center justify-center">
  {/* 왼쪽 체인 */}
  <motion.img
    src="/asset/c2.png"
    alt="Left Chain"
    initial={{ x: '-200%', opacity: 0 }}
    animate={{ 
      x: '-25%', 
      opacity: 1,
    }}
    transition={{ 
      duration: 1.5, 
      ease: 'easeOut'
    }}
    className="absolute w-[600px] max-w-[90vw] z-10 left-1/2 -translate-x-1/2"
  />

  {/* 오른쪽 체인 */}
  <motion.img
    src="/asset/c1.png"
    alt="Right Chain"
    initial={{ x: '200%', opacity: 0 }}
    animate={{ 
      x: '25%', 
      opacity: 1,
    }}
    transition={{ 
      duration: 1.5, 
      ease: 'easeOut',
      delay: 0.3
    }}
    className="absolute w-[600px] max-w-[90vw] z-20 left-1/2 -translate-x-1/2"
  />

  {/* 결합 임팩트 이펙트 */}
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: [0, 1.5, 1],
      opacity: [0, 1, 0.6, 0]
    }}
    transition={{ 
      duration: 1.2, 
      delay: 1.8,
      times: [0, 0.3, 0.7, 1]
    }}
    className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 blur-xl opacity-40 z-5"
  />

  {/* 파티클 효과 */}
  {[...Array(8)].map((_, i) => (
    <motion.div
      key={i}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: [0, 1, 0],
        opacity: [0, 1, 0],
        x: [0, (i - 4) * 50],
        y: [0, -40 + (i % 3) * 30]
      }}
      transition={{ 
        duration: 1.0, 
        delay: 1.8 + (i * 0.1),
        ease: 'easeOut'
      }}
      className="absolute w-3 h-3 bg-blue-400 rounded-full blur-sm z-25"
    />
  ))}
</section>
<br></br><br></br>
<br></br>
<br></br>


<section className="mt-20 px-6 md:px-10 flex flex-col md:flex-row items-center justify-between">
  {/* 좌측: 커뮤니티 텍스트 */}
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    className="text-center md:text-left"
  >
    <p className="text-sm text-gray-300">Join a community</p>
    <h2 className="text-4xl md:text-5xl font-extrabold mt-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-400 to-purple-500">
     DAO
    </h2>
  </motion.div>

  {/* 우측: 숫자 스탯 */}
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 1, delay: 0.3 }}
    className="mt-8 md:mt-0 space-y-8"
  >
    {/* Active Accounts */}
    <div className="text-center md:text-right">
      <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-purple-500">
      10 per account
      </p>
      <p className="uppercase text-xs text-gray-400 mt-1">PER TOKEN</p>
    </div>
    {/* NFTs Minted */}
    <div className="text-center md:text-right">
      <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
        ∞
      </p>
      <p className="uppercase text-xs text-gray-400 mt-1">Token Minted</p>
    </div>
    {/* Avg Cost */}
    <div className="text-center md:text-right">
      <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-green-600">
        0.1 POL per 10 tokens
      </p>
      <p className="uppercase text-xs text-gray-400 mt-1">Exchange ratio</p>
      <br></br>
    </div>
  </motion.div>
</section>
<br></br>
<br></br>
<br></br>
<br></br>

      <MadeForSection />
      {/* 구독 섹션 */}
      <SubscribeFooter />
    </main>
  );
}
