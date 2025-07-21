import { ethers } from 'ethers';
import { CONTRACT_ABI } from '@/lib/contract-abi';

const INFURA_URL = process.env.INFURA_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

export async function fetchOpenDateByTokenId(tokenId: string): Promise<{ openDate: string | null, isOpened: boolean | null }> {
  if (!INFURA_URL || !CONTRACT_ADDRESS) throw new Error('환경변수 미설정');
  const provider = new ethers.JsonRpcProvider(INFURA_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  let tokenUri = await contract.tokenURI(tokenId);
  if (tokenUri.startsWith('ipfs://')) {
    tokenUri = tokenUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
  }
  const res = await fetch(tokenUri);
  if (!res.ok) throw new Error('IPFS 메타데이터 fetch 실패');
  const metadata = await res.json();
  return {
    openDate: metadata.attributes?.find((a: any) => a.trait_type === 'Open Date')?.value || null,
    isOpened: metadata.attributes?.find((a: any) => a.trait_type === 'isOpened')?.value ?? null
  };
} 