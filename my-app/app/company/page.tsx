// app/company/page.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import SubscribeFooter from '../components/SubscribeFooter';

export default function CompanyPage() {
  const features = [
    { title: 'Secure IPFS Storage', desc: '모든 타임캡슐 데이터를 분산 저장하여 영구 보존합니다.' },
    { title: 'Time‑Locked Release', desc: '설정한 시점에만 열리는 강력한 타임락 기능.' },
    { title: 'Customizable NFTs', desc: '나만의 NFT 디자인과 메타데이터를 자유롭게 설정.' },
    { title: 'Community Governance', desc: 'DAO 투표로 신뢰할 수 있는 운영을 실현합니다.' },
  ];

  const roadmap = [
    { date: '2025 Q3', label: 'Private Beta 론칭' },
    { date: '2025 Q4', label: 'Public Release & SDK 공개' },
    { date: '2026 Q1', label: '다국어 지원 및 글로벌 마케팅' },
    { date: '2026 Q2', label: 'DAO 거버넌스 모듈 출시' },
  ];

  const partners = ['/logos/partner1.png', '/logos/partner2.png', '/logos/partner3.png', '/logos/partner4.png'];

  return (
    <main className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
      {/* 배경 네온 네트워크 패턴 */}
      <div className="absolute inset-0 bg-[url('/crypto-network.svg')] bg-center bg-no-repeat opacity-10"></div>
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-pink-500/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* 네비게이션 (훼손 금지) */}
      <nav className="z-10 relative w-full flex justify-between items-center px-10 py-6">
        <div className="text-2xl font-bold">
          <Link href="/">Chronos</Link>
        </div>
        <div className="space-x-8 text-sm text-gray-300 font-light">
          <Link href="/company">Company</Link>
          <Link href="/product">Product</Link>
          <Link href="/artist">Artist</Link>
          <Link href="/wallet">Wallet</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 text-center py-20 px-6 md:px-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
        >
          Company
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-gray-400"
        >
          Building the future of digital timecapsules and NFT experiences.
        </motion.p>
      </section>

      {/* About Us */}
      <section className="relative z-10 bg-gray-900 py-16 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-4">About Us</h2>
          <p className="text-gray-300 leading-relaxed">
            We create unforgettable digital experiences bridging physical & digital realms.
            Expertise in blockchain, IPFS, and UX ensures every timecapsule is both secure & delightful.
          </p>
        </motion.div>
      </section>

      {/* Core Features */}
      <section className="relative z-10 py-16 px-6 md:px-12">
        <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
          Core Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="
                backdrop-blur-lg bg-white/5 border border-white/10 rounded-3xl p-6 text-center
                shadow-md transition-transform transform
                hover:-translate-y-3 hover:scale-105 hover:shadow-cyan-500/40
                active:translate-y-1 active:scale-95
              "
            >
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="relative z-10 bg-gray-900 py-16 px-6 md:px-12">
        <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
          Roadmap
        </h2>
        <div className="relative max-w-3xl mx-auto before:absolute before:left-1/2 before:top-0 before:-mt-2 before:h-full before:w-1 before:bg-gradient-to-b from-cyan-500 to-purple-500">
          {roadmap.map((m, i) => (
            <motion.div
              key={m.date}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className={`relative mb-12 flex items-center ${
                i % 2 === 0 ? 'justify-start' : 'justify-end'
              }`}
            >
              <div className="z-10 w-48 p-4 backdrop-blur-md bg-white/5 border border-white/20 rounded-2xl">
                <p className="text-sm text-cyan-300">{m.date}</p>
                <h4 className="font-semibold">{m.label}</h4>
              </div>
              <div className="absolute left-1/2 w-4 h-4 bg-cyan-400 rounded-full transform -translate-x-1/2"></div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Our Partners */}
      <section className="relative z-10 py-16 px-6 md:px-12">
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
          Our Partners
        </h2>
        <div className="flex space-x-8 overflow-x-auto py-4 px-4">
          {partners.map((src, i) => (
            <motion.img
              key={i}
              src={src}
              alt={`Partner ${i + 1}`}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="
                h-16 object-contain opacity-80
                transition-transform transform
                hover:-translate-y-2 hover:scale-110
                active:scale-95
              "
            />
          ))}
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="relative z-10 bg-gradient-to-r from-cyan-800 to-purple-800 py-16 text-center px-6 md:px-12 rounded-3xl mx-6 md:mx-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-200"
        >
          Join Us on this Journey
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-300 mb-8"
        >
          함께 크립토·디지털 미래를 만들어갈 당신을 기다립니다.
        </motion.p>
        <Link
          href="/careers"
          className="
            inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-semibold shadow-lg
            transition-transform transform
            hover:-translate-y-1 hover:scale-105 hover:shadow-cyan-500/50
            active:translate-y-1 active:scale-95
          "
        >
          View Open Positions
        </Link>
      </section>

      {/* Subscribe Footer */}
      <div className="relative z-10">
        <SubscribeFooter />
      </div>
    </main>
  );
}
