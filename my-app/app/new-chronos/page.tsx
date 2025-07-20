'use client';

// 이 파일은 NewChronosPage 컴포넌트입니다. MyChronosPage와 혼동하지 마세요.
// 만약 MyChronosPage에서 이 에러가 난다면, app/my-chronos/page.tsx 파일에서 useAuth 등 훅이 조건문/함수/루프 안에서 호출되고 있지 않은지 확인하세요.
// 아래는 NewChronosPage에서 훅 순서가 올바른 예시입니다.

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import LoginRequired from '../../components/LoginRequired';

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

export default function NewChronosPage() {
  // 모든 훅은 컴포넌트 최상단에서 한 번만 호출
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // 로딩 시작
    try {
      // 사용자의 활성 지갑 주소들만 추출
      const userWalletAddresses = wallets
        .filter(wallet => wallet.isActive)
        .map(wallet => wallet.address);
      
      // 타임캡슐 데이터 준비
      const chronosData = {
        name,
        description,
        content,
        openDate: (document.getElementById('openDate') as HTMLInputElement)?.value || null,
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
        walletAddresses: userWalletAddresses
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
          window.location.href = '/my-chronos';
        }, 1200);
      } else {
        showToast(`타임캡슐 생성 실패: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('타임캡슐 생성 오류:', error);
      showToast('타임캡슐 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false); // 로딩 종료
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
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="text-lg text-white font-medium">타임캡슐 생성 중...</div>
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
      <nav className="w-full flex justify-between items-center px-10 py-6">
        <Link href="/" className="text-2xl font-bold text-white">
        <div className="text-2xl font-bold">
         Chronos
        </div>
        </Link>
        <div className="space-x-8 text-sm text-gray-300 font-light">
          <Link href="/company">Company</Link>
          <Link href="/product">Product</Link>
          <Link href="/new-chronos">New Chronos</Link>
          <Link href="/my-chronos">My Chronos</Link>
          {!shouldShowLoading && (
            isUserLoggedIn ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                <button
                  onClick={logout}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login">Login</Link>
            )
          )}
        </div>
      </nav>
      
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
                열기 날짜
              </label>
            </div>
            <input
              id="openDate"
              type="datetime-local"
              className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white transition-all duration-300"
            />
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
                내용
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
                    setAttachments(prev => [...prev, ...files]);
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
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
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
                  className="w-full px-4 py-3 bg-black/30 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="타임캡슐을 열 때 사용할 비밀번호를 입력하세요"
                />
                <p className="text-sm text-purple-200 mt-2">
                  타임캡슐은 aes-256을 사용하여 암호화됩니다. 비밀번호를 잊어버리면 타임캡슐의 내용을 볼 수 없습니다.
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
              className="px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:scale-105 hover:-translate-y-1 active:scale-95"
            >
              타임캡슐 생성
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}