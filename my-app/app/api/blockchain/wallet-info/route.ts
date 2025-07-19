import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// 환경 변수에서 설정 가져오기 (서버 사이드)
const INFURA_URL = process.env.INFURA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

console.log('PRIVATE_KEY:', PRIVATE_KEY);
console.log('INFURA_URL:', INFURA_URL);

// 서비스 지갑 정보 조회 API
export async function GET() {
  try {
    // 환경 변수 검증
    if (!PRIVATE_KEY) {
      return NextResponse.json({
        success: false,
        error: '서비스 지갑 개인키가 설정되지 않았습니다. (PRIVATE_KEY 환경 변수 확인 필요)'
      }, { status: 500 });
    }

    if (!INFURA_URL) {
      return NextResponse.json({
        success: false,
        error: 'Infura URL이 올바르게 설정되지 않았습니다. (INFURA_URL 환경 변수 확인 필요)'
      }, { status: 500 });
    }

    // Provider 초기화
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    
    // 네트워크 연결 테스트
    try {
      await provider.getNetwork();
    } catch (networkError) {
      return NextResponse.json({
        success: false,
        error: `네트워크 연결 실패: ${networkError instanceof Error ? networkError.message : '알 수 없는 네트워크 오류'}`
      }, { status: 500 });
    }
    
    // 서비스 지갑 초기화
    const serviceWallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log('serviceWallet:', serviceWallet);
    // 지갑 잔액 확인
    const balance = await provider.getBalance(serviceWallet.address);
    console.log('balance:', balance);
    
    return NextResponse.json({
      success: true,
      wallet: {
        address: serviceWallet.address,
        isConnected: true,
        balance: ethers.formatEther(balance),
        message: '서비스 지갑이 연결되어 있습니다.'
      }
    });

  } catch (error) {
    console.error('서비스 지갑 정보 조회 실패:', error);
    
    // 구체적인 오류 메시지 제공
    let errorMessage = '알 수 없는 오류';
    
    if (error instanceof Error) {
      if (error.message.includes('invalid project id')) {
        errorMessage = '잘못된 Infura 프로젝트 ID입니다.';
      } else if (error.message.includes('invalid private key')) {
        errorMessage = '잘못된 개인키 형식입니다.';
      } else if (error.message.includes('network')) {
        errorMessage = '네트워크 연결 오류입니다.';
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