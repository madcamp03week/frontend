'use client';

import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import SubscribeFooter from '@/components/SubscribeFooter';
import Navigation from '@/components/Navigation';

// Animation variants
const letterVariants: Variants = {
  hidden: { opacity: 0, y: 30, rotateX: 90 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { delay: i * 0.03, duration: 0.6, type: 'spring', stiffness: 100 },
  }),
};

const slideVariants: Variants = {
  hidden: { opacity: 0, x: -100, scale: 0.8 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.8, type: 'spring', stiffness: 80 },
  },
};

const fadeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.6, rotateY: 45 },
  visible: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: { duration: 0.7, type: 'spring', stiffness: 120 },
  },
};

const floatVariants: Variants = {
  animate: {
    y: [-10, 10, -10],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
};

const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.7, 1, 0.7],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};

function AnimatedText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <motion.h1 className={`${className} inline-block overflow-hidden`} initial="hidden" animate="visible">
      {text.split('').map((char, idx) => (
        <motion.span
          key={idx}
          custom={idx}
          variants={letterVariants}
          className="inline-block"
          whileHover={{ scale: 1.2, color: '#00ffff', textShadow: '0 0 20px #00ffff', transition: { duration: 0.2 } }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.h1>
  );
}

function CryptoParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-cyan-400 rounded-full"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}
    </div>
  );
}

export default function AboutPage() {
  const features = [
    { 
      title: '분산 저장 보안', 
      desc: 'IPFS 네트워크에 암호화된 형태로 분산 저장하여 해킹과 데이터 손실 위험을 제거합니다.', 
    },
    { 
      title: '스마트 타임락', 
      desc: '스마트 컨트랙트로 설정된 미래 시점에만 열람이 허용되는 완벽한 시간 잠금 시스템입니다.', 
    },
    { 
      title: 'NFT 소유권', 
      desc: '각 타임캡슐은 NFT로 발행되어 디지털 자산으로서의 소유권과 희소성을 명확하게 보장합니다.', 
    },
    { 
      title: 'DAO 거버넌스', 
      desc: '탈중앙화된 거버넌스로 우수 타임캡슐이 커뮤니티 투표를 통해 이루어집니다.', 
    },
    { 
      title: '크로스체인 지원', 
      desc: '이더리움, 폴리곤, BSC 등 다중 블록체인 네트워크를 지원하여 접근성을 극대화합니다.', 
    },
    { 
      title: '직관적 UX', 
      desc: '복잡한 온보딩 없이 지갑 연결 또는 이메일만으로 누구나 쉽게 사용할 수 있습니다.', 
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: '콘텐츠 업로드',
      desc: '사진, 동영상, 오디오, 텍스트 등 다양한 형식의 소중한 기억을 업로드합니다.',
    },
    {
      step: '02', 
      title: 'IPFS 암호화 저장',
      desc: '업로드된 콘텐츠는 IPFS 네트워크에 암호화된 형태로 분산 저장됩니다.',
    },
    {
      step: '03',
      title: '타임락 설정',
      desc: '스마트 컨트랙트를 통해 캡슐이 열릴 특정 미래 시점을 설정합니다.',
    },
    {
      step: '04',
      title: 'NFT 발행',
      desc: '타임캡슐이 NFT로 발행되어 사용자 지갑에 영구적으로 귀속됩니다.',
    },
    {
      step: '05',
      title: '열람 가능',
      desc: '설정된 시점에 블록체인 검증을 거쳐 콘텐츠가 안전하게 전달됩니다.',
    }
  ];

  const techStack = [
    { name: 'IPFS', desc: '분산 파일 시스템' },
    { name: 'Ethereum', desc: '스마트 컨트랙트' },
    { name: 'ERC-721', desc: 'NFT 표준' },
    { name: 'Solidity', desc: '컨트랙트 언어' },
    { name: 'Ethers.js', desc: '블록체인 연동' },
    { name: 'Next.js', desc: '프론트엔드' },
  ];

  const roadmap = [
    { date: '2025 Q3', label: '베타 버전 출시', status: 'current' },
    { date: '2025 Q4', label: '퍼블릭 런칭 & 다중체인 지원', status: 'upcoming' },
    { date: '2026 Q1', label: 'DAO 거버넌스 시스템 도입', status: 'future' },
    { date: '2026 Q2', label: 'DeFi 기능 통합 & 글로벌 확장', status: 'future' },
  ];

  return (
    <main className="relative min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-purple-900/20 to-black" />
      <CryptoParticles />
      <Navigation />

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 md:px-12 text-center overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
<motion.div variants={floatVariants} animate="animate" className="mb-8 flex">
  <AnimatedText
    text="Chronos:"
    className="text-6xl md:text-7xl font-light mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
  />
  <AnimatedText
    text=" 시간을 담는 블록체인"
    className="text-6xl md:text-7xl font-medium mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
  />
</motion.div>

        <motion.p
          initial={{ opacity: 0, y: 50, rotateX: 45 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 2, duration: 1, type: 'spring' }}
          className="relative text-xl text-gray-300 max-w-4xl leading-relaxed bg-black/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
        >
          블록체인과 분산 저장 기술로 개인의 소중한 기억을{' '}
          영구히 보존하는 디지털 타임캡슐 플랫폼
          <br/>
          NFT 소유권과 스마트 컨트랙트가 만나는 혁신적 경험으로 미래의 나에게 특별한 선물을 전달합니다.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.8 }}
          className="mt-8 flex flex-col sm:flex-row gap-4"
        >
  <Link
            href="/new-chronos"
            className="mt-8 inline-block px-8 py-3 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg
              bg-gradient-to-r from-cyan-400/60 via-blue-500/60 to-purple-500/60
              hover:from-cyan-400/80 hover:via-blue-500/80 hover:to-purple-500/80
              text-white relative overflow-hidden
              border border-white/40 hover:border-white/60
              backdrop-blur-sm hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/25"
          >
            <span className="relative z-10 tracking-wide flex items-center">
          
              Chrons 만들러 가기
            </span>
          </Link>
        </motion.div>
      </section>

      {/* What is Chronos Section */}
      <section className="relative bg-gradient-to-br from-gray-900/80 to-black/80 py-20 px-6 md:px-12 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-light mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Chronos란 무엇인가요?
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Chronos는 개인의 소중한 기억을 블록체인과 분산 저장 기술을 기반으로 영구히 보존하는 디지털 타임캡슐 플랫폼입니다. 
              사용자는 사진, 동영상, 오디오, 텍스트 등 다양한 형식의 콘텐츠를 손쉽게 업로드하고, 
              IPFS 네트워크에 암호화된 형태로 저장할 수 있습니다.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-2xl font-light mb-4 text-cyan-400">완벽한 보안</h3>
                <p className="text-gray-300 leading-relaxed">
                  저장된 데이터는 중앙 서버가 아닌 분산 노드에 분산되어 보관되기 때문에 
                  해킹이나 데이터 손실 위험이 사실상 제로에 가깝습니다.
                </p>
              </div>
              
              <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-2xl font-light mb-4 text-purple-400">스마트 타임락</h3>
                <p className="text-gray-300 leading-relaxed">
                  각 타임캡슐은 스마트 컨트랙트로 관리되며, 사용자가 설정한 특정 미래 시점에만 
                  자동으로 열람이 허용됩니다. 이 과정은 모두 블록체인에 기록되므로 누구도 임의로 개입할 수 없습니다.
                </p>
              </div>

              <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-2xl font-light mb-4 text-pink-400">NFT 소유권</h3>
                <p className="text-gray-300 leading-relaxed">
                  각 캡슐은 NFT로 발행되어 사용자 지갑에 영구적으로 귀속되며, 
                  디지털 자산으로서의 소유권과 희소성을 명확하게 보장합니다.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-3xl p-3 backdrop-blur-sm border border-white/10">
                <img 
                  src="/asset/chronos.png" 
                  alt="Chronos Digital Time Capsule" 
                  className="w-full h-auto rounded-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-3xl"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 px-6 md:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-light mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              핵심 기능
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              최첨단 블록체인 기술과 분산 저장 시스템으로 구현된 혁신적인 타임캡슐 서비스
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300" />
                <div className="relative bg-black/70 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:border-cyan-400/50 transition-all duration-300">
                  <h3 className="text-xl font-light mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative bg-gradient-to-br from-gray-900/90 to-black/90 py-20 px-6 md:px-12 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-light mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              작동 원리
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              간단한 5단계로 완성되는 블록체인 기반 디지털 타임캡슐
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-cyan-500 to-purple-500 hidden lg:block"></div>
            
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className={`relative mb-12 flex items-center ${
                  i % 2 === 0 ? 'lg:justify-start' : 'lg:justify-end'
                }`}
              >
                <div className={`w-full lg:w-96 ${i % 2 === 0 ? 'lg:mr-8' : 'lg:ml-8'}`}>
                  <div className="bg-black/70 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-white font-normal mr-4">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-xl font-light mb-3 text-white">{step.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                
                {/* Timeline Dot */}
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-cyan-400 rounded-full border-4 border-black hidden lg:block"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-light mb-6 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              기술 스택
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              최신 블록체인 기술과 분산 저장 시스템으로 구축된 안전하고 신뢰할 수 있는 플랫폼
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {techStack.map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.1, rotateY: 10 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center hover:bg-white/15 transition-all duration-300"
              >
                <h3 className="text-lg font-light mb-2 text-white">{tech.name}</h3>
                <p className="text-gray-400 text-sm">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="relative bg-gradient-to-br from-gray-900/90 to-black/90 py-20 px-6 md:px-12 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-light mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              로드맵
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Chronos의 미래 발전 계획과 주요 마일스톤
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roadmap.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                  item.status === 'current' 
                    ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-400/50' 
                    : 'bg-black/50 border-white/10 hover:border-white/30'
                }`}
              >
                {item.status === 'current' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-normal">
                    진행중
                  </div>
                )}
                <div className="text-center">
                  <p className="text-cyan-400 font-normal mb-2">{item.date}</p>
                  <h3 className="text-white font-light text-lg leading-tight">{item.label}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DAO Governance Section */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-light mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              DAO 거버넌스
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              서비스 운영은 탈중앙화된 거버넌스 구조로 설계되어, 모든 주요 의사결정은 DAO 투표를 통해 이루어집니다. <br></br>
              이를 통해 플랫폼의 업그레이드, 수수료 정책, 커뮤니티 이벤트 등 사용자 의견이 직접 반영되며 <br></br>
              커뮤니티와 함께 지속 가능한 생태계를 만들어갑니다.  </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl p-8 border border-white/10"
            >
              <h3 className="text-2xl font-light mb-4 text-white">커뮤니티 투표</h3>
              <p className="text-gray-300 leading-relaxed">
                홀더들의 투표를 통해 우수 TC이 결정되며, <br></br>
                투명하고 민주적인 거버넌스를 실현합니다.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-8 border border-white/10"
            >
              <h3 className="text-2xl font-light mb-4 text-white">제안 시스템</h3>
              <p className="text-gray-300 leading-relaxed">
                구성원 모두 개선 제안을 할 수 있으며, <br></br>
                검토 과정을 거쳐 투표에 상정됩니다.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-2xl p-8 border border-white/10"
            >
              <h3 className="text-2xl font-light mb-4 text-white">지속 가능성</h3>
              <p className="text-gray-300 leading-relaxed">
                장기적인 생태계 발전을 위한 정책과 인센티브 구조를 
                커뮤니티와 함께 설계하고 운영합니다.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-cyan-800/50 to-purple-800/50 py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-light mb-6 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent"
          >
            지금 시작하세요
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-300 mb-8 leading-relaxed"
          >
            Chronos는 단순한 데이터 저장 공간을 넘어, 과거와 미래를 연결하는 감동적인 경험을 제공함으로써,<br></br>
            개인의 이야기를 시간의 흐름 속에 영원히 기록합니다.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-normal text-lg shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
            >
              <Link href="/new-chronos" className="flex items-center justify-center h-full">
                첫 타임캡슐 만들기
              </Link>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 border border-white/30 rounded-full font-normal text-lg hover:bg-white/10 transition-all duration-300"
            >
              백서 다운로드
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Subscribe Footer */}
      <SubscribeFooter />
    </main>
  );
}
