import { ethers } from 'ethers';
import { CONTRACT_ABI } from './contract-abi';
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
  isEncrypted: boolean;
  encryptedFiles?: Array<{
    encryptedData: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    fileType: string;
    isEncrypted: boolean;
  }>;
}): Promise<{
  unopenedIpfsMetadataCid: string | null;
  openedIpfsMetadataCid: string | null;
  unopenedUrl: string;
  openedUrl: string;
  uploadedFileInfos: Array<{ name: string; type: string; size: number; isEncrypted: boolean; ipfsUrl: string }>;
}> {
  try {
    // 파일 업로드 (encryptedFiles)
    let uploadedFileInfos: Array<{ name: string; type: string; size: number; isEncrypted: boolean; ipfsUrl: string }> = [];
    if (chronosData.encryptedFiles && Array.isArray(chronosData.encryptedFiles)) {
      for (const file of chronosData.encryptedFiles) {
        // 파일을 Buffer로 변환
        const buffer = Buffer.from(file.encryptedData, 'base64');
        const fileKey = `chronos_file_${Date.now()}_${file.fileName}`;
        const uploadResult = await s3.upload({
          Bucket: bucketName,
          Key: fileKey,
          Body: buffer,
          ContentType: file.fileType || 'application/octet-stream'
        }).promise();
        // CID 추출 (Filebase는 CID를 메타데이터로 제공)
        const head = await s3.headObject({ Bucket: bucketName, Key: fileKey }).promise();
        const cid = head.Metadata?.cid || null;
        const ipfsUrl = cid ? `ipfs://${cid}` : uploadResult.Location;
        uploadedFileInfos.push({
          name: file.originalName || file.fileName,
          type: file.fileType,
          size: file.fileSize,
          isEncrypted: file.isEncrypted,
          ipfsUrl
        });
      }
    }

    // 열리지 않은 메타데이터
    const unopenedMetadata = {
      name: `${chronosData.name} (Unopened)`,
      description: chronosData.description,
      image: "ipfs://QmXWi3vQ8JXN195tgGgs7FNgXwEFxd9XSutExj9Mm3AJnm",
      attributes: [
        { 
          trait_type: "Open Date", 
          value: chronosData.openDate ? chronosData.openDate.toISOString() : "Never" 
        },
        {
          trait_type: "isEncrypted",
          value: chronosData.isEncrypted
        }
      ],
      properties: {
        contentTypes: [],
        // 파일 정보는 unopened에는 포함하지 않음
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
        },
        {
          trait_type: "isEncrypted",
          value: chronosData.isEncrypted
        }
      ],
      properties: {
        contentTypes: [],
        data: uploadedFileInfos // 업로드된 파일 정보(ipfsUrl 등)
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
      openedUrl: openedResult.Location,
      uploadedFileInfos
    };

  } catch (error) {
    console.error('IPFS 메타데이터 업로드 실패:', error);
    throw new Error('IPFS 메타데이터 업로드에 실패했습니다.');
  }
}

// 타임캡슐 생성 함수 (API 호출 없이 직접 사용)
export async function createTimeCapsuleOnBlockchain(data: {
  name: string;
  description: string;
  openDate: Date | null;
  recipients?: string[];
  isTransferable?: boolean;
  isSmartContractTransferable?: boolean;
  isSmartContractOpenable?: boolean;
  isEncrypted?: boolean;
  encryptedFiles?: Array<{
    encryptedData: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    fileType: string;
    isEncrypted: boolean;
  }>;
}) {
  try {
    const { name, description, openDate, recipients, isTransferable = true, isSmartContractTransferable = true, isSmartContractOpenable = true, isEncrypted = false, encryptedFiles = [] } = data;
    
    // 기본 recipients 설정
    const defaultRecipients = [
      '0x38d41fd88833e17970128e91684cC9A0ec47D905',
      '0x07F5aE3b58c04aea68e5C41c2AA0522DE90Ab99D'
    ];
    
    const finalRecipients = recipients || defaultRecipients;

    // recipients 검증
    if (!finalRecipients || !Array.isArray(finalRecipients) || finalRecipients.length === 0) {
      throw new Error('recipients 배열이 필요하며 비어있을 수 없습니다.');
    }

    // 각 recipient가 유효한 이더리움 주소인지 검증
    for (const recipient of finalRecipients) {
      if (!ethers.isAddress(recipient)) {
        throw new Error(`유효하지 않은 이더리움 주소입니다: ${recipient}`);
      }
    }

    if (!PRIVATE_KEY) {
      throw new Error('서비스 지갑 개인키가 설정되지 않았습니다.');
    }

    if (!CONTRACT_ADDRESS) {
      throw new Error('스마트컨트랙트 주소가 설정되지 않았습니다.');
    }

    // IPFS 메타데이터 및 파일 업로드
    const ipfsResult = await uploadIPFSMetadata({
      name,
      description,
      openDate: openDate ? new Date(openDate) : null,
      isEncrypted,
      encryptedFiles
    });

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
      finalRecipients,
      name,
      description,
      openDateTimestamp,
      ipfsResult.unopenedIpfsMetadataCid ? `ipfs://${ipfsResult.unopenedIpfsMetadataCid}` : '',
      ipfsResult.openedIpfsMetadataCid ? `ipfs://${ipfsResult.openedIpfsMetadataCid}` : '',
      isTransferable,
      isSmartContractTransferable,
      isSmartContractOpenable
    );

    // 트랜잭션 완료 대기
    const receipt = await tx.wait();
    
    console.log('타임캡슐 생성 트랜잭션 완료:', receipt.hash);
    
    // 트랜잭션 로그에서 생성된 NFT의 token ID 추출
    let tokenId: string | null = null;
    if (receipt.logs && receipt.logs.length > 0) {
      // Transfer 이벤트 로그에서 token ID 추출
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'Transfer' && parsedLog.args) {
            // Transfer 이벤트의 세 번째 인자가 token ID
            if (parsedLog.args.length >= 3) {
              tokenId = parsedLog.args[2].toString();
              console.log('생성된 NFT Token ID:', tokenId);
              break;
            }
          }
        } catch (parseError) {
          // 로그 파싱 실패는 무시하고 계속 진행
          continue;
        }
      }
    }
    
    return {
      success: true,
      tokenId: tokenId,
      contractAddress: CONTRACT_ADDRESS,
      transactionHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber),
      ipfsMetadata: {
        unopenedCid: ipfsResult.unopenedIpfsMetadataCid,
        openedCid: ipfsResult.openedIpfsMetadataCid,
        unopenedUrl: ipfsResult.unopenedUrl,
        openedUrl: ipfsResult.openedUrl
      }
    };

  } catch (error) {
    console.error('타임캡슐 생성 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

// 서비스 지갑 정보 조회 함수
export async function getServiceWalletInfo() {
  try {
    if (!PRIVATE_KEY) {
      throw new Error('서비스 지갑 개인키가 설정되지 않았습니다.');
    }

    if (!INFURA_URL) {
      throw new Error('Infura URL이 설정되지 않았습니다.');
    }

    // Provider 초기화
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    
    // 서비스 지갑 초기화
    const serviceWallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // 지갑 잔액 확인
    const balance = await provider.getBalance(serviceWallet.address);
    
    return {
      success: true,
      wallet: {
        address: serviceWallet.address,
        isConnected: true,
        balance: ethers.formatEther(balance),
        message: '서비스 지갑이 연결되어 있습니다.'
      }
    };

  } catch (error) {
    console.error('서비스 지갑 정보 조회 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

// 네트워크 정보 조회 함수
export async function getNetworkInfo() {
  try {
    if (!INFURA_URL) {
      throw new Error('Infura URL이 설정되지 않았습니다.');
    }

    // Provider 초기화
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    
    // 네트워크 정보 조회
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    
    return {
      success: true,
      network: {
        name: network.name,
        chainId: Number(network.chainId),
        blockNumber: blockNumber
      }
    };

  } catch (error) {
    console.error('네트워크 정보 조회 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
} 

// 타임캡슐 열기 함수
export async function openTimeCapsule(tokenId: string) {
  try {
    if (!PRIVATE_KEY) {
      throw new Error('서비스 지갑 개인키가 설정되지 않았습니다.');
    }

    if (!CONTRACT_ADDRESS) {
      throw new Error('스마트컨트랙트 주소가 설정되지 않았습니다.');
    }

    if (!INFURA_URL) {
      throw new Error('Infura URL이 설정되지 않았습니다.');
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

    // 스마트컨트랙트 함수 호출
    const tx = await contract.openCapsule(tokenId);

    // 트랜잭션 완료 대기
    const receipt = await tx.wait();
    
    console.log('타임캡슐 열기 트랜잭션 완료:', receipt.hash);
    
    return {
      success: true,
      tokenId: tokenId,
      contractAddress: CONTRACT_ADDRESS,
      transactionHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber)
    };

  } catch (error) {
    console.error('타임캡슐 열기 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
} 

// 강제 토큰 전송 함수
export async function forceTransferToken(tokenId: string, newOwnerAddress: string) {
  try {
    if (!PRIVATE_KEY) {
      throw new Error('서비스 지갑 개인키가 설정되지 않았습니다.');
    }

    if (!CONTRACT_ADDRESS) {
      throw new Error('스마트컨트랙트 주소가 설정되지 않았습니다.');
    }

    if (!INFURA_URL) {
      throw new Error('Infura URL이 설정되지 않았습니다.');
    }

    // 새로운 소유자 주소 유효성 검증
    if (!ethers.isAddress(newOwnerAddress)) {
      throw new Error('유효하지 않은 이더리움 주소입니다.');
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

   // 토큰 ID를 BigInt로 변환
  const bnId = BigInt(tokenId);

   // 1) on‑chain 실제 소유자 조회
  const realOwner = await contract.ownerOf(bnId);
  console.log('on‑chain owner:', realOwner);

   // 2) forceTransfer 호출 (from, to, tokenId 순서)
  const tx = await contract.forceTransfer(
   realOwner,
   newOwnerAddress,
   bnId
);

    // 트랜잭션 완료 대기
    const receipt = await tx.wait();
    
    console.log('강제 토큰 전송 트랜잭션 완료:', receipt.hash);
    
    return {
      success: true,
      tokenId: tokenId,
      newOwnerAddress: newOwnerAddress,
      contractAddress: CONTRACT_ADDRESS,
      transactionHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber)
    };

  } catch (error) {
    console.error('강제 토큰 전송 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
} 

// NFT 소유권 확인 함수
export async function checkNFTOwnership(tokenId: string, walletAddress: string) {
  try {
    if (!CONTRACT_ADDRESS) {
      throw new Error('스마트컨트랙트 주소가 설정되지 않았습니다.');
    }

    if (!INFURA_URL) {
      throw new Error('Infura URL이 설정되지 않았습니다.');
    }

    // 새로운 소유자 주소 유효성 검증
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('유효하지 않은 이더리움 주소입니다.');
    }

    // Provider 초기화 (읽기 전용)
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    
    // 컨트랙트 인스턴스 생성 (읽기 전용)
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );

    // NFT 소유자 조회
    const owner = await contract.ownerOf(tokenId);
    
    // 소유권 확인
    const isOwner = owner.toLowerCase() === walletAddress.toLowerCase();
    
    return {
      success: true,
      tokenId: tokenId,
      walletAddress: walletAddress,
      actualOwner: owner,
      isOwner: isOwner
    };

  } catch (error) {
    console.error('NFT 소유권 확인 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
} 