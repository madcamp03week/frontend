// app/company/page.tsx
'use client';

import { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import SubscribeFooter from '../components/SubscribeFooter';

export default function CompanyPage() {
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
          className="text-5xl font-extrabold mb-4"
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

      {/* About Us Section */}
      <section className="bg-gray-900 py-16 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold mb-4">About Us</h2>
          <p className="text-gray-300 leading-relaxed">
            We are dedicated to creating unforgettable digital experiences that bridge the gap
            between the physical and digital realms. Our team of experts specializes in blockchain,
            IPFS, and user-centric design to ensure every timecapsule is both secure and delightful.
          </p>
        </motion.div>
      </section>

      {/* Our Team Section */}
      <section className="py-16 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-8"
        >
          <h2 className="text-3xl font-bold">Our Team</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {[
            { name: '박재현', role: 'Founder & Engineer (KAIST)', img: '/team/park.jpg' },
            { name: '황광호', role: 'Co-Founder (Jeonbuk National Univ.)', img: '/team/hwang.jpg' },
          ].map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.2 }}
              className="text-center"
            >
              <img
                src={member.img}
                alt={member.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h3 className="text-xl font-semibold">{member.name}</h3>
              <p className="text-gray-400">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Subscribe Footer */}
      <SubscribeFooter />
    </main>
  );
}
