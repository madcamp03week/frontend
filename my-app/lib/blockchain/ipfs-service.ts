import PinataClient from '@pinata/sdk';

const pinata = new PinataClient({
  pinataApiKey: process.env.PINATA_API_KEY!,
  pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY!,
});

// 재시도 로직을 위한 헬퍼 함수
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`[IPFS 재시도] 시도 ${attempt}/${maxRetries} 실패:`, error);
      
      if (attempt < maxRetries) {
        console.log(`[IPFS 재시도] ${delayMs}ms 후 재시도합니다...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        // 재시도 간격을 점진적으로 증가 (지수 백오프)
        delayMs *= 2;
      }
    }
  }
  
  throw new Error(`최대 재시도 횟수(${maxRetries})를 초과했습니다. 마지막 오류: ${lastError!.message}`);
}

// 파일 업로드 함수
async function uploadFileToIPFS(file: {
  encryptedData: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  isEncrypted: boolean;
}): Promise<{ name: string; type: string; size: number; isEncrypted: boolean; ipfsUrl: string }> {
  return retryOperation(async () => {
    console.log('file:', file);
    const base64Length = file.encryptedData.length;
    const hasPadding = file.encryptedData.endsWith('=') || file.encryptedData.endsWith('==');
    console.log(`[IPFS 업로드] 파일명: ${file.fileName}, base64 길이: ${base64Length}, 패딩 포함 여부: ${hasPadding}`);
    
    const buffer = Buffer.from(file.encryptedData, 'base64');
    const fileKey = `chronos_file_${Date.now()}_${file.fileName}`;
    
    // Pinata는 파일 스트림을 요구하므로, buffer를 Readable로 변환
    const { Readable } = require('stream');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream.path = fileKey; // 파일명 지정
    
    const result = await pinata.pinFileToIPFS(stream, {
      pinataMetadata: { name: fileKey },
    });
    
    console.log('result:', result);
    const ipfsUrl = `ipfs://${result.IpfsHash}`;
    
    return {
      name: file.originalName || file.fileName,
      type: file.fileType,
      size: file.fileSize,
      isEncrypted: file.isEncrypted,
      ipfsUrl
    };
  });
}

// 메타데이터 업로드 함수
async function uploadMetadataToIPFS(metadata: any, fileName: string): Promise<{ IpfsHash: string }> {
  return retryOperation(async () => {
    return await pinata.pinJSONToIPFS(metadata, { pinataMetadata: { name: fileName } });
  });
}

export async function uploadIPFSMetadata(chronosData: {
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
    let uploadedFileInfos: Array<{ name: string; type: string; size: number; isEncrypted: boolean; ipfsUrl: string }> = [];
    
    if (chronosData.encryptedFiles && Array.isArray(chronosData.encryptedFiles)) {
      // 파일들을 순차적으로 업로드 (병렬 업로드는 네트워크 부하를 줄이기 위해)
      for (const file of chronosData.encryptedFiles) {
        try {
          const fileInfo = await uploadFileToIPFS(file);
          uploadedFileInfos.push(fileInfo);
          console.log(`[IPFS 성공] 파일 업로드 완료: ${file.fileName}`);
        } catch (error) {
          console.error(`[IPFS 실패] 파일 업로드 실패: ${file.fileName}`, error);
          throw new Error(`파일 "${file.fileName}" 업로드에 실패했습니다: ${error}`);
        }
      }
    }

    const unopenedMetadata = {
      name: `${chronosData.name} (Unopened)`,
      description: chronosData.description,
      image: "ipfs://bafybeibd63ibvb2mp3jgfuxdjsso7mnkm7jkvjd7qczja5vylxyy2lvkvi",
      attributes: [
        { 
          trait_type: "Open Date", 
          value: chronosData.openDate ? chronosData.openDate.toISOString() : "Never" 
        },
        {
          trait_type: "isEncrypted",
          value: chronosData.isEncrypted
        },
        {
          trait_type: "isOpened",
          value: false
        }
      ],
      properties: {
        contentTypes: [],
      }
    };

    const openedMetadata = {
      name: `${chronosData.name} (Opened)`,
      description: chronosData.description,
      image: "ipfs://bafybeigqktpxgkwmovr66cbyxxkszhjv2oiqcjtdct45tqgte6mkxy6waq",
      attributes: [
        { 
          trait_type: "Open Date", 
          value: chronosData.openDate ? chronosData.openDate.toISOString() : "Never" 
        },
        {
          trait_type: "isEncrypted",
          value: chronosData.isEncrypted
        },
        {
          trait_type: "isOpened",
          value: true
        }
      ],
      properties: {
        contentTypes: [],
        data: uploadedFileInfos
      }
    };

    console.log('unopenedMetadata:', unopenedMetadata);
    console.log('openedMetadata:', openedMetadata);

    const timestamp = Date.now();
    const unopenedFileName = `unopened_${timestamp}.json`;
    const openedFileName = `opened_${timestamp}.json`;

    // 메타데이터 업로드도 재시도 로직 적용
    const [unopenedResult, openedResult] = await Promise.all([
      uploadMetadataToIPFS(unopenedMetadata, unopenedFileName),
      uploadMetadataToIPFS(openedMetadata, openedFileName)
    ]);

    console.log('[IPFS 성공] 메타데이터 업로드 완료');

    return {
      unopenedIpfsMetadataCid: unopenedResult.IpfsHash,
      openedIpfsMetadataCid: openedResult.IpfsHash,
      unopenedUrl: `ipfs://${unopenedResult.IpfsHash}`,
      openedUrl: `ipfs://${openedResult.IpfsHash}`,
      uploadedFileInfos
    };
  } catch (error) {
    console.error('IPFS 메타데이터 업로드 실패:', error);
    throw new Error(`IPFS 메타데이터 업로드에 실패했습니다: ${error}`);
  }
} 