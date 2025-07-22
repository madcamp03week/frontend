import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CHRONOS_TOKEN_CONTRACT_ABI } from '@/lib/contract-abi';

const CHRONOS_TOKEN_CONTRACT_ADDR = process.env.CHRONOS_TOKEN_CONTRACT_ADDR;
const INFURA_URL = process.env.INFURA_URL;

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address || !ethers.isAddress(address)) {
      console.log('address:', address); 
      return NextResponse.json({ success: false, error: '유효하지 않은 주소입니다.' }, { status: 400 });
    }
    if (!CHRONOS_TOKEN_CONTRACT_ADDR) {
      console.log('CHRONOS_TOKEN_CONTRACT_ADDR:', CHRONOS_TOKEN_CONTRACT_ADDR);
      return NextResponse.json({ success: false, error: '토큰 컨트랙트 주소가 설정되지 않았습니다.' }, { status: 500 });
    }
    if (!INFURA_URL) {
      return NextResponse.json({ success: false, error: 'INFURA_URL이 설정되지 않았습니다.' }, { status: 500 });
    }
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const contract = new ethers.Contract(CHRONOS_TOKEN_CONTRACT_ADDR, CHRONOS_TOKEN_CONTRACT_ABI, provider);
    const balance = await contract.balanceOf(address);
    console.log('balance:', balance);
    const balanceInCR = Number(balance) / 10 ** 18;
    console.log('balanceInCR:', balanceInCR);
    return NextResponse.json({ 
      success: true, 
      address, 
      balance: balanceInCR.toString(),
      // balanceInCR: balanceInCR.toString()
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '알 수 없는 오류' }, { status: 500 });
  }
} 