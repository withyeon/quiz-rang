'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { usePlayersRealtime } from '@/hooks/usePlayersRealtime'
import { useRoomRealtime } from '@/hooks/useRoomRealtime'
import { useAudioContext } from '@/components/AudioProvider'
import QuizView from '@/components/QuizView'
import GameResult from '@/components/GameResult'
import Countdown from '@/components/Countdown'
import AnimatedBackground from '@/components/AnimatedBackground'
import PoolTable from '@/components/PoolTable'
import ItemCard from '@/components/ItemCard'
import Leaderboard from '@/components/Leaderboard'
import {
  generatePoolItem,
  calculateShotPower,
  calculateScore,
  simulateBallPhysics,
  isBallInHole,
  applyPoolItemEffect,
  type BallPosition,
  type ShotPower,
  type PoolItem,
  type PoolItemEffect,
  HOLES,
} from '@/lib/game/pool'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row']

type Question = {
  id: string
  type: 'CHOICE' | 'SHORT' | 'OX' | 'BLANK'
  question_text: string
  options: string[]
  answer: string
}

type PoolView = 'lobby' | 'countdown' | 'quiz' | 'pool' | 'wrong' | 'result'

export default function PoolPage() {
  const [roomCode, setRoomCode] = useState('')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<PoolView>('lobby')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isCorrect, setIsCorrect] = useState(false)
  const [answerTime, setAnswerTime] = useState(0)
  const [canShoot, setCanShoot] = useState(false)
  const [ballPosition, setBallPosition] = useState<BallPosition>({ x: 0.5, y: 0.5, vx: 0, vy: 0 })
  const [acquiredItem, setAcquiredItem] = useState<PoolItem | null>(null)
  const [activeItems, setActiveItems] = useState<PoolItemEffect[]>([])
  const [showCountdown, setShowCountdown] = useState(false)
  const [consecutiveStreak, setConsecutiveStreak] = useState(0)
  const [isBlinded, setIsBlinded] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [showGuideLine, setShowGuideLine] = useState(false)
  const [remainingShots, setRemainingShots] = useState(1) // 더블 샷 아이템용
  const [questions, setQuestions] = useState<Question[]>([])

  const questionStartTime = useRef<number>(0)
  const animationFrameRef = useRef<number>()

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

  // 게임 모드 확인 및 리다이렉트
  useEffect(() => {
    if (!room || roomLoading) return

    const gameMode = room.game_mode || 'gold_quest'

    // pool이 아니면 올바른 페이지로 리다이렉트
    if (gameMode !== 'pool') {
      const gameUrl = gameMode === 'gold_quest'
        ? `/game?room=${roomCode}&playerId=${playerId}`
        : gameMode === 'racing'
          ? `/racing?room=${roomCode}&playerId=${playerId}`
          : gameMode === 'battle_royale'
            ? `/battle?room=${roomCode}&playerId=${playerId}`
            : gameMode === 'fishing'
              ? `/fishing?room=${roomCode}&playerId=${playerId}`
              : gameMode === 'factory'
                ? `/factory?room=${roomCode}&playerId=${playerId}`
                : gameMode === 'cafe'
                  ? `/cafe?room=${roomCode}&playerId=${playerId}`
                  : gameMode === 'mafia'
                    ? `/mafia?room=${roomCode}&playerId=${playerId}`
                    : `/pool?room=${roomCode}&playerId=${playerId}`

      if (gameUrl !== window.location.pathname + window.location.search) {
        window.location.href = gameUrl
      }
    }
  }, [room, roomLoading, roomCode, playerId])

  // 현재 플레이어 정보
  const currentPlayer = players.find((p) => p.id === playerId) || null

  // 문제 데이터 가져오기
  useEffect(() => {
    if (!room?.set_id) return

    const fetchQuestions = async () => {
      try {
        const { data, error } = await ((supabase
          .from('questions') as any)
          .select('*')
          .eq('set_id', room.set_id) as any)

        if (error) throw error

        setQuestions(data as Question[])
      } catch (error) {
        console.error('Error fetching questions:', error)
      }
    }

    fetchQuestions()
  }, [room?.set_id])

  const currentQuestion = questions.length > 0 ? questions[currentQuestionIndex % questions.length] : null

  // 게임 상태에 따른 화면 전환
  useEffect(() => {
    if (!room) return

    if (room.status === 'playing') {
      if (currentView === 'lobby' && !showCountdown) {
        setShowCountdown(true)
      }
    } else if (room.status === 'waiting') {
      if (currentView !== 'lobby') {
        setCurrentView('lobby')
        setShowCountdown(false)
      }
    } else if (room.status === 'finished') {
      if (currentView !== 'result') {
        setCurrentView('result')
        playBGM('result')
      }
    }
  }, [room?.status, currentView, showCountdown, playBGM])

  // 카운트다운 완료 후 게임 시작
  const handleCountdownComplete = () => {
    setShowCountdown(false)
    setCurrentView('quiz')
    setCurrentQuestionIndex(0)
    setSelectedAnswer('')
    setIsCorrect(false)
    setBallPosition({ x: 0.5, y: 0.5, vx: 0, vy: 0 })
    setCanShoot(false)
    setRemainingShots(1)
    playBGM('game')
  }

  // 공 물리 시뮬레이션
  useEffect(() => {
    if (currentView !== 'pool' || !canShoot) return

    const isMoving = Math.abs(ballPosition.vx) > 0.001 || Math.abs(ballPosition.vy) > 0.001
    if (!isMoving) return

    const animate = () => {
      setBallPosition((prev) => {
        const newPos = simulateBallPhysics(prev, { angle: 0, power: 0 })

        // 구멍 체크
        for (const hole of HOLES) {
          if (isBallInHole(newPos, hole)) {
            // 구멍에 들어감!
            handleBallInHole(hole)
            return { x: 0.5, y: 0.5, vx: 0, vy: 0 } // 공 초기화
          }
        }

        return newPos
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [currentView, canShoot, ballPosition.vx, ballPosition.vy])

  // 구멍에 들어갔을 때 처리
  const handleBallInHole = async (hole: typeof HOLES[0]) => {
    if (!currentPlayer || !playerId) return

    playSFX('correct')

    // 점수 계산
    const hasBonusPoints = activeItems.some(e => e.type === 'BONUS_POINTS')
    const scoreGain = calculateScore(hole.points, answerTime, consecutiveStreak, hasBonusPoints)

    // 점수 업데이트
    try {
      const { data: playerData } = await (supabase
        .from('players')
        .select('score')
        .eq('id', playerId)
        .single() as any)

      const newScore = (playerData?.score || 0) + scoreGain

      await ((supabase
        .from('players') as any)
        .update({ score: newScore })
        .eq('id', playerId))

      // 연속 성공 카운트 증가
      setConsecutiveStreak((prev) => prev + 1)

      // 아이템 획득 확률 (30%)
      if (Math.random() < 0.3) {
        const item = generatePoolItem()
        setAcquiredItem(item)
        playSFX('item')
      }

      // 보너스 포인트 아이템 제거
      if (hasBonusPoints) {
        setActiveItems((prev) => prev.filter(e => e.type !== 'BONUS_POINTS'))
      }

      // 다음 문제로
      setTimeout(() => {
        setCurrentView('quiz')
        setCanShoot(false)
        setRemainingShots(1)
        setCurrentQuestionIndex((prev) => prev + 1)
      }, 2000)
    } catch (error) {
      console.error('Error updating score:', error)
    }
  }

  // 답안 제출 처리
  const handleAnswerSubmit = (answer: string) => {
    if (!currentQuestion) return

    if (answer === '') {
      playSFX('incorrect')
      setConsecutiveStreak(0)
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

    const timeSpent = Date.now() - questionStartTime.current
    setAnswerTime(timeSpent)

    if (correct) {
      playSFX('correct')

      // 정답: 포켓볼 화면으로
      setTimeout(() => {
        setCurrentView('pool')
        setCanShoot(true)
        // 공을 중앙으로 초기화
        setBallPosition({ x: 0.5, y: 0.5, vx: 0, vy: 0 })
      }, 1500)
    } else {
      setConsecutiveStreak(0)
      playSFX('incorrect')
      setCurrentView('wrong')
      setTimeout(() => {
        setCurrentView('quiz')
        setSelectedAnswer('')
        setIsCorrect(false)
        setCurrentQuestionIndex((prev) => prev + 1)
      }, 3000)
    }
  }

  // 공 치기
  const handleShot = (shotPower: ShotPower) => {
    if (!canShoot || remainingShots <= 0) return

    playSFX('click')

    // 아이템 효과 적용
    const hasPowerShot = activeItems.some(e => e.type === 'POWER_SHOT')
    const hasAccuracyBoost = activeItems.some(e => e.type === 'ACCURACY_BOOST')

    let finalPower = shotPower.power
    if (hasPowerShot) {
      finalPower = Math.min(1, finalPower * 1.5)
    }
    if (hasAccuracyBoost) {
      // 정확도 향상: 각도 조정
      shotPower.angle += (Math.random() - 0.5) * 5 // ±2.5도
    }

    // 공에 힘 적용
    const radians = (shotPower.angle * Math.PI) / 180
    const vx = Math.cos(radians) * finalPower * 0.1
    const vy = Math.sin(radians) * finalPower * 0.1

    setBallPosition((prev) => ({
      ...prev,
      vx,
      vy,
    }))

    setCanShoot(false)
    setRemainingShots((prev) => prev - 1)

    // 파워 샷 아이템 제거
    if (hasPowerShot) {
      setActiveItems((prev) => prev.filter(e => e.type !== 'POWER_SHOT'))
    }
    if (hasAccuracyBoost) {
      setActiveItems((prev) => prev.filter(e => e.type !== 'ACCURACY_BOOST'))
    }
  }

  // 공이 멈췄을 때
  const handleBallStop = () => {
    // 더블 샷이 있으면 다시 칠 수 있음
    if (remainingShots > 0) {
      setCanShoot(true)
    } else {
      // 다음 문제로
      setTimeout(() => {
        setCurrentView('quiz')
        setCanShoot(false)
        setRemainingShots(1)
        setCurrentQuestionIndex((prev) => prev + 1)
      }, 1000)
    }
  }

  // 아이템 사용
  const handleUseItem = (item: PoolItem) => {
    if (!playerId) return

    playSFX('item')
    const effect = applyPoolItemEffect(item, playerId, players)

    // 자신에게 적용되는 효과
    if (effect.type === 'GUIDE_LINE') {
      setShowGuideLine(true)
      setTimeout(() => setShowGuideLine(false), 10000) // 10초
    } else if (effect.type === 'DOUBLE_SHOT') {
      setRemainingShots((prev) => prev + 1)
    } else if (effect.type === 'BONUS_POINTS') {
      setActiveItems((prev) => [...prev, effect])
    } else if (effect.type === 'POWER_SHOT' || effect.type === 'ACCURACY_BOOST') {
      setActiveItems((prev) => [...prev, effect])
    }

    // 다른 플레이어에게 적용되는 효과는 서버에서 처리해야 함
    // 여기서는 클라이언트 효과만 처리

    setAcquiredItem(null)
  }

  // 문제 시작 시간 기록
  useEffect(() => {
    if (currentView === 'quiz') {
      questionStartTime.current = Date.now()
    }
  }, [currentView, currentQuestionIndex])

  if (!roomCode || !playerId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-800">방 코드와 플레이어 ID가 필요합니다.</p>
        </div>
      </div>
    )
  }

  if (roomLoading || playersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 relative overflow-hidden">
      <AnimatedBackground />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-700 via-green-600 to-green-700 rounded-xl shadow-2xl p-4 mb-6 border-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="text-4xl"
              >
                🎱
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white">포켓볼 게임</h1>
                <p className="text-sm text-green-200">방 코드: {roomCode}</p>
              </div>
            </div>
            {currentPlayer && (
              <div className="text-right bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="text-lg font-bold text-white">{currentPlayer.nickname}</div>
                <div className="text-sm text-yellow-300 font-semibold">
                  점수: {currentPlayer.score}점 | 연속: {consecutiveStreak}회
                </div>
              </div>
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
              className="bg-white rounded-xl shadow-2xl p-12 text-center border-2 border-gray-200"
            >
              <div className="text-6xl mb-6">🎱</div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">게임 대기 중...</h2>
              <p className="text-gray-600 text-lg">선생님이 게임을 시작할 때까지 기다려주세요.</p>
            </motion.div>
          )}

          {currentView === 'quiz' && currentQuestion && (
            <QuizView question={currentQuestion} onAnswer={handleAnswerSubmit} timeLimit={30} />
          )}

          {currentView === 'pool' && (
            <div className="space-y-4">
              <PoolTable
                ballPosition={ballPosition}
                onShot={handleShot}
                canShoot={canShoot && remainingShots > 0}
                activeEffects={activeItems}
                isBlinded={isBlinded}
                isShaking={isShaking}
                showGuideLine={showGuideLine}
                onBallStop={handleBallStop}
              />

              {remainingShots > 1 && (
                <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 text-center">
                  <p className="text-yellow-800 font-bold">더블 샷! {remainingShots}번 더 칠 수 있습니다!</p>
                </div>
              )}
            </div>
          )}

          {currentView === 'wrong' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-50 rounded-xl shadow-2xl p-12 text-center border-2 border-red-300"
            >
              <div className="text-8xl mb-6">❌</div>
              <h2 className="text-5xl font-bold text-red-600 mb-4">틀렸습니다!</h2>
              <p className="text-gray-700 text-lg">3초 후 다음 문제로 이동합니다...</p>
            </motion.div>
          )}
        </div>

        {/* 아이템 획득 모달 */}
        {acquiredItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => handleUseItem(acquiredItem)}
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white rounded-xl p-8 max-w-md text-center"
            >
              <div className="text-6xl mb-4">{acquiredItem.icon}</div>
              <h3 className="text-2xl font-bold mb-2">{acquiredItem.name}</h3>
              <p className="text-gray-600 mb-4">{acquiredItem.description}</p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700">
                사용하기
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* 게임 결과 화면 */}
        {currentView === 'result' && (
          <GameResult players={players} currentPlayerId={playerId} />
        )}

        {/* 플레이어 순위 (결과 화면이 아닐 때만 표시) */}
        {currentView !== 'result' && (
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">🎱 포켓볼 순위</h2>
            <Leaderboard
              players={players}
              currentPlayerId={playerId}
              sortBy="score"
            />
          </div>
        )}
      </div>
    </main>
  )
}
