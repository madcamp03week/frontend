import { ethers } from 'ethers';
import { CONTRACT_ABI } from './contract-abi';

// 환경 변수에서 설정 가져오기 (클라이언트 사이드용)
// 클라이언트에서는 블록체인 직접 접근하지 않음

// 스마트컨트랙트 ABI

// 클라이언트 사이드에서는 API를 통해 블록체인 연동
export const initializeBlockchain = () => {
  console.log('클라이언트 사이드 블록체인 초기화 - API를 통해 처리됩니다.');
  return true;
};

// 타임캡슐 생성 함수 (통합 API를 통해 처리)
export const createTimeCapsuleOnChain = async (chronosData: {
  name: string;
  description: string;
  openDate: Date | null;
  recipients?: string[];
}) => {
  try {
    // recipients가 없으면 기본값 설정
    const dataToSend = {
      ...chronosData,
      recipients: chronosData.recipients || [
        '0x38d41fd88833e17970128e91684cC9A0ec47D905',
        '0x07F5aE3b58c04aea68e5C41c2AA0522DE90Ab99D'
      ]
    };

    // 통합 API 사용
    const response = await fetch('/api/chronos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: dataToSend.name,
        description: dataToSend.description,
        openDate: dataToSend.openDate,
        content: '', // 빈 내용으로 DB 저장
        isEncrypted: false,
        isPublic: false,
        userId: 'blockchain-only'
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('타임캡슐 생성 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
};

// 타임캡슐 열기 함수 (클라이언트 사이드)
export const openTimeCapsule = async (tokenId: string, firebaseToken: string) => {
  try {
    console.log('🚀 타임캡슐 열기 요청 시작:', { tokenId, hasFirebaseToken: !!firebaseToken });
    
    const response = await fetch(`/api/chronos/${tokenId}/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebaseToken
      }),
    });

    console.log('📡 API 응답 상태:', response.status, response.statusText);
    
    const result = await response.json();
    console.log('📄 API 응답 결과:', result);
    
    return result;
  } catch (error) {
    console.error('❌ 타임캡슐 열기 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
};

// 초기화 실행
if (typeof window !== 'undefined') {
  initializeBlockchain();
} 