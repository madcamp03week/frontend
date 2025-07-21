import { ethers } from 'ethers';
import sodium from 'libsodium-wrappers-sumo';

const ENCRYPTION_KEY = process.env.SERVER_SIDE_ENCRYPTION_KEY;

// libsodium 초기화
let sodiumReady = false;
const initSodium = async (): Promise<typeof sodium> => {
  if (!sodiumReady) {
    await sodium.ready;
    sodiumReady = true;
  }
  return sodium;
};

// Private Key 암호화 (시스템 키만 사용)
export const encryptPrivateKey = async (privateKey: string): Promise<string> => {
  try {
    const sodium = await initSodium();
    
    if (!ENCRYPTION_KEY) {
      throw new Error('암호화 키가 설정되지 않았습니다.');
    }
    
    // 시스템 암호화 키를 32바이트로 변환
    const keyBytes = sodium.from_string(ENCRYPTION_KEY.slice(0, 32));
    
    // 랜덤 nonce 생성
    const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    
    // Private Key를 바이트로 변환
    const privateKeyBytes = sodium.from_string(privateKey);
    
    // AES-256 암호화 (XChaCha20-Poly1305 사용)
    const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      privateKeyBytes,
      null, // 추가 데이터 없음
      null, // 추가 데이터 없음
      nonce,
      keyBytes
    );
    
    // nonce와 암호화된 데이터를 결합하여 base64로 인코딩
    const combined = new Uint8Array(nonce.length + encrypted.length);
    combined.set(nonce);
    combined.set(encrypted, nonce.length);
    
    return sodium.to_base64(combined);
  } catch (error) {
    console.error('Private Key 암호화 오류:', error);
    throw new Error('Private Key 암호화에 실패했습니다.');
  }
};

// Private Key 암호화 (개인 비밀번호 사용)
export const encryptPrivateKeyWithPassword = async (privateKey: string, password: string): Promise<string> => {
  try {
    const sodium = await initSodium();
    
    if (!password || password.length < 6) {
      throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
    }
    
    // 비밀번호를 32바이트 키로 변환 (Argon2 사용)
    const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
    const keyBytes = sodium.crypto_pwhash(
      sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
      password,
      salt,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_DEFAULT
    );
    
    // 랜덤 nonce 생성
    const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    
    // Private Key를 바이트로 변환
    const privateKeyBytes = sodium.from_string(privateKey);
    
    // AES-256 암호화 (XChaCha20-Poly1305 사용)
    const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      privateKeyBytes,
      null, // 추가 데이터 없음
      null, // 추가 데이터 없음
      nonce,
      keyBytes
    );
    
    // salt, nonce, 암호화된 데이터를 결합하여 base64로 인코딩
    const combined = new Uint8Array(salt.length + nonce.length + encrypted.length);
    combined.set(salt);
    combined.set(nonce, salt.length);
    combined.set(encrypted, salt.length + nonce.length);
    
    return sodium.to_base64(combined);
  } catch (error) {
    console.error('Private Key 비밀번호 암호화 오류:', error);
    throw new Error('Private Key 비밀번호 암호화에 실패했습니다.');
  }
};

// Private Key 복호화 (시스템 키만 사용)
export const decryptPrivateKey = async (encryptedPrivateKey: string): Promise<string> => {
  try {
    const sodium = await initSodium();
    
    if (!ENCRYPTION_KEY) {
      throw new Error('암호화 키가 설정되지 않았습니다.');
    }
    
    // 시스템 암호화 키를 32바이트로 변환
    const keyBytes = sodium.from_string(ENCRYPTION_KEY.slice(0, 32));
    
    // base64 디코딩
    const combined = sodium.from_base64(encryptedPrivateKey);
    
    // nonce와 암호화된 데이터 분리
    const nonce = combined.slice(0, sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const encrypted = combined.slice(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    
    // AES-256 복호화
    const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null, // 추가 데이터 없음
      encrypted,
      null, // 추가 데이터 없음
      nonce,
      keyBytes
    );
    
    return sodium.to_string(decrypted);
  } catch (error) {
    console.error('Private Key 복호화 오류:', error);
    throw new Error('Private Key 복호화에 실패했습니다.');
  }
};

// Private Key 복호화 (개인 비밀번호 사용)
export const decryptPrivateKeyWithPassword = async (encryptedPrivateKey: string, password: string): Promise<string> => {
  try {
    const sodium = await initSodium();
    
    if (!password || password.length < 6) {
      throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
    }
    
    // base64 디코딩
    const combined = sodium.from_base64(encryptedPrivateKey);
    
    // salt, nonce, 암호화된 데이터 분리
    const salt = combined.slice(0, sodium.crypto_pwhash_SALTBYTES);
    const nonce = combined.slice(
      sodium.crypto_pwhash_SALTBYTES,
      sodium.crypto_pwhash_SALTBYTES + sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
    );
    const encrypted = combined.slice(sodium.crypto_pwhash_SALTBYTES + sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    
    // 비밀번호로부터 키 재생성
    const keyBytes = sodium.crypto_pwhash(
      sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
      password,
      salt,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_DEFAULT
    );
    
    // AES-256 복호화
    const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null, // 추가 데이터 없음
      encrypted,
      null, // 추가 데이터 없음
      nonce,
      keyBytes
    );
    
    return sodium.to_string(decrypted);
  } catch (error) {
    console.error('Private Key 비밀번호 복호화 오류:', error);
    throw new Error('Private Key 비밀번호 복호화에 실패했습니다.');
  }
};

// 지갑 주소로부터 Private Key 복구 (암호화된 데이터 사용)
export const recoverWalletFromEncryptedKey = async (
  encryptedPrivateKey: string
): Promise<ethers.Wallet> => {
  try {
    const privateKey = await decryptPrivateKey(encryptedPrivateKey);
    return new ethers.Wallet(privateKey);
  } catch (error) {
    console.error('지갑 복구 오류:', error);
    throw new Error('지갑을 복구할 수 없습니다.');
  }
};

// 지갑 주소로부터 Private Key 복구 (비밀번호로 암호화된 데이터 사용)
export const recoverWalletFromPasswordEncryptedKey = async (
  encryptedPrivateKey: string,
  password: string
): Promise<ethers.Wallet> => {
  try {
    const privateKey = await decryptPrivateKeyWithPassword(encryptedPrivateKey, password);
    return new ethers.Wallet(privateKey);
  } catch (error) {
    console.error('비밀번호 지갑 복구 오류:', error);
    throw new Error('비밀번호로 암호화된 지갑을 복구할 수 없습니다.');
  }
};

// 암호화 키 유효성 검사
export const validateEncryptionKey = (): boolean => {
  return ENCRYPTION_KEY ? ENCRYPTION_KEY.length >= 32 : false;
}; 