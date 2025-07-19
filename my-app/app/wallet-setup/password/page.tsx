'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

export default function WalletPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { createNewWalletWithPassword } = useAuth();

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
      
      // 성공 시 홈페이지로 이동
      router.push('/');
    } catch (error) {
      console.error('지갑 생성 중 오류:', error);
      setError('지갑 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white mb-4">
            암호화 비밀번호 설정
          </h1>
          <p className="text-gray-400 text-lg">
            Private Key를 암호화할 비밀번호를 설정해주세요
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 bg-gray-800 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 bg-gray-800 placeholder-gray-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              뒤로 가기
            </button>
            
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
            >
              {loading ? '처리중...' : '지갑 생성'}
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-600">
          <h4 className="text-sm font-semibold text-white mb-2">
            ⚠️ 중요 안내
          </h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• 이 비밀번호는 Private Key를 복호화하는 데 사용됩니다.</li>
            <li>• 비밀번호를 잊어버리면 지갑에 접근할 수 없습니다.</li>
            <li>• 안전한 비밀번호를 사용하고 안전한 곳에 보관하세요.</li>
            <li>• 비밀번호는 복구할 수 없으니 주의하세요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 