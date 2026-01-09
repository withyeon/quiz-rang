'use client'

import { createContext, useContext, ReactNode, useMemo } from 'react'
import { useAudio, type AudioType, type SFXType } from '@/hooks/useAudio'

interface AudioContextType {
  isMuted: boolean
  volume: number
  currentBGM: AudioType | null
  playBGM: (type: AudioType) => void
  stopBGM: () => void
  playSFX: (type: SFXType) => void
  toggleMute: () => void
  setVolumeLevel: (volume: number) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

interface AudioProviderProps {
  children: ReactNode
  initialMuted?: boolean
}

export function AudioProvider({ children, initialMuted = true }: AudioProviderProps) {
  const audio = useAudio({ initialMuted, initialVolume: 0.5 })

  return <AudioContext.Provider value={audio}>{children}</AudioContext.Provider>
}

export function useAudioContext() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudioContext must be used within AudioProvider')
  }
  return context
}
