'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Sparkles, Menu, X, HelpCircle } from 'lucide-react'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])



  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/teacher')

  if (isDashboard) {
    return null // 대시보드에서는 Navbar 숨김
  }

  return (
    <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-bitbit ${
        isScrolled
          ? 'bg-sky-50/95 backdrop-blur-md shadow-lg border-b-2 border-sky-200'
          : 'bg-sky-50/30 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Image
                src="/header-logo.svg"
                alt="퀴즈독"
                width={200}
                height={60}
                className="h-32 w-auto object-contain"
                priority
              />
            </motion.div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/teacher/library"
              className="flex items-center gap-2 text-sky-700 hover:text-sky-500 transition-colors font-bold text-xl"
            >
              <span>📚</span>
              <span>자료실</span>
            </Link>
            <Link
              href="/#features"
              className="flex items-center gap-2 text-sky-700 hover:text-sky-500 transition-colors font-bold text-xl"
            >
              <span>⚡</span>
              기능 소개
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 text-sky-700 hover:text-sky-500 transition-colors font-bold text-xl"
            >
              <span>💰</span>
              요금제
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/lobby">
                <Button variant="outline" size="lg" className="text-lg relative z-10 bg-white/90 hover:bg-white text-sky-600 hover:text-sky-700 border-2 border-sky-300 font-bold">
                  🎮 코드로 입장
                </Button>
              </Link>
              <Link href="/teacher">
                <Button variant="outline" size="lg" className="sparkle-button text-lg relative z-10">
                  ✨ 시작하기 ✨
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-sky-50/95 backdrop-blur-md border-t border-sky-200">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/teacher/library"
              className="flex items-center gap-2 text-sky-700 hover:text-sky-500 py-2 font-bold text-xl"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span>📚</span>
              <span>자료실</span>
            </Link>
            
            <div className="border-t pt-3 mt-3 space-y-3">
              <Link
                href="/#features"
                className="flex items-center gap-2 text-sky-700 hover:text-sky-500 font-bold text-xl"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>⚡</span>
                기능 소개
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-2 text-sky-700 hover:text-sky-500 font-bold text-xl"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>💰</span>
                요금제
              </Link>
              <Link href="/lobby" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" size="lg" className="w-full text-lg relative z-10 bg-white/90 hover:bg-white text-sky-600 hover:text-sky-700 border-2 border-sky-300 font-bold mb-3">
                  🎮 코드로 입장
                </Button>
              </Link>
              <Link href="/teacher" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" size="lg" className="sparkle-button w-full text-lg relative z-10">
                  ✨ 시작하기 ✨
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
