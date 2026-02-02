'use client'

import { motion } from 'framer-motion'
import { SchoolRacingItem } from '@/lib/game/schoolRacing'

interface ItemCardProps {
  item: SchoolRacingItem
  onUse?: () => void
  isUsed?: boolean
}

export default function ItemCard({ item, onUse, isUsed = false }: ItemCardProps) {
  const rarityColors = {
    common: 'bg-gray-500',
    rare: 'bg-blue-500',
    epic: 'bg-purple-500',
    legendary: 'bg-yellow-500',
  }

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={`relative ${rarityColors[item.rarity]} rounded-xl p-4 shadow-2xl border-2 ${
        item.rarity === 'legendary' ? 'border-yellow-300 glow-box' : 'border-white/50'
      } ${isUsed ? 'opacity-50' : 'cursor-pointer hover:scale-110'} transition-all`}
      onClick={!isUsed && onUse ? onUse : undefined}
      whileHover={!isUsed ? { scale: 1.1, y: -5 } : {}}
      whileTap={!isUsed ? { scale: 0.95 } : {}}
    >
      {/* 아이템 아이콘 */}
      <div className="text-6xl mb-2 text-center">
        {item.icon}
      </div>

      {/* 아이템 이름 */}
      <div className="text-center font-bold text-white text-sm mb-1">
        {item.name}
      </div>

      {/* 아이템 설명 */}
      <div className="text-center text-white/80 text-xs">
        {item.description}
      </div>

      {/* 희귀도 배지 */}
      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${
        item.rarity === 'legendary' ? 'bg-yellow-300 text-yellow-900' :
        item.rarity === 'epic' ? 'bg-purple-300 text-purple-900' :
        item.rarity === 'rare' ? 'bg-blue-300 text-blue-900' :
        'bg-gray-300 text-gray-900'
      }`}>
        {item.rarity === 'legendary' ? '전설' :
         item.rarity === 'epic' ? '에픽' :
         item.rarity === 'rare' ? '레어' : '일반'}
      </div>

      {/* 사용됨 표시 */}
      {isUsed && (
        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">사용됨</span>
        </div>
      )}
    </motion.div>
  )
}
