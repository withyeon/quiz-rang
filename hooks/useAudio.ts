import { useState, useEffect, useRef, useCallback } from 'react'
import { Howl, Howler } from 'howler'

export type AudioType = 'lobby' | 'game' | 'result'
export type SFXType = 'correct' | 'incorrect' | 'item' | 'click'

interface UseAudioOptions {
  initialMuted?: boolean
  initialVolume?: number
}

// 무료 BGM URL (예시 - 실제로는 무료 에셋 사이트에서 가져오거나 로컬 파일 사용)
const BGM_URLS: Record<AudioType, string> = {
  lobby: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // 예시 URL
  game: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  result: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
}

// 무료 SFX URL (예시)
const SFX_URLS: Record<SFXType, string> = {
  correct: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // 실제로는 효과음 URL
  incorrect: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  item: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  click: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
}

export function useAudio({ initialMuted = true, initialVolume = 0.5 }: UseAudioOptions = {}) {
  const [isMuted, setIsMuted] = useState(initialMuted)
  const [volume, setVolume] = useState(initialVolume)
  const [currentBGM, setCurrentBGM] = useState<AudioType | null>(null)

  const bgmRef = useRef<Howl | null>(null)
  const sfxRefs = useRef<Map<SFXType, Howl>>(new Map())

  // BGM 재생
  const playBGM = useCallback(
    (type: AudioType) => {
      if (isMuted) return

      // 이전 BGM 정지
      if (bgmRef.current) {
        bgmRef.current.stop()
        bgmRef.current = null
      }

      // 새 BGM 재생
      try {
        const sound = new Howl({
          src: [BGM_URLS[type]],
          loop: true,
          volume: volume,
          html5: true, // HTML5 Audio 사용 (더 나은 호환성)
        })

        sound.play()
        bgmRef.current = sound
        setCurrentBGM(type)
      } catch (error) {
        console.error('BGM 재생 실패:', error)
        // 에러 발생 시에도 상태는 업데이트 (실제 파일이 없어도 UI는 동작)
        setCurrentBGM(type)
      }
    },
    [isMuted, volume]
  )

  // BGM 정지
  const stopBGM = useCallback(() => {
    if (bgmRef.current) {
      bgmRef.current.stop()
      bgmRef.current = null
    }
    setCurrentBGM(null)
  }, [])

  // SFX 재생
  const playSFX = useCallback(
    (type: SFXType) => {
      if (isMuted) return

      try {
        // SFX는 캐시에서 가져오거나 새로 생성
        let sound = sfxRefs.current.get(type)
        if (!sound) {
          sound = new Howl({
            src: [SFX_URLS[type]],
            volume: volume,
            html5: true,
          })
          sfxRefs.current.set(type, sound)
        }

        sound.volume(volume)
        sound.play()
      } catch (error) {
        console.error('SFX 재생 실패:', error)
      }
    },
    [isMuted, volume]
  )

  // 음소거 토글
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev
      if (newMuted) {
        stopBGM()
        Howler.mute(true)
      } else {
        Howler.mute(false)
        if (currentBGM) {
          playBGM(currentBGM)
        }
      }
      return newMuted
    })
  }, [currentBGM, playBGM, stopBGM])

  // 볼륨 설정
  const setVolumeLevel = useCallback(
    (newVolume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, newVolume))
      setVolume(clampedVolume)
      Howler.volume(clampedVolume)

      if (bgmRef.current) {
        bgmRef.current.volume(clampedVolume)
      }
      sfxRefs.current.forEach((sound) => {
        sound.volume(clampedVolume)
      })
    },
    []
  )

  // 음소거 상태에 따라 Howler 설정
  useEffect(() => {
    Howler.mute(isMuted)
  }, [isMuted])

  // 볼륨 변경 시 Howler 설정
  useEffect(() => {
    Howler.volume(volume)
  }, [volume])

  // 클린업
  useEffect(() => {
    return () => {
      if (bgmRef.current) {
        bgmRef.current.stop()
        bgmRef.current = null
      }
      sfxRefs.current.forEach((sound) => {
        sound.stop()
        sound.unload()
      })
      sfxRefs.current.clear()
    }
  }, [])

  return {
    isMuted,
    volume,
    currentBGM,
    playBGM,
    stopBGM,
    playSFX,
    toggleMute,
    setVolumeLevel,
  }
}
