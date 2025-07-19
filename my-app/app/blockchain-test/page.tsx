'use client';

import { useState } from 'react';
import { 
  initializeBlockchain, 
  createTimeCapsuleOnChain, 
  checkServiceWalletConnection,
  getNetworkInfo,
  getServiceWalletInfo
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
  const [walletAddress, setWalletAddress] = useState('');
  const [networkInfo, setNetworkInfo] = useState('');
  const [serviceWalletInfo, setServiceWalletInfo] = useState('');

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
        isPublic: false
      };

      const result = await createTimeCapsuleOnChain(testData);
      setTestResult(safeStringify(result));
    } catch (error) {
      setTestResult(`오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testConnectWallet = async () => {
    setLoading(true);
    try {
      const result = await checkServiceWalletConnection();
      if (result.success && result.wallet?.address) {
        setWalletAddress(result.wallet.address);
        setTestResult(`서비스 지갑 연결 확인: ${result.wallet.address}`);
      } else {
        setTestResult(`서비스 지갑 연결 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      setTestResult(`오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetNetworkInfo = async () => {
    setLoading(true);
    try {
      const result = await getNetworkInfo();
      if (result.success) {
        setNetworkInfo(safeStringify(result.network));
        setTestResult(safeStringify(result));
      } else {
        setTestResult(`네트워크 정보 조회 실패: ${result.error}`);
      }
    } catch (error) {
      setTestResult(`오류: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetServiceWalletInfo = async () => {
    setLoading(true);
    try {
      const result = await getServiceWalletInfo();
      if (result.success) {
        setServiceWalletInfo(safeStringify(result.wallet));
        setTestResult(safeStringify(result));
      } else {
        setTestResult(`서비스 지갑 정보 조회 실패: ${result.error}`);
      }
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

      // 2. 네트워크 정보 조회
      const networkResult = await getNetworkInfo();
      
      // 3. 타임캡슐 생성
      const createResult = await createTimeCapsuleOnChain({
        name: '전체 플로우 테스트',
        description: 'DB + 블록체인 연동 테스트',
        openDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isPublic: true
      });

      setTestResult(safeStringify({
        initialization: initResult,
        network: networkResult,
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
          
          <button
            onClick={testConnectWallet}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg"
          >
            {loading ? '테스트 중...' : '서비스 지갑 연결 확인'}
          </button>
          
          <button
            onClick={testGetNetworkInfo}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg"
          >
            {loading ? '테스트 중...' : '네트워크 정보'}
          </button>
          
          <button
            onClick={testGetServiceWalletInfo}
            disabled={loading}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg"
          >
            {loading ? '테스트 중...' : '서비스 지갑 정보'}
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

      {walletAddress && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-2">서비스 지갑 주소:</h3>
          <p className="text-sm text-gray-300 break-all">{walletAddress}</p>
        </div>
      )}

      {networkInfo && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-2">네트워크 정보:</h3>
          <pre className="text-sm text-gray-300 overflow-auto whitespace-pre-wrap">
            {networkInfo}
          </pre>
        </div>
      )}

      {serviceWalletInfo && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-2">서비스 지갑 정보:</h3>
          <pre className="text-sm text-gray-300 overflow-auto whitespace-pre-wrap">
            {serviceWalletInfo}
          </pre>
        </div>
      )}

      {testResult && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">테스트 결과:</h2>
          <pre className="text-sm text-gray-300 overflow-auto whitespace-pre-wrap">
            {testResult}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-900 border border-blue-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">설정 필요사항:</h3>
        <ul className="text-sm space-y-1">
          <li>• .env.local 파일에 Infura URL 설정</li>
          <li>• 스마트컨트랙트 주소 설정</li>
          <li>• 서비스 지갑 주소와 개인키 설정</li>
          <li>• ethers 패키지 설치: npm install ethers@6.9.0</li>
        </ul>
      </div>
    </div>
  );
} 