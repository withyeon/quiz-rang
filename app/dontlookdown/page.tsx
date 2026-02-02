'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { usePlayersRealtime } from '@/hooks/usePlayersRealtime'
import { useRoomRealtime } from '@/hooks/useRoomRealtime'
import { useAudioContext } from '@/components/AudioProvider'
import DontLookDownGame from '@/components/DontLookDownGame'
import GameResult from '@/components/GameResult'
import Countdown from '@/components/Countdown'
import AnimatedBackground from '@/components/AnimatedBackground'
import Leaderboard from '@/components/Leaderboard'
import {
    type DLDPlayer,
    type Platform,
    type GameSettings,
    DEFAULT_SETTINGS,
    createPlayer,
    generatePlatformMap,
    checkWinner,
    getLeaderboard,
} from '@/lib/game/dontlookdown'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row']

type Question = {
    id: string
    type: 'CHOICE' | 'SHORT' | 'OX' | 'BLANK'
    question_text: string
    options: string[]
    answer: string
}

type DLDView = 'lobby' | 'countdown' | 'game' | 'result'

export default function DontLookDownPage() {
    const [roomCode, setRoomCode] = useState('')
    const [playerId, setPlayerId] = useState<string | null>(null)
    const [currentView, setCurrentView] = useState<DLDView>('lobby')
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [questions, setQuestions] = useState<Question[]>([])
    const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
    const [platforms, setPlatforms] = useState<Platform[]>([])
    const [dldPlayers, setDldPlayers] = useState<Map<string, DLDPlayer>>(new Map())
    const [winner, setWinner] = useState<string | null>(null)
    const [gameStartTime, setGameStartTime] = useState<number>(0)

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

        if ((gameMode as string) !== 'dontlookdown') {
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
                                    : gameMode === 'pool'
                                        ? `/pool?room=${roomCode}&playerId=${playerId}`
                                        : `/game?room=${roomCode}&playerId=${playerId}`

            window.location.href = gameUrl
        }
    }, [room, roomLoading, roomCode, playerId])

    // 퀴즈 세트 로드
    useEffect(() => {
        if (!room?.set_id) return

        const loadQuestions = async () => {
            const { data, error } = await (supabase
                .from('questions')
                .select('*')
                .eq('set_id', room.set_id || '') as any)
                .order('created_at')

            if (error) {
                console.error('Error loading questions:', error)
                return
            }

            if (data) {
                setQuestions(data.map((q: any) => ({
                    id: q.id,
                    type: (q.type as any) || 'CHOICE',
                    question_text: q.question_text,
                    options: q.options || [],
                    answer: q.answer,
                })))
            }
        }

        loadQuestions()
    }, [room?.set_id])

    // 게임 시작
    useEffect(() => {
        if (room?.status === 'playing' && currentView === 'lobby') {
            setCurrentView('countdown')

            // 플랫폼 맵 생성
            const generatedPlatforms = generatePlatformMap(gameSettings.summitGoal)
            setPlatforms(generatedPlatforms)

            // 플레이어 초기화
            const initialPlayers = new Map<string, DLDPlayer>()
            players.forEach(player => {
                initialPlayers.set(
                    player.id,
                    createPlayer(player.id, player.nickname, player.avatar || '')
                )
            })
            setDldPlayers(initialPlayers)
            setGameStartTime(Date.now())
        }
    }, [room?.status, currentView, players, gameSettings])

    // 카운트다운 완료
    const handleCountdownComplete = () => {
        setCurrentView('game')
        playBGM('lobby')
    }

    // 플레이어 업데이트
    const handleUpdatePlayer = async (player: DLDPlayer) => {
        setDldPlayers(prev => {
            const updated = new Map(prev)
            updated.set(player.id, player)
            return updated
        })

        // 데이터베이스 업데이트
        const updateData = {
            score: Math.floor(player.height),
            gold: Math.floor(player.energy),
        }
        await ((supabase
            .from('players') as any)
            .update(updateData)
            .eq('id', player.id))

        // 승리 조건 체크
        const winnerId = checkWinner(dldPlayers, gameSettings.summitGoal)
        if (winnerId) {
            setWinner(winnerId)
            setCurrentView('result')

            // 방 상태 업데이트
            await ((supabase
                .from('rooms') as any)
                .update({ status: 'finished' })
                .eq('room_code', roomCode))
        }
    }

    // 퀴즈 정답 처리
    const handleAnswerQuestion = async (answer: string) => {
        if (!playerId || !questions[currentQuestionIndex]) return

        const currentQuestion = questions[currentQuestionIndex]
        const isCorrect = answer === currentQuestion.answer

        if (isCorrect) {
            playSFX('correct')

            // 에너지 부여는 컴포넌트에서 처리됨
        } else {
            playSFX('correct' as any)
        }

        // 다음 문제
        setCurrentQuestionIndex(prev => (prev + 1) % questions.length)
    }

    // 게임 시간 체크
    useEffect(() => {
        if (currentView !== 'game' || !gameStartTime) return

        const interval = setInterval(() => {
            const elapsed = (Date.now() - gameStartTime) / 1000

            if (elapsed >= gameSettings.duration) {
                // 시간 종료 - 가장 높은 플레이어 승리
                const leaderboard = getLeaderboard(dldPlayers)
                if (leaderboard.length > 0) {
                    setWinner(leaderboard[0].id)
                    setCurrentView('result')

                        // 방 상태 업데이트
                        ; ((supabase
                            .from('rooms') as any)
                            .update({ status: 'finished' })
                            .eq('room_code', roomCode))
                }
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [currentView, gameStartTime, dldPlayers, gameSettings, roomCode])

    const currentPlayer = players.find(p => p.id === playerId)

    return (
        <main className="min-h-screen relative overflow-hidden">
            <AnimatedBackground />

            <AnimatePresence mode="wait">
                {/* 로비 대기 */}
                {currentView === 'lobby' && (
                    <motion.div
                        key="lobby"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center min-h-screen p-8"
                    >
                        <div className="text-center max-w-2xl">
                            <h1 className="text-6xl font-bold text-white mb-8 drop-shadow-lg font-bitbit">
                                ⛰️ Don't Look Down
                            </h1>
                            <div className="bg-white/90 rounded-2xl p-8 mb-8">
                                <p className="text-2xl font-bold text-gray-800 mb-4">
                                    정상까지 먼저 올라가세요!
                                </p>
                                <p className="text-gray-600">
                                    퀴즈를 풀어 에너지를 얻고, 플랫폼을 점프하며 올라가세요
                                </p>
                            </div>
                            <Leaderboard players={players} />
                        </div>
                    </motion.div>
                )}

                {/* 카운트다운 */}
                {currentView === 'countdown' && (
                    <Countdown onComplete={handleCountdownComplete} />
                )}

                {/* 게임 플레이 */}
                {currentView === 'game' && playerId && currentPlayer && (
                    <motion.div
                        key="game"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-screen"
                    >
                        <DontLookDownGame
                            playerId={playerId}
                            playerName={currentPlayer.nickname}
                            characterImage={currentPlayer.avatar || ''}
                            players={Array.from(dldPlayers.values())}
                            platforms={platforms}
                            settings={gameSettings}
                            onUpdatePlayer={handleUpdatePlayer}
                            currentQuestion={questions[currentQuestionIndex] || null}
                            onAnswerQuestion={handleAnswerQuestion}
                        />
                    </motion.div>
                )}

                {/* 결과 화면 */}
                {currentView === 'result' && (
                    <GameResult
                        players={players}
                        currentPlayerId={winner}
                    />
                )}
            </AnimatePresence>
        </main>
    )
}
