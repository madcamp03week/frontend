'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function WalletSetupPage() {
  const [selectedOption, setSelectedOption] = useState<'own' | 'provided' | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { createNewWallet } = useAuth();

  const handleOptionSelect = (option: 'own' | 'provided') => {
    setSelectedOption(option);
  };

  const handleContinue = async () => {
    if (!selectedOption) return;
    
    setLoading(true);
    
    try {
      if (selectedOption === 'provided') {
        // 새로운 지갑 생성
        await createNewWallet();
        console.log('새로운 지갑이 생성되었습니다.');
      } else {
        // 본인의 Private Key 사용 - 여기에 Private Key 입력 로직이 들어갈 예정
        console.log('본인의 Private Key 사용 옵션 선택됨');
        // TODO: Private Key 입력 페이지로 이동하거나 모달 표시
      }
      
      // 성공 시 홈페이지로 이동
      router.push('/');
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
            지갑 생성 방법을 선택해주세요
          </h1>
          <p className="text-gray-400 text-lg">
            폴리곤 지갑을 생성하는 방법을 선택하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* 왼쪽: 본인의 Private Key로 지갑 생성 */}
          <div 
            className={`relative p-8 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
              selectedOption === 'own' 
                ? 'border-blue-500 bg-blue-900 bg-opacity-20' 
                : 'border-gray-600 bg-gray-800 hover:border-gray-500'
            }`}
            onClick={() => handleOptionSelect('own')}
          >
            <div className="absolute top-4 right-4">
              {selectedOption === 'own' && (
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                본인의 Private Key 사용
              </h3>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                기존에 가지고 계신 Private Key를 입력하여 지갑을 생성합니다. 
                이 방법은 완전한 제어권을 가지게 되며, 기존 지갑을 그대로 사용할 수 있습니다.
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
                  기존 지갑 연동 가능
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Private Key 직접 관리
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 우리가 만들어주는 지갑 */}
          <div 
            className={`relative p-8 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
              selectedOption === 'provided' 
                ? 'border-green-500 bg-green-900 bg-opacity-20' 
                : 'border-gray-600 bg-gray-800 hover:border-gray-500'
            }`}
            onClick={() => handleOptionSelect('provided')}
          >
            <div className="absolute top-4 right-4">
              {selectedOption === 'provided' && (
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                새로운 지갑 생성
              </h3>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                안전하게 암호화된 새로운 폴리곤 지갑을 생성해드립니다. 
                Private Key는 암호화되어 안전하게 저장되며, 언제든지 복구할 수 있습니다.
              </p>

              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  간편한 설정
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  안전한 암호화 저장
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  자동 백업 및 복구
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

        {/* 선택된 옵션에 따른 추가 정보 */}
        {selectedOption && (
          <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-600">
            <h4 className="text-lg font-semibold text-white mb-3">
              {selectedOption === 'own' ? '본인의 Private Key 사용' : '새로운 지갑 생성'} 선택됨
            </h4>
            <p className="text-gray-300">
              {selectedOption === 'own' 
                ? '다음 단계에서 Private Key를 입력하시면 기존 지갑을 연동할 수 있습니다. Private Key는 안전하게 암호화되어 저장됩니다.'
                : '다음 단계에서 새로운 폴리곤 지갑이 생성됩니다. Private Key는 자동으로 생성되고 안전하게 암호화되어 저장됩니다.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 