// pages/api/my-chronos/send.ts

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '@/lib/contract-abi';  

const RPC_URL     = process.env.INFURA_URL!;   // .env.local에 설정된 RPC URL
const PRIVATE_KEY = process.env.PRIVATE_KEY!;  // 서비스 지갑 개인키

export async function POST(request: NextRequest) {
  try {
    const { toAddress, tokenId, contractAddress } = await request.json();
    if (!toAddress || !tokenId || !contractAddress) {
      return NextResponse.json(
        { error: 'toAddress, tokenId, contractAddress 모두 필요합니다.' },
        { status: 400 }
      );
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL, 137);
    const signer   = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

    // BigNumber.from() 대신 BigInt 사용
    const bnId = BigInt(tokenId);
    const tx   = await contract.forceTransferToken(bnId, toAddress);
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: receipt.transactionHash
    });
  } catch (err: any) {
    console.error('🚨 send/route POST error:', err);
    return NextResponse.json(
      { error: '전송 실패', details: err.message },
      { status: 500 }
    );
  }
}
