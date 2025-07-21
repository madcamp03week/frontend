import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CHRONOS_DAO_ABI } from '@/lib/contract-abi';

const CHRONOS_DAO_CONTRACT_ADDR = process.env.CHRONOS_DAO_CONTRACT_ADDR;
const INFURA_URL = process.env.INFURA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

export async function POST(req: NextRequest) {
  try {
    const { type, postId, address } = await req.json();
    if (!postId || isNaN(postId)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 postId입니다.' }, { status: 400 });
    }
    if (!CHRONOS_DAO_CONTRACT_ADDR) {
      return NextResponse.json({ success: false, error: 'DAO 컨트랙트 주소가 설정되지 않았습니다.' }, { status: 500 });
    }
    if (!INFURA_URL) {
      return NextResponse.json({ success: false, error: 'INFURA_URL이 설정되지 않았습니다.' }, { status: 500 });
    }
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    // 좋아요 개수 조회
    if (type === 'getLikeCount') {
      const contract = new ethers.Contract(CHRONOS_DAO_CONTRACT_ADDR, CHRONOS_DAO_ABI, provider);
      const count = await contract.getLikeCount(postId);
      return NextResponse.json({ success: true, postId, likeCount: count.toString() });
    }
    // 좋아요 트랜잭션
    if (type === 'like') {
      if (!address || !ethers.isAddress(address)) {
        return NextResponse.json({ success: false, error: '유효하지 않은 address입니다.' }, { status: 400 });
      }
      if (!PRIVATE_KEY) {
        return NextResponse.json({ success: false, error: 'PRIVATE_KEY가 설정되지 않았습니다.' }, { status: 500 });
      }
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      const contract = new ethers.Contract(CHRONOS_DAO_CONTRACT_ADDR, CHRONOS_DAO_ABI, wallet);
      const tx = await contract.like(postId, address);
      const receipt = await tx.wait();
      return NextResponse.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
    }
    return NextResponse.json({ success: false, error: 'type 파라미터가 올바르지 않습니다.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '알 수 없는 오류' }, { status: 500 });
  }
} 