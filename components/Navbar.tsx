'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Sparkles, Menu, X, ChevronDown, BookOpen, Gamepad2, BarChart3, HelpCircle } from 'lucide-react'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const categories = [
    {
      name: '문제 생성',
      icon: BookOpen,
      items: [
        { name: '주제로 생성', href: '/teacher?source=topic' },
        { name: '유튜브로 생성', href: '/teacher?source=youtube' },
        { name: 'PDF로 생성', href: '/teacher?source=pdf' },
        { name: '텍스트로 생성', href: '/teacher?source=text' },
      ],
    },
    {
      name: '게임',
      icon: Gamepad2,
      items: [
        { name: '게임 시작', href: '/teacher/dashboard' },
        { name: '게임 참여', href: '/play' },
        { name: '게임 모드', href: '/game' },
      ],
    },
    {
      name: '리포트',
      icon: BarChart3,
      items: [
        { name: '학생 성적', href: '/teacher/dashboard?tab=reports' },
        { name: '문제 분석', href: '/teacher/dashboard?tab=analysis' },
        { name: '통계 보기', href: '/teacher/dashboard?tab=stats' },
      ],
    },
  ]

  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/teacher')

  if (isDashboard) {
    return null // 대시보드에서는 Navbar 숨김
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-gradient-to-r from-pink-100/95 via-yellow-100/95 to-purple-100/95 backdrop-blur-md shadow-lg border-b-2 border-pink-200'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-8 w-8 text-pink-500" />
            </motion.div>
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 via-yellow-500 to-purple-600 bg-clip-text text-transparent">
              퀴즈랑
            </span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-xl"
            >
              ✨
            </motion.span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {/* 카테고리 메뉴 */}
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <div key={category.name} className="relative" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setOpenDropdown(openDropdown === category.name ? null : category.name)}
                    className="flex items-center gap-1 text-gray-700 hover:text-pink-600 transition-colors font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{category.name}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === category.name ? 'rotate-180' : ''}`} />
                  </motion.button>
                  
                  {/* 드롭다운 메뉴 */}
                  {openDropdown === category.name && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl shadow-xl border-2 border-pink-200 py-2 z-50 backdrop-blur-sm"
                    >
                      {category.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-pink-100 hover:text-pink-600 transition-colors font-medium rounded-lg mx-2"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </div>
              )
            })}
            
            <Link
              href="/#features"
              className="text-gray-700 hover:text-pink-600 transition-colors font-semibold"
            >
              기능 소개
            </Link>
            <Link
              href="/pricing"
              className="text-gray-700 hover:text-pink-600 transition-colors font-semibold"
            >
              요금제
            </Link>
            <Link href="/teacher">
              <Button variant="outline" size="sm" className="border-2 border-pink-300 text-pink-600 hover:bg-pink-50">
                시작하기
              </Button>
            </Link>
            <Link href="/teacher/dashboard">
              <Button size="sm" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600">
                대시보드
              </Button>
            </Link>
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
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            {/* 모바일 카테고리 메뉴 */}
            {categories.map((category) => {
              const Icon = category.icon
              const isOpen = openDropdown === category.name
              return (
                <div key={category.name}>
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : category.name)}
                    className="w-full flex items-center justify-between text-gray-700 hover:text-primary-600 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{category.name}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="pl-6 space-y-2 mt-2">
                      {category.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block py-2 text-sm text-gray-600 hover:text-primary-600"
                          onClick={() => {
                            setIsMobileMenuOpen(false)
                            setOpenDropdown(null)
                          }}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            
            <div className="border-t pt-3 mt-3 space-y-3">
              <Link
                href="/#features"
                className="block text-gray-700 hover:text-primary-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                기능 소개
              </Link>
              <Link
                href="/pricing"
                className="block text-gray-700 hover:text-primary-600"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                요금제
              </Link>
              <Link href="/teacher" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  시작하기
                </Button>
              </Link>
              <Link href="/teacher/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <Button size="sm" className="w-full">
                  대시보드
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
