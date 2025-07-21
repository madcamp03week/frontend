import { adminDb } from './firebase-admin';

// 지갑 데이터 인터페이스
export interface WalletData {
  id: string;
  userId: string;
  address: string;
  encryptedPrivateKey?: string; // 암호화된 Private Key
  network: 'polygon';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  label?: string;
  userMade?: boolean; // 사용자가 직접 생성한 지갑인지 여부
}

// Admin SDK를 사용한 사용자의 모든 지갑 조회 (활성 지갑만)
export const getUserWalletsAdmin = async (userId: string): Promise<WalletData[]> => {
  try {
    console.log('Admin SDK로 사용자 활성 지갑 조회 시도:', userId);
    const walletsRef = adminDb.collection('wallets');
    const q = walletsRef.where('userId', '==', userId).where('isActive', '==', true);
    console.log('Admin SDK 활성 지갑 조회 쿼리 실행');
    const querySnapshot = await q.get();
    
    console.log('Admin SDK 활성 지갑 조회 결과 - 문서 수:', querySnapshot.size);
    
    const wallets: WalletData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Admin SDK 활성 지갑 문서 데이터:', doc.id, data);
      wallets.push({
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as WalletData);
    });
    
    console.log('Admin SDK 최종 반환할 활성 지갑 목록:', wallets);
    return wallets;
  } catch (error) {
    console.error('Admin SDK 사용자 활성 지갑 조회 오류:', error);
    console.error('조회하려던 사용자 ID:', userId);
    throw new Error('사용자 활성 지갑을 조회할 수 없습니다.');
  }
};

// Admin SDK를 사용한 사용자의 모든 지갑 조회 (활성 + 비활성)
export const getAllUserWalletsAdmin = async (userId: string): Promise<WalletData[]> => {
  try {
    console.log('Admin SDK로 사용자 모든 지갑 조회 시도:', userId);
    const walletsRef = adminDb.collection('wallets');
    const q = walletsRef.where('userId', '==', userId);
    console.log('Admin SDK 모든 지갑 조회 쿼리 실행');
    const querySnapshot = await q.get();
    
    console.log('Admin SDK 모든 지갑 조회 결과 - 문서 수:', querySnapshot.size);
    
    const wallets: WalletData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Admin SDK 지갑 문서 데이터:', doc.id, data);
      wallets.push({
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as WalletData);
    });
    
    console.log('Admin SDK 최종 반환할 모든 지갑 목록:', wallets);
    return wallets;
  } catch (error) {
    console.error('Admin SDK 사용자 모든 지갑 조회 오류:', error);
    console.error('조회하려던 사용자 ID:', userId);
    throw new Error('사용자 모든 지갑을 조회할 수 없습니다.');
  }
}; 
