'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import LoginRequired from '../../components/LoginRequired';
import Navigation from '../../components/Navigation';

export default function WalletSetupPage() {
  const [selectedOption, setSelectedOption] = useState<'chronos' | 'own' | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, createNewWallet } = useAuth();

  const handleOptionSelect = (option: 'chronos' | 'own') => {
    setSelectedOption(option);
  };

  useEffect(() => {
    // 로그인 상태 확인
    if (user !== undefined) {
      setIsLoading(false);
    }
  }, [user]);

  const handleContinue = async () => {
    if (!selectedOption) return;
    
    setLoading(true);
    
    try {
      if (selectedOption === 'chronos') {
        // Chronos가 암호화하여 관리하는 방법 - 지갑 생성
        await createNewWallet();
        console.log('Chronos 암호화 방식으로 지갑이 생성되었습니다.');
        // 성공 시 잠시 대기 후 메인 페이지로 이동 (상태 업데이트를 위해)
        setTimeout(() => {
          router.push('/');
        }, 500);
      } else {
        // 본인의 비밀번호로 암호화하는 방법 - 비밀번호 입력 페이지로 이동
        console.log('본인 비밀번호 암호화 방식 선택됨');
        router.push('/wallet-setup/password');
      }
    } catch (error) {
      console.error('지갑 설정 중 오류:', error);
      // 에러 처리 로직 추가 가능
    } finally {
      setLoading(false);
    }
  };

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
      <Navigation />

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-white">
            Private key 암호화 방법을 선택하세요.
          </h1>
          <div className="h-1 w-32 bg-white/30 rounded-full mx-auto mb-6"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* 왼쪽: Chronos가 암호화하여 관리 */}
          <div 
            className={`relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border rounded-3xl p-8 cursor-pointer transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 ${
              selectedOption === 'chronos' 
                ? 'border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-500/5' 
                : 'border-white/20 hover:border-white/30 hover:bg-gradient-to-br from-white/15 to-white/8'
            }`}
            onClick={() => handleOptionSelect('chronos')}
          >
            <div className="absolute top-6 right-6">
              {selectedOption === 'chronos' && (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                Chronos 암호화
              </h3>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                Private key를 Chronos가 암호화하여 관리합니다. 
                이 방법은 추가적인 비밀번호가 필요하지 않아 간편합니다.
              </p>

              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  추가 비밀번호 불필요
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  간편한 사용
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 본인의 비밀번호로 암호화 */}
          <div 
            className={`relative backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border rounded-3xl p-8 cursor-pointer transition-all duration-300 shadow-2xl hover:shadow-green-500/25 ${
              selectedOption === 'own' 
                ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-green-500/5' 
                : 'border-white/20 hover:border-white/30 hover:bg-gradient-to-br from-white/15 to-white/8'
            }`}
            onClick={() => handleOptionSelect('own')}
          >
            <div className="absolute top-6 right-6">
              {selectedOption === 'own' && (
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                본인 비밀번호로 암호화
              </h3>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                Private key를 본인의 비밀번호로 암호화하여 관리합니다. 
                Private key가 본인의 비밀번호로 암호화됩니다.
              </p>

              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  완전한 제어권 보유
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  본인 비밀번호로 암호화
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  높은 보안성
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <button
            onClick={() => router.back()}
            className="px-8 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 hover:border-white/30 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-white/10 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            뒤로 가기
          </button>
          
          <button
            onClick={handleContinue}
            disabled={!selectedOption || loading}
            className="px-8 py-3 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 disabled:from-gray-500/20 disabled:to-gray-600/20 border border-white/20 hover:border-white/30 disabled:border-gray-500/30 text-white rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-white/10 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                처리중...
              </div>
            ) : (
              '계속하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 