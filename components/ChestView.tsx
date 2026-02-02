'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAudioContext } from '@/components/AudioProvider'

import type { BoxEvent } from '@/lib/game/goldQuest'

interface ChestViewProps {
  onChestSelect: (chestIndex: number) => void
  selectedChest: number | null
  reward: BoxEvent | null
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

  // 컴포넌트가 마운트되거나 selectedChest가 null이 되면 초기화
  useEffect(() => {
    if (selectedChest === null) {
      setRevealedChests([false, false, false])
    }
  }, [selectedChest])

  // reward가 null이 되면 상태 초기화 (새로운 문제로 이동시)
  useEffect(() => {
    if (reward === null) {
      setRevealedChests([false, false, false])
    }
  }, [reward])

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
    if (!revealedChests[index]) return null
    if (selectedChest !== index) return null

    if (!reward) return null
    return reward.icon || null
  }

  const getChestColor = (index: number) => {
    if (!revealedChests[index]) return 'bg-yellow-100 border-yellow-400'
    if (selectedChest !== index) return 'bg-gray-100 border-gray-300 opacity-50'

    if (!reward) return 'bg-yellow-100 border-yellow-400'

    // Gold Quest 색상
    if (reward.type === 'GOLD_STACK' || reward.type === 'JESTER' || reward.type === 'UNICORN') {
      return reward.type === 'UNICORN'
        ? 'bg-purple-100 border-purple-500'
        : reward.type === 'JESTER'
          ? 'bg-yellow-100 border-yellow-500'
          : 'bg-green-100 border-green-500'
    }

    if (reward.type === 'SLIME_MONSTER' || reward.type === 'DRAGON') {
      return 'bg-red-100 border-red-500'
    }

    if (reward.type === 'ELF' || reward.type === 'WIZARD' || reward.type === 'KING') {
      return 'bg-orange-100 border-orange-500'
    }

    return 'bg-gray-100 border-gray-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-50 rounded-xl shadow-2xl p-8 max-w-3xl mx-auto border-4 border-yellow-400 glow-box"
    >
      <motion.h2
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-4xl font-bold text-center mb-8 text-yellow-800"
      >
        💰 보물상자를 선택하세요! 💰
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
            className={`p-12 rounded-xl border-4 transition-all ${isProcessing || revealedChests[index]
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
              className="text-8xl mb-4 flex items-center justify-center"
            >
              {getChestIcon(index) ? (
                <span>{getChestIcon(index)}</span>
              ) : (
                <span className="text-8xl">📦</span>
              )}
            </motion.div>
            <div className="text-sm font-medium text-gray-700 font-semibold">
              {revealedChests[index] && selectedChest === index && reward
                ? reward.itemName || reward.message
                : '보물상자'}
            </div>
          </motion.button>
        ))}
      </div>

      {reward && selectedChest !== null && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`p-6 rounded-xl text-center font-bold text-2xl shadow-2xl border-4 ${reward.type === 'GOLD_STACK' || reward.type === 'JESTER' || reward.type === 'UNICORN'
            ? reward.type === 'UNICORN'
              ? 'bg-purple-600 text-white border-purple-300 glow-box'
              : reward.type === 'JESTER'
                ? 'bg-yellow-600 text-white border-yellow-300 glow-box'
                : 'bg-green-600 text-white border-green-300 glow-box'
            : reward.type === 'SLIME_MONSTER' || reward.type === 'DRAGON'
              ? 'bg-red-600 text-white border-red-300'
              : reward.type === 'ELF' || reward.type === 'WIZARD' || reward.type === 'KING'
                ? 'bg-orange-600 text-white border-orange-300'
                : 'bg-gray-500 text-white border-gray-300'
            }`}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="flex items-center justify-center gap-3"
          >
            <span className="text-4xl">{reward.icon}</span>
            <span>{reward.message}</span>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
