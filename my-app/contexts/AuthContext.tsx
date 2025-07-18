'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createPolygonWallet } from '../lib/wallet';
import { 
  saveUserProfile, 
  saveWalletData, 
  getUserWithWallets,
  deactivateWallet,
  type UserProfile,
  type WalletData 
} from '../lib/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
  wallets: WalletData[];
  logout: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  createNewWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userProfile: null,
  wallets: [],
  logout: async () => {},
  signUp: async () => {},
  signIn: async () => {},
  createNewWallet: async () => {},
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // 사용자가 로그인되어 있으면 Firestore에서 데이터 로드
      if (user) {
        try {
          const { user: profile, wallets: userWallets } = await getUserWithWallets(user.uid);
          if (profile) {
            setUserProfile({
              ...profile,
              createdAt: new Date(profile.createdAt),
              updatedAt: new Date(profile.updatedAt),
            });
          }
          setWallets(userWallets.map(wallet => ({
            ...wallet,
            createdAt: new Date(wallet.createdAt),
            updatedAt: new Date(wallet.updatedAt),
          })));
        } catch (error) {
          console.error('사용자 데이터 로드 오류:', error);
          // 프로필이 없는 경우 새로 생성
          if (user) {
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
            } catch (profileError) {
              console.error('프로필 생성 오류:', profileError);
            }
          }
        }
      } else {
        setUserProfile(null);
        setWallets([]);
      }
      
      setLoading(false);
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
      
      // 폴리곤 지갑 생성
      const newWallet = createPolygonWallet();
      
      // Firestore에 지갑 정보 저장
      const savedWallet = await saveWalletData({
        userId: user.uid,
        address: newWallet.address,
        network: 'polygon',
        isActive: true,
        label: '기본 지갑',
      });
      
      // serverTimestamp를 Date로 변환
      const walletWithDates = {
        ...savedWallet,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setWallets([walletWithDates]);
      
      console.log('새로운 폴리곤 지갑이 생성되었습니다:', savedWallet.address);
      
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
      
      // Firestore에 지갑 정보 저장
      const savedWallet = await saveWalletData({
        userId: user.uid,
        address: newWallet.address,
        network: 'polygon',
        isActive: true,
        label: '기본 지갑',
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
      
    } catch (error) {
      console.error('지갑 생성 중 오류:', error);
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
    logout,
    signUp,
    signIn,
    createNewWallet,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 