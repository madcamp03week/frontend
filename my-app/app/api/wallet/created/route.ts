import { NextRequest, NextResponse } from 'next/server';
import { mintChronosToken } from '../../../../lib/blockchain/contract-service';
import { adminDb } from '../../../../lib/firebase-admin';

// 한 유저당 1회만 민팅 허용
export async function POST(req: NextRequest) {
  try {
    const { address, userId } = await req.json();
    if (!address || !userId) {
      return NextResponse.json({ success: false, error: 'address와 userId가 필요합니다.' }, { status: 400 });
    }

    // 민팅 실행 (10 토큰)
    const mintAmount = BigInt('15000000000000000000'); // 10 * 10^18
    const result = await mintChronosToken(address, mintAmount);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, txHash: result.txHash, blockNumber: result.blockNumber });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || '알 수 없는 오류' }, { status: 500 });
  }
} 