'use client';

import { useState } from 'react';

export default function WalletTestPage() {
  const [userId, setUserId] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testPrivateKeyAPI = async () => {
    if (!userId || !walletAddress) {
      setError('사용자 ID와 지갑 주소를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 실제 구현에서는 클라이언트에서 지갑 정보를 가져와야 합니다
      // 여기서는 테스트용 더미 데이터를 사용합니다
      const response = await fetch('/api/wallet/private-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletData: {
            address: walletAddress,
            encryptedPrivateKey: 'dummy-encrypted-key-for-testing',
            userMade: false, // 테스트용
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'API 호출에 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('API 호출 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const testGetAPI = async () => {
    setError('GET 요청은 보안상 지원하지 않습니다. POST 요청을 사용해주세요.');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Wallet Private Key API 테스트</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API 테스트</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자 ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="사용자 ID를 입력하세요"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지갑 주소
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="지갑 주소를 입력하세요"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={testPrivateKeyAPI}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '로딩 중...' : 'POST 요청 테스트'}
              </button>
              
              <button
                onClick={testGetAPI}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '로딩 중...' : 'GET 요청 테스트'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium">오류</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-medium">API 응답</h3>
            <div className="mt-2">
              <h4 className="text-sm font-medium text-gray-700 mb-2">응답 데이터:</h4>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
            
            {result.data && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Private Key 정보:</h4>
                <div className="bg-white p-4 rounded-md border">
                  <p><strong>User Made:</strong> {result.data.userMade ? '사용자 생성' : '시스템 생성'}</p>
                  <p><strong>Private Key:</strong></p>
                  <div className="bg-gray-100 p-2 rounded text-sm font-mono break-all">
                    {result.data.privateKey}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="text-blue-800 font-medium mb-2">API 사용법</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p><strong>POST 요청:</strong> /api/wallet/private-key</p>
            <p><strong>GET 요청:</strong> /api/wallet/private-key?userId=xxx&walletAddress=xxx</p>
            <p><strong>응답:</strong> userMade가 false이면 복호화된 private key, true이면 암호화된 private key</p>
          </div>
        </div>
      </div>
    </div>
  );
} 