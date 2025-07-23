import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '@/lib/contract-abi';

const INFURA_URL = process.env.INFURA_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// 재시도 유틸리티 함수
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 5000,
  operationName: string = '작업'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`🔄 ${operationName} 재시도 ${attempt}/${maxRetries}`);
      }
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ ${operationName} 실패 (시도 ${attempt}/${maxRetries}):`, lastError.message);
      
      if (attempt === maxRetries) {
        throw new Error(`${operationName} 실패 (${maxRetries}회 시도): ${lastError.message}`);
      }
      
      // 지수 백오프: 1초, 2초, 4초... (최대 maxDelay)
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      console.log(`⏳ ${delay}ms 후 재시도...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// tokenId로부터 메타데이터를 fetch하여 필요한 정보를 반환
async function getChronosDataByTokenId(tokenId: string, maxRetries: number = 3) {
  if (!INFURA_URL || !CONTRACT_ADDRESS) throw new Error('환경변수 미설정');
  
  return retryWithBackoff(async () => {
    console.log(`🔄 ${tokenId} 메타데이터 조회 시도`);
    
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
    
    // 3. fetch로 메타데이터 가져오기 (타임아웃 설정)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
    
    try {
      const res = await fetch(tokenUri, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Chronos-App/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error(`IPFS 메타데이터 fetch 실패: ${res.status} ${res.statusText}`);
      
      const metadata = await res.json();
      
      console.log(`✅ ${tokenId} 메타데이터 조회 성공`);
      
      return {
        name: metadata.name,
        description: metadata.description,
        openDate: metadata.attributes?.find((a: any) => a.trait_type === 'Open Date')?.value || null,
        isEncrypted: metadata.attributes?.find((a: any) => a.trait_type === 'isEncrypted')?.value ?? false,
        uploadedFileInfos: metadata.properties?.data || [],
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('메타데이터 fetch 타임아웃 (10초)');
      }
      throw error;
    }
  }, maxRetries, 1000, 5000, `${tokenId} 메타데이터 조회`);
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