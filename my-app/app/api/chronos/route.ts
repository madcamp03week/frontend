import { NextRequest, NextResponse } from 'next/server';
import { addDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { firestore } from '../../../lib/firebase';
import { createTimeCapsuleOnBlockchain } from '../../../lib/blockchain-service';
import { getUserWallets } from '../../../lib/firestore';


// 타임캡슐 생성 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 필수 필드 검증
    const { name, content, openDate, description, isEncrypted, password, isPublic, tags, enhancedSecurity, n, m, isTransferable, isSmartContractTransferable, isSmartContractOpenable, walletAddresses } = body;
    
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
      isTransferable: isTransferable !== undefined ? isTransferable : true,
      isSmartContractTransferable: isSmartContractTransferable !== undefined ? isSmartContractTransferable : true,
      isSmartContractOpenable: isSmartContractOpenable !== undefined ? isSmartContractOpenable : true,
      userId,
      createdAt: new Date(),
      status: 'active' // active, opened, deleted
    };

    // Firestore에 타임캡슐 저장
    const chronosRef = collection(firestore, 'chronos');
    const docRef = await addDoc(chronosRef, chronosData);

    // 사용자의 지갑 주소들 처리
    let userWalletAddresses: string[] = [];
    
    // 클라이언트에서 전달받은 지갑 주소가 있으면 사용
    if (walletAddresses && Array.isArray(walletAddresses) && walletAddresses.length > 0) {
      userWalletAddresses = walletAddresses;
      console.log('클라이언트에서 전달받은 지갑 주소들:', userWalletAddresses);
    } else {
      // 지갑 주소가 없으면 기본 주소 사용 (임시)
      userWalletAddresses = ['0x38d41fd88833e17970128e91684cC9A0ec47D905'];
      console.log('기본 지갑 주소 사용:', userWalletAddresses);
    }

    // 블록체인에 타임캡슐 생성 (함수 직접 호출)
    let blockchainResult = null;
    try {
      blockchainResult = await createTimeCapsuleOnBlockchain({
        name: chronosData.name,
        description: chronosData.description,
        openDate: chronosData.openDate,
        recipients: userWalletAddresses,
        isTransferable: chronosData.isTransferable,
        isSmartContractTransferable: chronosData.isSmartContractTransferable,
        isSmartContractOpenable: chronosData.isSmartContractOpenable
      });
      
      if (blockchainResult.success) {
        console.log('블록체인 생성 결과:', blockchainResult);
      } else {
        console.error('블록체인 생성 실패:', blockchainResult.error);
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
