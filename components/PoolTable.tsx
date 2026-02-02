'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { BallPosition, ShotPower, PoolItemEffect } from '@/lib/game/pool'
import { HOLES } from '@/lib/game/pool'

interface PoolTableProps {
  ballPosition: BallPosition
  onShot: (shotPower: ShotPower) => void
  canShoot: boolean
  activeEffects?: PoolItemEffect[]
  isBlinded?: boolean
  isShaking?: boolean
  showGuideLine?: boolean
  onBallStop?: () => void
}

export default function PoolTable({
  ballPosition,
  onShot,
  canShoot,
  activeEffects = [],
  isBlinded = false,
  isShaking = false,
  showGuideLine = false,
  onBallStop,
}: PoolTableProps) {
  const [aiming, setAiming] = useState(false)
  const [aimAngle, setAimAngle] = useState(0)
  const [aimPower, setAimPower] = useState(0.5)
  const [isMoving, setIsMoving] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

  // 공이 움직이는지 확인
  useEffect(() => {
    const isBallMoving = Math.abs(ballPosition.vx) > 0.001 || Math.abs(ballPosition.vy) > 0.001
    setIsMoving(isBallMoving)
    
    if (!isBallMoving && isMoving && onBallStop) {
      onBallStop()
    }
  }, [ballPosition.vx, ballPosition.vy, isMoving, onBallStop])

  // 마우스/터치로 조준
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canShoot || isMoving) return
    setAiming(true)
    updateAimAngle(e)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!aiming) return
    updateAimAngle(e)
  }

  const handleMouseUp = () => {
    if (!aiming) return
    setAiming(false)
    
    if (canShoot && !isMoving) {
      onShot({ angle: aimAngle, power: aimPower })
    }
  }

  const updateAimAngle = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const dx = mouseX - centerX
    const dy = mouseY - centerY
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI
    
    setAimAngle(angle)
    
    // 거리에 따라 파워 조절 (중앙에서 멀수록 강함)
    const distance = Math.sqrt(dx * dx + dy * dy)
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)
    setAimPower(Math.min(1, distance / maxDistance))
  }

  // 캔버스에 그리기
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 테이블 배경 (초록색)
      ctx.fillStyle = '#1a5f1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 테이블 가장자리
      ctx.strokeStyle = '#8b4513'
      ctx.lineWidth = 20
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

      // 구멍 그리기
      HOLES.forEach((hole) => {
        const x = hole.x * canvas.width
        const y = hole.y * canvas.height
        const radius = 20

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = '#000'
        ctx.fill()
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 2
        ctx.stroke()
      })

      // 가이드 라인 (아이템 효과)
      if (showGuideLine && aiming && !isMoving) {
        const startX = ballPosition.x * canvas.width
        const startY = ballPosition.y * canvas.height
        const radians = (aimAngle * Math.PI) / 180
        const length = 200
        const endX = startX + Math.cos(radians) * length
        const endY = startY + Math.sin(radians) * length

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // 조준선 (조준 중일 때)
      if (aiming && !isMoving) {
        const startX = ballPosition.x * canvas.width
        const startY = ballPosition.y * canvas.height
        const radians = (aimAngle * Math.PI) / 180
        const length = 150 * aimPower
        const endX = startX + Math.cos(radians) * length
        const endY = startY + Math.sin(radians) * length

        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.lineWidth = 2
        ctx.stroke()

        // 파워 표시
        ctx.fillStyle = `rgba(255, ${255 - aimPower * 255}, 0, 0.8)`
        ctx.beginPath()
        ctx.arc(endX, endY, 5, 0, Math.PI * 2)
        ctx.fill()
      }

      // 공 그리기
      const ballX = ballPosition.x * canvas.width
      const ballY = ballPosition.y * canvas.height
      const ballRadius = 15

      ctx.beginPath()
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.stroke()

      // 공 번호 (1번 공)
      ctx.fillStyle = '#000'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('1', ballX, ballY)
    }

    draw()
    animationFrameRef.current = requestAnimationFrame(draw)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [ballPosition, aiming, aimAngle, aimPower, showGuideLine, isMoving])

  return (
    <motion.div
      className="relative bg-green-800 rounded-lg border-8 border-amber-800 shadow-2xl"
      style={{
        width: '100%',
        maxWidth: '800px',
        aspectRatio: '2 / 1',
        transform: isShaking ? 'translate(2px, 2px)' : 'translate(0, 0)',
      }}
      animate={isShaking ? {
        x: [0, 2, -2, 2, -2, 0],
        y: [0, -2, 2, -2, 2, 0],
      } : {}}
      transition={{ duration: 0.1, repeat: isShaking ? Infinity : 0 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full h-full rounded"
      />
      
      {/* 화면 가리기 효과 */}
      {isBlinded && (
        <div className="absolute inset-0 bg-black/50 rounded pointer-events-none" />
      )}

      {/* 조준 불가 표시 */}
      {!canShoot && !isMoving && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded pointer-events-none">
          <div className="bg-white/90 px-6 py-3 rounded-lg shadow-lg">
            <p className="text-lg font-bold text-gray-800">
              퀴즈를 풀고 정답을 맞추면 공을 칠 수 있습니다!
            </p>
          </div>
        </div>
      )}

      {/* 공이 움직이는 중 표시 */}
      {isMoving && (
        <div className="absolute top-4 left-4 bg-yellow-500/90 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-bold text-white">공이 움직이는 중...</p>
        </div>
      )}
    </motion.div>
  )
}
