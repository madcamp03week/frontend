import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '../../../../lib/contract-abi';

// 환경 변수에서 설정 가져오기 (서버 사이드)
const INFURA_URL = process.env.INFURA_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// 타임캡슐 생성 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, openDate, isPublic } = body;

    if (!PRIVATE_KEY) {
      return NextResponse.json({
        success: false,
        error: '서비스 지갑 개인키가 설정되지 않았습니다.'
      }, { status: 500 });
    }

    if (!CONTRACT_ADDRESS) {
      return NextResponse.json({
        success: false,
        error: '스마트컨트랙트 주소가 설정되지 않았습니다.'
      }, { status: 500 });
    }

    // Provider 초기화
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    
    // 서비스 지갑 초기화
    const serviceWallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // 컨트랙트 인스턴스 생성
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      serviceWallet
    );

    // openDate를 Unix timestamp로 변환
    const openDateTimestamp = openDate 
      ? Math.floor(new Date(openDate).getTime() / 1000)
      : 0;

    // 스마트컨트랙트 함수 호출
    const tx = await contract.createTimeCapsule(
      name,
      description,
      openDateTimestamp,
      isPublic
    );

    // 트랜잭션 완료 대기
    const receipt = await tx.wait();
    
    console.log('타임캡슐 생성 트랜잭션 완료:', receipt.hash);
    
    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber)
    });

  } catch (error) {
    console.error('타임캡슐 생성 실패:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 