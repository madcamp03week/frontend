'use client';

import Link from 'next/link';

interface LoginRequiredProps {
  title?: string;
  description?: string;
}

export default function LoginRequired({ 
  title = "로그인이 필요합니다", 
  description 
}: LoginRequiredProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-indigo-900">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-12 text-center shadow-2xl">
                  <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-r from-white/20 to-white/10 rounded-full flex items-center justify-center border border-white/20">
            <svg className="w-10 h-10 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        <h1 className="text-3xl font-bold mb-6 text-white">
          {title}
        </h1>
        {description && (
          <p className="text-gray-300 mb-8 text-lg">
            {description}
          </p>
        )}
        <Link 
          href="/login" 
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-white/10 border border-white/20 hover:border-white/30 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          로그인 페이지로 이동
        </Link>
      </div>
    </div>
  );
} 