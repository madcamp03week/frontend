import { ethers } from 'ethers';

const INFURA_URL = process.env.INFURA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

export async function getServiceWalletInfo() {
  try {
    if (!PRIVATE_KEY) throw new Error('서비스 지갑 개인키가 설정되지 않았습니다.');
    if (!INFURA_URL) throw new Error('Infura URL이 설정되지 않았습니다.');
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const serviceWallet = new ethers.Wallet(PRIVATE_KEY, provider);
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
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

export async function getNetworkInfo() {
  try {
    if (!INFURA_URL) throw new Error('Infura URL이 설정되지 않았습니다.');
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
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
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
} 