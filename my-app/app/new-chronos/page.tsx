'use client';

// 이 파일은 NewChronosPage 컴포넌트입니다. MyChronosPage와 혼동하지 마세요.
// 만약 MyChronosPage에서 이 에러가 난다면, app/my-chronos/page.tsx 파일에서 useAuth 등 훅이 조건문/함수/루프 안에서 호출되고 있지 않은지 확인하세요.
// 아래는 NewChronosPage에서 훅 순서가 올바른 예시입니다.

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import LoginRequired from '../../components/LoginRequired';
import Navigation from '../../components/Navigation';
import { encryptFile } from '../../lib/crypto';

// localStorage에서 사용자 정보를 확인하는 함수
const getCachedUserInfo = () => {
  if (typeof window === 'undefined') return null;
  try {
    const userProfile = localStorage.getItem('chronos_user_profile');
    const wallets = localStorage.getItem('chronos_wallets');
    return userProfile && wallets ? { userProfile: JSON.parse(userProfile), wallets: JSON.parse(wallets) } : null;
  } catch (error) {
    console.error('캐시된 사용자 정보 파싱 오류:', error);
    return null;
  }
};

// 파일 크기 제한 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

export default function NewChronosPage() {
  // 모든 훅은 컴포넌트 최상단에서 한 번만 호출
  const router = useRouter();
  const { user, wallets, userProfile, logout, createNewWallet, loading: authLoading } = useAuth();
  const [cachedUserInfo, setCachedUserInfo] = useState(getCachedUserInfo());
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState('');
  const [enhancedSecurity, setEnhancedSecurity] = useState(false);
  const [n, setN] = useState(3);
  const [m, setM] = useState(2);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneCount, setCloneCount] = useState(1);

  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState('');
  const [manualAddress, setManualAddress] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [encryptedFiles, setEncryptedFiles] = useState<Array<{ 
    encryptedData?: string; 
    fileName: string; 
    originalName: string;
    fileSize: number;
    fileType: string;
    isEncrypted: boolean;
  }>>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'encrypting' | 'blockchain' | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  
  // 새로운 토글 상태들
  const [isTransferable, setIsTransferable] = useState(true);
  const [isSmartContractTransferable, setIsSmartContractTransferable] = useState(true);
  const [isSmartContractOpenable, setIsSmartContractOpenable] = useState(true);

  // 컴포넌트 마운트 시 캐시된 사용자 정보 확인
  useEffect(() => {
    setCachedUserInfo(getCachedUserInfo());
  }, []);

  // 사용자 로그인 상태 확인 (캐시된 정보 우선 사용)
  const isUserLoggedIn = user || cachedUserInfo;
  const shouldShowLoading = authLoading && !cachedUserInfo;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 2500);
  };

  // 파일 크기 검증
  const validateFileSize = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      showToast(`파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.`, 'error');
      return false;
    }
    return true;
  };

  // 파일을 base64로 인코딩하는 함수
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // data:image/jpeg;base64, 부분을 제거하고 base64 데이터만 추출
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  // 파일 업로드 처리 (첨부 시에는 암호화하지 않음)
  const handleFileUpload = async (files: File[]) => {
    const validFiles = files.filter(validateFileSize);
    
    if (validFiles.length === 0) return;

    // 파일 첨부 시에는 암호화하지 않고 바로 추가
    setAttachments(prev => [...prev, ...validFiles]);
    showToast(`${validFiles.length}개 파일이 추가되었습니다.`, 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // 로딩 시작
    
    try {
      // 1단계: 파일 암호화 (isEncrypted가 true일 때만)
      if (isEncrypted) {
        setLoadingStep('encrypting');
        const encryptStartTime = Date.now();
        
        // 모든 파일을 처리 (content + 첨부파일)
        let allFiles: Array<{ 
          encryptedData: string; 
          fileName: string; 
          originalName: string;
          fileSize: number;
          fileType: string;
          isEncrypted: boolean;
        }> = [];
        
        // 1. Content 파일 처리
        if (content.trim()) {
          try {
            // content를 Blob으로 변환하여 File 객체 생성
            const contentBlob = new Blob([content], { type: 'text/plain' });
            const contentFileObj = new File([contentBlob], 'content.txt', { type: 'text/plain' });
            
            // content 파일 암호화
            const encryptedContent = await encryptFile(contentFileObj, password);
            console.log('🔐 Content 파일 암호화 결과:', {
              fileName: encryptedContent.fileName,
              originalName: 'content.txt',
              fileSize: contentFileObj.size,
              fileType: 'text/plain',
              isEncrypted: true,
              encryptedDataLength: encryptedContent.encryptedData.length,
              encryptedDataPreview: encryptedContent.encryptedData.substring(0, 100) + '...'
            });
            allFiles.push({
              encryptedData: encryptedContent.encryptedData,
              fileName: encryptedContent.fileName,
              originalName: 'content.txt',
              fileSize: contentFileObj.size,
              fileType: 'text/plain',
              isEncrypted: true
            });
          } catch (error) {
            console.error('content 파일 처리 실패:', error);
            showToast('내용 처리에 실패했습니다.', 'error');
            setLoading(false);
            setLoadingStep(null);
            return;
          }
        }

        // 2. 첨부파일 처리
        if (attachments.length > 0) {
          const attachmentPromises = attachments.map(async (file, index) => {
            try {
              // 첨부파일 암호화
              const result = await encryptFile(file, password);
              console.log(`🔐 첨부파일 ${file.name} 암호화 결과:`, {
                fileName: result.fileName,
                originalName: file.name,
                fileSize: file.size,
                fileType: file.type,
                isEncrypted: true,
                encryptedDataLength: result.encryptedData.length,
                encryptedDataPreview: result.encryptedData.substring(0, 100) + '...'
              });
              return {
                encryptedData: result.encryptedData,
                fileName: result.fileName,
                originalName: file.name,
                fileSize: file.size,
                fileType: file.type,
                isEncrypted: true
              };
            } catch (error) {
              console.error(`첨부파일 ${file.name} 처리 실패:`, error);
              showToast(`첨부파일 ${file.name} 처리에 실패했습니다.`, 'error');
              return null;
            }
          });

          const attachmentResults = await Promise.all(attachmentPromises);
          const successfulAttachments = attachmentResults.filter(result => result !== null);
          allFiles.push(...successfulAttachments);
        }

        // 암호화 완료 후 최소 3초간 대기
        const encryptEndTime = Date.now();
        const encryptDuration = encryptEndTime - encryptStartTime;
        const minWaitTime = 3000; // 3초
        
        console.log('🔐 전체 암호화 완료:', {
          totalFiles: allFiles.length,
          encryptDuration: `${encryptDuration}ms`,
          minWaitTime: `${minWaitTime}ms`
        });
        
        if (encryptDuration < minWaitTime) {
          const remainingTime = minWaitTime - encryptDuration;
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        // 2단계: 블록체인에 기록
        setLoadingStep('blockchain');

        // 사용자의 활성 지갑 주소들만 추출
        const userWalletAddresses = wallets
          .filter(wallet => wallet.isActive)
          .map(wallet => wallet.address);
        
        // 타임캡슐 데이터 준비
        const chronosData = {
          name,
          description,
          content,
          openDate: (() => {
            const dateInput = document.getElementById('openDate') as HTMLInputElement;
            const timeInput = document.getElementById('openTime') as HTMLInputElement;
            if (dateInput?.value && timeInput?.value) {
              // KST로 입력된 값을 UTC로 변환
              const kstString = `${dateInput.value}T${timeInput.value}`;
              const kstDate = new Date(kstString);
              // KST → UTC: KST는 UTC+9이므로 9시간 빼기
              const utcDate = new Date(kstDate.getTime() - 9 * 60 * 60 * 1000);
              return utcDate.toISOString(); // 항상 Z(UTC)로 끝남
            }
            return null;
          })(),
          isEncrypted,
          password: isEncrypted ? password : null,
          isPublic,
          tags,
          enhancedSecurity,
          n: enhancedSecurity ? n : null,
          m: enhancedSecurity ? m : null,
          isTransferable,
          isSmartContractTransferable,
          isSmartContractOpenable,
          userId: user?.uid || 'anonymous',
          walletAddresses: userWalletAddresses,
          encryptedFiles: allFiles
        };

        // API 호출
        const response = await fetch('/api/chronos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chronosData),
        });
        const result = await response.json();

        if (response.ok) {
          showToast('타임캡슐이 성공적으로 생성되었습니다!', 'success');
          setTimeout(() => {
            router.push('/my-chronos');
          }, 1200);
        } else {
          showToast(`타임캡슐 생성 실패: ${result.error}`, 'error');
        }
      } else {
        // 암호화하지 않는 경우
        let allFiles: Array<{ 
          encryptedData: string; 
          fileName: string; 
          originalName: string;
          fileSize: number;
          fileType: string;
          isEncrypted: boolean;
        }> = [];
        
        // 1. Content 파일 처리
        if (content.trim()) {
          try {
            // content를 Blob으로 변환하여 File 객체 생성
            const contentBlob = new Blob([content], { type: 'text/plain' });
            const contentFileObj = new File([contentBlob], 'content.txt', { type: 'text/plain' });
            
            // 암호화하지 않음 - base64로 인코딩
            const base64Data = await fileToBase64(contentFileObj);
            console.log('📄 Content 파일 base64 인코딩 결과:', {
              fileName: 'content.txt',
              originalName: 'content.txt',
              fileSize: contentFileObj.size,
              fileType: 'text/plain',
              isEncrypted: false,
              base64DataLength: base64Data.length,
              base64DataPreview: base64Data.substring(0, 100) + '...'
            });
            allFiles.push({
              encryptedData: base64Data,
              fileName: 'content.txt',
              originalName: 'content.txt',
              fileSize: contentFileObj.size,
              fileType: 'text/plain',
              isEncrypted: false
            });
          } catch (error) {
            console.error('content 파일 처리 실패:', error);
            showToast('내용 처리에 실패했습니다.', 'error');
            setLoading(false);
            setLoadingStep(null);
            return;
          }
        }

        // 2. 첨부파일 처리
        if (attachments.length > 0) {
          const attachmentPromises = attachments.map(async (file, index) => {
            try {
              // 암호화하지 않음 - base64로 인코딩
              const base64Data = await fileToBase64(file);
              console.log(`📄 첨부파일 ${file.name} base64 인코딩 결과:`, {
                fileName: file.name,
                originalName: file.name,
                fileSize: file.size,
                fileType: file.type,
                isEncrypted: false,
                base64DataLength: base64Data.length,
                base64DataPreview: base64Data.substring(0, 100) + '...'
              });
              return {
                encryptedData: base64Data,
                fileName: file.name,
                originalName: file.name,
                fileSize: file.size,
                fileType: file.type,
                isEncrypted: false
              };
            } catch (error) {
              console.error(`첨부파일 ${file.name} 처리 실패:`, error);
              showToast(`첨부파일 ${file.name} 처리에 실패했습니다.`, 'error');
              return null;
            }
          });

        const attachmentResults = await Promise.all(attachmentPromises);
        const successfulAttachments = attachmentResults.filter(result => result !== null);
        allFiles.push(...successfulAttachments);
      }

      // 2단계: 블록체인에 기록
      setLoadingStep('blockchain');

      // 사용자의 활성 지갑 주소들만 추출
      const userWalletAddresses = wallets
        .filter(wallet => wallet.isActive)
        .map(wallet => wallet.address);
      
      // 타임캡슐 데이터 준비
      const chronosData = {
        name,
        description,
        content,
        openDate: (() => {
          const dateInput = document.getElementById('openDate') as HTMLInputElement;
          const timeInput = document.getElementById('openTime') as HTMLInputElement;
          if (dateInput?.value && timeInput?.value) {
            // KST로 입력된 값을 UTC로 변환
            const kstString = `${dateInput.value}T${timeInput.value}`;
            const kstDate = new Date(kstString);
            // KST → UTC: KST는 UTC+9이므로 9시간 빼기
            const utcDate = new Date(kstDate.getTime() - 9 * 60 * 60 * 1000);
            return utcDate.toISOString(); // 항상 Z(UTC)로 끝남
          }
          return null;
        })(),
        isEncrypted,
        password: isEncrypted ? password : null,
        isPublic,
        tags,
        enhancedSecurity,
        n: enhancedSecurity ? n : null,
        m: enhancedSecurity ? m : null,
        isTransferable,
        isSmartContractTransferable,
        isSmartContractOpenable,
        userId: user?.uid || 'anonymous',
        walletAddresses: userWalletAddresses,
        encryptedFiles: allFiles
      };

      console.log('📦 타임캡슐 데이터 (암호화 없음):', {
        name,
        description,
        content: content.substring(0, 100) + '...',
        openDate: chronosData.openDate,
        isEncrypted,
        isPublic,
        tags,
        enhancedSecurity,
        n: chronosData.n,
        m: chronosData.m,
        userId: chronosData.userId,
        walletAddresses: chronosData.walletAddresses,
        totalFiles: allFiles.length,
        filesInfo: allFiles.map(file => ({
          fileName: file.fileName,
          originalName: file.originalName,
          fileSize: file.fileSize,
          fileType: file.fileType,
          isEncrypted: file.isEncrypted,
          dataLength: file.encryptedData.length
        }))
      });

      // API 호출
        const response = await fetch('/api/chronos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chronosData),
        });
        const result = await response.json();

        if (response.ok) {
          showToast('타임캡슐이 성공적으로 생성되었습니다!', 'success');
          setTimeout(() => {
            router.push('/my-chronos');
          }, 1200);
        } else {
          showToast(`타임캡슐 생성 실패: ${result.error}`, 'error');
        }
      }
    } catch (error) {
      console.error('타임캡슐 생성 오류:', error);
      showToast('타임캡슐 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false); // 로딩 종료
      setLoadingStep(null);
    }
  };

  // 로그인이 필요한 경우
  if (!isUserLoggedIn) {
    return <LoginRequired />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900 text-white relative overflow-hidden">
      {/* 배경 그라데이션 오브 */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      {/* 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white animate-spin-reverse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="text-lg text-white font-medium">
            {loadingStep === 'encrypting' ? '파일 암호화 중...' : 
             loadingStep === 'blockchain' ? '블록체인에 타임캡슐 기록하는 중...' : 
             isEncrypted ? '파일 암호화 중...' : '타임캡슐 생성 중...'}
          </div>
        </div>
      )}
      {/* 토스트 알림 */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-xl shadow-2xl text-sm font-semibold backdrop-blur-xl border border-white/20
          ${toast.type === 'success' ? 'bg-gradient-to-r from-green-500/90 to-emerald-600/90 text-white' : 'bg-gradient-to-r from-red-500/90 to-pink-600/90 text-white'}`}>
          {toast.message}
        </div>
      )}
      {/* 네비게이션 */}
      <Navigation />
      
      {/* 메인 컨텐츠 */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent animate-pulse">
            새로운 타임캡슐 만들기
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mb-6"></div>
          <p className="text-gray-300 text-lg">미래의 자신에게 전할 메시지를 작성해보세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl space-y-8">
          {/* 타임캡슐 이름 */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <label htmlFor="name" className="block text-lg font-medium text-white">
                타임캡슐 이름 *
              </label>
            </div>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-gray-400 transition-all duration-300"
              placeholder="타임캡슐의 이름을 입력하세요"
            />
          </div>

          {/* 열기 날짜 */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <label htmlFor="openDate" className="block text-lg font-medium text-white">
                열기 날짜 *
              </label>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="openDate" className="block text-sm font-medium mb-2 text-gray-300">
                    날짜
                  </label>
                  <div className="relative">
                    <input
                      id="openDate"
                      type="date"
                      required
                      defaultValue={(() => {
                        const now = new Date();
                        const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
                        return kst.toISOString().slice(0, 10);
                      })()}
                      className="w-full px-4 py-3 pr-12 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white transition-all duration-300 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-12 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:text-white [&::-webkit-datetime-edit-fields-wrapper]:text-white [&::-webkit-datetime-edit-text]:text-white [&::-webkit-datetime-edit-month-field]:text-white [&::-webkit-datetime-edit-day-field]:text-white [&::-webkit-datetime-edit-year-field]:text-white"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="openTime" className="block text-sm font-medium mb-2 text-gray-300">
                    시간 (24시간 형식)
                  </label>
                  <div className="relative">
                    <input
                      id="openTime"
                      type="time"
                      step="60"
                      required
                      defaultValue={(() => {
                        const now = new Date();
                        const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
                        return kst.toISOString().slice(11, 16);
                      })()}
                      className="w-full px-4 py-3 pr-12 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white transition-all duration-300 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-12 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:text-white [&::-webkit-datetime-edit-fields-wrapper]:text-white [&::-webkit-datetime-edit-text]:text-white [&::-webkit-datetime-edit-hour-field]:text-white [&::-webkit-datetime-edit-minute-field]:text-white"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const dateInput = document.getElementById('openDate') as HTMLInputElement;
                    const timeInput = document.getElementById('openTime') as HTMLInputElement;
                    if (dateInput.value && timeInput.value) {
                      const currentDate = new Date(dateInput.value);
                      currentDate.setDate(currentDate.getDate() + 1);
                      dateInput.value = currentDate.toISOString().slice(0, 10);
                      // 시간은 그대로 유지
                    }
                  }}
                  className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 hover:text-purple-200 rounded-lg transition-all duration-300 text-sm"
                >
                  +1일
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dateInput = document.getElementById('openDate') as HTMLInputElement;
                    const timeInput = document.getElementById('openTime') as HTMLInputElement;
                    if (dateInput.value && timeInput.value) {
                      const currentDate = new Date(dateInput.value);
                      currentDate.setMonth(currentDate.getMonth() + 1);
                      dateInput.value = currentDate.toISOString().slice(0, 10);
                      // 시간은 그대로 유지
                    }
                  }}
                  className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 hover:text-purple-200 rounded-lg transition-all duration-300 text-sm"
                >
                  +1달
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dateInput = document.getElementById('openDate') as HTMLInputElement;
                    const timeInput = document.getElementById('openTime') as HTMLInputElement;
                    if (dateInput.value && timeInput.value) {
                      const currentDate = new Date(dateInput.value);
                      currentDate.setFullYear(currentDate.getFullYear() + 1);
                      dateInput.value = currentDate.toISOString().slice(0, 10);
                      // 시간은 그대로 유지
                    }
                  }}
                  className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 hover:text-purple-200 rounded-lg transition-all duration-300 text-sm"
                >
                  +1년
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dateInput = document.getElementById('openDate') as HTMLInputElement;
                    const timeInput = document.getElementById('openTime') as HTMLInputElement;
                    if (dateInput.value && timeInput.value) {
                      const currentDate = new Date(dateInput.value);
                      currentDate.setFullYear(currentDate.getFullYear() + 10);
                      dateInput.value = currentDate.toISOString().slice(0, 10);
                      // 시간은 그대로 유지
                    }
                  }}
                  className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 hover:text-purple-200 rounded-lg transition-all duration-300 text-sm"
                >
                  +10년
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dateInput = document.getElementById('openDate') as HTMLInputElement;
                    const timeInput = document.getElementById('openTime') as HTMLInputElement;
                    const now = new Date();
                    const kst = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
                    dateInput.value = kst.toISOString().slice(0, 10);
                    timeInput.value = kst.toISOString().slice(11, 16);
                  }}
                  className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-300 hover:text-cyan-200 rounded-lg transition-all duration-300 text-sm"
                >
                  지금 시각
                </button>
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <label htmlFor="description" className="block text-lg font-medium text-white">
                설명
              </label>
            </div>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-gray-400 resize-none transition-all duration-300"
              placeholder="타임캡슐에 대한 간단한 설명을 입력하세요"
            />
          </div>

          {/* 내용 */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <label htmlFor="content" className="block text-lg font-medium text-white">
                내용 *
              </label>
            </div>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-gray-400 resize-none transition-all duration-300"
              placeholder="미래의 자신에게 전할 메시지를 자유롭게 작성하세요..."
            />
          </div>

          {/* 파일 첨부 */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <label className="block text-lg font-medium text-white">
                첨부 파일
              </label>
            </div>
            <div className="space-y-3">
              {/* 파일 첨부 버튼 */}
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt,.mp3,.mp4"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    handleFileUpload(files);
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-purple-500/20 hover:from-purple-500/30 hover:to-purple-500/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 hover:text-purple-200 rounded-xl transition-all duration-300 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>파일 추가</span>
                </label>
                <span className="text-sm text-gray-300">
                  사진, 비디오, 문서 등 어떤 형식이든 저장할 수 있습니다 (파일당 최대 5MB)
                </span>
              </div>

              {/* 첨부된 파일 목록 */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-black/30 border border-white/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-white text-sm">{file.name}</span>
                        <span className="text-gray-300 text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachments(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/20 rounded-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 암호화 설정 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <label className="block text-lg font-medium text-white">
                  암호화
                </label>
              </div>
              <button
                type="button"
                onClick={() => setIsEncrypted(!isEncrypted)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent ${
                  isEncrypted ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isEncrypted ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {isEncrypted && (
              <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <label htmlFor="password" className="block text-sm font-medium mb-2 text-purple-300">
                  비밀번호 *
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={isEncrypted}
                  className={`w-full px-4 py-3 bg-black/30 border rounded-xl focus:outline-none focus:ring-2 text-white placeholder-gray-400 transition-all duration-300 ${
                    password.length > 0 && password.length < 6
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500/50'
                      : 'border-purple-500/30 focus:ring-purple-500 focus:border-purple-500/50'
                  }`}
                  placeholder="타임캡슐을 열 때 사용할 비밀번호를 입력하세요"
                />
                {password.length > 0 && password.length < 6 && (
                  <p className="text-sm text-red-400 mt-2">
                    비밀번호는 최소 6자리 이상이어야 합니다.
                  </p>
                )}
                <p className="text-sm text-purple-200 mt-2">
                  타임캡슐은 XChaCha20을 사용하여 암호화됩니다. 비밀번호를 잊어버리면 타임캡슐의 내용을 볼 수 없습니다.
                </p>
              </div>
            )}
          </div>

          {/* 커뮤니티에 공개 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <label className="block text-lg font-medium text-white">
                  커뮤니티에 공개
                </label>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent ${
                  isPublic ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-300">
              이 옵션을 선택하면 타임캡슐이 커뮤니티에 공개되어 다른 사용자들이 볼 수 있습니다.
            </p>
          </div>

          {/* 태그 */}
          {isPublic && (
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <label htmlFor="tags" className="block text-lg font-medium text-white">
                  태그
                </label>
              </div>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-gray-400 transition-all duration-300"
                placeholder="예: 미래, 꿈, 목표, 회고 (쉼표로 구분)"
              />
            </div>
          )}

          {/* 고급 설정 버튼 */}
          <div className="border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-purple-500 hover:text-purple-400 transition-colors"
            >
              <span className="text-lg">고급</span>
              <svg
                className={`w-5 h-5 transform transition-transform ${showAdvanced ? 'rotate-45' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          {/* 고급 설정 경고 */}
          {showAdvanced && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm text-yellow-200">
                아래 옵션들을 충분히 고려하지 않고 사용한다면, 타임캡슐의 보안성이 크게 떨어질 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* 고급 설정 (접을 수 있음) */}
          {showAdvanced && (
            <div className="bg-black/30 border border-white/20 rounded-xl p-6 space-y-6">
              <h3 className="text-xl font-semibold text-purple-500">고급 설정</h3>
              
                            {/* 향상된 보안 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    향상된 보안
                  </label>
                                          <button
                          type="button"
                          onClick={() => setEnhancedSecurity(!enhancedSecurity)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent ${
                            enhancedSecurity ? 'bg-purple-600' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              enhancedSecurity ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                </div>
                <p className="text-xs text-gray-400">
                 Shamir's secret sharing을 사용하여 타임캡슐을 더욱 안전하게 보호합니다. 타임캡슐 생성 후 제공되는 비밀번호를 확인하세요.
                </p>
                
                {enhancedSecurity && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="n" className="block text-xs font-medium mb-1">
                          n (총 비밀번호 쌍 개수)
                        </label>
                        <input
                          id="n"
                          type="number"
                          min="2"
                          max="10"
                          value={n}
                          onChange={(e) => setN(parseInt(e.target.value) || 3)}
                          className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white text-sm transition-all duration-300"
                        />
                      </div>
                      <div>
                        <label htmlFor="m" className="block text-xs font-medium mb-1">
                          m (필요한 조합 수)
                        </label>
                        <input
                          id="m"
                          type="number"
                          min="2"
                          max={n}
                          value={m}
                          onChange={(e) => setM(parseInt(e.target.value) || 2)}
                          className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white text-sm transition-all duration-300"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      총 {n}개의 BIP-39 비밀번호 쌍을 생성합니다. {m}명 이상의 조합으로 타임캡슐을 복호화할 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
              
              {/* 주소 수동 지정 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    주소 수동 지정
                  </label>
                                          <button
                          type="button"
                          onClick={() => setManualAddress(!manualAddress)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent ${
                            manualAddress ? 'bg-purple-600' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              manualAddress ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                </div>
                <p className="text-xs text-gray-400">
                  타임캡슐을 전송할 주소를 직접 지정할 수 있습니다.


                </p>
                
                {manualAddress && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className="px-4 py-3 bg-black/30 border border-white/20 rounded-lg hover:bg-white/10 transition-all duration-300 text-white text-sm"
                      >
                        Chronos 계정 지정
                      </button>
                      <button
                        type="button"
                        className="px-4 py-3 bg-black/30 border border-white/20 rounded-lg hover:bg-white/10 transition-all duration-300 text-white text-sm"
                      >
                        지갑 주소 입력
                      </button>
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        className="flex items-center space-x-2 text-purple-500 hover:text-purple-400 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>새로운 주소 추가</span>
                      </button>
                      <p className="text-xs text-gray-400 mt-2">
                        새로운 주소를 추가하면 입력된 주소들로 동일한 내용의 타임캡슐이 minting 됩니다. 각 소유자는 독립적으로 캡슐을 열 수 있습니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 전송 가능 타임캡슐 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    P2P 전송 가능한 타임캡슐
                  </label>
                                        <button
                        type="button"
                        onClick={() => setIsTransferable(!isTransferable)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent ${
                          isTransferable ? 'bg-purple-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            isTransferable ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                </div>
                <p className="text-xs text-gray-400">
                  타임캡슐을 다른 사람에게 전송할 수 있습니다.
                </p>
              </div>

              {/* 스마트 컨트랙트 전송 가능 타임캡슐 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Chronos 서비스 전송 가능 타임캡슐
                  </label>
                                        <button
                        type="button"
                        onClick={() => setIsSmartContractTransferable(!isSmartContractTransferable)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent ${
                          isSmartContractTransferable ? 'bg-purple-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            isSmartContractTransferable ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                </div>
                <p className="text-xs text-gray-400">
                  Chronos 서비스를 통해 타임캡슐을 전송할 수 있습니다.
                </p>
              </div>

              {/* 스마트 컨트랙트 열기 가능 타임캡슐 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                  Chronos 서비스 열기 가능 타임캡슐
                  </label>
                                        <button
                        type="button"
                        onClick={() => setIsSmartContractOpenable(!isSmartContractOpenable)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent ${
                          isSmartContractOpenable ? 'bg-purple-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            isSmartContractOpenable ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                </div>
                <p className="text-xs text-gray-400">
                  Chronos 서비스를 통해 타임캡슐을 열 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* 버튼 그룹 */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
            <Link
              href="/"
              className="px-8 py-3 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded-xl transition-all duration-300 hover:bg-white/5"
            >
              취소
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-purple-500/20 to-purple-500/20 hover:from-purple-500/30 hover:to-purple-500/30 border-2 border-purple-500/30 hover:border-purple-500/50 text-purple-200 hover:text-purple-100 font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            >
              타임캡슐 생성
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}