import { ethers } from 'ethers';
import { CONTRACT_ABI } from '../contract-abi';
import { uploadIPFSMetadata } from './ipfs-service';
import { CHRONOS_TOKEN_CONTRACT_ABI } from '../contract-abi';

const INFURA_URL = process.env.INFURA_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const CHRONOS_TOKEN_CONTRACT_ADDR = process.env.CHRONOS_TOKEN_CONTRACT_ADDR;

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
    const defaultRecipients = [
      '0x38d41fd88833e17970128e91684cC9A0ec47D905',
      '0x07F5aE3b58c04aea68e5C41c2AA0522DE90Ab99D'
    ];
    const finalRecipients = recipients || defaultRecipients;
    if (!finalRecipients || !Array.isArray(finalRecipients) || finalRecipients.length === 0) {
      throw new Error('recipients 배열이 필요하며 비어있을 수 없습니다.');
    }
    for (const recipient of finalRecipients) {
      if (!ethers.isAddress(recipient)) {
        throw new Error(`유효하지 않은 이더리움 주소입니다: ${recipient}`);
      }
    }
    if (!PRIVATE_KEY) throw new Error('서비스 지갑 개인키가 설정되지 않았습니다.');
    if (!CONTRACT_ADDRESS) throw new Error('스마트컨트랙트 주소가 설정되지 않았습니다.');
    const ipfsResult = await uploadIPFSMetadata({
      name,
      description,
      openDate: openDate ? new Date(openDate) : null,
      isEncrypted,
      encryptedFiles
    });
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const serviceWallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, serviceWallet);
    const openDateTimestamp = openDate ? Math.floor(new Date(openDate).getTime() / 1000) : 0;
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
    const receipt = await tx.wait();
    let tokenId: string | null = null;
    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'Transfer' && parsedLog.args) {
            if (parsedLog.args.length >= 3) {
              tokenId = parsedLog.args[2].toString();
              break;
            }
          }
        } catch (parseError) {
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
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

export async function openTimeCapsule(tokenId: string) {
  try {
    if (!PRIVATE_KEY) throw new Error('서비스 지갑 개인키가 설정되지 않았습니다.');
    if (!CONTRACT_ADDRESS) throw new Error('스마트컨트랙트 주소가 설정되지 않았습니다.');
    if (!INFURA_URL) throw new Error('Infura URL이 설정되지 않았습니다.');
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const serviceWallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, serviceWallet);
    const tx = await contract.openCapsule(tokenId);
    const receipt = await tx.wait();
    return {
      success: true,
      tokenId: tokenId,
      contractAddress: CONTRACT_ADDRESS,
      transactionHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

export async function forceTransferToken(tokenId: string, newOwnerAddress: string) {
  try {
    if (!PRIVATE_KEY) throw new Error('서비스 지갑 개인키가 설정되지 않았습니다.');
    if (!CONTRACT_ADDRESS) throw new Error('스마트컨트랙트 주소가 설정되지 않았습니다.');
    if (!INFURA_URL) throw new Error('Infura URL이 설정되지 않았습니다.');
    if (!ethers.isAddress(newOwnerAddress)) throw new Error('유효하지 않은 이더리움 주소입니다.');
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const serviceWallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, serviceWallet);
    const bnId = BigInt(tokenId);
    const realOwner = await contract.ownerOf(bnId);
    const tx = await contract.forceTransfer(realOwner, newOwnerAddress, bnId);
    const receipt = await tx.wait();
    return {
      success: true,
      tokenId: tokenId,
      newOwnerAddress: newOwnerAddress,
      contractAddress: CONTRACT_ADDRESS,
      transactionHash: receipt.hash,
      blockNumber: Number(receipt.blockNumber)
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

export async function checkNFTOwnership(tokenId: string, walletAddress: string) {
  try {
    if (!CONTRACT_ADDRESS) throw new Error('스마트컨트랙트 주소가 설정되지 않았습니다.');
    if (!INFURA_URL) throw new Error('Infura URL이 설정되지 않았습니다.');
    if (!ethers.isAddress(walletAddress)) throw new Error('유효하지 않은 이더리움 주소입니다.');
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const owner = await contract.ownerOf(tokenId);
    const isOwner = owner.toLowerCase() === walletAddress.toLowerCase();
    return {
      success: true,
      tokenId: tokenId,
      walletAddress: walletAddress,
      actualOwner: owner,
      isOwner: isOwner
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * CHRONOS 토큰 민팅 함수
 * @param address 민팅 받을 지갑 주소
 * @param amount 민팅할 토큰 수량
 * @returns { success: boolean, txHash?: string, blockNumber?: number, error?: string }
 */
export async function mintChronosToken(address: string, amount: number) {
  try {
    if (!address || !ethers.isAddress(address)) {
      return { success: false, error: '유효하지 않은 주소입니다.' };
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return { success: false, error: '유효하지 않은 수량입니다.' };
    }
    if (!CHRONOS_TOKEN_CONTRACT_ADDR) {
      return { success: false, error: '토큰 컨트랙트 주소가 설정되지 않았습니다.' };
    }
    if (!INFURA_URL) {
      return { success: false, error: 'INFURA_URL이 설정되지 않았습니다.' };
    }
    if (!PRIVATE_KEY) {
      return { success: false, error: 'PRIVATE_KEY가 설정되지 않았습니다.' };
    }
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CHRONOS_TOKEN_CONTRACT_ADDR, CHRONOS_TOKEN_CONTRACT_ABI, wallet);
    const tx = await contract.mint(address, amount);
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (error: any) {
    return { success: false, error: error?.message || '알 수 없는 오류' };
  }
} 