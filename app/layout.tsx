import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import { AudioProviderWrapper } from '@/components/AudioProviderWrapper'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-sans-kr',
})

export const metadata: Metadata = {
  title: '퀴즈독 - 강아지와 함께하는 재미있는 퀴즈 게임',
  description: '강아지와 함께하는 재미있는 퀴즈 게임! 교실을 게임으로 바꿔보세요 🐕',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body className="antialiased">
        <AudioProviderWrapper>{children}</AudioProviderWrapper>
      </body>
    </html>
  )
}

