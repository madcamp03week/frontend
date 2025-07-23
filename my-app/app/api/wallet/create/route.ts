import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { encryptPrivateKey } from '../../../../lib/crypto';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { mintChronosToken } from '../../../../lib/blockchain/contract-service';

// 백엔드에서 지갑 생성 및 서버 키로 암호화하는 API
export async function POST(request: NextRequest) {
  try {
    // 1. Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // 'Bearer ' 제거

    // 2. Firebase 토큰 검증
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('토큰 검증 실패:', error);
      return NextResponse.json(
        { error: '유효하지 않은 인증 토큰입니다.' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // 3. 요청 본문 파싱
    const body = await request.json();
    const { network = 'polygon', label = '기본 지갑' } = body;

    // 4. 새로운 지갑 생성 (백엔드에서)
    const newWallet = ethers.Wallet.createRandom();
    
    // 5. Private Key를 서버 키로 암호화
    const encryptedPrivateKey = await encryptPrivateKey(newWallet.privateKey);

    // 6. 기존 활성 지갑들을 비활성화
    const walletsRef = adminDb.collection('wallets');
    const activeWalletsQuery = await walletsRef
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const batch = adminDb.batch();
    activeWalletsQuery.docs.forEach((doc: any) => {
      batch.update(doc.ref, { isActive: false });
    });

    // 7. 새 지갑 정보를 Firestore에 저장
    const newWalletData = {
      userId,
      address: newWallet.address,
      encryptedPrivateKey,
      network,
      isActive: true,
      label,
      userMade: false, // 백엔드에서 생성
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newWalletRef = walletsRef.doc();
    batch.set(newWalletRef, newWalletData);

    // 8. 모든 변경사항을 한 번에 커밋
    await batch.commit();

    // 8-1. 지갑 생성 후 10 토큰 자동 민팅
    const mintAmount = ethers.parseUnits('15', 18); // 10 토큰을 18자리 소수점으로 변환
    mintChronosToken(newWallet.address, mintAmount)
      .then((result) => {
        if (!result.success) {
          console.error('토큰 민팅 실패:', result.error);
        } else {
          console.log('토큰 민팅 성공:', result.txHash);
        }
      })
      .catch((err) => {
        console.error('토큰 민팅 예외:', err);
      });

    // 9. 성공 응답
    return NextResponse.json({
      success: true,
      message: '지갑이 성공적으로 생성되었습니다.',
      data: {
        id: newWalletRef.id,
        address: newWallet.address,
        network,
        isActive: true, // isActive 필드 추가
        label,
        userMade: false,
        createdAt: newWalletData.createdAt,
        updatedAt: newWalletData.updatedAt
      }
    });

  } catch (error) {
    console.error('지갑 생성 오류:', error);
    return NextResponse.json(
      { error: '지갑 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET 요청은 지원하지 않음
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'GET 요청은 지원하지 않습니다. POST 요청을 사용해주세요.' },
    { status: 405 }
  );
} 