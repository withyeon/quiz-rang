import type { Metadata } from 'next'
import './globals.css'
import { AudioProviderWrapper } from '@/components/AudioProviderWrapper'

export const metadata: Metadata = {
  title: '퀴즈랑 - 교실을 게임으로 바꾸세요',
  description: '한국 교육 현장에 최적화된 실시간 게이미피케이션 퀴즈 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <AudioProviderWrapper>{children}</AudioProviderWrapper>
      </body>
    </html>
  )
}

