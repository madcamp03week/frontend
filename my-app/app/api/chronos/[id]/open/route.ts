import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../../lib/firebase-admin';
import { openTimeCapsule, checkNFTOwnership } from '../../../../../lib/blockchain-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 타임캡슐 열기 API 시작');
    
    const { firebaseToken } = await request.json();
    const { id: tokenId } = await params;
    
    console.log('📝 파라미터 확인:', { tokenId, hasFirebaseToken: !!firebaseToken });

    // 필수 파라미터 검증
    if (!tokenId) {
      console.log('❌ tokenId 누락');
      return NextResponse.json(
        { success: false, error: 'tokenId가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!firebaseToken) {
      console.log('❌ firebaseToken 누락');
      return NextResponse.json(
        { success: false, error: 'Firebase 토큰이 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('✅ 파라미터 검증 통과');

    // Firebase 토큰 검증
    let decodedToken;
    try {
      console.log('🔐 Firebase 토큰 검증 시작');
      decodedToken = await adminAuth.verifyIdToken(firebaseToken);
      console.log('✅ Firebase 토큰 검증 성공:', decodedToken.uid);
    } catch (error) {
      console.error('❌ Firebase 토큰 검증 실패:', error);
      return NextResponse.json(
        { success: false, error: '유효하지 않은 Firebase 토큰입니다.' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Firestore에서 사용자 정보 조회
    console.log('📊 Firestore 사용자 정보 조회 시작:', userId);
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('❌ 사용자 정보 없음:', userId);
      return NextResponse.json(
        { success: false, error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // wallets 컬렉션에서 활성 지갑 조회
    console.log('🔍 활성 지갑 조회 시작:', userId);
    const walletsQuery = adminDb.collection('wallets')
      .where('userId', '==', userId)
      .where('isActive', '==', true);
    
    const walletsSnapshot = await walletsQuery.get();
    
    if (walletsSnapshot.empty) {
      console.log('❌ 활성 지갑 없음:', userId);
      return NextResponse.json(
        { success: false, error: '등록된 활성 지갑이 없습니다.' },
        { status: 400 }
      );
    }

    // 첫 번째 활성 지갑 사용
    const walletDoc = walletsSnapshot.docs[0];
    const walletData = walletDoc.data();
    const walletAddress = walletData.address;
    
    console.log('📊 지갑 정보 조회 결과:', { userId, walletAddress, walletId: walletDoc.id });
    console.log('📊 전체 지갑 데이터:', walletData);

    if (!walletAddress) {
      console.log('❌ 지갑 주소 없음');
      return NextResponse.json(
        { success: false, error: '등록된 지갑 주소가 없습니다.' },
        { status: 400 }
      );
    }

    // NFT 소유권 확인
    console.log('🔍 NFT 소유권 확인 시작:', { tokenId, walletAddress });
    const ownershipCheck = await checkNFTOwnership(tokenId, walletAddress);
    
    if (!ownershipCheck.success) {
      console.log('❌ NFT 소유권 확인 실패:', ownershipCheck.error);
      return NextResponse.json(
        { success: false, error: ownershipCheck.error },
        { status: 500 }
      );
    }

    console.log('🔍 NFT 소유권 확인 결과:', ownershipCheck);

    if (!ownershipCheck.isOwner) {
      console.log('❌ NFT 소유자가 아님:', { requestedWallet: walletAddress, actualOwner: ownershipCheck.actualOwner });
      return NextResponse.json(
        { 
          success: false, 
          error: '이 NFT의 소유자가 아닙니다.',
          details: {
            requestedWallet: walletAddress,
            actualOwner: ownershipCheck.actualOwner
          }
        },
        { status: 403 }
      );
    }

    console.log('✅ NFT 소유권 확인 통과');

    // 타임캡슐 열기 실행
    console.log('🚀 타임캡슐 열기 실행 시작:', tokenId);
    const openResult = await openTimeCapsule(tokenId);
    
    if (!openResult.success) {
      console.log('❌ 타임캡슐 열기 실패:', openResult.error);
      return NextResponse.json(
        { success: false, error: openResult.error },
        { status: 500 }
      );
    }

    console.log('✅ 타임캡슐 열기 성공:', openResult);

    // chronos DB에서 해당 tokenId와 recipientAddress의 문서를 찾아 status를 'opened'로 업데이트
    console.log('📝 chronos DB 업데이트 시작:', { tokenId, walletAddress });
    try {
      const chronosQuery = adminDb.collection('chronos')
        .where('tokenId', '==', tokenId)
        .where('recipientAddress', '==', walletAddress);
      
      const chronosSnapshot = await chronosQuery.get();
      
      if (!chronosSnapshot.empty) {
        const chronosDoc = chronosSnapshot.docs[0];
        await chronosDoc.ref.update({
          status: 'opened',
          openedAt: new Date(),
          openedTransactionHash: openResult.transactionHash,
          openedBlockNumber: openResult.blockNumber,
          openedBy: walletAddress // 누가 열었는지 기록
        });
        console.log('✅ chronos DB 업데이트 성공:', chronosDoc.id);
      } else {
        console.log('⚠️ chronos DB에서 해당 tokenId와 recipientAddress를 찾을 수 없음:', { tokenId, walletAddress });
      }
    } catch (dbError) {
      console.error('❌ chronos DB 업데이트 실패:', dbError);
      // DB 업데이트 실패는 전체 트랜잭션을 실패시키지 않음
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '타임캡슐이 성공적으로 열렸습니다.',
      data: {
        tokenId: openResult.tokenId,
        transactionHash: openResult.transactionHash,
        blockNumber: openResult.blockNumber,
        contractAddress: openResult.contractAddress
      }
    });

  } catch (error) {
    console.error('💥 타임캡슐 열기 API 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 