import { ethers } from 'ethers';
import { CONTRACT_ABI } from './contract-abi';
import AWS from 'aws-sdk';

// 환경 변수에서 설정 가져오기 (서버 사이드)
const INFURA_URL = process.env.INFURA_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

export * from './blockchain/ipfs-service';
export * from './blockchain/contract-service';
export * from './blockchain/wallet-service'; 