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

export * from './blockchain/ipfs-service';
export * from './blockchain/contract-service';
export * from './blockchain/wallet-service'; 