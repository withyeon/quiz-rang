'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import QuizView from './QuizView'
type Question = {
    id: string
    type: 'CHOICE' | 'SHORT' | 'OX' | 'BLANK'
    question_text: string
    options: string[]
    answer: string
}
import {
    type DLDPlayer,
    type Platform,
    type GameSettings,
    PHYSICS,
    ENERGY,
    PLAYER_SIZE,
    METERS_PER_PIXEL,
    updatePlayerPhysics,
    movePlayer,
    jumpPlayer,
    giveEnergy,
    isPlayerAtPeak,
    generatePlatformMap,
} from '@/lib/game/dontlookdown'

interface DontLookDownGameProps {
    playerId: string
    playerName: string
    characterImage: string
    players: DLDPlayer[]
    platforms: Platform[]
    settings: GameSettings
    onUpdatePlayer: (player: DLDPlayer) => void
    currentQuestion: Question | null
    onAnswerQuestion: (answer: string) => void
}

export default function DontLookDownGame({
    playerId,
    playerName,
    characterImage,
    players,
    platforms,
    settings,
    onUpdatePlayer,
    currentQuestion,
    onAnswerQuestion,
}: DontLookDownGameProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [localPlayer, setLocalPlayer] = useState<DLDPlayer | null>(null)
    const [showQuiz, setShowQuiz] = useState(false)
    const [cameraY, setCameraY] = useState(0)
    const [keys, setKeys] = useState<Set<string>>(new Set())

    const gameLoopRef = useRef<number>()
    const lastTimeRef = useRef<number>(Date.now())

    // 현재 플레이어 찾기
    useEffect(() => {
        const player = players.find(p => p.id === playerId)
        if (player) {
            setLocalPlayer(player)
        }
    }, [players, playerId])

    // 키보드 입력
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            setKeys(prev => new Set(prev).add(e.key.toLowerCase()))

            // Space나 W로 퀴즈 모달 열기
            if ((e.key === ' ' || e.key.toLowerCase() === 'w') && !showQuiz) {
                e.preventDefault()
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            setKeys(prev => {
                const newSet = new Set(prev)
                newSet.delete(e.key.toLowerCase())
                return newSet
            })
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [showQuiz])

    // 게임 루프
    useEffect(() => {
        if (!localPlayer) return

        const gameLoop = () => {
            const now = Date.now()
            const deltaTime = Math.min((now - lastTimeRef.current) / 16, 2) // 최대 2배속
            lastTimeRef.current = now

            let updatedPlayer = { ...localPlayer }

            // 키 입력 처리
            const isMovingLeft = keys.has('a') || keys.has('arrowleft')
            const isMovingRight = keys.has('d') || keys.has('arrowright')
            const isJumping = keys.has(' ') || keys.has('w') || keys.has('arrowup')
            const isRunning = keys.has('shift')

            // 이동
            if (isMovingLeft && !isMovingRight) {
                updatedPlayer = movePlayer(updatedPlayer, 'left', isRunning)
            } else if (isMovingRight && !isMovingLeft) {
                updatedPlayer = movePlayer(updatedPlayer, 'right', isRunning)
            }

            // 점프
            if (isJumping) {
                if (updatedPlayer.isOnGround) {
                    updatedPlayer = jumpPlayer(updatedPlayer, false)
                } else if (updatedPlayer.canDoubleJump) {
                    updatedPlayer = jumpPlayer(updatedPlayer, true)
                }
            }

            // 물리 업데이트
            updatedPlayer = updatePlayerPhysics(updatedPlayer, platforms, deltaTime)

            // 정상 도달 체크
            if (isPlayerAtPeak(updatedPlayer, platforms)) {
                // 승리!
            }

            setLocalPlayer(updatedPlayer)
            onUpdatePlayer(updatedPlayer)

            // 카메라 업데이트 (플레이어 따라가기)
            setCameraY(updatedPlayer.y - 300) // 플레이어를 화면 중앙에

            gameLoopRef.current = requestAnimationFrame(gameLoop)
        }

        gameLoopRef.current = requestAnimationFrame(gameLoop)

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current)
            }
        }
    }, [localPlayer, platforms, keys, onUpdatePlayer])

    // Canvas 렌더링
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // 캔버스 크기 설정
        canvas.width = 800
        canvas.height = 600

        // 배경 (하늘)
        const gradient = ctx.createLinearGradient(0, 0, 0, 600)
        gradient.addColorStop(0, '#87CEEB')
        gradient.addColorStop(1, '#E0F6FF')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 800, 600)

        // 카메라 변환
        ctx.save()
        ctx.translate(0, -cameraY)

        // 플랫폼 그리기
        platforms.forEach(platform => {
            if (platform.type === 'peak') {
                ctx.fillStyle = '#FFD700' // 금색
            } else if (platform.type === 'start') {
                ctx.fillStyle = '#654321' // 갈색
            } else if (platform.type === 'checkpoint') {
                ctx.fillStyle = '#00FF00' // 초록색 (체크포인트)
            } else {
                ctx.fillStyle = '#808080' // 회색
            }

            ctx.fillRect(platform.x, platform.y, platform.width, platform.height)

            // 플랫폼 테두리
            ctx.strokeStyle = '#000000'
            ctx.lineWidth = 2
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height)

            // 체크포인트 표시
            if (platform.type === 'checkpoint') {
                ctx.fillStyle = '#FFFFFF'
                ctx.font = 'bold 12px Arial'
                ctx.textAlign = 'center'
                ctx.fillText('💾', platform.x + platform.width / 2, platform.y + 18)
            }
        })

        // 다른 플레이어들 그리기
        players.forEach(player => {
            if (player.id === playerId) return // 자신은 나중에 그림

            // 플레이어 위치에 이미지 렌더링 준비 (Canvas에서는 Image 객체 사용)
            // 간단한 표시로 대체 (실제 이미지는 React 레이어에서 처리)
            ctx.fillStyle = 'rgba(100, 100, 255, 0.3)'
            ctx.fillRect(player.x, player.y, PLAYER_SIZE.WIDTH, PLAYER_SIZE.HEIGHT)

            // 닉네임
            ctx.fillStyle = '#000'
            ctx.font = 'bold 12px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(player.nickname, player.x + PLAYER_SIZE.WIDTH / 2, player.y - 5)
        })

        ctx.restore()
    }, [players, platforms, localPlayer, cameraY, playerId])

    // 퀴즈 정답 처리
    const handleAnswer = (answer: string) => {
        onAnswerQuestion(answer)

        // 정답이면 에너지 부여 (서버에서 처리하지만 즉시 반영)
        if (localPlayer && currentQuestion && answer === currentQuestion.answer) {
            const updatedPlayer = giveEnergy(localPlayer, settings.energyPerQuestion)
            setLocalPlayer(updatedPlayer)
        }

        setShowQuiz(false)
    }

    if (!localPlayer) {
        return <div>Loading...</div>
    }

    return (
        <div className="relative w-full h-full">
            {/* 게임 캔버스 */}
            <canvas
                ref={canvasRef}
                className="w-full h-full bg-gradient-to-b from-sky-400 to-sky-200"
            />

            {/* 캐릭터 이미지 레이어 (Canvas 위에 절대 위치) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* 다른 플레이어들 */}
                {players.map(player => {
                    if (player.id === playerId) return null

                    const screenY = player.y - cameraY

                    // 화면 밖이면 렌더링 안 함
                    if (screenY < -100 || screenY > 700) return null

                    return (
                        <div
                            key={player.id}
                            className="absolute transition-all duration-100"
                            style={{
                                left: `${(player.x / 800) * 100}%`,
                                top: `${(screenY / 600) * 100}%`,
                                width: `${(PLAYER_SIZE.WIDTH / 800) * 100}%`,
                                height: `${(PLAYER_SIZE.HEIGHT / 600) * 100}%`,
                                transform: player.facingRight ? 'scaleX(1)' : 'scaleX(-1)',
                            }}
                        >
                            <Image
                                src={player.avatar}
                                alt={player.nickname}
                                fill
                                className="object-contain drop-shadow-lg"
                                sizes="40px"
                            />
                            {/* 닉네임 */}
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                <span className="bg-black/50 text-white text-xs px-2 py-1 rounded font-bold">
                                    {player.nickname}
                                </span>
                            </div>
                        </div>
                    )
                })}

                {/* 로컬 플레이어 */}
                {localPlayer && (
                    <div
                        className="absolute transition-all duration-75"
                        style={{
                            left: `${(localPlayer.x / 800) * 100}%`,
                            top: `${((localPlayer.y - cameraY) / 600) * 100}%`,
                            width: `${(PLAYER_SIZE.WIDTH / 800) * 100}%`,
                            height: `${(PLAYER_SIZE.HEIGHT / 600) * 100}%`,
                            transform: localPlayer.facingRight ? 'scaleX(1)' : 'scaleX(-1)',
                        }}
                    >
                        <Image
                            src={characterImage}
                            alt={playerName}
                            fill
                            className="object-contain drop-shadow-2xl"
                            sizes="40px"
                            priority
                        />
                    </div>
                )}
            </div>

            {/* UI 오버레이 */}
            <div className="absolute inset-0 pointer-events-none">
                {/* 높이 표시 */}
                <div className="absolute top-4 left-4 bg-white/90 rounded-lg px-4 py-2 pointer-events-auto">
                    <div className="text-sm font-semibold text-gray-600">Height</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {Math.floor(localPlayer.height)}m
                    </div>
                </div>

                {/* 에너지 표시 */}
                <div className="absolute top-4 right-4 bg-white/90 rounded-lg px-4 py-2">
                    <div className="text-sm font-semibold text-gray-600">Energy</div>
                    <div className="text-2xl font-bold text-yellow-600">
                        ⚡ {Math.floor(localPlayer.energy)}
                    </div>
                </div>

                {/* Answer Questions 버튼 */}
                <motion.button
                    onClick={() => setShowQuiz(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute bottom-4 left-4 bg-purple-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg pointer-events-auto"
                >
                    Answer Questions
                </motion.button>

                {/* 조작 안내 */}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
                    <div>⬅️➡️ Move | ⬆️ Jump | Shift: Run</div>
                    <div>Space: Double Jump</div>
                </div>
            </div>

            {/* 퀴즈 모달 */}
            <AnimatePresence>
                {showQuiz && currentQuestion && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="max-w-2xl w-full"
                        >
                            <QuizView
                                question={currentQuestion}
                                onAnswer={handleAnswer}
                                timeLimit={30}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
