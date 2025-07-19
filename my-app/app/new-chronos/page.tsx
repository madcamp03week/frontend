'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function NewChronosPage() {
  const { user } = useAuth();
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
  const [nonTransferable, setNonTransferable] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState('');
  const [manualAddress, setManualAddress] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
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
        nonTransferable,
        userId: user?.uid || 'anonymous'
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
        alert('타임캡슐이 성공적으로 생성되었습니다!');
        // 성공 후 대시보드로 이동
        window.location.href = '/dashboard';
      } else {
        alert(`타임캡슐 생성 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('타임캡슐 생성 오류:', error);
      alert('타임캡슐 생성 중 오류가 발생했습니다.');
    }
  };

  const { userProfile, wallets, logout, createNewWallet } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  
  // 로그인이 필요한 경우
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
          <a href="/login" className="text-blue-400 hover:text-blue-300">
            로그인 페이지로 이동
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
{/* 네비게이션 */}
      <nav className="w-full flex justify-between items-center px-10 py-6">
        <div className="text-2xl font-bold">
         Chronos
        </div>
        <div className="space-x-8 text-sm text-gray-300 font-light">
          <Link href="/company">Company</Link>
          <Link href="/product">Product</Link>
          <Link href="/new-chronos">New Chronos</Link>
          <Link href="/my-chronos">My Chronos</Link>
          {!loading && (
            user ? (
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
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">새로운 타임캡슐 만들기</h1>
          <p className="text-gray-400">미래의 자신에게 전할 메시지를 작성해보세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 타임캡슐 이름 */}
          <div>
            <label htmlFor="name" className="block text-lg font-medium mb-3">
              타임캡슐 이름 *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              placeholder="타임캡슐의 이름을 입력하세요"
            />
          </div>

          {/* 열기 날짜 */}
          <div>
            <label htmlFor="openDate" className="block text-lg font-medium mb-3">
              열기 날짜
            </label>
            <input
              id="openDate"
              type="datetime-local"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            />
          </div>

          {/* 설명 */}
          <div>
            <label htmlFor="description" className="block text-lg font-medium mb-3">
              설명
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
              placeholder="타임캡슐에 대한 간단한 설명을 입력하세요"
            />
          </div>

          {/* 내용 */}
          <div>
            <label htmlFor="content" className="block text-lg font-medium mb-3">
              내용
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
              placeholder="미래의 자신에게 전할 메시지를 자유롭게 작성하세요..."
            />
          </div>

          {/* 파일 첨부 */}
          <div>
            <label className="block text-lg font-medium mb-3">
              첨부 파일
            </label>
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
                  className="flex items-center space-x-2 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>파일 추가</span>
                </label>
                <span className="text-sm text-gray-400">
                  사진, 비디오, 문서 등 어떤 형식이든 저장할 수 있습니다 (파일당 최대 5MB)
                </span>
              </div>

              {/* 첨부된 파일 목록 */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800 border border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-white text-sm">{file.name}</span>
                        <span className="text-gray-400 text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-300 transition-colors"
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
              <label className="block text-lg font-medium">
                암호화
              </label>
              <button
                type="button"
                onClick={() => setIsEncrypted(!isEncrypted)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  isEncrypted ? 'bg-blue-600' : 'bg-gray-600'
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
              <div className="mt-3">
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  비밀번호 *
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={isEncrypted}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="타임캡슐을 열 때 사용할 비밀번호를 입력하세요"
                />
                <p className="text-sm text-gray-400 mt-2">
                  타임캡슐은 aes-256을 사용하여 암호화됩니다. 비밀번호를 잊어버리면 타임캡슐의 내용을 볼 수 없습니다.
                </p>
              </div>
            )}
          </div>

          {/* 커뮤니티에 공개 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-lg font-medium">
                커뮤니티에 공개
              </label>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  isPublic ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-400">
              이 옵션을 선택하면 타임캡슐이 커뮤니티에 공개되어 다른 사용자들이 볼 수 있습니다.
            </p>
          </div>

          {/* 태그 */}
          {isPublic && (
            <div>
              <label htmlFor="tags" className="block text-lg font-medium mb-3">
                태그
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                placeholder="예: 미래, 꿈, 목표, 회고 (쉼표로 구분)"
              />
            </div>
          )}

          {/* 고급 설정 버튼 */}
          <div className="border-t border-gray-800 pt-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
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
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm text-yellow-300">
                아래 옵션들을 충분히 고려하지 않고 사용한다면, 타임캡슐의 보안성이 크게 떨어질 수 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* 고급 설정 (접을 수 있음) */}
          {showAdvanced && (
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-6">
              <h3 className="text-xl font-semibold text-blue-400">고급 설정</h3>
              
                            {/* 향상된 보안 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    향상된 보안
                  </label>
                  <button
                    type="button"
                    onClick={() => setEnhancedSecurity(!enhancedSecurity)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                      enhancedSecurity ? 'bg-blue-600' : 'bg-gray-600'
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
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
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
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
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
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                      manualAddress ? 'bg-blue-600' : 'bg-gray-600'
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
                        className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-white text-sm"
                      >
                        Chronos 계정 지정
                      </button>
                      <button
                        type="button"
                        className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors text-white text-sm"
                      >
                        지갑 주소 입력
                      </button>
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>새로운 주소 추가</span>
                      </button>
                      <p className="text-xs text-gray-400 mt-2">
                        새로운 주소를 추가하면 입력된 주소들로 동일한 내용의 타입캡슐이 minting 됩니다. 각 소유자는 독립적으로 캡슐을 열 수 있습니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 양도 불가능 타임캡슐 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    양도 불가능한 타임캡슐
                  </label>
                  <button
                    type="button"
                    onClick={() => setNonTransferable(!nonTransferable)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                      nonTransferable ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        nonTransferable ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  이 옵션을 선택하면 타임캡슐을 다른 사람에게 양도할 수 없습니다.
                </p>
              </div>
            </div>
          )}

          {/* 버튼 그룹 */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-800">
            <Link
              href="/"
              className="px-6 py-3 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              타임캡슐 생성
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 