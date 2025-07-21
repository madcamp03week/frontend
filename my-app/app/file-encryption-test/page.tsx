'use client';

import { useState } from 'react';
import { encryptFile, decryptFile, encryptFileWithSystemKey, decryptFileWithSystemKey } from '../../lib/crypto';

// SHA-256 해시 계산 함수
const calculateSHA256 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        resolve(hashHex);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export default function FileEncryptionTest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('test-password-123');
  const [encryptedData, setEncryptedData] = useState<string>('');
  const [decryptedFile, setDecryptedFile] = useState<File | null>(null);
  const [originalHash, setOriginalHash] = useState<string>('');
  const [decryptedHash, setDecryptedHash] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  // 테스트용 이미지 생성 함수
  const createTestImage = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // 그라데이션 배경
      const gradient = ctx.createLinearGradient(0, 0, 200, 200);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(0.5, '#4ecdc4');
      gradient.addColorStop(1, '#45b7d1');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 200);
      
      // 텍스트 추가
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TEST IMAGE', 100, 100);
      
      // 현재 시간 추가
      ctx.font = '16px Arial';
      ctx.fillText(new Date().toLocaleString(), 100, 130);
      
      // 원 추가
      ctx.beginPath();
      ctx.arc(100, 160, 20, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
    }
    
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'test.png', { type: 'image/png' });
          resolve(file);
        }
      }, 'image/png');
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // 원본 파일의 SHA-256 해시 계산
      const hash = await calculateSHA256(file);
      setOriginalHash(hash);
    }
  };

  const testPasswordEncryption = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    try {
      console.log('=== 비밀번호 기반 암호화 테스트 시작 ===');
      
      // 1. 파일 암호화
      console.log('1. 파일 암호화 중...');
      const { encryptedData: encrypted } = await encryptFile(selectedFile, password);
      setEncryptedData(encrypted);
      console.log('암호화 완료. 암호화된 데이터 길이:', encrypted.length);
      
      // 2. 파일 복호화
      console.log('2. 파일 복호화 중...');
      const { file: decrypted, metadata } = await decryptFile(encrypted, password);
      setDecryptedFile(decrypted);
      console.log('복호화 완료. 메타데이터:', metadata);
      
      // 3. SHA-256 해시 계산 및 비교
      console.log('3. SHA-256 해시 계산 중...');
      const decryptedHash = await calculateSHA256(decrypted);
      setDecryptedHash(decryptedHash);
      
      const hashesMatch = originalHash === decryptedHash;
      console.log('원본 해시:', originalHash);
      console.log('복호화된 해시:', decryptedHash);
      console.log('해시 일치:', hashesMatch);
      
      setTestResults({
        type: 'password',
        success: hashesMatch,
        originalHash,
        decryptedHash,
        hashesMatch,
        metadata,
        encryptedDataLength: encrypted.length
      });
      
    } catch (error) {
      console.error('테스트 실패:', error);
      setTestResults({
        type: 'password',
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testSystemKeyEncryption = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    try {
      console.log('=== 시스템 키 기반 암호화 테스트 시작 ===');
      
      // 1. 파일 암호화
      console.log('1. 파일 암호화 중...');
      const { encryptedData: encrypted } = await encryptFileWithSystemKey(selectedFile);
      setEncryptedData(encrypted);
      console.log('암호화 완료. 암호화된 데이터 길이:', encrypted.length);
      
      // 2. 파일 복호화
      console.log('2. 파일 복호화 중...');
      const { file: decrypted, metadata } = await decryptFileWithSystemKey(encrypted);
      setDecryptedFile(decrypted);
      console.log('복호화 완료. 메타데이터:', metadata);
      
      // 3. SHA-256 해시 계산 및 비교
      console.log('3. SHA-256 해시 계산 중...');
      const decryptedHash = await calculateSHA256(decrypted);
      setDecryptedHash(decryptedHash);
      
      const hashesMatch = originalHash === decryptedHash;
      console.log('원본 해시:', originalHash);
      console.log('복호화된 해시:', decryptedHash);
      console.log('해시 일치:', hashesMatch);
      
      setTestResults({
        type: 'system',
        success: hashesMatch,
        originalHash,
        decryptedHash,
        hashesMatch,
        metadata,
        encryptedDataLength: encrypted.length
      });
      
    } catch (error) {
      console.error('테스트 실패:', error);
      setTestResults({
        type: 'system',
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadEncryptedFile = () => {
    if (!encryptedData) return;
    
    const blob = new Blob([encryptedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'encrypted_file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadDecryptedFile = () => {
    if (!decryptedFile) return;
    
    const url = URL.createObjectURL(decryptedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = decryptedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">파일 암호화/복호화 테스트</h1>
        
        {/* 파일 선택 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. 테스트 파일 선택</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="file"
              onChange={handleFileSelect}
              className="block flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={async () => {
                const testFile = await createTestImage();
                setSelectedFile(testFile);
                const hash = await calculateSHA256(testFile);
                setOriginalHash(hash);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              테스트 이미지 생성
            </button>
          </div>
          {selectedFile && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p><strong>선택된 파일:</strong> {selectedFile.name}</p>
              <p><strong>파일 크기:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
              <p><strong>파일 타입:</strong> {selectedFile.type}</p>
              <p><strong>SHA-256 해시:</strong> {originalHash}</p>
              {selectedFile.type.startsWith('image/') && (
                <div className="mt-2">
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Preview" 
                    className="max-w-xs border rounded"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 비밀번호 설정 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">2. 비밀번호 설정</h2>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="암호화 비밀번호 (최소 6자)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-600 mt-2">비밀번호는 최소 6자 이상이어야 합니다.</p>
        </div>

        {/* 테스트 버튼 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">3. 암호화/복호화 테스트</h2>
          <div className="flex gap-4">
            <button
              onClick={testPasswordEncryption}
              disabled={!selectedFile || password.length < 6 || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '테스트 중...' : '비밀번호 기반 테스트'}
            </button>
            <button
              onClick={testSystemKeyEncryption}
              disabled={!selectedFile || isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '테스트 중...' : '시스템 키 기반 테스트'}
            </button>
          </div>
        </div>

        {/* 테스트 결과 */}
        {testResults && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">4. 테스트 결과</h2>
            
            {testResults.success ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  ✅ 테스트 성공! ({testResults.type === 'password' ? '비밀번호 기반' : '시스템 키 기반'})
                </h3>
                
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <h4 className="font-semibold text-gray-700 mb-2">해시 비교 결과:</h4>
                     <p><strong>원본 SHA-256:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{testResults.originalHash}</code></p>
                     <p><strong>복호화 SHA-256:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{testResults.decryptedHash}</code></p>
                     <p><strong>일치 여부:</strong> <span className="text-green-600 font-semibold">✅ 일치</span></p>
                   </div>
                   
                   <div>
                     <h4 className="font-semibold text-gray-700 mb-2">파일 정보:</h4>
                     <p><strong>원본 파일명:</strong> {testResults.metadata.originalName}</p>
                     <p><strong>확장자:</strong> {testResults.metadata.extension}</p>
                     <p><strong>파일 크기:</strong> {testResults.metadata.size} bytes</p>
                     <p><strong>암호화 데이터 크기:</strong> {testResults.encryptedDataLength} characters</p>
                   </div>
                 </div>
                 
                 {/* 이미지 미리보기 */}
                 {testResults.metadata.type.startsWith('image/') && (
                   <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                     <h4 className="font-semibold text-gray-700 mb-2">이미지 미리보기:</h4>
                     <div className="flex gap-4">
                       <div>
                         <p className="text-sm text-gray-600 mb-2">원본 이미지:</p>
                         <img 
                           src={selectedFile ? URL.createObjectURL(selectedFile) : ''} 
                           alt="Original" 
                           className="max-w-xs border rounded"
                         />
                       </div>
                       <div>
                         <p className="text-sm text-gray-600 mb-2">복호화된 이미지:</p>
                         <img 
                           src={decryptedFile ? URL.createObjectURL(decryptedFile) : ''} 
                           alt="Decrypted" 
                           className="max-w-xs border rounded"
                         />
                       </div>
                     </div>
                   </div>
                 )}
                
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={downloadEncryptedFile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    암호화된 파일 다운로드
                  </button>
                  <button
                    onClick={downloadDecryptedFile}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    복호화된 파일 다운로드
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  ❌ 테스트 실패 ({testResults.type === 'password' ? '비밀번호 기반' : '시스템 키 기반'})
                </h3>
                <p className="text-red-700">{testResults.error}</p>
              </div>
            )}
          </div>
        )}

        {/* 사용법 안내 */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📋 사용법</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>테스트할 파일을 선택합니다 (test.png 권장)</li>
            <li>암호화에 사용할 비밀번호를 입력합니다 (최소 6자)</li>
            <li>원하는 테스트 방법을 선택합니다:
              <ul className="list-disc list-inside ml-6 mt-2">
                <li><strong>비밀번호 기반:</strong> 사용자 비밀번호로 암호화 (서비스 종료 후에도 복호화 가능)</li>
                <li><strong>시스템 키 기반:</strong> 서버 시스템 키로 암호화 (서버에서만 복호화 가능)</li>
              </ul>
            </li>
            <li>테스트 결과를 확인하고 파일들을 다운로드할 수 있습니다</li>
          </ol>
          
          <div className="mt-4 p-4 bg-white rounded-lg">
                         <h3 className="font-semibold mb-2">🔍 SHA-256 해시 비교</h3>
             <p className="text-sm text-gray-600">
               원본 파일과 복호화된 파일의 SHA-256 해시를 비교하여 암호화/복호화가 정확히 수행되었는지 확인합니다. 
               해시가 일치하면 파일이 손실 없이 완벽하게 복원되었음을 의미합니다.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
} 