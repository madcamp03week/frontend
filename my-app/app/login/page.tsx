'use client';

import { useState } from 'react';
import { 
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../../components/Navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { signUp, signIn, shouldRedirectToWalletSetup, setShouldRedirectToWalletSetup, user, hasWallet, loading: authLoading, dataLoaded } = useAuth();

  // 로그인한 사용자가 이미 로그인되어 있으면 적절한 페이지로 리다이렉트
  useEffect(() => {
    if (user && !authLoading && dataLoaded) {
      if (!hasWallet) {
        console.log('로그인 페이지: 사용자가 지갑을 보유하지 않음. 지갑 설정 페이지로 이동합니다.');
        router.push('/wallet-setup');
      } else {
        console.log('로그인 페이지: 이미 로그인된 사용자. 메인 페이지로 이동합니다.');
        router.push('/');
      }
    }
  }, [user, authLoading, dataLoaded, hasWallet, router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await signUp(email, password);
        // 회원가입 성공 시 바로 지갑 설정 페이지로 이동
        router.push('/wallet-setup');
      } else {
        await signIn(email, password);
        router.push('/'); // 로그인 성공 시 홈페이지로 이동
      }
    } catch (error: any) {
      console.error('로그인 오류:', error);
      // 한국어 에러 메시지
      let errorMessage = '';
      switch (error.code) {
        case 'auth/configuration-not-found':
          errorMessage = 'Firebase 설정에 문제가 있습니다. 관리자에게 문의해주세요.';
          break;
        case 'auth/user-not-found':
          errorMessage = '등록되지 않은 이메일입니다.';
          break;
        case 'auth/wrong-password':
          errorMessage = '비밀번호가 올바르지 않습니다.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = '이미 사용 중인 이메일입니다.';
          break;
        case 'auth/weak-password':
          errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
          break;
        case 'auth/invalid-email':
          errorMessage = '올바른 이메일 형식이 아닙니다.';
          break;
        case 'auth/too-many-requests':
          errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
          break;
        case 'auth/user-disabled':
          errorMessage = '비활성화된 계정입니다. 관리자에게 문의해주세요.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = '이 로그인 방법이 허용되지 않습니다.';
          break;
        case 'auth/network-request-failed':
          errorMessage = '네트워크 연결을 확인해주세요.';
          break;
        case 'auth/invalid-credential':
          errorMessage = '잘못된 인증 정보입니다.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = '보안을 위해 다시 로그인해주세요.';
          break;
        default:
          errorMessage = '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // OAuth 로그인 성공 후 사용자 프로필 확인 및 생성
      if (result.user) {
        console.log('Google 로그인 성공:', result.user.uid);
        // AuthContext의 onAuthStateChanged에서 자동으로 프로필을 생성하므로
        // 잠시 기다린 후 리다이렉트
        setTimeout(() => {
          if (shouldRedirectToWalletSetup) {
            setShouldRedirectToWalletSetup(false);
            router.push('/wallet-setup');
          } else {
            router.push('/'); // 기존 사용자는 홈페이지로 이동
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('Google 로그인 오류:', error);
      // 한국어 에러 메시지
      let errorMessage = '';
      switch (error.code) {
        case 'auth/configuration-not-found':
          errorMessage = 'Firebase 설정에 문제가 있습니다. 관리자에게 문의해주세요.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = '로그인 창이 닫혔습니다. 다시 시도해주세요.';
          break;
        case 'auth/popup-blocked':
          errorMessage = '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = '이미 다른 방법으로 가입된 계정입니다.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = '로그인 요청이 취소되었습니다.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = '허용되지 않은 도메인입니다.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google 로그인이 허용되지 않습니다.';
          break;
        case 'auth/network-request-failed':
          errorMessage = '네트워크 연결을 확인해주세요.';
          break;
        default:
          errorMessage = 'Google 로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // OAuth 로그인 성공 후 사용자 프로필 확인 및 생성
      if (result.user) {
        console.log('GitHub 로그인 성공:', result.user.uid);
        // AuthContext의 onAuthStateChanged에서 자동으로 프로필을 생성하므로
        // 잠시 기다린 후 리다이렉트
        setTimeout(() => {
          if (shouldRedirectToWalletSetup) {
            setShouldRedirectToWalletSetup(false);
            router.push('/wallet-setup');
          } else {
            router.push('/'); // 기존 사용자는 홈페이지로 이동
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error('GitHub 로그인 오류:', error);
      // 한국어 에러 메시지
      let errorMessage = '';
      switch (error.code) {
        case 'auth/configuration-not-found':
          errorMessage = 'Firebase 설정에 문제가 있습니다. 관리자에게 문의해주세요.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = '로그인 창이 닫혔습니다. 다시 시도해주세요.';
          break;
        case 'auth/popup-blocked':
          errorMessage = '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = '이미 다른 방법으로 가입된 계정입니다.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = '로그인 요청이 취소되었습니다.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = '허용되지 않은 도메인입니다.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'GitHub 로그인이 허용되지 않습니다.';
          break;
        case 'auth/network-request-failed':
          errorMessage = '네트워크 연결을 확인해주세요.';
          break;
        case 'auth/oauth-provider-error':
          errorMessage = 'GitHub 인증 서비스에 문제가 있습니다.';
          break;
        default:
          errorMessage = 'GitHub 로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900 text-white relative overflow-hidden">
      {/* 배경 그라데이션 오브 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      
      {/* 네비게이션 */}
      <Navigation />

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4 sm:px-6 lg:px-8">
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-white">
              {isSignUp ? '회원가입' : '로그인'}
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-white/60 to-white/30 rounded-full mx-auto"></div>
          </div>
          
          <form className="space-y-6" onSubmit={handleEmailAuth}>
            <div className="space-y-4">
              <div>
                <div className="mb-3">
                  <label htmlFor="email-address" className="block text-sm font-medium text-white">
                    이메일 주소
                  </label>
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50 text-white placeholder-gray-400 transition-all duration-300 ${
                    error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <div className="mb-3">
                  <label htmlFor="password" className="block text-sm font-medium text-white">
                    비밀번호
                  </label>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-gray-400 transition-all duration-300 ${
                    error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="backdrop-blur-xl bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 disabled:from-gray-500/20 disabled:to-gray-600/20 text-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-white/10 font-medium border border-white/20 hover:border-white/30 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    처리중...
                  </div>
                ) : (
                  isSignUp ? '회원가입' : '로그인'
                )}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-400">또는</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-white/10"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 {isSignUp ? '회원가입' : '로그인'}
              </button>
              
              <button
                type="button"
                onClick={handleGitHubSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-white/10"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub로 {isSignUp ? '회원가입' : '로그인'}
              </button>
            </div>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-gray-400 hover:text-white transition-colors duration-300"
              >
                {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 