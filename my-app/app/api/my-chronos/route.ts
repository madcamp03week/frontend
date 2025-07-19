import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../lib/firebase-admin';

interface OpenSeaV2NFT {
  identifier: string;
  name: string;
  description: string;
  image_url: string;
  metadata_url: string;
  opensea_url: string;
  updated_at: string;
  is_disabled: boolean;
  is_nsfw: boolean;
  collection: string;
  contract: string;
  token_standard: string;
  chain: string;
  creator: string;
  traits: Array<{
    trait_type: string;
    value: string | number;
    display_type: string;
    max_value: string | number;
    trait_count: number;
    order: string | number;
  }>;
}

interface OpenSeaV2Response {
  nfts: OpenSeaV2NFT[];
  next: string;
}

interface ChronosData {
  id: string;
  name: string;
  openDate?: string;
  description?: string;
  imageUrl?: string;
  tokenId: string;
  contractAddress: string;
  permalink: string;
  collectionName?: string;
  ownerAddress: string;
  traits?: any[];
  lastSale?: any;
  listingDate?: string;
}

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    console.log('🔍 사용자 ID:', userId);

    // URL 파라미터에서 지갑 주소 가져오기
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ error: '지갑 주소가 필요합니다' }, { status: 400 });
    }

    console.log('💰 지갑 주소:', walletAddress);

    // OpenSea API v2 호출
    const openSeaApiUrl = `https://api.opensea.io/api/v2/chain/polygon/account/${walletAddress}/nfts`;
    
    console.log('🌊 OpenSea API v2 호출:', openSeaApiUrl);

    const response = await fetch(openSeaApiUrl, {
      headers: {
        'Accept': 'application/json',
        'X-API-KEY': process.env.OPENSEA_API_KEY || '', // API 키가 있으면 사용
      },
    });

    if (!response.ok) {
      console.error('❌ OpenSea API v2 오류:', response.status, response.statusText);
      return NextResponse.json({ 
        error: 'OpenSea API v2 호출 실패', 
        details: response.statusText 
      }, { status: response.status });
    }

    const data: OpenSeaV2Response = await response.json();
    console.log('📦 OpenSea v2 응답 데이터 개수:', data.nfts?.length || 0);
    
    // Raw 응답 데이터 출력
    console.log('🔍 OpenSea v2 Raw 응답 데이터:');
    console.log(JSON.stringify(data, null, 2));
    
    // 첫 번째 NFT의 상세 구조도 출력
    if (data.nfts && data.nfts.length > 0) {
      console.log('📋 첫 번째 NFT 상세 구조:');
      console.log(JSON.stringify(data.nfts[0], null, 2));
    }

    // TimeCapsule NFT 필터링 (실제 컨트랙트 주소 사용)
    const TIMECAPSULE_CONTRACT_ADDRESS = '0xb39b584c68f3daf59b4028f6b593dad3350ddaaf';
    
    const timeCapsuleAssets = data.nfts?.filter(nft => 
      nft.contract?.toLowerCase() === TIMECAPSULE_CONTRACT_ADDRESS.toLowerCase() ||
      nft.collection?.toLowerCase() === TIMECAPSULE_CONTRACT_ADDRESS.toLowerCase()
    ) || [];

    console.log('⏰ TimeCapsule NFT 개수:', timeCapsuleAssets.length);

    // Chronos 형식으로 변환
    const chronosList: ChronosData[] = timeCapsuleAssets.map(nft => {
      // 메타데이터에서 제목과 열기 날짜 추출 시도
      let name = nft.name || `TimeCapsule #${nft.identifier}`;
      let openDate: string | undefined;
      let description = nft.description;

      // traits에서 메타데이터 추출 시도
      if (nft.traits && nft.traits.length > 0) {
        const titleTrait = nft.traits.find(trait => 
          trait.trait_type?.toLowerCase().includes('title') ||
          trait.trait_type?.toLowerCase().includes('name')
        );
        const dateTrait = nft.traits.find(trait => 
          trait.trait_type?.toLowerCase().includes('date') ||
          trait.trait_type?.toLowerCase().includes('open') ||
          trait.trait_type?.toLowerCase().includes('time')
        );

        if (titleTrait?.value) {
          name = String(titleTrait.value);
        }
        if (dateTrait?.value) {
          openDate = String(dateTrait.value);
        }
      }

      return {
        id: `${nft.contract}-${nft.identifier}`,
        name,
        openDate,
        description,
        imageUrl: nft.image_url,
        tokenId: nft.identifier,
        contractAddress: nft.contract,
        permalink: nft.opensea_url,
        collectionName: nft.collection,
        ownerAddress: walletAddress,
        traits: nft.traits,
        lastSale: undefined, // v2 API에서는 별도로 가져와야 함
        listingDate: nft.updated_at,
      };
    });

    console.log('✅ 변환된 Chronos 데이터:', chronosList.length);

    return NextResponse.json({
      success: true,
      data: chronosList,
      stats: {
        total: chronosList.length,
        timeCapsules: timeCapsuleAssets.length,
        totalAssets: data.nfts?.length || 0,
      }
    });

  } catch (error) {
    console.error('❌ my-chronos API 오류:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 