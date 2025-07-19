import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '../../../../lib/contract-abi';
import AWS from 'aws-sdk';

// 환경 변수에서 설정 가져오기 (서버 사이드)
const INFURA_URL = process.env.INFURA_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// AWS SDK 설정 (Filebase)
const s3 = new AWS.S3({
  endpoint: 'https://s3.filebase.com',
  accessKeyId: process.env.FILEBASE_ACCESS_KEY_ID,
  secretAccessKey: process.env.FILEBASE_SECRET_ACCESS_KEY,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
  httpOptions: {
    timeout: 30000
  }
});

const bucketName = process.env.FILEBASE_BUCKET_NAME || 'madcamp03';

// IPFS 메타데이터 업로드 함수
async function uploadIPFSMetadata(chronosData: {
  name: string;
  description: string;
  openDate: Date | null;
}): Promise<{
  unopenedIpfsMetadataCid: string | null;
  openedIpfsMetadataCid: string | null;
  unopenedUrl: string;
  openedUrl: string;
}> {
  try {
    // 열리지 않은 메타데이터
    const unopenedMetadata = {
      name: `${chronosData.name} (Unopened)`,
      description: chronosData.description,
      image: "ipfs://QmXWi3vQ8JXN195tgGgs7FNgXwEFxd9XSutExj9Mm3AJnm",
      attributes: [
        { 
          trait_type: "Open Date", 
          value: chronosData.openDate ? chronosData.openDate.toISOString() : "Never" 
        }
      ],
      properties: {
        contentTypes: []
      }
    };

    // 열린 메타데이터
    const openedMetadata = {
      name: `${chronosData.name} (Opened)`,
      description: chronosData.description,
      image: "ipfs://QmXWi3vQ8JXN195tgGgs7FNgXwEFxd9XSutExj9Mm3AJnm",
      attributes: [
        { 
          trait_type: "Open Date", 
          value: chronosData.openDate ? chronosData.openDate.toISOString() : "Never" 
        }
      ],
      properties: {
        contentTypes: []
      }
    };

    // 파일명 생성 (타임스탬프 기반)
    const timestamp = Date.now();
    const unopenedFileName = `unopened_${timestamp}.json`;
    const openedFileName = `opened_${timestamp}.json`;

    // IPFS에 업로드
    const uploadPromises = [
      // 열리지 않은 메타데이터 업로드
      s3.upload({
        Bucket: bucketName,
        Key: unopenedFileName,
        Body: JSON.stringify(unopenedMetadata, null, 2),
        ContentType: 'application/json'
      }).promise(),
      
      // 열린 메타데이터 업로드
      s3.upload({
        Bucket: bucketName,
        Key: openedFileName,
        Body: JSON.stringify(openedMetadata, null, 2),
        ContentType: 'application/json'
      }).promise()
    ];

    const [unopenedResult, openedResult] = await Promise.all(uploadPromises);

    // 메타데이터에서 CID 추출
    const unopenedHead = await s3.headObject({
      Bucket: bucketName,
      Key: unopenedFileName
    }).promise();

    const openedHead = await s3.headObject({
      Bucket: bucketName,
      Key: openedFileName
    }).promise();

    const unopenedCid = unopenedHead.Metadata?.cid || null;
    const openedCid = openedHead.Metadata?.cid || null;

    console.log('IPFS 메타데이터 업로드 완료:');
    console.log('Unopened CID:', unopenedCid);
    console.log('Opened CID:', openedCid);

    return {
      unopenedIpfsMetadataCid: unopenedCid,
      openedIpfsMetadataCid: openedCid,
      unopenedUrl: unopenedResult.Location,
      openedUrl: openedResult.Location
    };

  } catch (error) {
    console.error('IPFS 메타데이터 업로드 실패:', error);
    throw new Error('IPFS 메타데이터 업로드에 실패했습니다.');
  }
}

// 타임캡슐 생성 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('받은 요청 데이터:', JSON.stringify(body, null, 2));
    
    const { name, description, openDate, recipients } = body;
    console.log('추출된 recipients:', recipients);
    console.log('recipients 타입:', typeof recipients);
    console.log('recipients가 배열인가?', Array.isArray(recipients));

    // recipients 검증
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      console.log('recipients 검증 실패:', { recipients, isArray: Array.isArray(recipients), length: recipients?.length });
      return NextResponse.json({
        success: false,
        error: 'recipients 배열이 필요하며 비어있을 수 없습니다.'
      }, { status: 400 });
    }

    // 각 recipient가 유효한 이더리움 주소인지 검증
    for (const recipient of recipients) {
      if (!ethers.isAddress(recipient)) {
        return NextResponse.json({
          success: false,
          error: `유효하지 않은 이더리움 주소입니다: ${recipient}`
        }, { status: 400 });
      }
    }

    if (!PRIVATE_KEY) {
      return NextResponse.json({
        success: false,
        error: '서비스 지갑 개인키가 설정되지 않았습니다.'
      }, { status: 500 });
    }

    if (!CONTRACT_ADDRESS) {
      return NextResponse.json({
        success: false,
        error: '스마트컨트랙트 주소가 설정되지 않았습니다.'
      }, { status: 500 });
    }

    // IPFS 메타데이터 업로드
    let ipfsResult = null;
    try {
      ipfsResult = await uploadIPFSMetadata({
        name,
        description,
        openDate: openDate ? new Date(openDate) : null
      });
      console.log('IPFS 메타데이터 업로드 성공:', ipfsResult);
    } catch (ipfsError) {
      console.error('IPFS 메타데이터 업로드 실패:', ipfsError);
      return NextResponse.json({
        success: false,
        error: 'IPFS 메타데이터 업로드에 실패했습니다.'
      }, { status: 500 });
    }

    // Provider 초기화
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    
    // 서비스 지갑 초기화
    const serviceWallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // 컨트랙트 인스턴스 생성
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      serviceWallet
    );

    // openDate를 Unix timestamp로 변환
    const openDateTimestamp = openDate 
      ? Math.floor(new Date(openDate).getTime() / 1000)
      : 0;

    // 스마트컨트랙트 함수 호출 (IPFS CID 포함)
    const tx = await contract.createCapsule(
      recipients, // 요청에서 받은 recipients 배열
      name,
      description,
      openDateTimestamp,
      ipfsResult.unopenedIpfsMetadataCid ? `ipfs://${ipfsResult.unopenedIpfsMetadataCid}` : '',
      ipfsResult.openedIpfsMetadataCid ? `ipfs://${ipfsResult.openedIpfsMetadataCid}` : ''
    );

    // 트랜잭션 완료 대기
    const receipt = await tx.wait();
    
    console.log('타임캡슐 생성 트랜잭션 완료:', receipt.hash);
    
    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber),
      ipfs: ipfsResult
    });

  } catch (error) {
    console.error('타임캡슐 생성 실패:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 