'use client';

import Link from 'next/link';

export default function MyChronosPage() {
  // 임시 데이터 (실제로는 API에서 가져올 데이터)
  const walletAddress = "0x1234...5678";
  const chronosList = [
    {
      id: 1,
      title: "2024년 목표",
      openDate: "2025-01-01 00:00",
      status: "locked"
    },
    {
      id: 2,
      title: "미래의 나에게",
      openDate: "2024-12-31 23:59",
      status: "locked"
    },
    {
      id: 3,
      title: "회고록",
      openDate: "2024-06-15 12:00",
      status: "unlocked"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 네비게이션 */}
      <nav className="w-full flex justify-between items-center px-10 py-6 border-b border-gray-800">
        <div className="text-2xl font-bold">
          <Link href="/">Chronos</Link>
        </div>
        <div className="text-sm text-gray-300">
          My Chronos
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">My Chronos</h1>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-300">
              <span className="font-medium">내 지갑 주소:</span> {walletAddress}
            </p>
          </div>
        </div>

        {/* 타임캡슐 리스트 */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    순번
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    제목
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    지정된 날짜
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    Chronos 열기
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    내용 보기
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    전송
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300 border-b border-gray-700">
                    Polyscan에서 확인하기
                  </th>
                </tr>
              </thead>
              <tbody>
                {chronosList.map((chronos, index) => (
                  <tr key={chronos.id} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {chronos.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      <div>
                        <div>{chronos.openDate}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {(() => {
                            const today = new Date();
                            const openDate = new Date(chronos.openDate);
                            const diffTime = openDate.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            
                            if (diffDays > 0) {
                              return `D-${diffDays}`;
                            } else if (diffDays === 0) {
                              return 'D-Day';
                            } else {
                              return `D+${Math.abs(diffDays)}`;
                            }
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {chronos.status === 'locked' ? (
                        <span className="text-gray-400 text-sm">잠김</span>
                      ) : (
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                          열기
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                        보기
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm">
                        전송
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm">
                        확인
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 빈 상태 메시지 */}
        {chronosList.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-300 mb-2">타임캡슐이 없습니다</h3>
            <p className="text-gray-400 mb-6">새로운 타임캡슐을 만들어보세요!</p>
            <Link
              href="/new-chronos"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              새로운 타임캡슐 만들기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 