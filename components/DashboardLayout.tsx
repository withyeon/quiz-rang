'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BookOpen, BarChart3, Settings, Sparkles, TrendingUp } from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/teacher', label: '내 문제집', icon: BookOpen },
    { href: '/teacher/dashboard', label: '게임 관리', icon: BarChart3 },
    { href: '/teacher/analytics', label: '통계 분석', icon: TrendingUp },
    { href: '/teacher/settings', label: '설정', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <Sparkles className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">퀴즈랑</span>
          </Link>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
