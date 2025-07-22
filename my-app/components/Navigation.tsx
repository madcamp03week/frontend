'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    setCachedUserInfo(getCachedUserInfo());
  }, []);

  const isUserLoggedIn = isClient && (user || cachedUserInfo);
  const shouldShowLoading = authLoading && !cachedUserInfo && isClient;

  return (
    <>
      {/*  PC 전용 네비게이션 (기존 그대로 유지) */}
      <nav className="w-full flex justify-between items-center px-10 py-6 relative z-50 hidden md:flex ">
        <Link href="/" className="text-2xl font-bold hover:text-white transition-colors cursor-pointer">
          <span>Chronos</span>
        </Link>
        <div className="space-x-8 text-sm text-gray-300 font-light">
          <Link href="/about">About</Link>
          <Link href="/community">DAO</Link>
          <Link href="/new-chronos">New Chronos</Link>
          <Link href="/my-chronos">My Chronos</Link>
          {isClient && !shouldShowLoading && (
            isUserLoggedIn ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                <button
                  onClick={async () => {
                    try {
                      await logout();
                      if (window.location.pathname === '/') {
                        window.location.reload();
                      } else {
                        router.push('/');
                      }
                    } catch (error) {
                      console.error('로그아웃 중 오류:', error);
                    }
                  }}
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

      {/*  모바일 상단 네비게이션 */}
      <nav className="w-full flex justify-between items-center px-6 py-4 md:hidden  text-white fixed top-0 z-50">
        <Link href="/" className="text-xl font-bold">Chronos</Link>
        <button className="text-3xl" onClick={() => setMenuOpen(true)}>☰</button>
      </nav>

      {/* 오버레이 (모바일 메뉴 열릴 때만) */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/*  모바일 오른쪽 슬라이딩 메뉴 */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-gray-900 text-white z-50 transform transition-transform duration-300 md:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-end p-4">
          <button className="text-white text-2xl" onClick={() => setMenuOpen(false)}>&times;</button>
        </div>
        <nav className="flex flex-col space-y-4 px-6 text-lg">
          <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
          <Link href="/community" onClick={() => setMenuOpen(false)}>DAO</Link>
          <Link href="/new-chronos" onClick={() => setMenuOpen(false)}>New Chronos</Link>
          <Link href="/my-chronos" onClick={() => setMenuOpen(false)}>My Chronos</Link>
          {isClient && !shouldShowLoading && (
            isUserLoggedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <button
                  onClick={async () => {
                    try {
                      await logout();
                      setMenuOpen(false);
                      if (window.location.pathname === '/') {
                        window.location.reload();
                      } else {
                        router.push('/');
                      }
                    } catch (error) {
                      console.error('로그아웃 오류:', error);
                    }
                  }}
                  className="text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)}>Login</Link>
            )
          )}
        </nav>
      </div>

      {/* 본문 내용이 네비게이션에 가려지지 않도록 padding-top 추가 (모바일용) */}
      <div className="block md:hidden h-[64px]" /> {/* 상단 nav 높이만큼 공간 확보 */}
    </>
  );
}
