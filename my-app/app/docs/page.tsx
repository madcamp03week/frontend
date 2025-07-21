// app/docs/page.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import SubscribeFooter from '../../components/SubscribeFooter';
import Navigation from '@/components/Navigation';

export default function DocsPage() {
  const sections = [
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'features', title: 'Core Features' },
    { id: 'roadmap', title: 'Roadmap' },
    { id: 'api', title: 'API Reference' },
  ];

  return (
    <main className="min-h-screen bg-black text-white font-sans overflow-hidden px-6 md:px-12 py-16">
  {/*navigation */}
  <Navigation />

      {/* Hero */}
      <section className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
        >
          Documentation
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-gray-400 max-w-2xl mx-auto"
        >
          프로젝트 사용 방법, ㄴ핵심 기능, API 레퍼런스를 한 곳에 모았습니다.
        </motion.p>
      </section>

      {/* Table of Contents */}
      <aside className="mb-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Contents</h2>
        <ul className="space-y-2">
          {sections.map(sec => (
            <li key={sec.id}>
              <a
                href={`#${sec.id}`}
                className="text-cyan-300 hover:text-cyan-100 transition transform hover:-translate-x-1"
              >
                • {sec.title}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      {/* Content Sections */}
      <section className="space-y-24 max-w-3xl mx-auto">
        {/* Getting Started */}
        <article id="getting-started">
          <h3 className="text-3xl font-bold mb-4">Getting Started</h3>
          <p className="text-gray-300 leading-relaxed">
            1) 레포지토리를 클론하고<br/>
            2) `npm install` 후<br/>
            3) `npm run dev`로 로컬 서버 실행<br/>
            자세한 환경변수 설정은 <code className="bg-white/10 px-1 rounded">.env.example</code> 를 참고하세요.
          </p>
        </article>

        {/* Core Features */}
        <article id="features">
          <h3 className="text-3xl font-bold mb-4">Core Features</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Secure IPFS Storage</li>
            <li>Time‑Locked Release</li>
            <li>Customizable NFTs</li>
            <li>Community Governance (DAO)</li>
          </ul>
        </article>

        {/* Roadmap */}
        <article id="roadmap">
          <h3 className="text-3xl font-bold mb-4">Roadmap</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>2025 Q3 – Private Beta 론칭</li>
            <li>2025 Q4 – Public Release & SDK 공개</li>
            <li>2026 Q1 – 다국어 지원 및 글로벌 마케팅</li>
            <li>2026 Q2 – DAO 거버넌스 모듈 출시</li>
          </ol>
        </article>

        {/* API Reference */}
        <article id="api">
          <h3 className="text-3xl font-bold mb-4">API Reference</h3>
          <p className="text-gray-300 leading-relaxed">
            주요 엔드포인트 예시:
          </p>
          <pre className="bg-white/10 p-4 rounded text-sm overflow-auto">
            <code>
{`GET /api/wallets           // 사용자 지갑 목록 조회
POST /api/wallets          // 새 지갑 생성
GET /api/timecapsules/{id} // 타임캡슐 상세 정보`}
            </code>
          </pre>
        </article>
      </section>

      {/* Subscribe Footer */}
      <div className="mt-32">
        <SubscribeFooter />
      </div>
    </main>
  );
}
