'use client'

import { motion } from 'framer-motion'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row'] & {
  position?: number
}

interface RacingTrackProps {
  players: Player[]
  currentPlayerId: string | null
  trackLength?: number // 트랙 전체 길이 (기본값: 1000)
}

export default function RacingTrack({
  players,
  currentPlayerId,
  trackLength = 1000,
}: RacingTrackProps) {
  // 위치 순으로 정렬
  const sortedPlayers = [...players].sort((a, b) => {
    const posA = a.position || 0
    const posB = b.position || 0
    return posB - posA // 앞선 순서대로
  })

  const maxPosition = Math.max(...players.map(p => p.position || 0), 0)
  const finishLine = trackLength

  return (
    <div className="relative w-full rounded-2xl shadow-2xl overflow-hidden border-4 border-gray-800">
      {/* 배경 - 하늘과 구름 */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-green-200">
        {/* 구름 애니메이션 */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-10 opacity-30"
            style={{ left: `${20 + i * 30}%` }}
            animate={{
              x: [0, 100, 0],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <div className="text-6xl">☁️</div>
          </motion.div>
        ))}
      </div>

      {/* 도로 배경 */}
      <div className="relative h-40 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 mt-20">
        {/* 도로 중앙선 (움직이는 효과) */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, yellow 0px, yellow 30px, transparent 30px, transparent 60px)',
              backgroundSize: '60px 100%',
            }}
            animate={{
              backgroundPosition: ['0px 0px', '60px 0px'],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>

        {/* 도로 가장자리 */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-white opacity-50" />
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-white opacity-50" />

        {/* 도로 패턴 (속도감) */}
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 22px)'
          }} />
        </div>

        {/* 플레이어들 */}
        <div className="relative h-full">
          {sortedPlayers.map((player, index) => {
            const position = player.position || 0
            const percentage = Math.min((position / finishLine) * 100, 100)
            const isCurrentPlayer = player.id === currentPlayerId
            const isFinished = position >= finishLine

            return (
              <motion.div
                key={player.id}
                initial={{ x: 0 }}
                animate={{ x: `${percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`absolute left-0 transform -translate-x-1/2 ${
                  isCurrentPlayer ? 'z-20' : 'z-10'
                }`}
                style={{
                  top: `${20 + index * 35}px`,
                }}
              >
                <div className={`relative ${
                  isCurrentPlayer ? 'scale-125' : 'scale-100'
                }`}>
                  {/* 속도 효과 (뒤쪽 먼지) - 더 역동적으로 */}
                  {percentage > 10 && (
                    <>
                      <motion.div
                        animate={{ 
                          opacity: [0.3, 0.8, 0.3],
                          x: [-10, -20, -10]
                        }}
                        transition={{ duration: 0.3, repeat: Infinity }}
                        className="absolute -left-8 top-1/2 transform -translate-y-1/2 text-3xl"
                      >
                        💨
                      </motion.div>
                      <motion.div
                        animate={{ 
                          opacity: [0.2, 0.5, 0.2],
                          x: [-15, -25, -15]
                        }}
                        transition={{ duration: 0.4, repeat: Infinity, delay: 0.1 }}
                        className="absolute -left-12 top-1/2 transform -translate-y-1/2 text-2xl"
                      >
                        💨
                      </motion.div>
                    </>
                  )}

                  {/* 플레이어 차량/캐릭터 */}
                  <motion.div
                    animate={isFinished ? {
                      scale: [1, 1.3, 1],
                      rotate: [0, 360],
                    } : {
                      y: [0, -3, 0],
                    }}
                    transition={{
                      duration: isFinished ? 0.5 : 1,
                      repeat: isFinished ? 0 : Infinity,
                    }}
                    className={`relative ${
                      isCurrentPlayer ? 'drop-shadow-2xl' : 'drop-shadow-lg'
                    }`}
                  >
                    {/* 차량 스타일 배경 */}
                    <div className={`absolute inset-0 rounded-lg ${
                      isCurrentPlayer 
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-xl' 
                        : 'bg-gradient-to-br from-gray-400 to-gray-600'
                    } transform -skew-x-12 -translate-x-2 -translate-y-1 opacity-80`} 
                    style={{ width: '60px', height: '40px' }}
                    />
                    
                    {/* 아바타 */}
                    <div className={`relative text-4xl ${
                      isCurrentPlayer ? 'filter brightness-110' : ''
                    }`}>
                      {player.avatar || '🐕'}
                    </div>

                  {/* 번개 효과 (속도 부스트 시) - 더 화려하게 */}
                  {isCurrentPlayer && percentage > 20 && (
                    <>
                      <motion.div
                        animate={{ 
                          rotate: [0, 360],
                          scale: [1, 1.3, 1]
                        }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="absolute -top-2 -right-2 text-xl z-10"
                      >
                        ⚡
                      </motion.div>
                      <motion.div
                        animate={{ 
                          opacity: [0.5, 1, 0.5],
                          scale: [1, 1.5, 1]
                        }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="absolute -top-4 -right-4 text-2xl z-0"
                      >
                        ✨
                      </motion.div>
                    </>
                  )}
                  </motion.div>

                  {/* 닉네임 플래그 */}
                  <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap ${
                      isCurrentPlayer 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xl border-2 border-white' 
                        : 'bg-white/95 text-gray-800 px-2 py-1 rounded-md text-xs font-semibold shadow-md border border-gray-300'
                    }`}
                  >
                    {player.nickname}
                    {isCurrentPlayer && (
                      <span className="ml-1 text-xs">⭐</span>
                    )}
                  </motion.div>

                  {/* 위치/속도 표시 */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                      {Math.floor(position)}m
                    </div>
                  </div>

                  {/* 결승선 통과 효과 */}
                  {isFinished && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 2, 1.5], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5 }}
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                    >
                      <div className="text-4xl">🎉</div>
                      <div className="text-2xl font-bold text-yellow-400 text-center mt-2">
                        WIN!
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* 결승선 */}
      <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-r from-transparent via-yellow-400 to-yellow-500 border-l-4 border-dashed border-yellow-600 z-30 shadow-2xl">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-300 font-bold text-sm rotate-90 whitespace-nowrap drop-shadow-lg"
        >
          🏁 결승선
        </motion.div>
      </div>

      {/* 트랙 정보 */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 flex justify-between text-xs font-bold">
        <div className="flex items-center gap-2">
          <span>🏁</span>
          <span>시작</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🏆</span>
          <span>결승선: {finishLine}m</span>
        </div>
      </div>
    </div>
  )
}
