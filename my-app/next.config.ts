import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 환경 최적화
  experimental: {
    // API 라우트 컴파일 최적화
    serverComponentsExternalPackages: ['firebase-admin'],
    // 타입스크립트 컴파일 최적화
    typedRoutes: true,
  },
  
  // 개발 환경에서만 적용되는 설정
  ...(process.env.NODE_ENV === 'development' && {
    // 개발 서버 최적화
    swcMinify: false, // 개발에서는 SWC 미니파이 비활성화
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
    swcMinify: true,
    compress: true,
    poweredByHeader: false,
  }),
};

export default nextConfig;
