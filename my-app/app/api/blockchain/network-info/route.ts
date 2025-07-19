import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// 환경 변수에서 설정 가져오기 (서버 사이드)
const INFURA_URL = process.env.INFURA_URL;

// 네트워크 정보 조회 API
export async function GET() {
  try {
    // 환경 변수 검증
    if (!INFURA_URL || INFURA_URL.includes('YOUR_PROJECT_ID')) {
      return NextResponse.json({
        success: false,
        error: 'Infura URL이 올바르게 설정되지 않았습니다. (INFURA_URL 환경 변수 확인 필요)'
      }, { status: 500 });
    }

    // Provider 초기화
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    
    // 네트워크 정보 조회
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    return NextResponse.json({
      success: true,
      network: {
        name: network.name,
        chainId: Number(network.chainId), // BigInt를 Number로 변환
        blockNumber: Number(blockNumber), // BigInt를 Number로 변환
        infuraUrl: INFURA_URL.replace(/\/v3\/[^\/]+/, '/v3/***') // 프로젝트 ID 숨김
      }
    });

  } catch (error) {
    console.error('네트워크 정보 조회 실패:', error);
    
    // 구체적인 오류 메시지 제공
    let errorMessage = '알 수 없는 오류';
    
    if (error instanceof Error) {
      if (error.message.includes('invalid project id')) {
        errorMessage = '잘못된 Infura 프로젝트 ID입니다.';
      } else if (error.message.includes('network')) {
        errorMessage = '네트워크 연결 오류입니다.';
      } else if (error.message.includes('timeout')) {
        errorMessage = '네트워크 연결 시간 초과입니다.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
} 