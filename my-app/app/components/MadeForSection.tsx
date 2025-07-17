// components/MadeForSection.tsx
'use client';

import { FC } from 'react'
import { motion } from 'framer-motion'

interface Feature {
  title: string
  text: string
  stat: string
  accent: string
}

const features: Feature[] = [
  {
    title: 'Fast',
    text: `Don't keep your users waiting. Solana has block times of 400 ms — and as hardware gets faster, so will the network.`,
    stat: '3,234',
    accent: 'border-cyan-400',
  },
  {
    title: 'Decentralized',
    text: `The Solana network is validated by thousands of nodes that operate independently of each other, ensuring your data remains secure and censorship resistant.`,
    stat: '1,675',
    accent: 'border-yellow-400',
  },
  {
    title: 'Scalable',
    text: `Get big, quick. Solana is made to handle thousands of transactions per second, and fees for both developers and users remain less than $0.01.`,
    stat: '3,234',
    accent: 'border-purple-400',
  },
  {
    title: 'Energy Efficient',
    text: `Solana's proof of stake network and other innovations minimize its impact on the environment. Each transaction uses about the same energy as a few Google searches.`,
    stat: '0%',
    accent: 'border-green-400',
  },
]

const MadeForSection: FC = () => {
  return (
    <section className="relative py-24 px-6 md:px-12 overflow-hidden">
      {/* Background Blob */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-purple-900 to-blue-800 opacity-30 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Text */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col justify-center"
        >
          <p className="text-sm text-gray-300 mb-2">Made for</p>
          <h2 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-400 to-purple-500">
            mass adoption
          </h2>
          <p className="flex items-center text-xs text-gray-400 mt-4">
            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2" /> LIVE DATA
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.2 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className={`w-1 h-8 mb-3 ${f.accent}`} />
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{f.text}</p>
              </div>
              <div className="mt-6 flex items-center">
                <span className={`inline-block w-2 h-2 ${f.accent} rounded-full mr-2`} />
                <p className="font-bold">{f.stat}</p>
                <p className="text-xs text-gray-400 ml-2 uppercase">
                  {f.title === 'Fast' ? 'Transactions per second'
                    : f.title === 'Decentralized' ? 'Validator nodes'
                    : f.title === 'Scalable' ? 'Total transactions'
                    : 'Net carbon impact'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default MadeForSection
