'use client';

import { useState } from 'react';

export default function ApiTestPage() {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testCreateChronos = async () => {
    setLoading(true);
    try {
      const testData = {
        name: '테스트 타임캡슐',
        description: 'API 테스트용 타임캡슐입니다.',

        openDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
        isEncrypted: false,
        isPublic: false,
        tags: '테스트,API',
        enhancedSecurity: false,
        nonTransferable: false,
        userId: 'test-user-123'
      };

      const response = await fetch('/api/chronos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResult(`오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetChronosList = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chronos?userId=test-user-123');
      const result = await response.json();
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResult(`오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetSpecificChronos = async () => {
    setLoading(true);
    try {
      // 먼저 타임캡슐을 생성하고 그 ID로 조회 테스트
      const createResponse = await fetch('/api/chronos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '테스트용 타임캡슐',
          userId: 'test-user-123'
        }),
      });
      
      const createResult = await createResponse.json();
      
      if (createResponse.ok && createResult.chronosId) {
        const response = await fetch(`/api/chronos/${createResult.chronosId}`);
        const result = await response.json();
        setTestResult(JSON.stringify(result, null, 2));
      } else {
        setTestResult('타임캡슐 생성 실패');
      }
    } catch (error) {
      setTestResult(`오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateBlockchainCapsule = async () => {
    setLoading(true);
    try {
      const testData = {
        name: '블록체인 타임캡슐 테스트',
        description: '블록체인 API 테스트용 타임캡슐입니다.',
        openDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
        recipients: [
          '0x38d41fd88833e17970128e91684cC9A0ec47D905',
          '0x07F5aE3b58c04aea68e5C41c2AA0522DE90Ab99D'
        ]
      };

      console.log('전송할 데이터:', JSON.stringify(testData, null, 2));

      const response = await fetch('/api/blockchain/create-capsule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      console.log('API 응답:', result);
      setTestResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('에러:', error);
      setTestResult(`오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">API 테스트 페이지</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testCreateChronos}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg mr-4"
        >
          {loading ? '테스트 중...' : '타임캡슐 생성 테스트'}
        </button>
        
        <button
          onClick={testGetChronosList}
          disabled={loading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg mr-4"
        >
          {loading ? '테스트 중...' : '타임캡슐 목록 조회 테스트'}
        </button>
        
        <button
          onClick={testGetSpecificChronos}
          disabled={loading}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 rounded-lg mr-4"
        >
          {loading ? '테스트 중...' : '특정 타임캡슐 조회 테스트'}
        </button>
        
        <button
          onClick={testCreateBlockchainCapsule}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg"
        >
          {loading ? '테스트 중...' : '블록체인 타임캡슐 생성 테스트'}
        </button>
      </div>

      {testResult && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">테스트 결과:</h2>
          <pre className="text-sm text-gray-300 overflow-auto whitespace-pre-wrap">
            {testResult}
          </pre>
        </div>
      )}
    </div>
  );
} 