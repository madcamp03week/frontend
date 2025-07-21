// app/api/my-chronos/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ethers }                  from 'ethers';
import { adminAuth }               from '@/lib/firebase-admin';
import { getUserWalletsAdmin }     from '@/lib/firestore-admin';
import { CONTRACT_ABI }            from '@/lib/contract-abi';

const RPC_URL     = process.env.INFURA_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { tokenId, contractAddress, email, toAddress } = await request.json();

    if (!tokenId || !contractAddress) {
      return NextResponse.json(
        { error: 'tokenId & contractAddress 모두 필요합니다.' },
        { status: 400 }
      );
    }

    // recipients 결정
    let recipients: string[] = [];
    if (email) {
      // 이메일 → UID → 활성화된 지갑들
      const userRecord = await adminAuth.getUserByEmail(email);
      const wallets    = await getUserWalletsAdmin(userRecord.uid);
      if (wallets.length === 0) {
        return NextResponse.json(
          { error: '활성화된 지갑이 없습니다.' },
          { status: 404 }
        );
      }
      recipients = wallets.map(w => w.address);

    } else if (toAddress) {
      // 직접 주소로 전송
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

    // ethers.js 세팅
    const provider = new ethers.JsonRpcProvider(RPC_URL, 137);
    const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

    // 토큰 강제 전송
    const bnId     = BigInt(tokenId);
    const txHashes: string[] = [];
    for (const recipient of recipients) {
      const tx = await contract.forceTransferToken(bnId, recipient);
      const receipt = await tx.wait();
      txHashes.push(receipt.transactionHash);
    }

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
