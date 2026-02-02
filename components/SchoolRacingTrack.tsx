'use client'

import { motion } from 'framer-motion'
import type { Database } from '@/types/database.types'
import { getCurrentStage, TRACK_LENGTH, MAP_STAGES } from '@/lib/game/schoolRacing'

type Player = Database['public']['Tables']['players']['Row'] & {
  position?: number
}

interface SchoolRacingTrackProps {
  players: Player[]
  currentPlayerId: string | null
  trackLength?: number
}

export default function SchoolRacingTrack({
  players,
  currentPlayerId,
  trackLength = TRACK_LENGTH,
}: SchoolRacingTrackProps) {
  // 위치 순으로 정렬
  const sortedPlayers = [...players].sort((a, b) => {
    const posA = a.position || 0
    const posB = b.position || 0
    return posB - posA // 앞선 순서대로
  })

  const maxPosition = Math.max(...players.map(p => p.position || 0), 0)
  const finishLine = trackLength

  // 현재 플레이어의 스테이지
  const currentPlayer = players.find(p => p.id === currentPlayerId)
  const currentStage = currentPlayer ? getCurrentStage(currentPlayer.position || 0) : MAP_STAGES[0]

  return (
    <div className="relative w-full rounded-2xl shadow-2xl overflow-hidden border-4 border-blue-500">
      {/* 진행바 (상단) */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 to-green-600 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-white font-bold">
          <span className="text-2xl">🏠</span>
          <span className="text-sm">집</span>
        </div>
        
        {/* 플레이어 위치 표시 */}
        <div className="flex-1 relative h-8 mx-4">
          {sortedPlayers.map((player, index) => {
            const position = player.position || 0
            const percentage = Math.min((position / finishLine) * 100, 100)
            const isCurrentPlayer = player.id === currentPlayerId
            
            return (
              <motion.div
                key={player.id}
                initial={{ left: '0%' }}
                animate={{ left: `${percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`absolute transform -translate-x-1/2 ${
                  isCurrentPlayer ? 'z-20' : 'z-10'
                }`}
              >
                <div className={`text-2xl ${isCurrentPlayer ? 'scale-125' : ''}`}>
                  {player.avatar || '🏃'}
                </div>
                {isCurrentPlayer && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-yellow-300 bg-black/70 px-2 py-1 rounded whitespace-nowrap">
                    {player.nickname}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
        
        <div className="flex items-center gap-2 text-white font-bold">
          <span className="text-sm">학교</span>
          <span className="text-2xl">🏫</span>
        </div>
      </div>

      {/* 배경 - 스테이지별 변경 */}
      <div className={`absolute inset-0 mt-16 ${
        currentStage.stage === 'home' 
          ? 'bg-gradient-to-b from-pink-200 via-orange-200 to-yellow-200' 
          : currentStage.stage === 'city'
          ? 'bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500'
          : 'bg-gradient-to-b from-green-300 via-green-400 to-green-500'
      }`}>
        {/* 스테이지별 배경 요소 */}
        {currentStage.stage === 'home' && (
          <>
            {/* 집 배경 */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-6xl opacity-30"
                style={{ left: `${20 + i * 30}%`, top: '20%' }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3 + i, repeat: Infinity }}
              >
                🏠
              </motion.div>
            ))}
          </>
        )}
        
        {currentStage.stage === 'city' && (
          <>
            {/* 도시 배경 */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-5xl opacity-40"
                style={{ left: `${15 + i * 20}%`, top: '10%' }}
              >
                🏢
              </motion.div>
            ))}
            {/* 횡단보도 */}
            <motion.div
              className="absolute bottom-20 left-0 right-0 h-2 bg-white"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </>
        )}
        
        {currentStage.stage === 'school' && (
          <>
            {/* 학교 배경 */}
            <motion.div
              className="absolute right-10 top-10 text-8xl opacity-50"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🏫
            </motion.div>
            {/* 교문 (닫히는 효과) */}
            <motion.div
              className="absolute right-0 top-1/2 transform -translate-y-1/2 text-6xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🚪
            </motion.div>
          </>
        )}
      </div>

      {/* 도로 (횡스크롤) */}
      <div className="relative h-32 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 mt-16">
        {/* 도로 중앙선 */}
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

        {/* 플레이어들 */}
        <div className="relative h-full">
          {sortedPlayers.map((player, index) => {
            const position = player.position || 0
            const percentage = Math.min((position / finishLine) * 100, 100)
            const isCurrentPlayer = player.id === currentPlayerId
            const isFinished = position >= finishLine
            const playerStage = getCurrentStage(position)

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
                  top: `${10 + index * 30}px`,
                }}
              >
                <div className={`relative ${
                  isCurrentPlayer ? 'scale-125' : 'scale-100'
                }`}>
                  {/* 흙먼지 효과 */}
                  {percentage > 5 && (
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

                  {/* 캐릭터 (등교하는 학생) */}
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
                    {/* 식빵 물고 달리는 학생 */}
                    <div className="relative text-4xl">
                      {player.avatar || '🏃'}
                      {/* 식빵 */}
                      <motion.div
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xl"
                      >
                        🍞
                      </motion.div>
                      {/* 가방 */}
                      <div className="absolute -bottom-2 right-0 text-lg">
                        🎒
                      </div>
                      {/* 땀방울 */}
                      <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute -top-4 right-2 text-sm"
                      >
                        💦
                      </motion.div>
                    </div>

                    {/* 속도 효과 */}
                    {isCurrentPlayer && percentage > 20 && (
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

                  {/* 위치 표시 */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                      {Math.floor(position)}m
                    </div>
                  </div>

                  {/* 교문 통과 효과 */}
                  {isFinished && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 2, 1.5], opacity: [0, 1, 0] }}
                      transition={{ duration: 1.5 }}
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                    >
                      <div className="text-4xl">🎉</div>
                      <div className="text-2xl font-bold text-yellow-400 text-center mt-2">
                        등교 성공!
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* 교문 (결승선) */}
      <div className="absolute right-0 top-16 bottom-0 w-4 bg-gradient-to-r from-transparent via-red-400 to-red-500 border-l-4 border-dashed border-red-600 z-30 shadow-2xl">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-300 font-bold text-sm rotate-90 whitespace-nowrap drop-shadow-lg"
        >
          🚪 교문
        </motion.div>
      </div>

      {/* 현재 스테이지 정보 */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 flex justify-between text-xs font-bold">
        <div className="flex items-center gap-2">
          <span>{currentStage.emoji}</span>
          <span>{currentStage.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>⏰</span>
          <span>8:59 AM - 교문 닫히는 중!</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🏁</span>
          <span>목표: {finishLine}m</span>
        </div>
      </div>
    </div>
  )
}
