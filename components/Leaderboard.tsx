'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row']

interface LeaderboardProps {
  players: Player[]
  currentPlayerId?: string | null
}

export default function Leaderboard({ players, currentPlayerId }: LeaderboardProps) {
  const [sortedPlayers, setSortedPlayers] = useState<Player[]>([])
  const [previousRanks, setPreviousRanks] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    // 점수 순으로 정렬
    const sorted = [...players].sort((a, b) => b.score - a.score)
    
    // 이전 순위 저장
    const newPreviousRanks = new Map<string, number>()
    sorted.forEach((player, index) => {
      const oldIndex = sortedPlayers.findIndex((p) => p.id === player.id)
      if (oldIndex !== -1) {
        newPreviousRanks.set(player.id, oldIndex)
      }
    })
    setPreviousRanks(newPreviousRanks)
    
    setSortedPlayers(sorted)
  }, [players])

  const getRankChange = (playerId: string, currentIndex: number): number | null => {
    const previousRank = previousRanks.get(playerId)
    if (previousRank === undefined) return null
    return previousRank - currentIndex // 양수면 상승, 음수면 하락
  }

  return (
    <div className="bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-2xl p-6 border-2 border-primary-200 glow-box">
      <motion.h2
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent"
      >
        실시간 순위
      </motion.h2>
      
      {sortedPlayers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">플레이어가 없습니다.</div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {sortedPlayers.map((player, index) => {
              const rankChange = getRankChange(player.id, index)
              const isCurrentPlayer = player.id === currentPlayerId

              return (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    isCurrentPlayer
                      ? 'border-primary-500 bg-gradient-to-r from-primary-100 to-indigo-100 scale-105 shadow-lg glow-box'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:shadow-md'
                  } ${
                    rankChange && rankChange > 0
                      ? 'pulse-glow bg-green-50 border-green-300'
                      : rankChange && rankChange < 0
                      ? 'bg-red-50 border-red-300'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={rankChange && rankChange > 0 ? { scale: [1, 1.3, 1] } : {}}
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-indigo-600 text-white font-bold text-lg shadow-lg"
                    >
                      {index + 1}
                    </motion.div>
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      className="text-3xl"
                    >
                      {player.avatar || '🎮'}
                    </motion.span>
                    <div>
                      <div className="font-bold text-gray-800 text-lg">
                        {player.nickname}
                        {isCurrentPlayer && (
                          <span className="ml-2 text-xs bg-primary-500 text-white px-2 py-1 rounded-full">
                            나
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {player.is_online ? '🟢 온라인' : '🔴 오프라인'}
                      </div>
                    </div>
                    {rankChange !== null && rankChange !== 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`text-sm font-bold ${
                          rankChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {rankChange > 0 ? '↑' : '↓'} {Math.abs(rankChange)}
                      </motion.div>
                    )}
                  </div>
                  <motion.div
                    animate={rankChange && rankChange > 0 ? { scale: [1, 1.1, 1] } : {}}
                    className="text-right"
                  >
                    <div className="text-2xl font-bold text-gray-800">{player.score}점</div>
                    <div className="text-sm text-yellow-600 font-semibold">💰 {player.gold} Gold</div>
                  </motion.div>
                </motion.div>
              )
          })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
