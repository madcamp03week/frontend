import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const INFURA_URL = process.env.INFURA_URL;

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json({ success: false, error: '유효하지 않은 주소입니다.' }, { status: 400 });
    }
    if (!INFURA_URL) {
      return NextResponse.json({ success: false, error: 'INFURA_URL이 설정되지 않았습니다.' }, { status: 500 });
    }
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const balance = await provider.getBalance(address);
    return NextResponse.json({ success: true, address, balance: ethers.formatEther(balance) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '알 수 없는 오류' }, { status: 500 });
  }
} 