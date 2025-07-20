'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import LoginRequired from '../../../components/LoginRequired';

export default function WalletPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, createNewWalletWithPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 비밀번호로 암호화하는 지갑 생성
      await createNewWalletWithPassword(password);
      console.log('비밀번호로 암호화된 지갑이 생성되었습니다.');
      
      // 성공 시 잠시 대기 후 메인 페이지로 이동 (상태 업데이트를 위해)
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (error) {
      console.error('지갑 생성 중 오류:', error);
      setError('지갑 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 로그인 상태 확인
    if (user !== undefined) {
      setIsLoading(false);
    }
  }, [user]);

  // 로딩 중이거나 로그인되지 않은 경우
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900 text-white relative overflow-hidden flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // 로그인되지 않은 경우
  if (!user) {
    return <LoginRequired />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900 text-white relative overflow-hidden">
      {/* 배경 그라데이션 오브 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      
      {/* 네비게이션 */}
      <nav className="w-full flex justify-between items-center px-10 py-6">
        <Link href="/">
          <div className="text-2xl font-bold">
            Chronos
          </div>
        </Link>
        <div className="space-x-8 text-sm text-gray-300 font-light">
          <Link href="/company">Company</Link>
          <Link href="/product">Product</Link>
          <Link href="/new-chronos">New Chronos</Link>
          <Link href="/my-chronos">My Chronos</Link>
          {user ? (
            <Link href="/dashboard">Dashboard</Link>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-white">
            암호화 비밀번호 설정
          </h1>
          <div className="h-1 w-32 bg-white/30 rounded-full mx-auto mb-6"></div>
          <p className="text-gray-300 text-lg">
            Private Key를 암호화할 비밀번호를 설정해주세요
          </p>
        </div>

        {/* 폼 카드 */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-white/20 bg-white/10 placeholder-gray-400 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 sm:text-sm backdrop-blur-sm"
                  placeholder="비밀번호를 입력하세요 (최소 6자)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-white/20 bg-white/10 placeholder-gray-400 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 sm:text-sm backdrop-blur-sm"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-8 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-white/10 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                뒤로 가기
              </button>
              
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="flex-1 px-8 py-3 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 disabled:from-gray-500/20 disabled:to-gray-600/20 border border-white/20 hover:border-white/30 disabled:border-gray-500/30 text-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-white/10 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    처리중...
                  </div>
                ) : (
                  '지갑 생성'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 중요 안내 카드 */}
        <div className="mt-8 backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-3xl p-6 shadow-2xl">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="text-yellow-400 mr-2">⚠️</span>
            중요 안내
          </h4>
          <ul className="text-sm text-gray-300 space-y-2">
            <li className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              이 비밀번호는 Private Key를 복호화하는 데 사용됩니다.
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              비밀번호를 잊어버리면 지갑에 접근할 수 없습니다.
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              안전한 비밀번호를 사용하고 안전한 곳에 보관하세요.
            </li>
            <li className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              비밀번호는 복구할 수 없으니 주의하세요.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 