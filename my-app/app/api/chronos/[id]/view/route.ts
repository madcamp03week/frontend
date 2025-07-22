import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '@/lib/contract-abi';

const INFURA_URL = process.env.INFURA_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// tokenId로부터 메타데이터를 fetch하여 필요한 정보를 반환
async function getChronosDataByTokenId(tokenId: string) {
  if (!INFURA_URL || !CONTRACT_ADDRESS) throw new Error('환경변수 미설정');
  const provider = new ethers.JsonRpcProvider(INFURA_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  // 1. tokenURI 조회
  let tokenUri = await contract.tokenURI(tokenId);
  // 2. ipfs:// → https://ipfs.io/ipfs/ 변환 (또는 S3 URL 그대로 사용)
  if (tokenUri.startsWith('ipfs://')) {
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
    tokenUri = tokenUri.replace('ipfs://', gateway);
    console.log('🔗 변환된 tokenUri:', tokenUri);
  }
  // 3. fetch로 메타데이터 가져오기
  const res = await fetch(tokenUri);
  if (!res.ok) throw new Error('IPFS 메타데이터 fetch 실패');
  const metadata = await res.json();
  return {
    name: metadata.name,
    description: metadata.description,
    openDate: metadata.attributes?.find((a: any) => a.trait_type === 'Open Date')?.value || null,
    isEncrypted: metadata.attributes?.find((a: any) => a.trait_type === 'isEncrypted')?.value ?? false,
    uploadedFileInfos: metadata.properties?.data || [],
  };
}

export async function GET(request: NextRequest) {
  // 예: /api/chronos/123/view
  const url = new URL(request.url);
  const paths = url.pathname.split('/');
  // ['','api','chronos','123','view']
  const tokenId = paths[paths.length - 2];
  try {
    const chronosData = await getChronosDataByTokenId(tokenId);

    // isEncrypted와 uploadedFileInfos 콘솔 출력
    console.log('isEncrypted:', chronosData.isEncrypted);
    console.log('uploadedFileInfos:', chronosData.uploadedFileInfos);
    
    // Set 객체나 복잡한 객체를 순수한 객체로 변환
    const sanitizedData = JSON.parse(JSON.stringify(chronosData));
    
    return NextResponse.json(sanitizedData, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 