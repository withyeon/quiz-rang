'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { SchoolRacingItemType } from '@/lib/game/schoolRacing'

interface ItemEffectOverlayProps {
  effectType: SchoolRacingItemType | null
  fromPlayer?: string
  duration?: number
}

export default function ItemEffectOverlay({
  effectType,
  fromPlayer,
  duration = 3000,
}: ItemEffectOverlayProps) {
  if (!effectType) return null

  const effectMessages: Record<SchoolRacingItemType, { icon: string; message: string; color: string }> = {
    ENERGY_BOOST: { icon: '⚡', message: '에너지 부스트! 자동으로 1미터 앞으로!', color: 'from-yellow-400 to-orange-500' },
    SODA_BLAST: { icon: '🥤', message: '소다 블라스트! 4미터 앞으로 슝~!', color: 'from-blue-400 to-cyan-500' },
    SPICY_PEPPER: { icon: '🌶️', message: '매운 고추! 다음 3문제가 2배 가치!', color: 'from-red-400 to-pink-500' },
    WHOOSH: { icon: '💨', message: '후우시! 뒤로 밀려났다!', color: 'from-gray-400 to-gray-600' },
    ROCKET_ATTACK: { icon: '🚀', message: '로켓 공격! 1미터 뒤로 밀려났다!', color: 'from-orange-400 to-red-500' },
    BUSY_BEES: { icon: '🐝', message: '바쁜 벌들! 3미터 뒤로 밀려났다!', color: 'from-yellow-400 to-amber-600' },
    FREEZE: { icon: '❄️', message: '얼어붙었다! 7초간 못 움직여!', color: 'from-blue-400 to-cyan-500' },
    MINIFY: { icon: '🔍', message: '화면이 축소되었다!', color: 'from-purple-400 to-pink-500' },
    MIGHTY_SHIELD: { icon: '🛡️', message: '강력한 방패! 다음 공격을 막았다!', color: 'from-yellow-400 to-orange-500' },
    BLOOK_FIESTA: { icon: '🎉', message: '블록 피에스타! 화면에 블록이 나타났다!', color: 'from-pink-400 to-purple-500' },
  }

  const effect = effectMessages[effectType]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: -50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5, y: -50 }}
        transition={{ duration: 0.3 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
      >
        <div className={`bg-gradient-to-r ${effect.color} text-white px-8 py-4 rounded-xl shadow-2xl border-4 border-white/50`}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{effect.icon}</span>
            <div>
              <div className="text-2xl font-bold">{effect.message}</div>
              {fromPlayer && (
                <div className="text-sm opacity-90">from {fromPlayer}</div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
