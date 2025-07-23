import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  type DocumentData,
  type QuerySnapshot
} from 'firebase/firestore';
import { firestore } from './firebase';

// 사용자 정보 인터페이스
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 지갑 정보 인터페이스
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

// 사용자 프로필 저장
export const saveUserProfile = async (userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => {
  try {
    const userRef = doc(firestore, 'users', userProfile.uid);
    
    // undefined 값 제거
    const cleanUserData = {
      uid: userProfile.uid,
      email: userProfile.email,
      ...(userProfile.displayName && { displayName: userProfile.displayName }),
      ...(userProfile.photoURL && { photoURL: userProfile.photoURL }),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    console.log('사용자 프로필 저장 시도:', userProfile.uid, cleanUserData);
    await setDoc(userRef, cleanUserData);
    console.log('사용자 프로필이 성공적으로 저장되었습니다:', userProfile.uid);
    return cleanUserData;
  } catch (error) {
    console.error('사용자 프로필 저장 오류:', error);
    console.error('저장하려던 데이터:', userProfile);
    throw new Error('사용자 프로필을 저장할 수 없습니다.');
  }
};

// 사용자 프로필 조회
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    console.log('사용자 프로필 조회 시도:', uid);
    const userRef = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      console.log('사용자 프로필을 찾았습니다:', uid, data);
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile;
    } else {
      console.log('사용자 프로필을 찾을 수 없습니다:', uid);
      return null;
    }
  } catch (error) {
    console.error('사용자 프로필 조회 오류:', error);
    console.error('조회하려던 UID:', uid);
    throw new Error('사용자 프로필을 조회할 수 없습니다.');
  }
};

// 사용자 프로필 업데이트
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    const userRef = doc(firestore, 'users', uid);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(userRef, updateData);
    console.log('사용자 프로필이 업데이트되었습니다:', uid);
    return true;
  } catch (error) {
    console.error('사용자 프로필 업데이트 오류:', error);
    throw new Error('사용자 프로필을 업데이트할 수 없습니다.');
  }
};

// 지갑 정보 저장
export const saveWalletData = async (walletData: Omit<WalletData, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const walletRef = doc(collection(firestore, 'wallets'));
    
    // undefined 값 제거
    const cleanWalletData = {
      userId: walletData.userId,
      address: walletData.address,
      network: walletData.network,
      isActive: walletData.isActive,
      ...(walletData.label && { label: walletData.label }),
      ...(walletData.encryptedPrivateKey && { encryptedPrivateKey: walletData.encryptedPrivateKey }),
      ...(walletData.userMade !== undefined && { userMade: walletData.userMade }),
      id: walletRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(walletRef, cleanWalletData);
    console.log('지갑 정보가 저장되었습니다:', cleanWalletData.id);
    return cleanWalletData;
  } catch (error) {
    console.error('지갑 정보 저장 오류:', error);
    throw new Error('지갑 정보를 저장할 수 없습니다.');
  }
};

// 사용자의 모든 지갑 조회 (활성 지갑만)
export const getUserWallets = async (userId: string): Promise<WalletData[]> => {
  try {
    console.log('사용자 활성 지갑 조회 시도:', userId);
    const walletsRef = collection(firestore, 'wallets');
    const q = query(walletsRef, where('userId', '==', userId), where('isActive', '==', true));
    console.log('활성 지갑 조회 쿼리 실행:', q);
    const querySnapshot = await getDocs(q);
    
    console.log('활성 지갑 조회 결과 - 문서 수:', querySnapshot.size);
    
    const wallets: WalletData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('활성 지갑 문서 데이터:', doc.id, data);
      wallets.push({
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as WalletData);
    });
    
    console.log('최종 반환할 활성 지갑 목록:', wallets);
    return wallets;
  } catch (error) {
    console.error('사용자 활성 지갑 조회 오류:', error);
    console.error('조회하려던 사용자 ID:', userId);
    throw new Error('사용자 활성 지갑을 조회할 수 없습니다.');
  }
};

// 사용자의 모든 지갑 조회 (활성 + 비활성)
export const getAllUserWallets = async (userId: string): Promise<WalletData[]> => {
  try {
    console.log('사용자 모든 지갑 조회 시도:', userId);
    const walletsRef = collection(firestore, 'wallets');
    const q = query(walletsRef, where('userId', '==', userId));
    console.log('모든 지갑 조회 쿼리 실행:', q);
    const querySnapshot = await getDocs(q);
    
    console.log('모든 지갑 조회 결과 - 문서 수:', querySnapshot.size);
    
    const wallets: WalletData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('지갑 문서 데이터:', doc.id, data);
      wallets.push({
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as WalletData);
    });
    
    console.log('최종 반환할 모든 지갑 목록:', wallets);
    return wallets;
  } catch (error) {
    console.error('사용자 모든 지갑 조회 오류:', error);
    console.error('조회하려던 사용자 ID:', userId);
    throw new Error('사용자 모든 지갑을 조회할 수 없습니다.');
  }
};

// 특정 지갑 조회
export const getWalletById = async (walletId: string): Promise<WalletData | null> => {
  try {
    const walletRef = doc(firestore, 'wallets', walletId);
    const walletSnap = await getDoc(walletRef);
    
    if (walletSnap.exists()) {
      const data = walletSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as WalletData;
    } else {
      console.log('지갑을 찾을 수 없습니다:', walletId);
      return null;
    }
  } catch (error) {
    console.error('지갑 조회 오류:', error);
    throw new Error('지갑을 조회할 수 없습니다.');
  }
};

// 지갑 정보 업데이트
export const updateWalletData = async (walletId: string, updates: Partial<WalletData>) => {
  try {
    const walletRef = doc(firestore, 'wallets', walletId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(walletRef, updateData);
    console.log('지갑 정보가 업데이트되었습니다:', walletId);
    return true;
  } catch (error) {
    console.error('지갑 정보 업데이트 오류:', error);
    throw new Error('지갑 정보를 업데이트할 수 없습니다.');
  }
};

// 지갑 비활성화 (삭제 대신)
export const deactivateWallet = async (walletId: string) => {
  try {
    const walletRef = doc(firestore, 'wallets', walletId);
    await updateDoc(walletRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
    console.log('지갑이 비활성화되었습니다:', walletId);
    return true;
  } catch (error) {
    console.error('지갑 비활성화 오류:', error);
    throw new Error('지갑을 비활성화할 수 없습니다.');
  }
};

// 사용자와 지갑 정보를 함께 조회
export const getUserWithWallets = async (uid: string) => {
  try {
    const [userProfile, wallets] = await Promise.all([
      getUserProfile(uid),
      getUserWallets(uid)
    ]);
    
    return {
      user: userProfile,
      wallets: wallets
    };
  } catch (error) {
    console.error('사용자 및 지갑 정보 조회 오류:', error);
    throw new Error('사용자 및 지갑 정보를 조회할 수 없습니다.');
  }
};

// Chronos 데이터에서 tokenId로 openDate 조회
export const getOpenDateByTokenId = async (tokenId: string): Promise<{ openDate: string | null, isOpened: boolean | null }> => {
  try {
    console.log('🔍 Firestore에서 tokenId로 openDate 조회 시도:', tokenId);
    const chronosRef = collection(firestore, 'chronos');
    const q = query(chronosRef, where('tokenId', '==', tokenId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      console.log('✅ Firestore에서 chronos 데이터 찾음:', data);
      
      return {
        openDate: data.openDate ? data.openDate.toDate().toISOString() : null,
        isOpened: data.status === 'opened' ? true : false
      };
    } else {
      console.log('❌ Firestore에서 해당 tokenId의 chronos 데이터를 찾을 수 없음:', tokenId);
      return {
        openDate: null,
        isOpened: null
      };
    }
  } catch (error) {
    console.error('❌ Firestore에서 openDate 조회 오류:', error);
    return {
      openDate: null,
      isOpened: null
    };
  }
}; 