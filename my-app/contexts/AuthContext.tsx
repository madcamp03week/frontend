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
  getAllUserWallets,
  getUserProfile,
  type UserProfile,
  type WalletData 
} from '../lib/firestore';

// localStorage 키 상수
const STORAGE_KEYS = {
  USER_PROFILE: 'chronos_user_profile',
  WALLETS: 'chronos_wallets',
  AUTH_STATE: 'chronos_auth_state'
};

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

// localStorage 유틸리티 함수들
const getStoredUserProfile = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!stored) return null;
    const profile = JSON.parse(stored);
    return {
      ...profile,
      createdAt: new Date(profile.createdAt),
      updatedAt: new Date(profile.updatedAt),
    };
  } catch (error) {
    console.error('저장된 사용자 프로필 파싱 오류:', error);
    return null;
  }
};

const getStoredWallets = (): WalletData[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WALLETS);
    if (!stored) return [];
    const wallets = JSON.parse(stored);
    return wallets.map((wallet: any) => ({
      ...wallet,
      createdAt: new Date(wallet.createdAt),
      updatedAt: new Date(wallet.updatedAt),
    }));
  } catch (error) {
    console.error('저장된 지갑 데이터 파싱 오류:', error);
    return [];
  }
};

const setStoredUserProfile = (profile: UserProfile | null) => {
  if (typeof window === 'undefined') return;
  if (profile) {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  }
};

const setStoredWallets = (wallets: WalletData[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
};

const clearStoredData = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  localStorage.removeItem(STORAGE_KEYS.WALLETS);
  localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [shouldRedirectToWalletSetup, setShouldRedirectToWalletSetup] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // 클라이언트 사이드 렌더링 확인 및 초기 localStorage 데이터 로드
  useEffect(() => {
    setIsClient(true);
    
    // 초기 로딩 시 localStorage에서 캐시된 데이터를 즉시 로드
    const cachedProfile = getStoredUserProfile();
    const cachedWallets = getStoredWallets();
    
    if (cachedProfile && cachedWallets.length > 0) {
      console.log('초기 로딩: 캐시된 데이터를 즉시 로드:', { 
        profile: cachedProfile.displayName, 
        walletsCount: cachedWallets.length 
      });
      setUserProfile(cachedProfile);
      setWallets(cachedWallets);
      setDataLoaded(true);
      setLoading(false); // 캐시된 데이터가 있으면 즉시 로딩 완료
    }
  }, []);
  
  // 지갑 보유 여부 계산 (클라이언트에서만 계산)
  const hasWallet = isClient && dataLoaded ? wallets.some(wallet => wallet.isActive) : false;
  console.log('지갑 보유 여부 계산:', { 
    walletsCount: wallets.length, 
    activeWallets: wallets.filter(w => w.isActive).length, 
    hasWallet,
    dataLoaded,
    isClient
  });

  // OAuth 사용자를 위한 지갑 생성 함수
  const createWalletForOAuthUser = async (userId: string) => {
    try {
      // 폴리곤 지갑 생성
      const newWallet = createPolygonWallet();
      
      // Private Key 암호화 (시스템 키만 사용)
      const encryptedPrivateKey = await encryptPrivateKey(newWallet.privateKey);
      
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
      setStoredWallets([walletWithDates]);
      
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
        
        // 먼저 localStorage에서 캐시된 데이터를 로드하여 즉시 UI 업데이트
        const cachedProfile = getStoredUserProfile();
        const cachedWallets = getStoredWallets();
        
        if (cachedProfile && cachedWallets.length > 0) {
          console.log('캐시된 데이터를 즉시 로드:', { 
            profile: cachedProfile.displayName, 
            walletsCount: cachedWallets.length 
          });
          setUserProfile(cachedProfile);
          setWallets(cachedWallets);
          setDataLoaded(true);
        }
        
        try {
          const [profile, userWallets] = await Promise.all([
            getUserProfile(user.uid),
            getAllUserWallets(user.uid)
          ]);
          console.log('Firestore에서 로드된 데이터:', { 
            profile: profile ? '있음' : '없음', 
            walletsCount: userWallets.length,
            wallets: userWallets.map((w: WalletData) => ({ id: w.id, address: w.address, isActive: w.isActive }))
          });
          if (profile) {
            const profileWithDates = {
              ...profile,
              createdAt: new Date(profile.createdAt),
              updatedAt: new Date(profile.updatedAt),
            };
            setUserProfile(profileWithDates);
            setStoredUserProfile(profileWithDates);
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
              const profileWithDates = {
                ...newProfile,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              setUserProfile(profileWithDates);
              setStoredUserProfile(profileWithDates);
              
              // OAuth 로그인 사용자의 경우 지갑 설정 페이지로 이동하도록 설정
              if (user.providerData.length > 0) {
                console.log('OAuth 사용자 - 지갑 설정 페이지로 이동하도록 설정');
                setShouldRedirectToWalletSetup(true);
              }
            } catch (profileError) {
              console.error('프로필 생성 오류:', profileError);
            }
          }
          
          const walletsWithDates = userWallets.map(wallet => ({
            ...wallet,
            createdAt: new Date(wallet.createdAt),
            updatedAt: new Date(wallet.updatedAt),
          }));
          setWallets(walletsWithDates);
          setStoredWallets(walletsWithDates);
          
          // OAuth 로그인 사용자이고 활성 지갑이 없는 경우 지갑 설정 페이지로 이동하도록 설정
          const activeWallets = userWallets.filter((wallet: WalletData) => wallet.isActive);
          if (activeWallets.length === 0 && user.providerData.length > 0) {
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
              const profileWithDates = {
                ...newProfile,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              setUserProfile(profileWithDates);
              setStoredUserProfile(profileWithDates);
              
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
        clearStoredData(); // 로그아웃 시 캐시된 데이터 삭제
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
      setStoredUserProfile(profileWithDates);
      
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
      // Firebase ID 토큰 가져오기
      const idToken = await user.getIdToken();
      
      // 백엔드 API 호출하여 지갑 생성
      const response = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          network: 'polygon',
          label: '기본 지갑'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '지갑 생성에 실패했습니다.');
      }

      const result = await response.json();
      
      console.log('백엔드 응답 데이터:', result.data);
      
      // 백엔드 응답 데이터를 Date 객체로 변환
      const walletWithDates = {
        ...result.data,
        id: result.data.id || result.data.address, // id가 없으면 address를 fallback으로 사용
        createdAt: result.data.createdAt ? new Date(result.data.createdAt) : new Date(),
        updatedAt: result.data.updatedAt ? new Date(result.data.updatedAt) : new Date()
      };
      
      console.log('변환된 지갑 데이터:', walletWithDates);
      
      // 기존 지갑들을 비활성화 상태로 업데이트하고 새 지갑만 활성으로 설정
      setWallets(prev => {
        const updatedWallets = [
          ...prev.map(wallet => ({ ...wallet, isActive: false })),
          walletWithDates
        ];
        console.log('업데이트된 지갑 목록:', updatedWallets);
        return updatedWallets;
      });
      setStoredWallets([
        ...wallets.map(wallet => ({ ...wallet, isActive: false })),
        walletWithDates
      ]);
      
      // 지갑 생성 후 dataLoaded를 강제로 true로 설정하여 hasWallet 계산이 즉시 반영되도록 함
      setDataLoaded(true);
      
      console.log('백엔드에서 새로운 폴리곤 지갑이 생성되었습니다:', walletWithDates.address);
      console.log('Private Key가 서버 키로 암호화되어 저장되었습니다.');
      
    } catch (error) {
      console.error('지갑 생성 중 오류:', error);
      throw error;
    }
  };

  const createNewWalletWithPassword = async (password: string) => {
    if (!user) return;

    try {
      // 기존 활성 지갑들을 비활성화
      const activeWallets = wallets.filter((wallet: WalletData) => wallet.isActive);
      for (const wallet of activeWallets) {
        await deactivateWallet(wallet.id);
      }

      // 클라이언트 사이드에서 새로운 폴리곤 지갑 생성
      const newWallet = createPolygonWallet();

      // Private Key 암호화 (사용자 비밀번호로 암호화)
      const encryptedPrivateKey = await encryptPrivateKeyWithPassword(newWallet.privateKey, password);

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
      setStoredWallets([
        ...wallets.map(wallet => ({ ...wallet, isActive: false })),
        walletWithDates
      ]);

      // 지갑 생성 후 dataLoaded를 강제로 true로 설정하여 hasWallet 계산이 즉시 반영되도록 함
      setDataLoaded(true);

      console.log('클라이언트에서 새로운 폴리곤 지갑이 생성되었습니다:', savedWallet.address);
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
      setStoredUserProfile(userProfile ? { ...userProfile, displayName, updatedAt: new Date() } : null);
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
      clearStoredData(); // 로그아웃 시 캐시된 데이터 삭제
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