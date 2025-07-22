'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';

interface Feature {
  title: string;
  text: string;
  stat: string;
  accent: string;
}

const features: Feature[] = [
  {
    title: 'Secure Storage',
    text: `Memories are encrypted and stored on IPFS and blockchain for tamper-proof safety.`,
    stat: 'XChaCha20',
    accent: 'border-blue-400',
  },
  {
    title: 'Time-Locked',
    text: `Smart contracts unlock your capsule only at the scheduled time—no early access.`,
    stat: 'Custom Dates',
    accent: 'border-purple-400',
  },
  {
    title: 'Immutable Provenance',
    text: `Each NFT logs a permanent history of creation and opening events on-chain.`,
    stat: 'On-Chain',
    accent: 'border-green-400',
  },
  {
    title: 'Seamless Sharing',
    text: `Send your time capsules globally with a single click and zero hassle.`,
    stat: 'Instant',
    accent: 'border-cyan-400',
  },
];

const MadeForSection: FC = () => {
  return (
    <section className="relative py-16 px-4 md:px-12 overflow-hidden">
      {/* Background Blob */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-purple-900 to-blue-800 opacity-20 blur-2xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-y-12 gap-x-8">
        {/* Left Text */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col justify-center"
        >
          <p className="text-sm text-gray-300 mb-2 uppercase tracking-wider">Discover</p>
          <h2 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-400 to-purple-500">
            Chronos NFT Time Capsule
          </h2>
          <p className="flex items-center text-xs text-gray-400 mt-4">
            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2" /> Live Release
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 flex flex-col justify-between"
            >
              <div>
                <div className={`w-1 h-8 mb-3 ${f.accent}`} />
                <h3 className="text-xl font-semibold mb-2 text-white">{f.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{f.text}</p>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                <p className="font-bold text-lg text-white">{f.stat}</p>
                <p className="text-xs text-gray-400 uppercase">
                  {f.title === 'Secure Storage'
                    ? 'Encryption Standard'
                    : f.title === 'Time-Locked'
                    ? 'Release Schedule'
                    : f.title === 'Immutable Provenance'
                    ? 'Chain Records'
                    : 'Transfer Ease'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MadeForSection;
