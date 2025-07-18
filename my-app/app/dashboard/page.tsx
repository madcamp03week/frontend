'use client';

import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-900 shadow-lg rounded-lg p-6 border border-gray-700">
            <h1 className="text-3xl font-bold text-white mb-6">
              대시보드
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 사용자 정보 카드 */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">
                  사용자 정보
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-white">이메일:</span> {user?.email || '이메일 없음'}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-white">이름:</span> {user?.displayName || '이름 없음'}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-white">UID:</span> {user?.uid}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-white">가입일:</span> {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ko-KR') : '알 수 없음'}
                  </p>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-white">로그인 방법:</span> {user?.providerData[0]?.providerId === 'github.com' ? 'GitHub' : user?.providerData[0]?.providerId === 'google.com' ? 'Google' : '이메일/비밀번호'}
                  </p>
                </div>
              </div>

              {/* 통계 카드 */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-green-400 mb-4">
                  통계
                </h3>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-green-400">0</p>
                  <p className="text-sm text-gray-300">총 거래 수</p>
                </div>
              </div>

              {/* 설정 카드 */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">
                  설정
                </h3>
                <div className="space-y-2">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors">
                    프로필 편집
                  </button>
                  <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors">
                    보안 설정
                  </button>
                </div>
              </div>
            </div>

            {/* 최근 활동 */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                최근 활동
              </h2>
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <p className="text-gray-300 text-center">
                  아직 활동 내역이 없습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 