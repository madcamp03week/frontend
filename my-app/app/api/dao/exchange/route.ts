import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CHRONOS_DAO_ABI } from '@/lib/contract-abi';

const CHRONOS_DAO_CONTRACT_ADDR = process.env.CHRONOS_DAO_CONTRACT_ADDR;
const INFURA_URL = process.env.INFURA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    console.log('address:', address);
    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 address입니다.' }, { status: 400 });
    }
    if (!CHRONOS_DAO_CONTRACT_ADDR) {
      return NextResponse.json({ success: false, error: 'DAO 컨트랙트 주소가 설정되지 않았습니다.' }, { status: 500 });
    }
    if (!INFURA_URL) {
      return NextResponse.json({ success: false, error: 'INFURA_URL이 설정되지 않았습니다.' }, { status: 500 });
    }
    if (!PRIVATE_KEY) {
      return NextResponse.json({ success: false, error: 'PRIVATE_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CHRONOS_DAO_CONTRACT_ADDR, CHRONOS_DAO_ABI, wallet);
    const tx = await contract.exchangeTokensForPolygon(address);
    const receipt = await tx.wait();
    return NextResponse.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '알 수 없는 오류' }, { status: 500 });
  }
} 