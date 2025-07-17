'use client';

import { motion } from 'framer-motion';
import MadeForSection from '@/app/components/MadeForSection'
import SubscribeFooter from './components/SubscribeFooter';


export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white font-sans overflow-hidden">
      {/* 네비게이션 */}
      <nav className="w-full flex justify-between items-center px-10 py-6">
        <div className="text-2xl font-bold">
          Block<span className="text-sky-400">NFT</span>
        </div>
        <div className="space-x-8 text-sm text-gray-300 font-light">
          <a href="#">Company</a>
          <a href="#">Product</a>
          <a href="#">Artist</a>
          <a href="#">Wallet</a>
        </div>
      </nav>

      {/* 메인 텍스트 */}
      <section className="flex flex-col items-center justify-center mt-28 px-4 text-center">
        <p className="text-lg italic text-gray-300 mb-2">A new era of</p>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          FINANCIAL EXPLORATION
        </h1>
      </section>

{/* 체인 이미지 애니메이션 */}
      <section className="mt-24 relative h-[500px] w-full flex items-center justify-center">
  {/* 왼쪽 체인 */}
  <motion.img
    src="/asset/c2.png"
    alt="Left Chain"
    initial={{ x: '-200%', opacity: 0 }}
    animate={{ 
      x: '-25%', 
      opacity: 1,
    }}
    transition={{ 
      duration: 1.5, 
      ease: 'easeOut'
    }}
    className="absolute w-[600px] max-w-[90vw] z-10 left-1/2 -translate-x-1/2"
  />

  {/* 오른쪽 체인 */}
  <motion.img
    src="/asset/c1.png"
    alt="Right Chain"
    initial={{ x: '200%', opacity: 0 }}
    animate={{ 
      x: '25%', 
      opacity: 1,
    }}
    transition={{ 
      duration: 1.5, 
      ease: 'easeOut',
      delay: 0.3
    }}
    className="absolute w-[600px] max-w-[90vw] z-20 left-1/2 -translate-x-1/2"
  />

  {/* 결합 임팩트 이펙트 */}
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: [0, 1.5, 1],
      opacity: [0, 1, 0.6, 0]
    }}
    transition={{ 
      duration: 1.2, 
      delay: 1.8,
      times: [0, 0.3, 0.7, 1]
    }}
    className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 blur-xl opacity-40 z-5"
  />

  {/* 파티클 효과 */}
  {[...Array(8)].map((_, i) => (
    <motion.div
      key={i}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: [0, 1, 0],
        opacity: [0, 1, 0],
        x: [0, (i - 4) * 50],
        y: [0, -40 + (i % 3) * 30]
      }}
      transition={{ 
        duration: 1.0, 
        delay: 1.8 + (i * 0.1),
        ease: 'easeOut'
      }}
      className="absolute w-3 h-3 bg-blue-400 rounded-full blur-sm z-25"
    />
  ))}
</section>

<section className="mt-20 px-6 md:px-10 flex flex-col md:flex-row items-center justify-between">
  {/* 좌측: 커뮤니티 텍스트 */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    className="text-center md:text-left"
  >
    <p className="text-sm text-gray-300">Join a community</p>
    <h2 className="text-4xl md:text-5xl font-extrabold mt-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-400 to-purple-500">
      of millions
    </h2>
  </motion.div>

  {/* 우측: 숫자 스탯 */}
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 1, delay: 0.3 }}
    className="mt-8 md:mt-0 space-y-8"
  >
    {/* Active Accounts */}
    <div className="text-center md:text-right">
      <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-purple-500">
        11.5M+
      </p>
      <p className="uppercase text-xs text-gray-400 mt-1">Active Accounts</p>
    </div>
    {/* NFTs Minted */}
    <div className="text-center md:text-right">
      <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
        21.9M
      </p>
      <p className="uppercase text-xs text-gray-400 mt-1">NFTs Minted</p>
    </div>
    {/* Avg Cost */}
    <div className="text-center md:text-right">
      <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-green-600">
        $0.00025
      </p>
      <p className="uppercase text-xs text-gray-400 mt-1">Average Cost per Transaction</p>
    </div>
  </motion.div>
</section>

      <MadeForSection />
      {/* 구독 섹션 */}
      <SubscribeFooter />







    </main>
  );
}
