'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createPolygonWallet } from '../lib/wallet';
import { encryptPrivateKey, encryptPrivateKeyWithPassword } from '../lib/crypto';
import { 
  saveUserProfile, 
  saveWalletData, 
  getUserWithWallets,
  deactivateWallet,
  updateUserProfile,
  type UserProfile,
  type WalletData 
} from '../lib/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
  wallets: WalletData[];
  shouldRedirectToWalletSetup: boolean;
  setShouldRedirectToWalletSetup: (value: boolean) => void;
  hasWallet: boolean;
  dataLoaded: boolean;
  logout: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  createNewWallet: () => Promise<void>;
  createNewWalletWithPassword: (password: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userProfile: null,
  wallets: [],
  shouldRedirectToWalletSetup: false,
  setShouldRedirectToWalletSetup: () => {},
  hasWallet: false,
  dataLoaded: false,
  logout: async () => {},
  signUp: async () => {},
  signIn: async () => {},
  createNewWallet: async () => {},
  createNewWalletWithPassword: async () => {},
  updateDisplayName: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [shouldRedirectToWalletSetup, setShouldRedirectToWalletSetup] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // 데이터 로드 완료 상태 추가
  
  // 지갑 보유 여부 계산 (데이터가 로드된 후에만 계산)
  const hasWallet = dataLoaded ? wallets.some(wallet => wallet.isActive) : false;
  console.log('지갑 보유 여부 계산:', { 
    walletsCount: wallets.length, 
    activeWallets: wallets.filter(w => w.isActive).length, 
    hasWallet,
    dataLoaded 
  });

  // OAuth 사용자를 위한 지갑 생성 함수
  const createWalletForOAuthUser = async (userId: string) => {
    try {
      // 폴리곤 지갑 생성
      const newWallet = createPolygonWallet();
      
      // Private Key 암호화 (시스템 키만 사용)
      const encryptedPrivateKey = encryptPrivateKey(newWallet.privateKey);
      
      // Firestore에 지갑 정보 저장 (암호화된 Private Key 포함)
      const savedWallet = await saveWalletData({
        userId: userId,
        address: newWallet.address,
        encryptedPrivateKey: encryptedPrivateKey,
        network: 'polygon',
        isActive: true,
        label: '기본 지갑',
        userMade: false, // 시스템에서 자동 생성
      });
      
      // serverTimestamp를 Date로 변환
      const walletWithDates = {
        ...savedWallet,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setWallets([walletWithDates]);
      
      console.log('OAuth 사용자를 위한 새로운 폴리곤 지갑이 생성되었습니다:', savedWallet.address);
      console.log('Private Key가 시스템 키로 암호화되어 저장되었습니다.');
      
      return walletWithDates;
    } catch (error) {
      console.error('OAuth 사용자 지갑 생성 오류:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // 사용자가 로그인되어 있으면 Firestore에서 데이터 로드
      if (user) {
        console.log('사용자 로그인 감지:', user.uid, user.email);
        setDataLoaded(false); // 새로운 사용자 로그인 시 데이터 로드 상태 초기화
        try {
          const { user: profile, wallets: userWallets } = await getUserWithWallets(user.uid);
          console.log('Firestore에서 로드된 데이터:', { 
            profile: profile ? '있음' : '없음', 
            walletsCount: userWallets.length,
            wallets: userWallets.map(w => ({ id: w.id, address: w.address, isActive: w.isActive }))
          });
          if (profile) {
            setUserProfile({
              ...profile,
              createdAt: new Date(profile.createdAt),
              updatedAt: new Date(profile.updatedAt),
            });
          } else {
            // 프로필이 없는 경우 새로 생성 (OAuth 로그인 사용자 포함)
            console.log('사용자 프로필이 없습니다. 새로 생성합니다:', user.uid);
            try {
              const newProfile = await saveUserProfile({
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || undefined,
                photoURL: user.photoURL || undefined,
              });
              setUserProfile({
                ...newProfile,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              
              // OAuth 로그인 사용자의 경우 지갑 설정 페이지로 이동하도록 설정
              if (user.providerData.length > 0) {
                console.log('OAuth 사용자 - 지갑 설정 페이지로 이동하도록 설정');
                setShouldRedirectToWalletSetup(true);
              }
            } catch (profileError) {
              console.error('프로필 생성 오류:', profileError);
            }
          }
          
          setWallets(userWallets.map(wallet => ({
            ...wallet,
            createdAt: new Date(wallet.createdAt),
            updatedAt: new Date(wallet.updatedAt),
          })));
          
          // OAuth 로그인 사용자이고 지갑이 없는 경우 지갑 설정 페이지로 이동하도록 설정
          if (userWallets.length === 0 && user.providerData.length > 0) {
            console.log('OAuth 사용자 - 지갑 설정 페이지로 이동하도록 설정');
            setShouldRedirectToWalletSetup(true);
          }
        } catch (error) {
          console.error('사용자 데이터 로드 오류:', error);
          // 프로필이 없는 경우 새로 생성
          if (user) {
            try {
              console.log('오류로 인해 사용자 프로필을 새로 생성합니다:', user.uid);
              const newProfile = await saveUserProfile({
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || undefined,
                photoURL: user.photoURL || undefined,
              });
              setUserProfile({
                ...newProfile,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              
              // OAuth 로그인 사용자의 경우 지갑 설정 페이지로 이동하도록 설정
              if (user.providerData.length > 0) {
                console.log('OAuth 사용자 - 지갑 설정 페이지로 이동하도록 설정');
                setShouldRedirectToWalletSetup(true);
              }
            } catch (profileError) {
              console.error('프로필 생성 오류:', profileError);
            }
          }
        }
      } else {
        setUserProfile(null);
        setWallets([]);
        setDataLoaded(true); // 로그아웃 상태에서도 데이터 로드 완료 표시
      }
      
      setLoading(false);
      if (user) {
        setDataLoaded(true); // 로그인된 사용자의 경우에만 데이터 로드 완료 표시
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      // Firebase 회원가입
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Firestore에 사용자 프로필 저장
      const newProfile = await saveUserProfile({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
      });
      
      // serverTimestamp를 Date로 변환
      const profileWithDates = {
        ...newProfile,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setUserProfile(profileWithDates);
      
      // 지갑 설정 페이지로 이동하도록 설정
      setShouldRedirectToWalletSetup(true);
      
      console.log('회원가입 완료. 지갑 설정 페이지로 이동합니다.');
      
    } catch (error) {
      console.error('회원가입 중 오류:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('로그인 중 오류:', error);
      throw error;
    }
  };

  const createNewWallet = async () => {
    if (!user) return;
    
    try {
      // 기존 활성 지갑들을 비활성화
      const activeWallets = wallets.filter(wallet => wallet.isActive);
      for (const wallet of activeWallets) {
        await deactivateWallet(wallet.id);
      }
      
      // 새로운 폴리곤 지갑 생성
      const newWallet = createPolygonWallet();
      
      // Private Key 암호화 (시스템 키만 사용)
      const encryptedPrivateKey = encryptPrivateKey(newWallet.privateKey);
      
      // Firestore에 지갑 정보 저장 (암호화된 Private Key 포함)
      const savedWallet = await saveWalletData({
        userId: user.uid,
        address: newWallet.address,
        encryptedPrivateKey: encryptedPrivateKey,
        network: 'polygon',
        isActive: true,
        label: '기본 지갑',
        userMade: false, // 시스템에서 자동 생성
      });
      
      // serverTimestamp를 Date로 변환
      const walletWithDates = {
        ...savedWallet,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // 기존 지갑들을 비활성화 상태로 업데이트하고 새 지갑만 활성으로 설정
      setWallets(prev => [
        ...prev.map(wallet => ({ ...wallet, isActive: false })),
        walletWithDates
      ]);
      
      console.log('새로운 폴리곤 지갑이 생성되었습니다:', savedWallet.address);
      console.log('Private Key가 시스템 키로 암호화되어 저장되었습니다.');
      
    } catch (error) {
      console.error('지갑 생성 중 오류:', error);
      throw error;
    }
  };

  const createNewWalletWithPassword = async (password: string) => {
    if (!user) return;

    try {
      // 기존 활성 지갑들을 비활성화
      const activeWallets = wallets.filter(wallet => wallet.isActive);
      for (const wallet of activeWallets) {
        await deactivateWallet(wallet.id);
      }

      // 새로운 폴리곤 지갑 생성
      const newWallet = createPolygonWallet();

      // Private Key 암호화 (사용자 비밀번호로 암호화)
      const encryptedPrivateKey = encryptPrivateKeyWithPassword(newWallet.privateKey, password);

      // Firestore에 지갑 정보 저장 (암호화된 Private Key 포함)
      const savedWallet = await saveWalletData({
        userId: user.uid,
        address: newWallet.address,
        encryptedPrivateKey: encryptedPrivateKey,
        network: 'polygon',
        isActive: true,
        label: '기본 지갑',
        userMade: true, // 사용자가 직접 생성한 지갑
      });

      // serverTimestamp를 Date로 변환
      const walletWithDates = {
        ...savedWallet,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 기존 지갑들을 비활성화 상태로 업데이트하고 새 지갑만 활성으로 설정
      setWallets(prev => [
        ...prev.map(wallet => ({ ...wallet, isActive: false })),
        walletWithDates
      ]);

      console.log('새로운 폴리곤 지갑이 생성되었습니다:', savedWallet.address);
      console.log('Private Key가 사용자 비밀번호로 암호화되어 저장되었습니다.');

    } catch (error) {
      console.error('지갑 생성 중 오류:', error);
      throw error;
    }
  };

  const updateDisplayName = async (displayName: string) => {
    if (!user) return;

    try {
      await updateUserProfile(user.uid, { displayName });
      setUserProfile(prev => prev ? { ...prev, displayName, updatedAt: new Date() } : null);
      console.log('닉네임이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('닉네임 업데이트 중 오류:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      setWallets([]);
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  };

  const value = {
    user,
    loading,
    userProfile,
    wallets,
    shouldRedirectToWalletSetup,
    setShouldRedirectToWalletSetup,
    hasWallet,
    dataLoaded,
    logout,
    signUp,
    signIn,
    createNewWallet,
    createNewWalletWithPassword,
    updateDisplayName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 