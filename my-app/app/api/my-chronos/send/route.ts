// app/api/my-chronos/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ethers }                  from 'ethers';
import { adminAuth }               from '@/lib/firebase-admin';
import { getUserWalletsAdmin }     from '@/lib/firestore-admin';
import { CONTRACT_ABI }            from '@/lib/contract-abi';

const RPC_URL     = process.env.INFURA_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

// 폴리곤 체인 ID
const CHAIN_ID = 137;

export async function POST(request: NextRequest) {
  try {
    // 1) Authorization 헤더 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization 헤더가 없습니다.' },
        { status: 401 }
      );
    }
    const idToken = authHeader.split(' ')[1];

    // 2) Firebase 토큰 검증 → uid 획득
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid     = decoded.uid;

    // 3) 클라이언트에서 받은 파라미터
    const { tokenId, contractAddress, email, toAddress } = await request.json();
    if (!tokenId || !contractAddress) {
      return NextResponse.json(
        { error: 'tokenId & contractAddress 모두 필요합니다.' },
        { status: 400 }
      );
    }

    // 4) recipients 결정 (email → 여러 지갑 or toAddress → 단일)
    let recipients: string[] = [];
    if (email) {
      // 이메일 → Firebase 사용자 조회 → uid
      const userRec = await adminAuth.getUserByEmail(email);
      const wallets = await getUserWalletsAdmin(userRec.uid);
      if (wallets.length === 0) {
        return NextResponse.json(
          { error: '해당 사용자에 활성화된 지갑이 없습니다.' },
          { status: 404 }
        );
      }
      recipients = wallets.map(w => w.address);

    } else if (toAddress) {
      if (!ethers.isAddress(toAddress)) {
        return NextResponse.json(
          { error: '유효하지 않은 toAddress 입니다.' },
          { status: 400 }
        );
      }
      recipients = [toAddress];

    } else {
      return NextResponse.json(
        { error: 'email 또는 toAddress 중 하나는 필요합니다.' },
        { status: 400 }
      );
    }

    // 5) 서비스 지갑 준비
    const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
    const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

    // 6) 검증 1 — “발송자” 지갑이 tokenId 를 소유하고 있는지 확인
    //    → uid로 조회한 활성 지갑 중 하나라도 소유자(ownerOf)와 일치해야 함
    const ownerOnChain: string = await contract.ownerOf(BigInt(tokenId));
    const senders: string[] = (await getUserWalletsAdmin(uid)).map(w => w.address.toLowerCase());
    if (!senders.includes(ownerOnChain.toLowerCase())) {
      return NextResponse.json(
        { error: '해당 NFT의 실제 소유자가 아닙니다.' },
        { status: 403 }
      );
    }

    // 7) 검증 2 — 스마트컨트랙트 설정에서 isSmartContractTransferable 확인
    const contentId = await contract.tokenIdToCapsuleContentId(BigInt(tokenId));
    const content   = await contract.capsuleContents(contentId);
    if (!content.isSmartContractTransferable) {
      return NextResponse.json(
        { error: '이 NFT는 스마트컨트랙트 전송이 허용되지 않습니다.' },
        { status: 403 }
      );
    }

    // 8) 검증 3 — (선택) 아직 열리지 않은 경우만 전송 가능하도록 하고 싶다면
    // const opened = await contract.isCapsuleOpenedForToken(BigInt(tokenId));
    // if (!opened) { /* ... */ }

    // 9) 전송 수행
    const bnId     = BigInt(tokenId);
    const txHashes: string[] = [];
    for (const recipient of recipients) {
      const tx      = await contract.forceTransferToken(bnId, recipient);
      const receipt = await tx.wait();
      txHashes.push(receipt.transactionHash);
    }

    // 10) 성공 응답
    return NextResponse.json({
      success: true,
      tokenId,
      contractAddress,
      recipients,
      txHashes
    });

  } catch (err: any) {
    console.error('🚨 /api/my-chronos/send 에러', err);
    return NextResponse.json(
      { error: '전송 실패', details: err.message },
      { status: 500 }
    );
  }
}
