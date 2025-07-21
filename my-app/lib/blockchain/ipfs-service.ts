import PinataClient from '@pinata/sdk';

const pinata = new PinataClient({
  pinataApiKey: process.env.PINATA_API_KEY!,
  pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY!,
});

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
      for (const file of chronosData.encryptedFiles) {
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
        uploadedFileInfos.push({
          name: file.originalName || file.fileName,
          type: file.fileType,
          size: file.fileSize,
          isEncrypted: file.isEncrypted,
          ipfsUrl
        });
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

    const [unopenedResult, openedResult] = await Promise.all([
      pinata.pinJSONToIPFS(unopenedMetadata, { pinataMetadata: { name: unopenedFileName } }),
      pinata.pinJSONToIPFS(openedMetadata, { pinataMetadata: { name: openedFileName } })
    ]);

    return {
      unopenedIpfsMetadataCid: unopenedResult.IpfsHash,
      openedIpfsMetadataCid: openedResult.IpfsHash,
      unopenedUrl: `ipfs://${unopenedResult.IpfsHash}`,
      openedUrl: `ipfs://${openedResult.IpfsHash}`,
      uploadedFileInfos
    };
  } catch (error) {
    console.error('IPFS 메타데이터 업로드 실패:', error);
    throw new Error('IPFS 메타데이터 업로드에 실패했습니다.');
  }
} 