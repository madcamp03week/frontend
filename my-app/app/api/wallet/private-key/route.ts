import { NextRequest, NextResponse } from 'next/server';
import { decryptPrivateKey } from '../../../../lib/crypto';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';

// Private Key 조회 API (보안 강화 버전)
export async function POST(request: NextRequest) {
  try {
    // Firebase Admin SDK 환경 변수 확인
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK 설정이 필요합니다. 환경 변수를 확인해주세요.' },
        { status: 500 }
      );
    }

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
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: '지갑 주소는 필수입니다.' },
        { status: 400 }
      );
    }

    // 4. Firestore에서 사용자의 지갑 조회 (소유권 확인)
    const walletsRef = adminDb.collection('wallets');
    const walletQuery = await walletsRef
      .where('userId', '==', userId)
      .where('address', '==', walletAddress)
      .limit(1)
      .get();

    if (walletQuery.empty) {
      return NextResponse.json(
        { error: '해당 지갑을 찾을 수 없거나 접근 권한이 없습니다.' },
        { status: 404 }
      );
    }

    const walletDoc = walletQuery.docs[0];
    const walletData = walletDoc.data();

    // 5. 암호화된 private key 확인
    if (!walletData.encryptedPrivateKey) {
      return NextResponse.json(
        { error: '이 지갑의 Private Key 정보가 없습니다.' },
        { status: 404 }
      );
    }

    let privateKeyData: {
      userMade: boolean;
      privateKey: string;
    };

    // 6. userMade 상태에 따라 private key 처리
    if (walletData.userMade === false) {
      // 시스템에서 생성된 지갑: 서버 키로 복호화하여 제공
      try {
        const decryptedPrivateKey = decryptPrivateKey(walletData.encryptedPrivateKey);
        privateKeyData = {
          userMade: false,
          privateKey: decryptedPrivateKey
        };
      } catch (decryptError) {
        console.error('Private Key 복호화 오류:', decryptError);
        return NextResponse.json(
          { error: 'Private Key 복호화에 실패했습니다.' },
          { status: 500 }
        );
      }
    } else {
      // 사용자가 생성한 지갑: 암호화된 상태로 제공
      privateKeyData = {
        userMade: true,
        privateKey: walletData.encryptedPrivateKey
      };
    }

    return NextResponse.json({
      success: true,
      data: privateKeyData,
      message: 'Private Key 정보를 성공적으로 조회했습니다.'
    });

  } catch (error) {
    console.error('Private Key 조회 오류:', error);
    return NextResponse.json(
      { error: 'Private Key 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET 요청은 지원하지 않음 (보안상 POST만 허용)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'GET 요청은 지원하지 않습니다. POST 요청을 사용해주세요.' },
    { status: 405 }
  );
} 