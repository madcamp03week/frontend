import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../lib/firebase-admin';
import { getUserWalletsAdmin, WalletData } from '../../../lib/firestore-admin';

// 트랜잭션 타입 정의
interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  nonce: string;
  blockNumber: string;
  blockHash: string;
  transactionIndex: string;
  input: string;
  status: 'success' | 'failed';
  timestamp: number;
  methodName?: string;
  contractAddress?: string;
  tokenId?: string;
  tokenName?: string;
  tokenSymbol?: string;
}

// 트랜잭션 통계
interface TransactionStats {
  total: number;
  success: number;
  failed: number;
  nftMints: number;
  nftTransfers: number;
  tokenTransfers: number;
  contractInteractions: number;
}







const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

// API 키 상태 확인
console.log('🔑 Etherscan API 키 상태:', {
  hasApiKey: !!ETHERSCAN_API_KEY,
  apiKeyLength: ETHERSCAN_API_KEY ? ETHERSCAN_API_KEY.length : 0,
  apiKeyPreview: ETHERSCAN_API_KEY ? `${ETHERSCAN_API_KEY.substring(0, 10)}...` : '없음'
});

async function getPolygonNFTTransactions(address: string) {
  // Etherscan Multi-chain API 사용 (Polygon: chainid=137)
  const apiKeyParam = ETHERSCAN_API_KEY ? `&apikey=${ETHERSCAN_API_KEY}` : '';
  const url = `https://api.etherscan.io/v2/api?chainid=137&module=account&action=tokennfttx&address=${address}&startblock=0&endblock=99999999&sort=desc&tag=latest${apiKeyParam}`;
  
  console.log('🔍 Etherscan Multi-chain API 호출 (Polygon):', url);
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log('📊 Etherscan 응답:', {
    status: data.status,
    message: data.message,
    resultCount: Array.isArray(data.result) ? data.result.length : 'N/A',
    result: data.result
  });
  
  return data.result;
}



// 사용자의 트랜잭션 조회 API
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decodedToken;
    
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // 사용자의 지갑 주소들 가져오기 (Admin SDK 사용)
    const userWallets = await getUserWalletsAdmin(userId);
    if (!userWallets || userWallets.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        stats: {
          total: 0,
          success: 0,
          failed: 0,
          nftMints: 0,
          nftTransfers: 0,
          tokenTransfers: 0,
          contractInteractions: 0,
        },
        message: '지갑이 없습니다.'
      });
    }

    // 활성 지갑 주소들만 사용
    const activeWalletAddresses = userWallets
      .filter((wallet: WalletData) => wallet.isActive)
      .map((wallet: WalletData) => wallet.address.toLowerCase());

    if (activeWalletAddresses.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        stats: {
          total: 0,
          success: 0,
          failed: 0,
          nftMints: 0,
          nftTransfers: 0,
          tokenTransfers: 0,
          contractInteractions: 0,
        },
        message: '활성 지갑이 없습니다.'
      });
    }

    // URL 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const address = searchParams.get('address'); // 특정 주소 필터링

    // 사용할 지갑 주소들 결정
    const targetAddresses = address 
      ? [address.toLowerCase()]
      : activeWalletAddresses;

    // 각 주소별로 트랜잭션 가져오기
    const allTransactions: Transaction[] = [];
    
    console.log('🎯 처리할 지갑 주소들:', targetAddresses);
    
    for (const walletAddress of targetAddresses) {
      console.log(`\n💰 지갑 ${walletAddress} 처리 중...`);
      
      try {
        // PolygonScan API로 NFT 트랜잭션 가져오기
        const transactions = await getPolygonNFTTransactions(walletAddress);
        
        if (transactions && Array.isArray(transactions)) {
          console.log(`📦 ${transactions.length}개의 NFT 트랜잭션 발견`);
          
          // NFT 트랜잭션 데이터 변환
          for (const tx of transactions) {
            const transaction: Transaction = {
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value || '0x0',
              gas: tx.gas,
              gasPrice: tx.gasPrice,
              nonce: tx.nonce,
              blockNumber: tx.blockNumber,
              blockHash: tx.blockHash,
              transactionIndex: tx.transactionIndex,
              input: tx.input || '0x',
              status: 'success', // Etherscan API는 성공한 트랜잭션만 반환
              timestamp: parseInt(tx.timeStamp) * 1000, // Unix timestamp를 milliseconds로 변환
              methodName: 'NFT Transfer',
              contractAddress: tx.contractAddress,
              tokenId: tx.tokenID,
              tokenName: tx.tokenName,
              tokenSymbol: tx.tokenSymbol,
            };
            
            console.log(`  🎨 NFT: ${tx.tokenName} #${tx.tokenID} (${tx.contractAddress})`);
            allTransactions.push(transaction);
          }
        } else {
          console.log('❌ 트랜잭션 데이터가 없거나 배열이 아님');
        }
      } catch (error) {
        console.error(`❌ 지갑 ${walletAddress} 트랜잭션 조회 실패:`, error);
        continue;
      }
    }
    
    console.log(`\n✅ 총 ${allTransactions.length}개의 NFT 트랜잭션 수집 완료`);

    // 트랜잭션 정렬 (최신순)
    allTransactions.sort((a, b) => b.timestamp - a.timestamp);

    // 통계 계산
    const stats: TransactionStats = {
      total: allTransactions.length,
      success: allTransactions.filter(tx => tx.status === 'success').length,
      failed: allTransactions.filter(tx => tx.status === 'failed').length,
      nftMints: allTransactions.filter(tx => 
        tx.methodName?.includes('mint') && tx.input !== '0x'
      ).length,
      nftTransfers: allTransactions.filter(tx => 
        tx.methodName?.includes('transfer') && tx.input !== '0x'
      ).length,
      tokenTransfers: allTransactions.filter(tx => 
        tx.value !== '0x0' && tx.input === '0x'
      ).length,
      contractInteractions: allTransactions.filter(tx => 
        tx.input !== '0x' && !tx.methodName?.includes('mint') && !tx.methodName?.includes('transfer')
      ).length,
    };

    // 페이지네이션 적용
    const paginatedTransactions = allTransactions.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedTransactions,
      stats,
      pagination: {
        total: allTransactions.length,
        limit,
        offset,
        hasMore: offset + limit < allTransactions.length,
      },
      message: `${allTransactions.length}개의 트랜잭션을 찾았습니다.`
    });

  } catch (error) {
    console.error('트랜잭션 조회 오류:', error);
    return NextResponse.json(
      { error: '트랜잭션 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 