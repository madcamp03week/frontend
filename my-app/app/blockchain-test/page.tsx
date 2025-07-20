'use client';

import { useState } from 'react';
import { 
  initializeBlockchain, 
  createTimeCapsuleOnChain
} from '../../lib/blockchain';

// BigInt를 안전하게 JSON으로 변환하는 함수
const safeStringify = (obj: any) => {
  return JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2);
};

export default function BlockchainTestPage() {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testInitializeBlockchain = async () => {
    setLoading(true);
    try {
      const result = initializeBlockchain();
      setTestResult(`블록체인 초기화: ${result ? '성공' : '실패'}`);
    } catch (error) {
      setTestResult(`오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateTimeCapsule = async () => {
    setLoading(true);
    try {
      const testData = {
        name: '블록체인 테스트 타임캡슐',
        description: '블록체인에 저장되는 타임캡슐입니다.',
        openDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        recipients: [
          '0x38d41fd88833e17970128e91684cC9A0ec47D905',
          '0x07F5aE3b58c04aea68e5C41c2AA0522DE90Ab99D'
        ]
      };

      const result = await createTimeCapsuleOnChain(testData);
      setTestResult(safeStringify(result));
    } catch (error) {
      setTestResult(`오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testFullFlow = async () => {
    setLoading(true);
    try {
      // 1. 블록체인 초기화
      const initResult = initializeBlockchain();
      if (!initResult) {
        setTestResult('블록체인 초기화 실패');
        return;
      }

      // 2. 타임캡슐 생성
      const createResult = await createTimeCapsuleOnChain({
        name: '전체 플로우 테스트',
        description: 'DB + 블록체인 연동 테스트',
        openDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        recipients: [
          '0x38d41fd88833e17970128e91684cC9A0ec47D905',
          '0x07F5aE3b58c04aea68e5C41c2AA0522DE90Ab99D'
        ]
      });

      setTestResult(safeStringify({
        initialization: initResult,
        blockchain: createResult
      }));
    } catch (error) {
      setTestResult(`오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">블록체인 테스트 페이지</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">기본 테스트</h2>
          
          <button
            onClick={testInitializeBlockchain}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
          >
            {loading ? '테스트 중...' : '블록체인 초기화'}
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">타임캡슐 테스트</h2>
          
          <button
            onClick={testCreateTimeCapsule}
            disabled={loading}
            className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 rounded-lg"
          >
            {loading ? '테스트 중...' : '타임캡슐 생성'}
          </button>
          
          <button
            onClick={testFullFlow}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg"
          >
            {loading ? '테스트 중...' : '전체 플로우 테스트'}
          </button>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">테스트 결과</h2>
        <pre className="text-sm text-green-400 overflow-auto max-h-96">
          {testResult || '테스트를 실행해보세요.'}
        </pre>
      </div>
    </div>
  );
} 