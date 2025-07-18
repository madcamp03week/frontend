// app/product/page.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import SubscribeFooter from '../components/SubscribeFooter';

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-black text-white font-sans">
       {/* 네비게이션 */}
        <nav className="w-full flex justify-between items-center px-10 py-6">
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
      <section className="text-center py-20 px-6 md:px-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent"
        >
          디지털 타임캡슐 DApp
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-gray-400 max-w-3xl mx-auto"
        >
          소중한 추억을 IPFS에 안전하게 저장하고, 미래의 정해진 시점에 NFT로 받아보세요.
          블록체인 기술로 보장되는 완전한 보안과 자동화된 스마트 컨트랙트 시스템을 경험하세요.
        </motion.p>
      </section>

      {/* Key Features Section */}
      <section className="bg-gray-900 py-16 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <h2 className="text-3xl font-bold">핵심 기능</h2>
          <p className="text-gray-400 mt-4">혁신적인 블록체인 기술로 구현한 타임캡슐 서비스</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { 
              title: 'IPFS 보안 저장', 
              desc: '사진, 비디오, 텍스트를 Filebase IPFS에 암호화하여 안전하게 저장합니다.',
              icon: '🔒'
            },
            { 
              title: '자동 NFT 발행', 
              desc: '타임캡슐이 열리는 순간 스마트 컨트랙트가 자동으로 NFT를 발행하여 지갑으로 전송합니다.',
              icon: '🎨'
            },
            { 
              title: '맞춤형 오픈 일정', 
              desc: '원하는 날짜와 시간을 정확히 설정하여 미래의 특별한 순간에 추억을 되찾으세요.',
              icon: '⏰'
            },
            { 
              title: '이메일 알림', 
              desc: '타임캡슐이 열릴 때 자동으로 이메일 알림을 받아 놓치지 않도록 합니다.',
              icon: '📧'
            },
            { 
              title: '지갑 통합', 
              desc: 'MetaMask 연결 또는 자체 지갑 생성으로 편리하게 시작할 수 있습니다.',
              icon: '💳'
            },
            { 
              title: 'NFT 거래', 
              desc: '생성된 타임캡슐을 열리기 전에도 NFT 형태로 거래할 수 있습니다.',
              icon: '🔄'
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-all duration-300"
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <h2 className="text-3xl font-bold">작동 방식</h2>
          <p className="text-gray-400 mt-4">간단한 5단계로 완성되는 디지털 타임캡슐</p>
        </motion.div>
        <div className="max-w-4xl mx-auto">
          {[
            {
              step: '01',
              title: '지갑 연결 및 회원가입',
              desc: 'MetaMask 지갑을 연결하거나 이메일로 회원가입하여 자동 생성된 지갑을 사용하세요.'
            },
            {
              step: '02',
              title: '타임캡슐 콘텐츠 업로드',
              desc: '소중한 사진(1MB), 비디오(10MB), 텍스트를 업로드하여 타임캡슐에 담으세요.'
            },
            {
              step: '03',
              title: '오픈 일시 설정',
              desc: '직관적인 날짜/시간 선택기로 캡슐이 열릴 정확한 시점을 지정하세요.'
            },
            {
              step: '04',
              title: '블록체인 저장',
              desc: '콘텐츠는 IPFS에 암호화 저장되고, 스마트 컨트랙트가 자동 실행을 위해 블록체인에 기록됩니다.'
            },
            {
              step: '05',
              title: 'NFT 자동 발행',
              desc: '설정한 시간이 되면 NFT가 자동으로 발행되어 지갑으로 전송되고 이메일 알림을 받게 됩니다.'
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
              className="flex items-start space-x-6 mb-8 p-6 bg-gray-900/50 rounded-xl border border-gray-800"
            >
              <div className="bg-gradient-to-r from-purple-600 to-green-400 text-black font-bold text-lg px-4 py-2 rounded-full min-w-[60px] text-center">
                {item.step}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-300 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="bg-gray-900 py-16 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <h2 className="text-3xl font-bold">기술 스택</h2>
          <p className="text-gray-400 mt-4">최신 블록체인 기술과 분산 저장 시스템</p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {[
            { name: 'IPFS', desc: '분산 파일 시스템' },
            { name: 'Ethereum', desc: '스마트 컨트랙트' },
            { name: 'ERC-721', desc: 'NFT 표준' },
            { name: 'Web3.js', desc: '블록체인 연동' },
            { name: 'Next.js', desc: '풀스택 프레임워크' },
            { name: 'MongoDB', desc: '메타데이터 저장' },
            { name: 'Filebase', desc: 'IPFS 게이트웨이' },
            { name: 'Solidity', desc: '스마트 컨트랙트 언어' },
          ].map((tech, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 + idx * 0.05 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center hover:bg-white/15 transition-all duration-300"
            >
              <h3 className="text-lg font-semibold mb-1">{tech.name}</h3>
              <p className="text-gray-400 text-sm">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing & Plans Section */}
      <section className="py-16 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <h2 className="text-3xl font-bold">요금제</h2>
          <p className="text-gray-400 mt-4">필요에 맞는 플랜을 선택하세요</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { 
              plan: 'Basic', 
              price: '$3', 
              features: ['최대 5개 파일', '표준 발행 수수료', '기본 IPFS 저장', '이메일 알림'] 
            },
            { 
              plan: 'Pro', 
              price: '$10', 
              features: ['최대 20개 파일', '할인된 발행 수수료', '우선 IPFS 저장', '이메일 알림', '거래 기능'] 
            },
            { 
              plan: 'Enterprise', 
              price: '문의', 
              features: ['무제한 파일', '맞춤형 서비스', '전용 지원', '고급 분석', 'API 접근'] 
            },
          ].map((pkg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + idx * 0.2 }}
              className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center hover:bg-white/15 transition-all duration-300 ${
                idx === 1 ? 'ring-2 ring-purple-400 scale-105' : ''
              }`}
            >
              {idx === 1 && (
                <div className="bg-gradient-to-r from-purple-600 to-green-400 text-black text-sm font-bold px-4 py-1 rounded-full inline-block mb-4">
                  추천
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{pkg.plan}</h3>
              <p className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
                {pkg.price}
              </p>
              <ul className="text-gray-300 text-sm mb-6 space-y-2">
                {pkg.features.map((f, j) => (
                  <li key={j} className="flex items-center justify-center space-x-2">
                    <span className="text-green-400">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full bg-gradient-to-r from-purple-600 to-green-400 px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                {pkg.plan} 선택
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-900/50 to-green-900/50 py-16 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-4">지금 시작하세요</h2>
          <p className="text-lg text-gray-300 mb-8">
            첫 번째 디지털 타임캡슐을 만들어 미래의 자신에게 특별한 선물을 남겨보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-purple-600 to-green-400 px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity">
              타임캡슐 만들기
            </button>
            <button className="border border-white/30 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors">
              데모 보기
            </button>
          </div>
        </motion.div>
      </section>

      {/* Subscribe Footer */}
      <SubscribeFooter />
    </main>
  );
}