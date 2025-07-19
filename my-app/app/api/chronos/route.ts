import { NextRequest, NextResponse } from 'next/server';
import { addDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';


// 타임캡슐 생성 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 필수 필드 검증
    const { name, content, openDate, description, isEncrypted, password, isPublic, tags, enhancedSecurity, n, m, nonTransferable } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: '타임캡슐 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 (실제로는 인증 미들웨어에서 가져와야 함)
    const userId = body.userId || 'anonymous';
    
    // 타임캡슐 데이터 구성
    const chronosData = {
      name,
      description: description || '',
      openDate: openDate ? new Date(openDate) : null,
      isEncrypted: isEncrypted || false,
      password: isEncrypted ? password : null,
      isPublic: isPublic || false,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      enhancedSecurity: enhancedSecurity || false,
      n: enhancedSecurity ? n : null,
      m: enhancedSecurity ? m : null,
      nonTransferable: nonTransferable || false,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active' // active, opened, deleted
    };

    // Firestore에 타임캡슐 저장
    const chronosRef = collection(firestore, 'chronos');
    const docRef = await addDoc(chronosRef, chronosData);

    // 블록체인에 타임캡슐 생성 (새로운 API 사용)
    let blockchainResult = null;
    try {
      const blockchainResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/blockchain/create-capsule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: chronosData.name,
          description: chronosData.description,
          openDate: chronosData.openDate,
          isPublic: chronosData.isPublic
        }),
      });
      
      if (blockchainResponse.ok) {
        blockchainResult = await blockchainResponse.json();
        console.log('블록체인 생성 결과:', blockchainResult);
      } else {
        console.error('블록체인 API 호출 실패:', blockchainResponse.status);
      }
    } catch (blockchainError) {
      console.error('블록체인 생성 실패:', blockchainError);
      // 블록체인 실패해도 DB 저장은 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      chronosId: docRef.id,
      message: '타임캡슐이 성공적으로 생성되었습니다.',
      data: {
        ...chronosData,
        id: docRef.id
      },
      blockchain: blockchainResult
    });

  } catch (error) {
    console.error('타임캡슐 생성 오류:', error);
    return NextResponse.json(
      { error: '타임캡슐 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 타임캡슐 목록 조회 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isPublic = searchParams.get('isPublic');
    const status = searchParams.get('status') || 'active';
    
    const chronosRef = collection(firestore, 'chronos');
    let q = query(chronosRef, orderBy('createdAt', 'desc'));
    
    // 필터링 조건 추가
    if (userId) {
      q = query(q, where('userId', '==', userId));
    }
    
    if (isPublic !== null) {
      q = query(q, where('isPublic', '==', isPublic === 'true'));
    }
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const querySnapshot = await getDocs(q);
    const chronosList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: chronosList,
      count: chronosList.length
    });

  } catch (error) {
    console.error('타임캡슐 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '타임캡슐 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 