// app/api/my-chronos/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ethers }                  from 'ethers';
import { adminAuth }               from '@/lib/firebase-admin';
import { getUserWalletsAdmin }     from '@/lib/firestore-admin';
import { CONTRACT_ABI }            from '@/lib/contract-abi';

const RPC_URL     = process.env.INFURA_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
// Polygon 메인넷 체인 ID
const CHAIN_ID    = 137;

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

    // 3) 요청 바디 파싱
    const { tokenId, contractAddress, email, toAddress } = await request.json();
    if (!tokenId || !contractAddress) {
      return NextResponse.json(
        { error: 'tokenId & contractAddress 모두 필요합니다.' },
        { status: 400 }
      );
    }

    // 4) recipients 결정
    let recipients: string[] = [];
    if (email) {
      // 이메일 → Firebase 사용자 → 활성화 지갑 목록
      const userRec = await adminAuth.getUserByEmail(email);
      const wallets = await getUserWalletsAdmin(userRec.uid);
      if (wallets.length === 0) {
        return NextResponse.json(
          { error: '해당 사용자에 활성화된 지갑이 없습니다.' },
          { status: 404 }
        );
      }
      recipients = wallets.map(w => w.address);
    }
    else if (toAddress) {
      if (!ethers.isAddress(toAddress)) {
        return NextResponse.json(
          { error: '유효하지 않은 toAddress 입니다.' },
          { status: 400 }
        );
      }
      recipients = [toAddress];
    }
    else {
      return NextResponse.json(
        { error: 'email 또는 toAddress 중 하나는 필요합니다.' },
        { status: 400 }
      );
    }

    // 5) ethers.js 준비
    const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
    const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

    // 6) 검증 1 — 실제 소유자 확인
    const ownerOnChain: string = await contract.ownerOf(BigInt(tokenId));
    const userWallets = await getUserWalletsAdmin(uid);
    const senders = userWallets.map(w => w.address.toLowerCase());
    if (!senders.includes(ownerOnChain.toLowerCase())) {
      return NextResponse.json(
        { error: '해당 NFT의 실제 소유자가 아닙니다.' },
        { status: 403 }
      );
    }

    // 7) 검증 2 — isSmartContractTransferable 확인
    const contentId = await contract.tokenIdToCapsuleContentId(BigInt(tokenId));
    const content   = await contract.capsuleContents(contentId);
    if (!content.isSmartContractTransferable) {
      return NextResponse.json(
        { error: '이 NFT는 스마트컨트랙트 전송이 허용되지 않습니다.' },
        { status: 403 }
      );
    }

    // 8) 전송 수행
    const bnId     = BigInt(tokenId);
    const txHashes: string[] = [];
    for (const recipient of recipients) {
      const tx      = await contract.forceTransferToken(bnId, recipient);
      const receipt = await tx.wait();
      txHashes.push(receipt.transactionHash);
    }

    // 9) 성공 응답 - Set 객체나 복잡한 객체를 순수한 객체로 변환
    const responseData = {
      success: true,
      tokenId,
      contractAddress,
      recipients,
      txHashes
    };
    
    return NextResponse.json(JSON.parse(JSON.stringify(responseData)));

  } catch (err: any) {
    console.error('🚨 /api/my-chronos/send 에러', err);
    return NextResponse.json(
      { error: '전송 실패', details: err.message },
      { status: 500 }
    );
  }
}
