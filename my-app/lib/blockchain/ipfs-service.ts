import AWS from 'aws-sdk';

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
        const buffer = Buffer.from(file.encryptedData, 'base64');
        const fileKey = `chronos_file_${Date.now()}_${file.fileName}`;
        const uploadResult = await s3.upload({
          Bucket: bucketName,
          Key: fileKey,
          Body: buffer,
          ContentType: file.fileType || 'application/octet-stream'
        }).promise();
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
      }
    };

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
        data: uploadedFileInfos
      }
    };

    const timestamp = Date.now();
    const unopenedFileName = `unopened_${timestamp}.json`;
    const openedFileName = `opened_${timestamp}.json`;

    const uploadPromises = [
      s3.upload({
        Bucket: bucketName,
        Key: unopenedFileName,
        Body: JSON.stringify(unopenedMetadata, null, 2),
        ContentType: 'application/json'
      }).promise(),
      s3.upload({
        Bucket: bucketName,
        Key: openedFileName,
        Body: JSON.stringify(openedMetadata, null, 2),
        ContentType: 'application/json'
      }).promise()
    ];

    const [unopenedResult, openedResult] = await Promise.all(uploadPromises);

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