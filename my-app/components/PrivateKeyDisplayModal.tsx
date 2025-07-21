'use client';

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { decryptPrivateKeyWithPassword } from '../lib/crypto';

interface PrivateKeyDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  userMade: boolean;
  encryptedPrivateKey: string; // userMade=false일 때는 이미 복호화된 키
  walletAddress: string;
}

export default function PrivateKeyDisplayModal({
  isOpen,
  onClose,
  userMade,
  encryptedPrivateKey,
  walletAddress
}: PrivateKeyDisplayModalProps) {
  const [password, setPassword] = useState('');
  const [decryptedKey, setDecryptedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleDecrypt = async () => {
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const decrypted = await decryptPrivateKeyWithPassword(encryptedPrivateKey, password);
      
      // userMade가 true인 경우에만 지갑 주소 검증
      if (userMade) {
        try {
          // 복호화된 private key로 지갑 생성
          const wallet = new ethers.Wallet(decrypted);
          const derivedAddress = wallet.address;
          
          // 지갑 주소 비교 (대소문자 구분 없이)
          if (derivedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            setError('비밀번호가 올바르지 않습니다.');
            setDecryptedKey('');
            return;
          }
        } catch (walletError) {
          console.error('지갑 생성 오류:', walletError);
          setError('비밀번호가 올바르지 않습니다.');
          setDecryptedKey('');
          return;
        }
      }
      
      setDecryptedKey(decrypted);
    } catch (err) {
      setError('비밀번호가 올바르지 않습니다.');
      console.error('복호화 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  const handleClose = () => {
    setPassword('');
    setDecryptedKey('');
    setError('');
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="relative max-w-2xl w-full mx-4 p-1">
        {/* 그라데이션 테두리 */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 p-[3px]">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-indigo-500/40 animate-pulse"></div>
        </div>
        
        {/* 내부 컨테이너 */}
        <div className="relative backdrop-blur-xl bg-gray-800/95 rounded-2xl p-6 border border-gray-700/30 shadow-2xl">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-large text-white">
                  Private Key 확인
                </h3>
                <p className="text-gray-400 text-sm">
                  {userMade ? '사용자 생성 지갑' : '시스템 생성 지갑'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 지갑 주소 */}
          <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600/50">
            <p className="text-gray-400 text-sm mb-2">지갑 주소</p>
            <p className="text-blue-300 font-mono text-sm break-all">{walletAddress}</p>
          </div>

          {/* 설명 */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {userMade 
                    ? '해당 키는 유저에 의해 암호화 되어 비밀번호를 통해 유저의 브라우저에서 복호화 할 수 있습니다.'
                    : '시스템에서 생성된 지갑으로, 서버에서 자동으로 복호화되어 제공됩니다.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Private Key 표시 영역 */}
          {userMade ? (
            // 사용자 생성 지갑: 비밀번호 입력 필요
            <div className="space-y-4">
              {!decryptedKey ? (
                <>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      비밀번호 입력
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="지갑 생성 시 사용한 비밀번호를 입력하세요"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      onKeyPress={(e) => e.key === 'Enter' && handleDecrypt()}
                    />
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}
                  
                  <button
                    onClick={handleDecrypt}
                    disabled={loading || !password.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 border border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 transform"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                        <span>복호화 중...</span>
                      </div>
                    ) : (
                      'Private Key 확인'
                    )}
                  </button>
                </>
              ) : (
                // 복호화된 키 표시
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Private Key (복호화됨)
                    </label>
                    <div className="relative">
                      <div className="p-4 bg-gray-700 border border-gray-600/50 rounded-lg">
                        <p className="text-blue-300 font-mono text-sm break-all">{decryptedKey}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(decryptedKey)}
                        className="absolute top-2 right-2 p-2 bg-gray-600/50 hover:bg-gray-500/50 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
                   ) : (
             // 시스템 생성 지갑: 바로 키 표시 (이미 복호화됨)
             <div className="space-y-4">
               <div>
                 <label className="block text-gray-300 text-sm font-medium mb-2">
                   Private Key (시스템 복호화됨)
                 </label>
                 <div className="relative">
                   <div className="p-4 bg-gray-700 border border-gray-600/50 rounded-lg">
                     <p className="text-blue-300 font-mono text-sm break-all">{encryptedPrivateKey}</p>
                   </div>
                   <button
                     onClick={() => copyToClipboard(encryptedPrivateKey)}
                     className="absolute top-2 right-2 p-2 bg-gray-600/50 hover:bg-gray-500/50 rounded-lg transition-colors"
                   >
                     {copied ? (
                       <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                       </svg>
                     ) : (
                       <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                       </svg>
                     )}
                   </button>
                 </div>
               </div>
             </div>
           )}

          {/* 경고 메시지 */}
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  <strong>보안 경고:</strong> Private Key는 절대 타인과 공유하지 마세요. 본인의 모든 타임캡슐을 잃을 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 