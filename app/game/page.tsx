'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { usePlayersRealtime } from '@/hooks/usePlayersRealtime'
import { useRoomRealtime } from '@/hooks/useRoomRealtime'
import { useAudioContext } from '@/components/AudioProvider'
import QuizView from '@/components/QuizView'
import ChestView from '@/components/ChestView'
import GameResult from '@/components/GameResult'
import Countdown from '@/components/Countdown'
import AnimatedBackground from '@/components/AnimatedBackground'
import { generateBoxEvent, applyBoxEvent, type BoxEvent } from '@/lib/game/goldQuest'
import PlayerSelector from '@/components/PlayerSelector'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row']

// 더미 문제 데이터
// 더미 데이터 제거
type Question = {
  id: string
  type: 'CHOICE' | 'SHORT' | 'OX' | 'BLANK'
  question_text: string
  options: string[]
  answer: string
}

type GameView = 'lobby' | 'countdown' | 'quiz' | 'chest' | 'playerSelect' | 'wrong' | 'result'

export default function GamePage() {
  const [roomCode, setRoomCode] = useState('')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<GameView>('lobby')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isCorrect, setIsCorrect] = useState(false)
  const [selectedChest, setSelectedChest] = useState<number | null>(null)
  const [boxEvent, setBoxEvent] = useState<BoxEvent | null>(null)
  const [isProcessingReward, setIsProcessingReward] = useState(false)
  const [showCountdown, setShowCountdown] = useState(false)
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0) // 연속 정답 카운트
  const [hasShield, setHasShield] = useState(false) // 방어권 보유 여부
  const [pendingEvent, setPendingEvent] = useState<BoxEvent | null>(null) // 플레이어 선택 대기 중인 이벤트

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

    // gold_quest가 아니면 올바른 페이지로 리다이렉트
    if (gameMode !== 'gold_quest') {
      const gameUrl = gameMode === 'racing'
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
                  : gameMode === 'pool'
                    ? `/pool?room=${roomCode}&playerId=${playerId}`
                    : `/game?room=${roomCode}&playerId=${playerId}`

      if (gameUrl !== window.location.pathname + window.location.search) {
        window.location.href = gameUrl
      }
    }
  }, [room, roomLoading, roomCode, playerId])

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

        // options가 JSONB로 오므로 string[]으로 변환 처리 필요할 수 있음
        // 지금은 그대로 사용
        setQuestions(data as Question[])
      } catch (error) {
        console.error('Error fetching questions:', error)
      }
    }

    fetchQuestions()
  }, [room?.set_id])

  // 현재 플레이어 정보
  const currentPlayer = players.find((p) => p.id === playerId) || null
  const currentQuestion = questions.length > 0 ? questions[currentQuestionIndex % questions.length] : null

  // 문제가 끝나면 게임 종료
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex >= questions.length && currentView === 'quiz') {
      // 모든 문제를 풀었으면 게임 종료
      if (room && room.status !== 'finished') {
        ; (async () => {
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
  }, [currentQuestionIndex, currentView, room, roomCode, questions.length])

  // 게임 상태에 따른 화면 전환 및 BGM 재생 (게임 시작 후에만)
  useEffect(() => {
    if (!room) return

    if (room.status === 'playing') {
      // 게임이 시작되면 로비에서 카운트다운으로 이동
      if (currentView === 'lobby' && !showCountdown) {
        setShowCountdown(true)
      }
    } else if (room.status === 'waiting') {
      if (currentView !== 'lobby') {
        setCurrentView('lobby')
        setShowCountdown(false)
        // waiting 상태에서는 소리 재생하지 않음
      }
    } else if (room.status === 'finished') {
      if (currentView !== 'result') {
        setCurrentView('result')
        // 게임 종료 시 결과 BGM 재생
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
    if (!currentQuestion) return
    const correct = answer === currentQuestion.answer
    setIsCorrect(correct)

    // 사운드 효과
    if (correct) {
      playSFX('correct')
      // 정답 파티클 효과 제거

      // 연속 정답 카운트 증가
      const newConsecutive = consecutiveCorrect + 1
      setConsecutiveCorrect(newConsecutive)

      // 연속 3정답 시 방어권 획득
      if (newConsecutive >= 3 && !hasShield) {
        setHasShield(true)
        playSFX('item')
      }

      // 정답: 상자 선택 화면으로
      setTimeout(() => {
        setCurrentView('chest')
        setSelectedChest(null)
        setBoxEvent(null)
        setIsProcessingReward(false) // 상자 선택 화면으로 갈 때 초기화
      }, 1500)
    } else {
      // 오답 시 연속 정답 카운트 리셋
      setConsecutiveCorrect(0)
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
    if (isProcessingReward || !playerId) return

    setIsProcessingReward(true)
    setSelectedChest(chestIndex)

    try {
      // 현재 플레이어 데이터를 데이터베이스에서 직접 가져오기
      const { data: freshPlayerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()

      if (playerError || !freshPlayerData) {
        console.error('플레이어 데이터 로드 실패:', playerError)
        setIsProcessingReward(false)
        return
      }

      const freshPlayer = freshPlayerData as Player

      playSFX('click')

      // 해적 컨셉 보상 생성
      const event = generateBoxEvent(freshPlayer.gold, players, playerId, false)
      setBoxEvent(event)

      // 긍정 효과 사운드
      if (event.type === 'GOLD_STACK' || event.type === 'JESTER' || event.type === 'UNICORN') {
        playSFX('item')
      }

      // 방어권이 있고 부정 효과인 경우 방어권 사용
      const isNegativeEvent = event.type === 'SLIME_MONSTER' ||
        event.type === 'DRAGON' ||
        event.type === 'ELF' ||
        event.type === 'WIZARD' ||
        event.type === 'KING'

      if (hasShield && isNegativeEvent) {
        setHasShield(false)
        playSFX('item')
        // 방어권으로 막힌 이벤트는 NOTHING으로 변경
        const blockedEvent: BoxEvent = {
          type: 'FAIRY',
          message: '방어권이 보호했다! 🛡️',
          itemName: '방어권',
          icon: '🛡️',
        }
        setBoxEvent(blockedEvent)

        setTimeout(() => {
          setCurrentView('quiz')
          setSelectedChest(null)
          setBoxEvent(null)
          setSelectedAnswer('')
          setIsCorrect(false)
          setCurrentQuestionIndex((prev) => prev + 1)
          setIsProcessingReward(false)
        }, 3000)
        return
      }

      // King (Swap), Elf, Wizard는 플레이어 선택 필요
      if (event.type === 'KING' || event.type === 'ELF' || event.type === 'WIZARD') {
        setPendingEvent(event)
        setCurrentView('playerSelect')
        setIsProcessingReward(false)
        return
      }

      // 일반 이벤트 처리
      const targetPlayer = event.targetPlayerId
        ? players.find((p) => p.id === event.targetPlayerId) || null
        : null

      await applyBoxEvent(event, playerId, freshPlayer, targetPlayer, supabase)

      // 3초  다음 문제로
      setTimeout(() => {
        setCurrentView('quiz')
        setSelectedChest(null)
        setBoxEvent(null)
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

  // 플레이어 선택 처리 (King/Elf/Wizard)
  const handlePlayerSelect = async (targetPlayerId: string) => {
    if (!pendingEvent || !playerId) return

    playSFX('click')
    setIsProcessingReward(true)

    try {
      // 현재 플레이어 데이터를 데이터베이스에서 직접 가져오기
      const { data: freshPlayerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()

      if (playerError || !freshPlayerData) {
        console.error('플레이어 데이터 로드 실패:', playerError)
        setIsProcessingReward(false)
        return
      }

      const freshPlayer = freshPlayerData as Player

      const targetPlayer = players.find((p) => p.id === targetPlayerId) || null
      if (!targetPlayer) {
        setIsProcessingReward(false)
        return
      }

      // 이벤트에 선택한 플레이어 ID와 값 설정
      const event: BoxEvent = {
        ...pendingEvent,
        targetPlayerId,
      }

      // Elf와 Wizard의 경우 훔칠 골드 양 계산
      if (pendingEvent.type === 'ELF' && targetPlayer.gold > 0) {
        event.value = Math.floor(targetPlayer.gold * 0.1)
        event.message = `엘프가 ${targetPlayer.nickname}님의 골드 10%를 훔쳤다! +${event.value} 골드 🧝`
      } else if (pendingEvent.type === 'WIZARD' && targetPlayer.gold > 0) {
        event.value = Math.floor(targetPlayer.gold * 0.25)
        event.message = `마법사가 ${targetPlayer.nickname}님의 골드 25%를 훔쳤다! +${event.value} 골드 🧙`
      } else if (pendingEvent.type === 'KING') {
        event.message = `왕이 ${targetPlayer.nickname}님과 골드를 교환했다! 👑`
      }

      await applyBoxEvent(event, playerId, freshPlayer, targetPlayer, supabase)

      // 이벤트 메시지 업데이트
      setBoxEvent(event)

      // 3초 후 다음 문제로
      setTimeout(() => {
        setCurrentView('quiz')
        setSelectedChest(null)
        setBoxEvent(null)
        setPendingEvent(null)
        setSelectedAnswer('')
        setIsCorrect(false)
        setCurrentQuestionIndex((prev) => prev + 1)
        setIsProcessingReward(false)
      }, 3000)
    } catch (error) {
      console.error('Error applying event:', error)
      setIsProcessingReward(false)
    }
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
        {/* 헤더 - Gold Quest 테마 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 rounded-xl shadow-2xl p-4 mb-6 border-4 border-yellow-400 relative overflow-hidden"
        >
          {/* 골드 배경 패턴 */}
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
            }} />
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl"
              >
                💰
              </motion.div>
              <div>
                <Image
                  src="/gold-quest.png"
                  alt="Gold Quest"
                  width={200}
                  height={40}
                  className="h-8 w-auto"
                />
                <p className="text-sm text-yellow-100">방 코드: {roomCode}</p>
              </div>
            </div>
            {currentPlayer && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-right bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
              >
                <div className="flex items-center gap-2 justify-end mb-1">
                  <div className="text-lg font-bold text-white">{currentPlayer.nickname}</div>
                  {hasShield && (
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-xl"
                      title="방어권 보유 중"
                    >
                      🛡️
                    </motion.span>
                  )}
                </div>
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
              className="bg-white rounded-xl shadow-2xl p-12 text-center border-2 border-gray-200"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="inline-block mb-6"
              >
                <div className="text-6xl">🎮</div>
              </motion.div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
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
              key={currentQuestionIndex} // 문제가 바뀔 때마다 컴포넌트 재마운트
              onChestSelect={handleChestSelect}
              selectedChest={selectedChest}
              reward={boxEvent}
              isProcessing={isProcessingReward}
            />
          )}

          {currentView === 'playerSelect' && pendingEvent && (
            <PlayerSelector
              players={players.filter((p) => {
                // King은 모든 플레이어, Elf/Wizard는 골드가 있는 플레이어만
                if (pendingEvent.type === 'KING') return true
                return p.gold > 0
              })}
              currentPlayerId={playerId || ''}
              onSelect={handlePlayerSelect}
              title={
                pendingEvent.type === 'KING'
                  ? '골드 교환'
                  : pendingEvent.type === 'ELF'
                    ? '골드 훔치기 (10%)'
                    : '골드 훔치기 (25%)'
              }
              description={
                pendingEvent.type === 'KING'
                  ? '누구와 골드를 교환할까요?'
                  : pendingEvent.type === 'ELF'
                    ? '누구에게서 골드 10%를 훔칠까요?'
                    : '누구에게서 골드 25%를 훔칠까요?'
              }
              icon={pendingEvent.icon || '⚔️'}
            />
          )}

          {currentView === 'wrong' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-red-50 rounded-xl shadow-2xl p-12 text-center border-2 border-red-300"
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
          <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-lg shadow-lg p-6 border-2 border-yellow-300">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">💰 골드 순위</h2>
            <div className="space-y-2">
              {players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => {
                  const isTopPlayer = index === 0
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 ${player.id === playerId
                        ? 'bg-indigo-50 border-indigo-500'
                        : isTopPlayer
                          ? 'bg-red-100 border-red-500'
                          : 'bg-white border-amber-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                        <span className="text-2xl">{player.avatar || '🏴‍☠️'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{player.nickname}</span>
                            {isTopPlayer && (
                              <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="text-lg"
                                title="현상수배!"
                              >
                                🎯
                              </motion.span>
                            )}
                          </div>
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
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
