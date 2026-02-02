'use client'

import { usePathname } from 'next/navigation'
import { AudioProvider } from './AudioProvider'
import SoundToggle from './SoundToggle'

export function AudioProviderWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // /play 경로는 학생 페이지 (기본 Mute)
  // 그 외는 선생님 페이지 (기본 Unmute)
  const initialMuted = pathname?.includes('/play') ?? true

  // 게임 페이지에서만 SoundToggle 표시
  const isGamePage = pathname?.match(/^\/(play|racing|battle|fishing|factory|game)/) !== null

  return (
    <AudioProvider initialMuted={initialMuted}>
      {children}
      {isGamePage && <SoundToggle />}
    </AudioProvider>
  )
}
