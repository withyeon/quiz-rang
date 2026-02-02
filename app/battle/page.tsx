'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { usePlayersRealtime } from '@/hooks/usePlayersRealtime'
import { useRoomRealtime } from '@/hooks/useRoomRealtime'
import { useAudioContext } from '@/components/AudioProvider'
import QuizView from '@/components/QuizView'
import BattleArena from '@/components/BattleArena'
import GameResult from '@/components/GameResult'
import Countdown from '@/components/Countdown'

import AnimatedBackground from '@/components/AnimatedBackground'
import {
  calculateDamage,
  isCriticalHit,
  generateAttack,
  applyDamage,
  applyHeal,
  checkWinner,
  isGameOver,
  generateItem,
  calculateZoneDamage,
  type AttackResult,
  type PlayerClass,
  type SnowballItem,
  PLAYER_CLASSES,
} from '@/lib/game/battleRoyale'
import ClassSelector from '@/components/ClassSelector'
import SnowEffect from '@/components/SnowEffect'
import BlizzardOverlay from '@/components/BlizzardOverlay'
import ScreenShake from '@/components/ScreenShake'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row'] & {
  health?: number
  player_class?: PlayerClass
}

type Question = {
  id: string
  type: 'CHOICE' | 'SHORT' | 'OX' | 'BLANK'
  question_text: string
  options: string[]
  answer: string
}

type BattleView = 'lobby' | 'classSelect' | 'countdown' | 'quiz' | 'attack' | 'wrong' | 'result'

export default function BattlePage() {
  const [roomCode, setRoomCode] = useState('')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<BattleView>('lobby')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isCorrect, setIsCorrect] = useState(false)
  const [answerTime, setAnswerTime] = useState(0)
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null)
  const [showCountdown, setShowCountdown] = useState(false)

  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null)
  const [hasSnowball, setHasSnowball] = useState(false) // 눈뭉치 장전 여부
  const [currentItem, setCurrentItem] = useState<SnowballItem | null>(null)
  const [isShaking, setIsShaking] = useState(false)
  const [showSnowEffect, setShowSnowEffect] = useState(false)
  const [isBlizzardActive, setIsBlizzardActive] = useState(false)
  const [gameStartTime, setGameStartTime] = useState<number>(0)
  const [zoneLevel, setZoneLevel] = useState(1)

  const questionStartTime = useRef<number>(0)

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

    // battle_royale이 아니면 올바른 페이지로 리다이렉트
    if (gameMode !== 'battle_royale') {
      const gameUrl = gameMode === 'gold_quest'
        ? `/game?room=${roomCode}&playerId=${playerId}`
        : gameMode === 'racing'
          ? `/racing?room=${roomCode}&playerId=${playerId}`
          : gameMode === 'fishing'
            ? `/fishing?room=${roomCode}&playerId=${playerId}`
            : gameMode === 'factory'
              ? `/factory?room=${roomCode}&playerId=${playerId}`
              : gameMode === 'cafe'
                ? `/cafe?room=${roomCode}&playerId=${playerId}`
                : gameMode === 'mafia'
                  ? `/mafia?room=${roomCode}&playerId=${playerId}`
                  : gameMode === 'pool'
                    ? `/pool?room=${roomCode}&playerId=${playerId}`
                    : `/battle?room=${roomCode}&playerId=${playerId}`

      if (gameUrl !== window.location.pathname + window.location.search) {
        window.location.href = gameUrl
      }
    }
  }, [room, roomLoading, roomCode, playerId])

  // 현재 플레이어 정보
  const currentPlayer = players.find((p) => p.id === playerId) as Player | undefined
  // 문제 데이터 가져오기
  const [questions, setQuestions] = useState<Question[]>([])

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

  // 직업 선택 저장
  const handleClassSelect = async (playerClass: PlayerClass) => {
    if (!playerId) return

    setSelectedClass(playerClass)

    try {
      const classInfo = PLAYER_CLASSES[playerClass]
      // 직업별 초기 체력 설정
      await ((supabase
        .from('players') as any)
        .update({
          player_class: playerClass,
          health: classInfo.maxHealth // 직업별 최대 체력으로 설정
        })
        .eq('id', playerId))
    } catch (error) {
      console.error('Error updating class:', error)
    }
  }

  // 저장된 직업 불러오기
  useEffect(() => {
    if (currentPlayer?.player_class) {
      setSelectedClass(currentPlayer.player_class as PlayerClass)
    }
  }, [currentPlayer?.player_class])

  // 게임 시작 감지
  useEffect(() => {
    if (room?.status === 'playing') {
      // 게임이 시작되면 직업 선택 또는 카운트다운으로 이동
      if (currentView === 'lobby') {
        if (!selectedClass) {
          setCurrentView('classSelect')
        } else {
          setShowCountdown(true)
          setGameStartTime(Date.now())
          playBGM('game')
          setTimeout(() => {
            setShowCountdown(false)
            setCurrentView('quiz')
            questionStartTime.current = Date.now()
          }, 3000)
        }
      } else if (currentView === 'classSelect' && selectedClass) {
        setShowCountdown(true)
        setGameStartTime(Date.now())
        playBGM('game')
        setTimeout(() => {
          setShowCountdown(false)
          setCurrentView('quiz')
          questionStartTime.current = Date.now()
        }, 3000)
      }
    } else if (room?.status === 'waiting' && currentView !== 'lobby') {
      setCurrentView('lobby')
      setShowCountdown(false)
      setSelectedClass(null)
      setHasSnowball(false)
      setCurrentItem(null)
    }
  }, [room?.status, currentView, playBGM, selectedClass])

  // 자기장(폭설 주의보) 시스템
  useEffect(() => {
    if (room?.status !== 'playing' || !gameStartTime) return

    const interval = setInterval(() => {
      const elapsed = Date.now() - gameStartTime
      const newZoneLevel = Math.floor(elapsed / 120000) + 1 // 2분마다 레벨 증가
      setZoneLevel(newZoneLevel)
    }, 1000)

    return () => clearInterval(interval)
  }, [room?.status, gameStartTime])

  // 자기장 데미지 적용
  useEffect(() => {
    if (room?.status !== 'playing' || !gameStartTime || zoneLevel <= 1) return

    const interval = setInterval(() => {
      // 자기장 데미지 (10초마다)
      const zoneDamage = calculateZoneDamage(Date.now() - gameStartTime, zoneLevel)

      players.forEach(async (player) => {
        if ((player.health || 100) > 0) {
          const newHealth = Math.max(0, (player.health || 100) - zoneDamage)
          try {
            await ((supabase
              .from('players') as any)
              .update({ health: newHealth })
              .eq('id', player.id))
          } catch (error) {
            console.error('Error applying zone damage:', error)
          }
        }
      })
    }, 10000) // 10초마다

    return () => clearInterval(interval)
  }, [room?.status, gameStartTime, zoneLevel, players])

  // 탈락 감지 (체온이 0이 되면 눈사람으로)
  useEffect(() => {
    if (currentPlayer && (currentPlayer.health || 100) <= 0 && currentView !== 'result') {
      playSFX('incorrect')
      // 눈사람 변신 연출 후 관전 모드
      setTimeout(() => {
        // 관전 모드로 전환 (다른 플레이어들이 게임하는 것을 볼 수 있음)
      }, 2000)
    }
  }, [currentPlayer?.health, currentView])

  // 게임 종료 확인
  useEffect(() => {
    if (players.length > 0 && room?.status === 'playing') {
      const winner = checkWinner(players as Player[])
      if (winner || isGameOver(players as Player[])) {
        setCurrentView('result')
        playSFX('item')
      }
    }
  }, [players, room?.status, playSFX])

  // 답안 제출
  const handleAnswerSubmit = async (answer: string) => {
    if (!currentPlayer || !roomCode || !playerId || !currentQuestion) return

    setSelectedAnswer(answer)
    const time = Date.now() - questionStartTime.current
    setAnswerTime(time)

    const correct = answer === currentQuestion.answer
    setIsCorrect(correct)

    if (correct) {
      playSFX('correct')

      // 핫초코 직업: 체온 회복
      if (selectedClass === 'hot_choco') {
        const maxHealth = PLAYER_CLASSES[selectedClass].maxHealth
        const newHealth = applyHeal(currentPlayer.health || 100, selectedClass)
        try {
          await ((supabase
            .from('players') as any)
            .update({ health: Math.min(newHealth, maxHealth) })
            .eq('id', playerId))
        } catch (error) {
          console.error('Error healing:', error)
        }
      }

      // 눈뭉치 장전 완료
      setHasSnowball(true)

      // 랜덤 아이템 획득 (20% 확률)
      if (Math.random() < 0.2) {
        const item = generateItem()
        if (item) {
          setCurrentItem(item)
          playSFX('item')
        }
      }

      // 다음 문제로 (플레이어 선택 대기)
      setTimeout(() => {
        setCurrentView('quiz')
        setSelectedAnswer('')
        setIsCorrect(false)
      }, 1500)
    } else {
      playSFX('incorrect')
      setCurrentView('wrong')
      setTimeout(() => {
        setCurrentView('quiz')
        setSelectedAnswer('')
        setIsCorrect(false)
        setCurrentQuestionIndex(prev => prev + 1)
        questionStartTime.current = Date.now()
      }, 2000)
    }
  }

  // 플레이어 공격 처리
  const handlePlayerAttack = async (targetId: string) => {
    if (!currentPlayer || !playerId || !hasSnowball) return

    playSFX('click')
    setHasSnowball(false)

    const time = Date.now() - questionStartTime.current
    const isCritical = isCriticalHit()
    const gameTime = Date.now() - gameStartTime
    const hasGiantBall = currentItem?.type === 'giant_ball'

    // 데미지 계산
    const damage = calculateDamage(
      true,
      time,
      isCritical,
      selectedClass || undefined,
      gameTime,
      hasGiantBall || false
    )

    // 공격 결과 생성
    const attack = generateAttack(playerId, targetId, damage, isCritical)
    if (hasGiantBall) {
      attack.itemType = 'giant_ball'
    }
    setAttackResult(attack)

    // 타겟 플레이어 체력 감소
    const targetPlayer = players.find(p => p.id === targetId) as Player | undefined
    if (targetPlayer) {
      const currentHealth = targetPlayer.health || 100
      const newHealth = applyDamage(currentHealth, damage, targetPlayer.player_class)

      try {
        await ((supabase
          .from('players') as any)
          .update({ health: newHealth })
          .eq('id', targetId))

        // 공격 화면 표시 및 이펙트
        setIsShaking(true)
        setShowSnowEffect(true)
        setCurrentView('attack')

        setTimeout(() => {
          setIsShaking(false)
          setShowSnowEffect(false)
        }, 500)

        // 왕눈덩이 아이템 사용
        if (hasGiantBall) {
          setCurrentItem(null)
        }

        setTimeout(() => {
          setAttackResult(null)
          setCurrentView('quiz')
          setCurrentQuestionIndex(prev => prev + 1)
          setSelectedAnswer('')
          setIsCorrect(false)
          questionStartTime.current = Date.now()
        }, 2000)
      } catch (error) {
        console.error('Error updating health:', error)
      }
    }
  }

  // 아이템 사용
  const handleUseItem = async () => {
    if (!currentItem || !playerId) return

    if (currentItem.type === 'blizzard') {
      // 1등 플레이어에게 눈보라 적용
      const topPlayer = players
        .filter(p => p.id !== playerId && (p.health || 100) > 0)
        .sort((a, b) => (b.score || 0) - (a.score || 0))[0]

      if (topPlayer) {
        setIsBlizzardActive(true)
        setTimeout(() => setIsBlizzardActive(false), 5000)
      }
    } else if (currentItem.type === 'heater') {
      // 체온 회복
      if (currentPlayer) {
        const maxHealth = selectedClass
          ? PLAYER_CLASSES[selectedClass].maxHealth
          : 100
        const newHealth = Math.min((currentPlayer.health || 100) + 30, maxHealth)

        await ((supabase
          .from('players') as any)
          .update({ health: newHealth })
          .eq('id', playerId))
      }
    }

    setCurrentItem(null)
  }

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
        <div className="text-2xl font-bold text-gray-800">로딩 중...</div>
      </div>
    )
  }

  // 현재 플레이어가 1등인지 확인 (눈보라 효과용)
  const isTopPlayer = players
    .filter(p => (p.health || 100) > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))[0]?.id === playerId

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-cyan-50 to-white relative overflow-hidden">
      <AnimatedBackground />
      <SnowEffect isActive={showSnowEffect} />
      {isBlizzardActive && isTopPlayer && <BlizzardOverlay isActive={true} />}

      <ScreenShake intensity={15} duration={500} isShaking={isShaking}>
        <div className="relative z-10 p-4">
          {/* 헤더 - 눈싸움 테마 */}
          <div className="max-w-6xl mx-auto mb-4">
            <div className="bg-gradient-to-r from-blue-800 via-cyan-700 to-blue-800 rounded-xl p-4 shadow-2xl border-4 border-blue-400 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="h-full w-full" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                }} />
              </div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="text-4xl"
                  >
                    ❄️
                  </motion.div>
                  <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                      눈싸움 대작전
                    </h1>
                    <p className="text-xs text-blue-200 font-semibold">방 코드: {roomCode}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {selectedClass && (
                    <div className="bg-black/50 rounded-lg px-3 py-2 border-2 border-blue-400">
                      <div className="text-xs text-blue-300 font-semibold mb-1">직업</div>
                      <div className="text-lg font-bold text-white flex items-center gap-1">
                        {PLAYER_CLASSES[selectedClass].icon}
                      </div>
                    </div>
                  )}

                  <div className="bg-black/50 rounded-lg px-4 py-2 border-2 border-blue-400">
                    <div className="text-sm text-blue-300 font-semibold mb-1">체온</div>
                    <div className="text-lg font-bold text-white">
                      {currentPlayer?.health || 100}°C
                    </div>
                  </div>

                  <div className="bg-black/50 rounded-lg px-3 py-2 border-2 border-yellow-400">
                    <div className="text-xs text-yellow-300 font-semibold mb-1">순위</div>
                    <div className="text-lg font-bold text-white">
                      #{players.filter(p => (p.health || 100) > (currentPlayer?.health || 100)).length + 1}
                    </div>
                  </div>

                  {hasSnowball && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="bg-green-500 rounded-lg px-4 py-2 border-2 border-green-300"
                    >
                      <div className="text-sm text-white font-semibold flex items-center gap-2">
                        ❄️ 눈뭉치 장전 완료!
                      </div>
                    </motion.div>
                  )}

                  {currentItem && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="bg-purple-500 rounded-lg px-4 py-2 border-2 border-purple-300 cursor-pointer"
                      onClick={handleUseItem}
                    >
                      <div className="text-sm text-white font-semibold flex items-center gap-2">
                        {currentItem.icon} {currentItem.name}
                      </div>
                    </motion.div>
                  )}

                  {zoneLevel > 1 && (
                    <div className="bg-red-500 rounded-lg px-4 py-2 border-2 border-red-300">
                      <div className="text-sm text-white font-semibold">
                        🌨️ 폭설 주의보 Lv.{zoneLevel}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 메인 컨텐츠 */}
          <div className="max-w-6xl mx-auto">
            {/* 카운트다운 */}
            {showCountdown && (
              <Countdown onComplete={() => { }} />
            )}

            {/* 로비 */}
            {currentView === 'lobby' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg text-center"
              >
                <h2 className="text-3xl font-bold mb-4">❄️ 눈싸움 준비 중...</h2>
                <p className="text-gray-600">선생님이 게임을 시작할 때까지 기다려주세요.</p>
                <div className="mt-6">
                  <BattleArena
                    players={players as Player[]}
                    currentPlayerId={playerId}
                    canAttack={false}
                  />
                </div>
              </motion.div>
            )}

            {/* 직업 선택 */}
            {currentView === 'classSelect' && (
              <ClassSelector
                onSelect={handleClassSelect}
                selectedClass={selectedClass || undefined}
              />
            )}

            {/* 탈락 화면 (눈사람 변신) */}
            {currentPlayer && (currentPlayer.health || 100) <= 0 && currentView !== 'result' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-blue-900 to-cyan-900 rounded-xl p-12 shadow-2xl text-center border-4 border-blue-400"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-9xl mb-6"
                >
                  ⛄
                </motion.div>
                <h2 className="text-5xl font-bold text-white mb-4">
                  눈사람이 되었습니다!
                </h2>
                <p className="text-blue-200 text-xl mb-6">
                  체온이 0도까지 떨어져 꽁꽁 얼어버렸습니다...
                </p>
                <p className="text-white/80 mb-6">
                  다른 플레이어들이 게임하는 것을 관전할 수 있습니다.
                </p>
                <div className="mt-6">
                  <BattleArena
                    players={players as Player[]}
                    currentPlayerId={playerId}
                    canAttack={false}
                  />
                </div>
              </motion.div>
            )}

            {/* 퀴즈 */}
            {currentView === 'quiz' && !showCountdown && currentPlayer && (currentPlayer.health || 100) > 0 && (
              <div className="space-y-4">
                {hasSnowball && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500 text-white p-4 rounded-xl text-center font-bold text-lg border-2 border-green-300"
                  >
                    ❄️ 눈뭉치 장전 완료! 아래 플레이어를 클릭하여 공격하세요!
                  </motion.div>
                )}

                {currentQuestion ? (
                  <QuizView
                    question={currentQuestion}
                    onAnswer={handleAnswerSubmit}
                    timeLimit={30}
                  />
                ) : (
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 text-center">
                    <p className="text-gray-800">문제를 불러오는 중...</p>
                  </div>
                )}

                {/* 배틀 아레나 */}
                <BattleArena
                  players={players as Player[]}
                  currentPlayerId={playerId}
                  attackResult={attackResult}
                  onPlayerClick={handlePlayerAttack}
                  canAttack={hasSnowball}
                />
              </div>
            )}

            {/* 공격 화면 */}
            {currentView === 'attack' && attackResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-blue-900 to-cyan-900 rounded-xl p-8 shadow-2xl text-center border-4 border-blue-400"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl mb-4"
                >
                  {attackResult.isCritical ? '💥' : '❄️'}
                </motion.div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  {attackResult.isCritical ? '크리티컬 히트!' : '눈뭉치 명중!'}
                </h2>
                <p className="text-2xl text-blue-200 mb-4">
                  {attackResult.damage}°C 감소!
                </p>
                {attackResult.itemType === 'giant_ball' && (
                  <p className="text-xl text-yellow-300 mb-2">
                    🎯 왕눈덩이 효과!
                  </p>
                )}
                <p className="text-white/80">
                  다음 문제로 이동합니다...
                </p>
              </motion.div>
            )}

            {/* 오답 화면 */}
            {currentView === 'wrong' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-blue-900 rounded-xl p-8 shadow-lg text-center border-4 border-blue-600"
              >
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-3xl font-bold text-white mb-2">틀렸습니다!</h2>
                <p className="text-blue-200">눈뭉치를 던질 수 없습니다.</p>
              </motion.div>
            )}

            {/* 결과 화면 */}
            {currentView === 'result' && (
              <GameResult
                players={players}
                currentPlayerId={playerId}
                gameMode="battle_royale"
              />
            )}
          </div>
        </div>
      </ScreenShake>
    </main>
  )
}
