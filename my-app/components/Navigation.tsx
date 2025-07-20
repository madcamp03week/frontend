'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

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

export default function Navigation() {
  const { user, logout, loading: authLoading } = useAuth();
  const [cachedUserInfo, setCachedUserInfo] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드 렌더링 확인
  useEffect(() => {
    setIsClient(true);
    setCachedUserInfo(getCachedUserInfo());
  }, []);

  // 사용자 로그인 상태 확인 (캐시된 정보 우선 사용)
  const isUserLoggedIn = user || cachedUserInfo;
  const shouldShowLoading = authLoading && !cachedUserInfo && isClient;

  return (
    <nav className="w-full flex justify-between items-center px-10 py-6 relative z-50">
      <Link href="/" className="text-2xl font-bold hover:text-white transition-colors cursor-pointer">
        <span>Chronos</span>
      </Link>
      <div className="space-x-8 text-sm text-gray-300 font-light">
        <Link href="/company">Company</Link>
        <Link href="/product">Product</Link>
        <Link href="/new-chronos">New Chronos</Link>
        <Link href="/my-chronos">My Chronos</Link>
        {isClient && !shouldShowLoading && (
          isUserLoggedIn ? (
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
  );
} 