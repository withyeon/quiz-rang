'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { usePlayersRealtime } from '@/hooks/usePlayersRealtime'
import { useRoomRealtime } from '@/hooks/useRoomRealtime'
import { useAudioContext } from '@/components/AudioProvider'
import QuizView from '@/components/QuizView'
import ChestView from '@/components/ChestView'
import GameResult from '@/components/GameResult'
import Countdown from '@/components/Countdown'
import ParticleEffect from '@/components/ParticleEffect'
import AnimatedBackground from '@/components/AnimatedBackground'
import { generateReward, type Reward } from '@/lib/game/reward'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row']

// 더미 문제 데이터
const DUMMY_QUESTIONS = [
  {
    id: '1',
    question_text: '한국의 수도는?',
    options: ['서울', '부산', '대구', '인천'],
    answer: '서울',
  },
  {
    id: '2',
    question_text: '태양계에서 가장 큰 행성은?',
    options: ['지구', '목성', '토성', '화성'],
    answer: '목성',
  },
  {
    id: '3',
    question_text: '2 + 2는?',
    options: ['3', '4', '5', '6'],
    answer: '4',
  },
  {
    id: '4',
    question_text: '한국의 독립기념일은?',
    options: ['3월 1일', '8월 15일', '10월 3일', '12월 25일'],
    answer: '8월 15일',
  },
  {
    id: '5',
    question_text: '지구의 위성은?',
    options: ['화성', '금성', '달', '태양'],
    answer: '달',
  },
]

type GameView = 'lobby' | 'countdown' | 'quiz' | 'chest' | 'wrong' | 'result'

export default function GamePage() {
  const [roomCode, setRoomCode] = useState('')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<GameView>('lobby')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isCorrect, setIsCorrect] = useState(false)
  const [selectedChest, setSelectedChest] = useState<number | null>(null)
  const [reward, setReward] = useState<Reward | null>(null)
  const [isProcessingReward, setIsProcessingReward] = useState(false)
  const [showCountdown, setShowCountdown] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [particleType, setParticleType] = useState<'confetti' | 'sparkle' | 'fireworks'>('confetti')

  // URL에서 roomCode와 playerId 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('room')
      const id = params.get('playerId')
      if (code) setRoomCode(code)
      if (id) setPlayerId(id)
    }
  }, [])

  const { players, loading: playersLoading } = usePlayersRealtime({ roomCode })
  const { room, loading: roomLoading } = useRoomRealtime({ roomCode })
  const { playBGM, playSFX } = useAudioContext()

  // 현재 플레이어 정보
  const currentPlayer = players.find((p) => p.id === playerId) || null
  const currentQuestion = DUMMY_QUESTIONS[currentQuestionIndex % DUMMY_QUESTIONS.length]
  
  // 문제가 끝나면 게임 종료
  useEffect(() => {
    if (currentQuestionIndex >= DUMMY_QUESTIONS.length && currentView === 'quiz') {
      // 모든 문제를 풀었으면 게임 종료
      if (room && room.status !== 'finished') {
        ;(async () => {
          try {
            await ((supabase
              .from('rooms') as any)
              .update({ status: 'finished' })
              .eq('room_code', roomCode) as any)
          } catch (error) {
            console.error('게임 종료 업데이트 실패:', error)
          }
        })()
      }
    }
  }, [currentQuestionIndex, currentView, room, roomCode])

  // 게임 상태에 따른 화면 전환 및 BGM 재생 (게임 시작 후에만)
  useEffect(() => {
    if (!room) return

    if (room.status === 'playing' && currentView === 'lobby') {
      // 카운트다운 시작
      setShowCountdown(true)
    } else if (room.status === 'waiting') {
      if (currentView !== 'lobby') {
        setCurrentView('lobby')
        // waiting 상태에서는 소리 재생하지 않음
      }
    } else if (room.status === 'finished') {
      if (currentView !== 'result') {
        setCurrentView('result')
        // 게임 종료 시 결과 BGM 재생
        playBGM('result')
      }
    }
  }, [room?.status, currentView, playBGM])

  // 카운트다운 완료 후 게임 시작
  const handleCountdownComplete = () => {
    setShowCountdown(false)
    setCurrentView('quiz')
    setCurrentQuestionIndex(0)
    setSelectedAnswer('')
    setIsCorrect(false)
    playBGM('game')
  }

  // 답안 제출 처리
  const handleAnswerSubmit = (answer: string) => {
    // 시간 초과로 빈 답안이 오면 오답 처리
    if (answer === '') {
      playSFX('incorrect')
      setCurrentView('wrong')
      setTimeout(() => {
        setCurrentView('quiz')
        setSelectedAnswer('')
        setIsCorrect(false)
        setCurrentQuestionIndex((prev) => prev + 1)
      }, 3000)
      return
    }

    setSelectedAnswer(answer)
    const correct = answer === currentQuestion.answer
    setIsCorrect(correct)

    // 사운드 효과
    if (correct) {
      playSFX('correct')
      // 정답 파티클 효과
      setParticleType('sparkle')
      setShowParticles(true)
      setTimeout(() => setShowParticles(false), 2000)
      // 정답: 상자 선택 화면으로
      setTimeout(() => {
        setCurrentView('chest')
        setSelectedChest(null)
        setReward(null)
      }, 1500)
    } else {
      playSFX('incorrect')
      // 오답: 3초간 틀렸습니다 화면
      setCurrentView('wrong')
      setTimeout(() => {
        setCurrentView('quiz')
        setSelectedAnswer('')
        setIsCorrect(false)
        // 다음 문제로 (순환)
        setCurrentQuestionIndex((prev) => prev + 1)
      }, 3000)
    }
  }

  // 상자 선택 처리
  const handleChestSelect = async (chestIndex: number) => {
    if (!currentPlayer || isProcessingReward) return

    playSFX('click')
    setIsProcessingReward(true)
    setSelectedChest(chestIndex)

    // 보상 생성
    const newReward = generateReward(currentPlayer.gold)
    setReward(newReward)
    
    // 아이템 획득 사운드 및 파티클
    if (newReward.type === 'gold_gain') {
      playSFX('item')
      setParticleType('confetti')
      setShowParticles(true)
      setTimeout(() => setShowParticles(false), 3000)
    }

    // DB 업데이트
    try {
      let newGold = currentPlayer.gold
      let newScore = currentPlayer.score

      if (newReward.type === 'gold_gain') {
        newGold += newReward.amount
        newScore += newReward.amount
      } else if (newReward.type === 'gold_loss') {
        newGold = Math.max(0, newGold - newReward.amount)
        newScore = Math.max(0, newScore - newReward.amount)
      }

      await ((supabase
        .from('players') as any)
        .update({
          gold: newGold,
          score: newScore,
        })
        .eq('id', playerId))

      // 3초 후 다음 문제로
      setTimeout(() => {
        setCurrentView('quiz')
        setSelectedChest(null)
        setReward(null)
        setSelectedAnswer('')
        setIsCorrect(false)
        setCurrentQuestionIndex((prev) => prev + 1)
        setIsProcessingReward(false)
      }, 3000)
    } catch (error) {
      console.error('Error updating reward:', error)
      setIsProcessingReward(false)
    }
  }

  if (!roomCode || !playerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-800">방 코드와 플레이어 ID가 필요합니다.</p>
        </div>
      </div>
    )
  }

  if (roomLoading || playersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 relative overflow-hidden">
      <AnimatedBackground />
      {showParticles && <ParticleEffect type={particleType} />}
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500 to-indigo-600 rounded-xl shadow-2xl p-4 mb-6 glow-box"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white neon-glow">Gold Quest</h1>
              <p className="text-sm text-primary-100">방 코드: {roomCode}</p>
            </div>
            {currentPlayer && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-right bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
              >
                <div className="text-lg font-bold text-white">{currentPlayer.nickname}</div>
                <div className="text-sm text-yellow-300 font-semibold">
                  💰 {currentPlayer.gold} Gold | {currentPlayer.score}점
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* 카운트다운 */}
        {showCountdown && <Countdown onComplete={handleCountdownComplete} />}

        {/* 게임 화면 */}
        <div className="mb-6">
          {currentView === 'lobby' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-2xl p-12 text-center border-2 border-primary-200"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="inline-block mb-6"
              >
                <div className="text-6xl">🎮</div>
              </motion.div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                게임 대기 중...
              </h2>
              <p className="text-gray-600 text-lg mb-6">선생님이 게임을 시작할 때까지 기다려주세요.</p>
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-primary-500 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {currentView === 'quiz' && currentQuestion && (
            <QuizView question={currentQuestion} onAnswer={handleAnswerSubmit} timeLimit={30} />
          )}

          {currentView === 'chest' && (
            <ChestView
              onChestSelect={handleChestSelect}
              selectedChest={selectedChest}
              reward={reward}
              isProcessing={isProcessingReward}
            />
          )}

          {currentView === 'wrong' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl shadow-2xl p-12 text-center border-2 border-red-300"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="text-8xl mb-6"
              >
                ❌
              </motion.div>
              <h2 className="text-5xl font-bold text-red-600 mb-4 neon-glow">틀렸습니다!</h2>
              <p className="text-gray-700 text-lg">3초 후 다음 문제로 이동합니다...</p>
              <div className="mt-6 flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-red-500 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

        </div>

        {/* 게임 결과 화면 */}
        {currentView === 'result' && (
          <GameResult players={players} currentPlayerId={playerId} />
        )}

        {/* 플레이어 순위 (결과 화면이 아닐 때만 표시) */}
        {currentView !== 'result' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">순위</h2>
            <div className="space-y-2">
              {players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.id === playerId
                        ? 'bg-indigo-50 border-2 border-indigo-500'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                      <span className="text-2xl">{player.avatar || '🎮'}</span>
                      <div>
                        <div className="font-semibold text-gray-800">{player.nickname}</div>
                        <div className="text-sm text-gray-500">
                          {player.is_online ? '🟢' : '🔴'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800">{player.score}점</div>
                      <div className="text-sm text-yellow-600">💰 {player.gold} Gold</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
