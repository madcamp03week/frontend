import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 서버 외부 패키지 설정 (firebase-admin)
  serverExternalPackages: ['firebase-admin'],
  
  // 개발 환경 최적화
  experimental: {
    // 타입스크립트 컴파일 최적화
    typedRoutes: true,
  },
  
  // 개발 환경에서만 적용되는 설정
  ...(process.env.NODE_ENV === 'development' && {
    // 타입스크립트 체크 비활성화 (개발 시)
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  }),
  
  // 프로덕션 최적화
  ...(process.env.NODE_ENV === 'production' && {
    compress: true,
    poweredByHeader: false,
  }),
};

export default nextConfig;
