// 타워 디펜스 게임 로직

// ==================== 타워 타입 ====================
export type TowerTypeId = 'BASIC' | 'MAGIC' | 'BOMB' | 'LASER' | 'SLOW'

export interface TowerType {
    id: TowerTypeId
    name: string
    emoji: string
    description: string
    cost: number
    damage: number
    range: number
    attackSpeed: number // attacks per second
    special?: string
}

export const TOWER_TYPES: Record<TowerTypeId, TowerType> = {
    BASIC: {
        id: 'BASIC',
        name: '기본 타워',
        emoji: '🏹',
        description: '저렴하고 안정적인 단일 대상 공격',
        cost: 100,
        damage: 10,
        range: 80,
        attackSpeed: 1, // 1 attack per second
    },
    MAGIC: {
        id: 'MAGIC',
        name: '마법 타워',
        emoji: '🔮',
        description: '범위 내 모든 적에게 데미지',
        cost: 200,
        damage: 8,
        range: 100,
        attackSpeed: 0.8,
        special: 'splash',
    },
    BOMB: {
        id: 'BOMB',
        name: '폭발 타워',
        emoji: '💣',
        description: '강력한 광역 폭발 데미지',
        cost: 300,
        damage: 25,
        range: 90,
        attackSpeed: 0.5,
        special: 'explosion',
    },
    LASER: {
        id: 'LASER',
        name: '레이저 타워',
        emoji: '⚡',
        description: '빠른 연사와 관통 공격',
        cost: 350,
        damage: 5,
        range: 120,
        attackSpeed: 3,
        special: 'pierce',
    },
    SLOW: {
        id: 'SLOW',
        name: '둔화 타워',
        emoji: '❄️',
        description: '적을 느리게 만듦',
        cost: 150,
        damage: 5,
        range: 100,
        attackSpeed: 1,
        special: 'slow',
    },
}

// ==================== 적 타입 ====================
export type EnemyTypeId = 'NORMAL' | 'FAST' | 'STRONG' | 'BOSS'

export interface EnemyType {
    id: EnemyTypeId
    name: string
    emoji: string
    hp: number
    speed: number // pixels per second
    goldReward: number
    description: string
}

export const ENEMY_TYPES: Record<EnemyTypeId, EnemyType> = {
    NORMAL: {
        id: 'NORMAL',
        name: '일반 적',
        emoji: '👾',
        hp: 50,
        speed: 50,
        goldReward: 10,
        description: '기본적인 적',
    },
    FAST: {
        id: 'FAST',
        name: '빠른 적',
        emoji: '🏃',
        hp: 30,
        speed: 100,
        goldReward: 15,
        description: '빠르지만 약한 적',
    },
    STRONG: {
        id: 'STRONG',
        name: '강한 적',
        emoji: '🛡️',
        hp: 150,
        speed: 30,
        goldReward: 30,
        description: '느리지만 강한 적',
    },
    BOSS: {
        id: 'BOSS',
        name: '보스',
        emoji: '👹',
        hp: 500,
        speed: 40,
        goldReward: 100,
        description: '강력한 보스 적',
    },
}

// ==================== 게임 상수 ====================
export const MAP_WIDTH = 800
export const MAP_HEIGHT = 600
export const PLAYER_START_HP = 100
export const PLAYER_START_GOLD = 300

// 적이 이동할 경로 (시작점 -> 끝점)
export const PATH_POINTS: { x: number; y: number }[] = [
    { x: 0, y: 200 },
    { x: 150, y: 200 },
    { x: 150, y: 400 },
    { x: 350, y: 400 },
    { x: 350, y: 150 },
    { x: 550, y: 150 },
    { x: 550, y: 350 },
    { x: 700, y: 350 },
    { x: 700, y: 500 },
    { x: MAP_WIDTH, y: 500 },
]

// ==================== 웨이브 시스템 ====================
export interface Wave {
    wave: number
    enemies: { type: EnemyTypeId; count: number; spawnDelay: number }[]
}

export const WAVES: Wave[] = [
    // Wave 1: Easy start
    {
        wave: 1,
        enemies: [{ type: 'NORMAL', count: 10, spawnDelay: 1000 }],
    },
    // Wave 2: Introduce fast enemies
    {
        wave: 2,
        enemies: [
            { type: 'NORMAL', count: 8, spawnDelay: 1000 },
            { type: 'FAST', count: 5, spawnDelay: 800 },
        ],
    },
    // Wave 3: More variety
    {
        wave: 3,
        enemies: [
            { type: 'NORMAL', count: 10, spawnDelay: 800 },
            { type: 'FAST', count: 8, spawnDelay: 600 },
        ],
    },
    // Wave 4: Introduce strong enemies
    {
        wave: 4,
        enemies: [
            { type: 'NORMAL', count: 12, spawnDelay: 700 },
            { type: 'FAST', count: 6, spawnDelay: 500 },
            { type: 'STRONG', count: 3, spawnDelay: 1500 },
        ],
    },
    // Wave 5: First boss
    {
        wave: 5,
        enemies: [
            { type: 'NORMAL', count: 10, spawnDelay: 600 },
            { type: 'FAST', count: 8, spawnDelay: 500 },
            { type: 'BOSS', count: 1, spawnDelay: 3000 },
        ],
    },
    // Wave 6: Difficulty ramp
    {
        wave: 6,
        enemies: [
            { type: 'NORMAL', count: 15, spawnDelay: 600 },
            { type: 'FAST', count: 12, spawnDelay: 400 },
            { type: 'STRONG', count: 5, spawnDelay: 1200 },
        ],
    },
    // Wave 7: Mixed
    {
        wave: 7,
        enemies: [
            { type: 'NORMAL', count: 18, spawnDelay: 500 },
            { type: 'FAST', count: 15, spawnDelay: 400 },
            { type: 'STRONG', count: 6, spawnDelay: 1000 },
        ],
    },
    // Wave 8: Lots of strong
    {
        wave: 8,
        enemies: [
            { type: 'NORMAL', count: 15, spawnDelay: 500 },
            { type: 'FAST', count: 10, spawnDelay: 400 },
            { type: 'STRONG', count: 10, spawnDelay: 800 },
        ],
    },
    // Wave 9: Pre-final
    {
        wave: 9,
        enemies: [
            { type: 'NORMAL', count: 20, spawnDelay: 400 },
            { type: 'FAST', count: 15, spawnDelay: 300 },
            { type: 'STRONG', count: 12, spawnDelay: 700 },
            { type: 'BOSS', count: 1, spawnDelay: 2000 },
        ],
    },
    // Wave 10: Final wave
    {
        wave: 10,
        enemies: [
            { type: 'NORMAL', count: 25, spawnDelay: 400 },
            { type: 'FAST', count: 20, spawnDelay: 300 },
            { type: 'STRONG', count: 15, spawnDelay: 600 },
            { type: 'BOSS', count: 2, spawnDelay: 1500 },
        ],
    },
]

// ==================== 게임 엔티티 ====================
export interface Tower {
    id: string
    type: TowerTypeId
    x: number
    y: number
    level: number
    lastAttackTime: number
}

export interface Enemy {
    id: string
    type: EnemyTypeId
    hp: number
    maxHp: number
    speed: number
    currentPathIndex: number
    x: number
    y: number
    slowedUntil?: number
}

export interface Projectile {
    id: string
    towerId: string
    towerType: TowerTypeId
    x: number
    y: number
    targetX: number
    targetY: number
    targetEnemyId: string
    speed: number
    damage: number
}

// ==================== 게임 로직 함수 ====================

/**
 * 퀴즈 정답 시 골드 보상 계산
 * @param answerTime 답변 시간 (초)
 * @param timeLimit 제한 시간 (초)
 * @param consecutiveCorrect 연속 정답 수
 * @returns 획득 골드
 */
export function calculateGoldReward(
    answerTime: number,
    timeLimit: number,
    consecutiveCorrect: number
): number {
    // 기본 골드: 빠를수록 많이
    const timeRatio = Math.max(0, (timeLimit - answerTime) / timeLimit)
    let baseGold = Math.floor(50 + timeRatio * 100) // 50~150 골드

    // 연속 정답 보너스
    let multiplier = 1
    if (consecutiveCorrect >= 5) {
        multiplier = 3 // 5연속: 3배
    } else if (consecutiveCorrect >= 3) {
        multiplier = 2 // 3연속: 2배
    }

    return Math.floor(baseGold * multiplier)
}

/**
 * 타워 배치 가능 여부 확인
 */
export function canPlaceTower(
    x: number,
    y: number,
    towers: Tower[],
    minDistance: number = 60
): boolean {
    // 경로와 너무 가까운지 확인
    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
        const p1 = PATH_POINTS[i]
        const p2 = PATH_POINTS[i + 1]

        // 선분과 점 사이의 거리 계산
        const distance = pointToSegmentDistance(x, y, p1.x, p1.y, p2.x, p2.y)
        if (distance < 40) {
            return false // 경로에 너무 가까움
        }
    }

    // 다른 타워와 너무 가까운지 확인
    for (const tower of towers) {
        const distance = Math.sqrt((x - tower.x) ** 2 + (y - tower.y) ** 2)
        if (distance < minDistance) {
            return false
        }
    }

    // 맵 경계 확인
    if (x < 30 || x > MAP_WIDTH - 30 || y < 30 || y > MAP_HEIGHT - 30) {
        return false
    }

    return true
}

/**
 * 점과 선분 사이의 최단 거리 계산
 */
function pointToSegmentDistance(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
): number {
    const dx = x2 - x1
    const dy = y2 - y1
    const lengthSquared = dx * dx + dy * dy

    if (lengthSquared === 0) {
        return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2)
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared
    t = Math.max(0, Math.min(1, t))

    const projX = x1 + t * dx
    const projY = y1 + t * dy

    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2)
}

/**
 * 타워 업그레이드 비용 계산
 */
export function getTowerUpgradeCost(towerType: TowerTypeId, currentLevel: number): number {
    const baseCost = TOWER_TYPES[towerType].cost
    return Math.floor(baseCost * 0.5 * currentLevel)
}

/**
 * 타워의 실제 데미지 계산 (레벨 적용)
 */
export function getTowerDamage(towerType: TowerTypeId, level: number): number {
    const baseDamage = TOWER_TYPES[towerType].damage
    return baseDamage * level
}

/**
 * 타워의 실제 범위 계산 (레벨 적용)
 */
export function getTowerRange(towerType: TowerTypeId, level: number): number {
    const baseRange = TOWER_TYPES[towerType].range
    return baseRange + (level - 1) * 10
}

/**
 * 두 점 사이의 거리 계산
 */
export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

/**
 * 경로상의 다음 위치 계산
 */
export function getNextPosition(
    enemy: Enemy,
    deltaTime: number
): { x: number; y: number; pathIndex: number } {
    const currentPoint = PATH_POINTS[enemy.currentPathIndex]
    const nextPoint = PATH_POINTS[enemy.currentPathIndex + 1]

    if (!nextPoint) {
        // 경로의 끝에 도달
        return { x: enemy.x, y: enemy.y, pathIndex: enemy.currentPathIndex }
    }

    const dx = nextPoint.x - currentPoint.x
    const dy = nextPoint.y - currentPoint.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 이동 거리 계산
    const moveDistance = enemy.speed * deltaTime

    // 현재 위치에서 다음 포인트까지의 거리
    const currentDx = nextPoint.x - enemy.x
    const currentDy = nextPoint.y - enemy.y
    const currentDistance = Math.sqrt(currentDx * currentDx + currentDy * currentDy)

    if (moveDistance >= currentDistance) {
        // 다음 포인트에 도달
        return {
            x: nextPoint.x,
            y: nextPoint.y,
            pathIndex: enemy.currentPathIndex + 1,
        }
    } else {
        // 다음 포인트로 조금 이동
        const ratio = moveDistance / currentDistance
        return {
            x: enemy.x + currentDx * ratio,
            y: enemy.y + currentDy * ratio,
            pathIndex: enemy.currentPathIndex,
        }
    }
}

/**
 * 적이 목표 지점에 도달했는지 확인
 */
export function hasReachedEnd(enemy: Enemy): boolean {
    return enemy.currentPathIndex >= PATH_POINTS.length - 1
}

/**
 * 발사체의 다음 위치 계산
 */
export function moveProjectile(
    projectile: Projectile,
    deltaTime: number
): { x: number; y: number; reached: boolean } {
    const dx = projectile.targetX - projectile.x
    const dy = projectile.targetY - projectile.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    const moveDistance = projectile.speed * deltaTime

    if (moveDistance >= distance) {
        return {
            x: projectile.targetX,
            y: projectile.targetY,
            reached: true,
        }
    }

    const ratio = moveDistance / distance
    return {
        x: projectile.x + dx * ratio,
        y: projectile.y + dy * ratio,
        reached: false,
    }
}
