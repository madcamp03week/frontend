// app/product/page.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import SubscribeFooter from '../../components/SubscribeFooter';
import Navigation from '../../components/Navigation';


export default function ProductPage() {
  return (
    <main className="min-h-screen bg-black text-white font-sans">
      {/* 네비게이션 */}
      <Navigation />

      {/* Hero Section */}
      <section className="text-center py-20 px-6 md:px-12">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent"
        >
          Decentralized Time Capsule
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-gray-400 max-w-3xl mx-auto"
        >
          IPFS에 안전하게 저장된 소중한 추억을 블록체인 NFT로 영구히 소장하세요.
          미래의 특정 시점에 공개되도록 설정하여 특별한 순간을 더욱 의미있게 만들 수 있습니다.
        </motion.p>
      </section>

      {/* Product Description Section */}
      <section className="py-16 px-6 md:px-12 bg-gray-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-4">⏳ 디지털 타임캡슐</h2>
          <p className="text-gray-300 leading-relaxed">
            지금 이 순간의 감정, 생각, 그리고 추억을 미래의 나에게 남기고 싶었던 적 있나요?
            디지털 타임캡슐은 사진, 영상, 텍스트를 담아 블록체인 기반 NFT로 영구 보관하고, 정해진 미래의 시간에만 열어볼 수 있도록 만들어진 특별한 서비스입니다.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            <b>🌐 완전한 소유권과 보안</b><br />
            타임캡슐은 NFT로 발행되어 오직 본인만 열람할 수 있고, IPFS 분산 저장 기술로 안전하게 보관됩니다. 영구적으로 변조 불가능한 형태로 기록되며, 블록체인 위에서 존재하는 진짜 당신의 이야기입니다.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            <b>⏰ 열람 시간 지정</b><br />
            미래의 특정 날짜와 시간에만 열람 가능하게 설정할 수 있습니다. 졸업식, 입사 5주년, 결혼기념일 등 당신만의 의미 있는 날에 다시 열어보세요.
          </p>
          <p className="text-gray-300 leading-relaxed mt-4">
            <b>✉️ 미래를 위한 선물</b><br />
            자신에게, 혹은 소중한 사람에게 편지나 영상을 남겨보세요. 시간이 지나 열람할 때, 그 감동은 상상 이상일 것입니다.
          </p>
          <p className="text-gray-300 italic mt-8">
            "기억은 사라지지만, 기록은 남습니다. 디지털 타임캡슐과 함께, 당신의 시간을 저장하세요."
          </p>
        </motion.div>
      </section>

      {/* Key Features Section */}
      <section className="bg-gray-900 py-16 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <h2 className="text-3xl font-bold">주요 기능</h2>
          <p className="text-gray-400 mt-4">분산 기술로 구현된 혁신적인 타임캡슐 서비스</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { 
              title: 'IPFS Encryption', 
              desc: 'Securely store data on Filebase IPFS with end-to-end encryption for ultimate privacy.',
            },
            { 
              title: 'Automated NFT Minting', 
              desc: 'Smart contracts automatically mint and transfer NFTs upon time capsule release.',
            },
            { 
              title: 'Precise Unlocking', 
              desc: 'Set exact dates and times to reveal memories at the perfect moment in the future.',
            },
            { 
              title: 'Email Notifications', 
              desc: 'Receive email alerts when time capsules are opened, ensuring no moment is missed.',
            },
            { 
              title: 'Wallet Integration', 
              desc: 'Seamlessly connect with MetaMask or create a new wallet for easy access.',
            },
            { 
              title: 'NFT Marketplace', 
              desc: 'Trade time capsule NFTs before they unlock, creating new opportunities.',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + idx * 0.1 }}
              className="
                bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 text-center
                shadow-lg
                hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30
                transition-all duration-300
              "
            >
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