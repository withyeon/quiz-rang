'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Tower,
    Enemy,
    Projectile,
    PATH_POINTS,
    MAP_WIDTH,
    MAP_HEIGHT,
    TOWER_TYPES,
    ENEMY_TYPES,
    TowerTypeId,
    getTowerRange,
    getTowerDamage,
    canPlaceTower,
    getDistance,
    moveProjectile,
} from '@/lib/game/tower'

interface TowerDefenseMapProps {
    towers: Tower[]
    enemies: Enemy[]
    projectiles: Projectile[]
    selectedTowerType: TowerTypeId | null
    onPlaceTower: (x: number, y: number) => void
    onSelectTower: (tower: Tower | null) => void
    selectedTower: Tower | null
}

export default function TowerDefenseMap({
    towers,
    enemies,
    projectiles,
    selectedTowerType,
    onPlaceTower,
    onSelectTower,
    selectedTower,
}: TowerDefenseMapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null)
    const animationFrameRef = useRef<number>()
    const lastUpdateRef = useRef<number>(Date.now())
    const backgroundImageRef = useRef<HTMLImageElement | null>(null)
    
    // 이미지 로딩을 위한 refs
    const towerImagesRef = useRef<Record<TowerTypeId, HTMLImageElement | null>>({
        BASIC: null,
        MAGIC: null,
        BOMB: null,
        LASER: null,
        SLOW: null,
    })
    const enemyImagesRef = useRef<Record<string, HTMLImageElement | null>>({
        NORMAL: null,
        FAST: null,
        STRONG: null,
        BOSS: null,
    })
    const projectileImagesRef = useRef<Record<TowerTypeId, HTMLImageElement | null>>({
        BASIC: null,
        MAGIC: null,
        BOMB: null,
        LASER: null,
        SLOW: null,
    })
    const imagesLoadedRef = useRef(false)

    // 캔버스 클릭 처리
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // 타워 선택 모드인지 확인
        if (selectedTowerType) {
            // 타워 배치 가능한지 확인
            if (canPlaceTower(x, y, towers)) {
                onPlaceTower(x, y)
            }
        } else {
            // 기존 타워 선택
            const clickedTower = towers.find((tower) => {
                const distance = getDistance(x, y, tower.x, tower.y)
                return distance < 40 // 타워 크기가 커졌으므로 클릭 범위도 조정 (기존 30 -> 40)
            })
            onSelectTower(clickedTower || null)
        }
    }

    // 마우스 이동 처리
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return

        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        setHoveredPosition({ x, y })
    }

    const handleMouseLeave = () => {
        setHoveredPosition(null)
    }

    // 모든 이미지 로드
    useEffect(() => {
        let loadedCount = 0
        const totalImages = 1 + 5 + 4 + 5 // 배경 + 타워 + 적 + 발사체
        
        const checkAllLoaded = () => {
            loadedCount++
            if (loadedCount === totalImages) {
                imagesLoadedRef.current = true
            }
        }
        
        // 배경 이미지 로드
        const bgImg = new Image()
        bgImg.src = '/tower/ui/background.svg'
        bgImg.onload = () => {
            backgroundImageRef.current = bgImg
            checkAllLoaded()
        }
        bgImg.onerror = () => {
            console.warn('배경 이미지를 로드할 수 없습니다.')
            checkAllLoaded()
        }
        
        // 타워 이미지 로드
        const towerImagePaths: Record<TowerTypeId, string> = {
            BASIC: '/tower/basic.svg',
            MAGIC: '/tower/magic.svg',
            BOMB: '/tower/bomb.svg',
            LASER: '/tower/laser.svg',
            SLOW: '/tower/slow.svg',
        }
        
        Object.entries(towerImagePaths).forEach(([type, path]) => {
            const img = new Image()
            img.src = path
            img.onload = () => {
                towerImagesRef.current[type as TowerTypeId] = img
                checkAllLoaded()
            }
            img.onerror = () => {
                console.warn(`타워 이미지를 로드할 수 없습니다: ${path}`)
                checkAllLoaded()
            }
        })
        
        // 적 이미지 로드
        const enemyImagePaths: Record<string, string> = {
            NORMAL: '/tower/enemy/normal.svg',
            FAST: '/tower/enemy/fast.svg',
            STRONG: '/tower/enemy/strong.svg',
            BOSS: '/tower/enemy/boss.svg',
        }
        
        Object.entries(enemyImagePaths).forEach(([type, path]) => {
            const img = new Image()
            img.src = path
            img.onload = () => {
                enemyImagesRef.current[type] = img
                checkAllLoaded()
            }
            img.onerror = () => {
                console.warn(`적 이미지를 로드할 수 없습니다: ${path}`)
                checkAllLoaded()
            }
        })
        
        // 발사체 이미지 로드
        const projectileImagePaths: Record<TowerTypeId, string> = {
            BASIC: '/tower/projectile/arrow.svg',
            MAGIC: '/tower/projectile/magic_orb.svg',
            BOMB: '/tower/projectile/bomb.svg',
            LASER: '/tower/projectile/laser_beam.svg',
            SLOW: '/tower/projectile/ice_shard.svg',
        }
        
        Object.entries(projectileImagePaths).forEach(([type, path]) => {
            const img = new Image()
            img.src = path
            img.onload = () => {
                projectileImagesRef.current[type as TowerTypeId] = img
                checkAllLoaded()
            }
            img.onerror = () => {
                console.warn(`발사체 이미지를 로드할 수 없습니다: ${path}`)
                checkAllLoaded()
            }
        })
    }, [])

    // 게임 루프 및 렌더링
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const animate = () => {
            const now = Date.now()
            lastUpdateRef.current = now

            // 캔버스 클리어
            ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT)

            // 배경 그리기
            if (backgroundImageRef.current) {
                ctx.drawImage(backgroundImageRef.current, 0, 0, MAP_WIDTH, MAP_HEIGHT)
            } else {
                // 이미지가 로드되지 않았으면 기본 색상 사용
                ctx.fillStyle = '#f0f4f8'
                ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT)
            }

            // 타워 범위 그리기 (선택된 타워)
            if (selectedTower) {
                const range = getTowerRange(selectedTower.type, selectedTower.level)
                ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(selectedTower.x, selectedTower.y, range, 0, Math.PI * 2)
                ctx.fill()
                ctx.stroke()
            }

            // 타워 그리기
            towers.forEach((tower) => {
                const towerType = TOWER_TYPES[tower.type]
                const towerImage = towerImagesRef.current[tower.type]
                const size = 70 // 타워 크기를 크게 (기존 50 -> 70)
                const isSelected = selectedTower?.id === tower.id

                // 타워 베이스 (선택 시 강조)
                if (isSelected) {
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
                    ctx.beginPath()
                    ctx.arc(tower.x, tower.y, 40, 0, Math.PI * 2) // 강조 원 크기도 크게 (기존 30 -> 40)
                    ctx.fill()
                    
                    ctx.strokeStyle = '#60a5fa'
                    ctx.lineWidth = 3
                    ctx.stroke()
                }

                // 타워 이미지 그리기
                if (towerImage) {
                    ctx.save()
                    ctx.translate(tower.x, tower.y)
                    ctx.drawImage(towerImage, -size / 2, -size / 2, size, size)
                    ctx.restore()
                } else {
                    // 이미지가 로드되지 않았으면 이모지로 대체
                    ctx.font = 'bold 32px Suhgung12, sans-serif' // 서궁체 적용
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillStyle = '#1f2937'
                    ctx.fillText(towerType.emoji, tower.x, tower.y)
                }

                // 타워 레벨 표시
                if (tower.level > 1) {
                    ctx.fillStyle = '#fbbf24'
                    ctx.beginPath()
                    ctx.arc(tower.x + 25, tower.y - 25, 14, 0, Math.PI * 2) // 위치와 크기 조정 (기존 +18/-18, 12 -> +25/-25, 14)
                    ctx.fill()
                    ctx.fillStyle = 'white'
                    ctx.font = 'bold 12px Suhgung12, sans-serif' // 서궁체 적용
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillText(`${tower.level}`, tower.x + 25, tower.y - 25)
                }
            })

            // 적 그리기
            enemies.forEach((enemy) => {
                const enemyType = ENEMY_TYPES[enemy.type]
                const enemyImage = enemyImagesRef.current[enemy.type]
                // 적 크기를 더 크게 설정 (기존 36 -> 50)
                const size = 50

                // 적 이미지 그리기
                if (enemyImage) {
                    ctx.save()
                    ctx.translate(enemy.x, enemy.y)
                    // HP가 낮으면 빨간색 필터 적용
                    if (enemy.hp < enemy.maxHp * 0.3) {
                        ctx.globalAlpha = 0.7
                        ctx.filter = 'hue-rotate(0deg) saturate(1.5)'
                    }
                    ctx.drawImage(enemyImage, -size / 2, -size / 2, size, size)
                    ctx.restore()
                } else {
                    // 이미지가 로드되지 않았으면 이모지로 대체
                    ctx.fillStyle = enemy.hp < enemy.maxHp * 0.3 ? '#ef4444' : '#f97316'
                    ctx.beginPath()
                    ctx.arc(enemy.x, enemy.y, 25, 0, Math.PI * 2) // 반지름도 크게 (기존 18 -> 25)
                    ctx.fill()
                    
                    ctx.strokeStyle = '#991b1b'
                    ctx.lineWidth = 2
                    ctx.stroke()
                    
                    ctx.font = 'bold 24px Suhgung12, sans-serif' // 서궁체 적용
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillStyle = '#1f2937'
                    ctx.fillText(enemyType.emoji, enemy.x, enemy.y)
                }

                // HP 바
                const hpBarWidth = 40 // HP 바 너비도 크게 (기존 30 -> 40)
                const hpBarHeight = 5 // HP 바 높이도 약간 크게 (기존 4 -> 5)
                const hpRatio = enemy.hp / enemy.maxHp

                ctx.fillStyle = '#1f2937'
                ctx.fillRect(enemy.x - hpBarWidth / 2, enemy.y - 35, hpBarWidth, hpBarHeight) // 위치 조정 (기존 -25 -> -35)

                ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444'
                ctx.fillRect(enemy.x - hpBarWidth / 2, enemy.y - 35, hpBarWidth * hpRatio, hpBarHeight)
            })

            // 발사체 그리기
            projectiles.forEach((projectile) => {
                const projectileImage = projectileImagesRef.current[projectile.towerType]
                const size = 20
                
                if (projectile.towerType === 'LASER') {
                    // 레이저는 선으로 표시
                    const tower = towers.find((t) => t.id === projectile.towerId)
                    if (tower) {
                        if (projectileImage) {
                            // 레이저 이미지를 선을 따라 그리기
                            const dx = projectile.x - tower.x
                            const dy = projectile.y - tower.y
                            const distance = Math.sqrt(dx * dx + dy * dy)
                            const angle = Math.atan2(dy, dx)
                            
                            ctx.save()
                            ctx.translate(tower.x, tower.y)
                            ctx.rotate(angle)
                            ctx.drawImage(projectileImage, 0, -size / 2, distance, size)
                            ctx.restore()
                        } else {
                            // 이미지가 없으면 선으로 대체
                            ctx.strokeStyle = '#3b82f6'
                            ctx.lineWidth = 3
                            ctx.beginPath()
                            ctx.moveTo(tower.x, tower.y)
                            ctx.lineTo(projectile.x, projectile.y)
                            ctx.stroke()
                        }
                    }
                } else {
                    // 일반 발사체
                    if (projectileImage) {
                        ctx.save()
                        // 발사체 방향 계산
                        const dx = projectile.targetX - projectile.x
                        const dy = projectile.targetY - projectile.y
                        const angle = Math.atan2(dy, dx)
                        ctx.translate(projectile.x, projectile.y)
                        ctx.rotate(angle)
                        ctx.drawImage(projectileImage, -size / 2, -size / 2, size, size)
                        ctx.restore()
                    } else {
                        // 이미지가 없으면 원으로 대체
                        ctx.fillStyle = projectile.towerType === 'BOMB' ? '#ef4444' :
                            projectile.towerType === 'MAGIC' ? '#8b5cf6' :
                                projectile.towerType === 'SLOW' ? '#06b6d4' : '#fbbf24'
                        ctx.beginPath()
                        ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2)
                        ctx.fill()
                    }
                }
            })

            // 호버링 중인 위치에 타워 배치 미리보기
            if (hoveredPosition && selectedTowerType) {
                const canPlace = canPlaceTower(hoveredPosition.x, hoveredPosition.y, towers)
                const towerType = TOWER_TYPES[selectedTowerType]
                const range = getTowerRange(selectedTowerType, 1)

                // 범위 표시
                ctx.fillStyle = canPlace ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                ctx.strokeStyle = canPlace ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(hoveredPosition.x, hoveredPosition.y, range, 0, Math.PI * 2)
                ctx.fill()
                ctx.stroke()

                // 타워 미리보기
                const previewImage = towerImagesRef.current[selectedTowerType]
                const size = 70 // 미리보기 크기도 크게 (기존 50 -> 70)
                
                if (previewImage) {
                    ctx.save()
                    ctx.globalAlpha = canPlace ? 0.7 : 0.5
                    ctx.translate(hoveredPosition.x, hoveredPosition.y)
                    ctx.drawImage(previewImage, -size / 2, -size / 2, size, size)
                    ctx.restore()
                } else {
                    // 이미지가 없으면 원과 이모지로 대체
                    ctx.fillStyle = canPlace ? 'rgba(31, 41, 55, 0.7)' : 'rgba(239, 68, 68, 0.7)'
                    ctx.beginPath()
                    ctx.arc(hoveredPosition.x, hoveredPosition.y, 35, 0, Math.PI * 2) // 원 크기도 크게 (기존 25 -> 35)
                    ctx.fill()

                    ctx.font = 'bold 32px Suhgung12, sans-serif' // 서궁체 적용
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillText(towerType.emoji, hoveredPosition.x, hoveredPosition.y)
                }
            }

            animationFrameRef.current = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [towers, enemies, selectedTowerType, hoveredPosition, selectedTower, projectiles])

    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                width={MAP_WIDTH}
                height={MAP_HEIGHT}
                onClick={handleCanvasClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="border-4 border-gray-800 rounded-xl shadow-2xl cursor-crosshair bg-white"
            />

            {/* 범례 */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border-2 border-gray-300">
                <div className="text-xs font-bold text-gray-700 mb-2">범례</div>
                <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-500 rounded"></div>
                        <span className="text-gray-600">적 경로</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">시작점</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span className="text-gray-600">목표 지점</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
