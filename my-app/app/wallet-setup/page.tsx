'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function WalletSetupPage() {
  const [selectedOption, setSelectedOption] = useState<'chronos' | 'own' | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { createNewWallet } = useAuth();

  const handleOptionSelect = (option: 'chronos' | 'own') => {
    setSelectedOption(option);
  };

  const handleContinue = async () => {
    if (!selectedOption) return;
    
    setLoading(true);
    
    try {
      if (selectedOption === 'chronos') {
        // Chronos가 암호화하여 관리하는 방법 - 지갑 생성
        await createNewWallet();
        console.log('Chronos 암호화 방식으로 지갑이 생성되었습니다.');
        // 성공 시 홈페이지로 이동
        router.push('/');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white mb-4">
            Private key 암호화 방법을 선택해 주세요
          </h1>
          <p className="text-gray-400 text-lg">
            Private Key를 안전하게 관리하는 방법을 선택하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* 왼쪽: Chronos가 암호화하여 관리 */}
          <div 
            className={`relative p-8 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
              selectedOption === 'chronos' 
                ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                : 'border-gray-600 bg-gray-800 hover:border-gray-500'
            }`}
            onClick={() => handleOptionSelect('chronos')}
          >
            <div className="absolute top-4 right-4">
              {selectedOption === 'chronos' && (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  추가 비밀번호 불필요
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  간편한 사용
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 본인의 비밀번호로 암호화 */}
          <div 
            className={`relative p-8 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
              selectedOption === 'own' 
                ? 'border-green-500 bg-green-900 bg-opacity-20' 
                : 'border-gray-600 bg-gray-800 hover:border-gray-500'
            }`}
            onClick={() => handleOptionSelect('own')}
          >
            <div className="absolute top-4 right-4">
              {selectedOption === 'own' && (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  완전한 제어권 보유
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  본인 비밀번호로 암호화
                </div>
                <div className="flex items-center">
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
            className="px-8 py-3 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            뒤로 가기
          </button>
          
          <button
            onClick={handleContinue}
            disabled={!selectedOption || loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
          >
            {loading ? '처리중...' : '계속하기'}
          </button>
        </div>
      </div>
    </div>
  );
} 