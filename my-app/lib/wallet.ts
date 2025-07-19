import { ethers } from 'ethers';

// MetaMask 타입 선언
declare global {
  interface Window {
    ethereum?: any;
  }
}

// 폴리곤 네트워크 설정
export const POLYGON_NETWORK = {
  chainId: '0x89', // 137 in decimal
  chainName: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: ['https://polygon-rpc.com/'],
  blockExplorerUrls: ['https://polygonscan.com/'],
};

// 새로운 폴리곤 지갑 생성
export const createPolygonWallet = () => {
  try {
    // 새로운 지갑 생성
    const wallet = ethers.Wallet.createRandom();
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
      publicKey: wallet.publicKey,
    };
  } catch (error) {
    console.error('지갑 생성 중 오류:', error);
    throw new Error('지갑 생성에 실패했습니다.');
  }
};

// 지갑 주소 유효성 검사
export const isValidAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

// 폴리곤 네트워크에 연결
export const connectToPolygon = () => {
  try {
    // MetaMask가 설치되어 있는지 확인
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    } else {
      // MetaMask가 없으면 RPC URL로 직접 연결
      return new ethers.JsonRpcProvider('https://polygon-rpc.com/');
    }
  } catch (error) {
    console.error('폴리곤 네트워크 연결 오류:', error);
    throw new Error('폴리곤 네트워크에 연결할 수 없습니다.');
  }
};

// 지갑 잔액 조회
export const getWalletBalance = async (address: string): Promise<string> => {
  try {
    const provider = connectToPolygon();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('잔액 조회 오류:', error);
    throw new Error('잔액을 조회할 수 없습니다.');
  }
};

// 폴리곤 네트워크로 전환 요청 (MetaMask)
export const requestPolygonNetwork = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [POLYGON_NETWORK],
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        // 네트워크가 이미 추가되어 있는 경우
        return true;
      }
      console.error('폴리곤 네트워크 추가 오류:', error);
      throw new Error('폴리곤 네트워크를 추가할 수 없습니다.');
    }
  }
  return false;
};

// 지갑 정보를 안전하게 저장 (실제 프로덕션에서는 암호화 필요)
export const saveWalletInfo = (userId: string, walletInfo: any) => {
  try {
    // 실제로는 서버에 안전하게 저장해야 합니다
    const walletData = {
      userId,
      address: walletInfo.address,
      // privateKey는 보안상 서버에 저장하지 않는 것이 좋습니다
      createdAt: new Date().toISOString(),
    };
    
    // 로컬 스토리지에 임시 저장 (개발용)
    localStorage.setItem(`wallet_${userId}`, JSON.stringify(walletData));
    
    return walletData;
  } catch (error) {
    console.error('지갑 정보 저장 오류:', error);
    throw new Error('지갑 정보를 저장할 수 없습니다.');
  }
};

// 지갑 정보 조회
export const getWalletInfo = (userId: string) => {
  try {
    const walletData = localStorage.getItem(`wallet_${userId}`);
    return walletData ? JSON.parse(walletData) : null;
  } catch (error) {
    console.error('지갑 정보 조회 오류:', error);
    return null;
  }
}; 