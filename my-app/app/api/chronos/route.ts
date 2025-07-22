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
    const {
      name,
      description,
      openDate, // ISO string (UTC)
      isEncrypted,
      isPublic,
      tags, // string (쉼표 구분)
      enhancedSecurity,
      n,
      m,
      isTransferable,
      isSmartContractTransferable,
      isSmartContractOpenable,
      walletAddresses, // string[]
      encryptedFiles // 배열
      // userId는 여기서 제외
    } = body;

    console.log('openDate:', openDate);
    
    if (!name) {
      return NextResponse.json(
        { error: '타임캡슐 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 (실제로는 인증 미들웨어에서 가져와야 함)
    let userId = body.userId || 'anonymous';
    
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

    // 1️⃣ 먼저 블록체인에 타임캡슐 생성
    let blockchainResult = null;
    try {
      blockchainResult = await createTimeCapsuleOnBlockchain({
        name,
        description: description || '',
        openDate: openDate ? new Date(openDate) : null,
        recipients: userWalletAddresses,
        isTransferable: isTransferable !== undefined ? isTransferable : true,
        isSmartContractTransferable: isSmartContractTransferable !== undefined ? isSmartContractTransferable : true,
        isSmartContractOpenable: isSmartContractOpenable !== undefined ? isSmartContractOpenable : true,
        isEncrypted, // 추가
        encryptedFiles, // 추가
        writerAddress: userWalletAddresses[0] // 첫 번째 주소를 작성자로 전달
      } as any);
      
      if (!blockchainResult.success) {
        return NextResponse.json(
          { error: '블록체인에 타임캡슐 생성에 실패했습니다.', details: blockchainResult.error },
          { status: 500 }
        );
      }
      
      console.log('블록체인 생성 성공:', blockchainResult);
    } catch (blockchainError) {
      console.error('블록체인 생성 실패:', blockchainError);
      return NextResponse.json(
        { error: '블록체인에 타임캡슐 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 2️⃣ 블록체인 생성 성공 후 Firestore에 타임캡슐 저장
    // 각 수신자별로 개별 chronos 문서 생성
    const chronosRef = collection(firestore, 'chronos');
    const chronosResults = [];

    for (const recipientAddress of userWalletAddresses) {
      const chronosData = {
        name,
        description: description || '',
        openDate: openDate ? new Date(openDate) : null,
        isEncrypted: isEncrypted || false,
        isPublic: isPublic || false,
        tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
        enhancedSecurity: enhancedSecurity || false,
        n: enhancedSecurity ? n : null,
        m: enhancedSecurity ? m : null,
        isTransferable: isTransferable !== undefined ? isTransferable : true,
        isSmartContractTransferable: isSmartContractTransferable !== undefined ? isSmartContractTransferable : true,
        isSmartContractOpenable: isSmartContractOpenable !== undefined ? isSmartContractOpenable : true,
        userId,
        recipientAddress, // 수신자 주소 추가
        createdAt: new Date(),
        status: 'active', // active, opened, deleted
        // 블록체인 정보 추가
        tokenId: blockchainResult.tokenId,
        contractAddress: blockchainResult.contractAddress,
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.blockNumber,
        ipfsMetadata: blockchainResult.ipfsMetadata,
        // 수신자 정보 추가
        isRecipient: true, // 수신자 문서임을 표시
        originalCreator: userId, // 원본 생성자
        totalRecipients: userWalletAddresses.length, // 총 수신자 수
        recipientIndex: userWalletAddresses.indexOf(recipientAddress), // 수신자 순서
        likeCount: 0 // 좋아요 카운트 초기값
      };

      // Firestore에 타임캡슐 저장
      const docRef = await addDoc(chronosRef, chronosData);
      chronosResults.push({
        ...chronosData,
        id: docRef.id
      });
      
      console.log(`✅ 수신자 ${recipientAddress}용 chronos 문서 생성 완료:`, docRef.id);
    }

    // Set 객체나 복잡한 객체를 순수한 객체로 변환
    const responseData = {
      success: true,
      chronosIds: chronosResults.map(c => c.id),
      tokenId: blockchainResult.tokenId,
      message: `${userWalletAddresses.length}명에게 타임캡슐이 성공적으로 생성되었습니다.`,
      data: chronosResults,
      blockchain: blockchainResult
    };
    
    return NextResponse.json(JSON.parse(JSON.stringify(responseData)));

  } catch (error) {
    console.error('타임캡슐 생성 오류:', error);
    return NextResponse.json(
      { error: '타임캡슐 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
