'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAudioContext } from '@/components/AudioProvider'

interface ChestViewProps {
  onChestSelect: (chestIndex: number) => void
  selectedChest: number | null
  reward: {
    type: 'gold_gain' | 'gold_loss' | 'nothing'
    amount: number
    message: string
  } | null
  isProcessing: boolean
}

export default function ChestView({
  onChestSelect,
  selectedChest,
  reward,
  isProcessing,
}: ChestViewProps) {
  const [revealedChests, setRevealedChests] = useState<boolean[]>([false, false, false])
  const { playSFX } = useAudioContext()

  useEffect(() => {
    if (selectedChest !== null && reward) {
      setRevealedChests((prev) => {
        const newRevealed = [...prev]
        newRevealed[selectedChest] = true
        return newRevealed
      })
    }
  }, [selectedChest, reward])

  const getChestIcon = (index: number) => {
    if (!revealedChests[index]) return '📦'
    if (selectedChest !== index) return '📦'

    if (!reward) return '📦'
    switch (reward.type) {
      case 'gold_gain':
        return '💰'
      case 'gold_loss':
        return '💸'
      case 'nothing':
        return '📭'
      default:
        return '📦'
    }
  }

  const getChestColor = (index: number) => {
    if (!revealedChests[index]) return 'bg-yellow-100 border-yellow-400'
    if (selectedChest !== index) return 'bg-gray-100 border-gray-300 opacity-50'

    if (!reward) return 'bg-yellow-100 border-yellow-400'
    switch (reward.type) {
      case 'gold_gain':
        return 'bg-green-100 border-green-500'
      case 'gold_loss':
        return 'bg-red-100 border-red-500'
      case 'nothing':
        return 'bg-gray-100 border-gray-400'
      default:
        return 'bg-yellow-100 border-yellow-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 rounded-xl shadow-2xl p-8 max-w-3xl mx-auto border-2 border-yellow-300 glow-box"
    >
      <motion.h2
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent neon-glow"
      >
        상자를 선택하세요!
      </motion.h2>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {[0, 1, 2].map((index) => (
          <motion.button
            key={index}
            onClick={() => {
              if (!isProcessing && !revealedChests[index]) {
                playSFX('click')
                onChestSelect(index)
              }
            }}
            disabled={isProcessing || revealedChests[index]}
            whileHover={
              !isProcessing && !revealedChests[index]
                ? { scale: 1.15, rotate: [0, -5, 5, -5, 0] }
                : {}
            }
            whileTap={!isProcessing && !revealedChests[index] ? { scale: 0.9 } : {}}
            animate={
              !revealedChests[index] && !isProcessing
                ? {
                    y: [0, -10, 0],
                  }
                : {}
            }
            transition={{
              y: {
                duration: 2,
                repeat: Infinity,
                delay: index * 0.2,
              },
            }}
            className={`p-12 rounded-xl border-4 transition-all ${
              isProcessing || revealedChests[index]
                ? 'cursor-not-allowed'
                : 'cursor-pointer shadow-2xl hover:shadow-[0_0_30px_rgba(251,191,36,0.6)]'
            } ${getChestColor(index)}`}
          >
            <motion.div
              animate={
                !revealedChests[index] && !isProcessing
                  ? {
                      rotate: [0, 5, -5, 0],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.3,
              }}
              className="text-8xl mb-4"
            >
              {getChestIcon(index)}
            </motion.div>
            <div className="text-sm font-medium text-gray-700 font-semibold">
              {revealedChests[index] && selectedChest === index && reward
                ? reward.message
                : '상자'}
            </div>
          </motion.button>
        ))}
      </div>

      {reward && selectedChest !== null && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`p-6 rounded-xl text-center font-bold text-2xl shadow-2xl ${
            reward.type === 'gold_gain'
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-2 border-green-300 glow-box'
              : reward.type === 'gold_loss'
              ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white border-2 border-red-300'
              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-2 border-gray-300'
          }`}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {reward.message}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
