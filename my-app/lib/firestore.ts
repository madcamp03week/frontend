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
  network: 'polygon';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  label?: string;
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
    
    await setDoc(userRef, cleanUserData);
    console.log('사용자 프로필이 저장되었습니다:', userProfile.uid);
    return cleanUserData;
  } catch (error) {
    console.error('사용자 프로필 저장 오류:', error);
    throw new Error('사용자 프로필을 저장할 수 없습니다.');
  }
};

// 사용자 프로필 조회
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(firestore, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
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

// 사용자의 모든 지갑 조회
export const getUserWallets = async (userId: string): Promise<WalletData[]> => {
  try {
    const walletsRef = collection(firestore, 'wallets');
    const q = query(walletsRef, where('userId', '==', userId), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    const wallets: WalletData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      wallets.push({
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as WalletData);
    });
    
    return wallets;
  } catch (error) {
    console.error('사용자 지갑 조회 오류:', error);
    throw new Error('사용자 지갑을 조회할 수 없습니다.');
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