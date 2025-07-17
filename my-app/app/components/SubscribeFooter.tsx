// components/SubscribeFooter.tsx
'use client'

import { FC } from 'react'
import { FaFacebookF, FaTwitter, FaVimeoV, FaYoutube } from 'react-icons/fa'

const navLinks = ['About us', 'Discover', 'Explore', 'Books']

const SubscribeFooter: FC = () => {
  return (
    <footer className="relative text-white">
      {/* 상단 그라데이션 */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-900 to-transparent pointer-events-none" />

      <div className="relative bg-black pt-16 pb-8 px-6 md:px-12">
        {/* 구독 섹션 */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
          <h3 className="text-2xl md:text-3xl font-light">Subscribe Newsletters</h3>
          <div className="flex w-full max-w-md">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-gray-800 placeholder-gray-500 text-white px-4 py-3 rounded-l-lg focus:outline-none"
            />
            <button className="bg-gradient-to-r from-purple-600 to-green-400 px-6 py-3 rounded-r-lg font-medium hover:opacity-90 transition">
              Subscribe Now
            </button>
          </div>
        </div>

        {/* 네비게이션 + 소셜 아이콘 */}
        <div className="max-w-7xl mx-auto mt-12 flex flex-col md:flex-row items-center justify-between">
          <nav className="flex space-x-6 mb-6 md:mb-0">
            {navLinks.map(link => (
              <a
                key={link}
                href="#"
                className="text-gray-400 hover:text-white transition text-sm"
              >
                {link}
              </a>
            ))}
          </nav>

          {/* 여기 parent 에서 text‑size, 색상을 줍니다 */}
          <div className="flex space-x-4 text-gray-400 text-2xl">
            <span className="hover:text-white transition">
              <FaFacebookF />
            </span>
            <span className="hover:text-white transition">
              <FaTwitter />
            </span>
            <span className="hover:text-white transition">
              <FaVimeoV />
            </span>
            <span className="hover:text-white transition">
              <FaYoutube />
            </span>
          </div>
        </div>

        <hr className="border-gray-800 my-6" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-gray-500 text-sm">
          <p>© 2025 BlockifyNFT. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SubscribeFooter
