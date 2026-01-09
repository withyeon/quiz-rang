'use client'

import { useAudioContext } from './AudioProvider'

export default function SoundToggle() {
  const { isMuted, toggleMute } = useAudioContext()

  return (
    <button
      onClick={toggleMute}
      className="fixed top-4 right-4 z-50 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
      aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
    >
      <span className="text-2xl">{isMuted ? '🔇' : '🔊'}</span>
    </button>
  )
}
