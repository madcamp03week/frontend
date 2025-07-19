import { ethers } from 'ethers';

// 암호화 키 (실제 프로덕션에서는 환경변수로 관리해야 함)
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

// Private Key 암호화 (시스템 키만 사용)
export const encryptPrivateKey = (privateKey: string): string => {
  try {
    if (!ENCRYPTION_KEY) {
      throw new Error('암호화 키가 설정되지 않았습니다.');
    }
    
    // 시스템 암호화 키를 32바이트로 변환
    const keyBytes = ethers.toUtf8Bytes(ENCRYPTION_KEY.slice(0, 32));
    
    // 간단한 XOR 암호화 (실제 프로덕션에서는 더 강력한 암호화 사용)
    const privateKeyBytes = ethers.toUtf8Bytes(privateKey);
    
    const encrypted = new Uint8Array(privateKeyBytes.length);
    for (let i = 0; i < privateKeyBytes.length; i++) {
      encrypted[i] = privateKeyBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // 암호화된 데이터를 base64로 인코딩
    return ethers.encodeBase64(encrypted);
  } catch (error) {
    console.error('Private Key 암호화 오류:', error);
    throw new Error('Private Key 암호화에 실패했습니다.');
  }
};

// Private Key 복호화 (시스템 키만 사용)
export const decryptPrivateKey = (encryptedPrivateKey: string): string => {
  try {
    if (!ENCRYPTION_KEY) {
      throw new Error('암호화 키가 설정되지 않았습니다.');
    }
    
    // 시스템 암호화 키를 32바이트로 변환
    const keyBytes = ethers.toUtf8Bytes(ENCRYPTION_KEY.slice(0, 32));
    
    // base64 디코딩
    const encryptedBytes = ethers.decodeBase64(encryptedPrivateKey);
    
    // XOR 복호화
    const decrypted = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return ethers.toUtf8String(decrypted);
  } catch (error) {
    console.error('Private Key 복호화 오류:', error);
    throw new Error('Private Key 복호화에 실패했습니다.');
  }
};

// 지갑 주소로부터 Private Key 복구 (암호화된 데이터 사용)
export const recoverWalletFromEncryptedKey = (
  encryptedPrivateKey: string
): ethers.Wallet => {
  try {
    const privateKey = decryptPrivateKey(encryptedPrivateKey);
    return new ethers.Wallet(privateKey);
  } catch (error) {
    console.error('지갑 복구 오류:', error);
    throw new Error('지갑을 복구할 수 없습니다.');
  }
};

// 암호화 키 유효성 검사
export const validateEncryptionKey = (): boolean => {
  return ENCRYPTION_KEY ? ENCRYPTION_KEY.length >= 32 : false;
}; 