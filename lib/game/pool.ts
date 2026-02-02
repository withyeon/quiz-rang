/**
 * 포켓볼 게임 로직
 * 퀴즈 정답 시 공을 한 번 칠 수 있고, 구멍에 넣으면 점수 획득
 */

export type PoolItemType =
  | 'ACCURACY_BOOST' // 정확도 향상: 다음 타격 정확도 증가
  | 'POWER_SHOT' // 파워 샷: 더 강하게 칠 수 있음
  | 'GUIDE_LINE' // 가이드 라인: 경로 표시
  | 'DOUBLE_SHOT' // 더블 샷: 정답 시 2번 칠 수 있음
  | 'SCREEN_SHAKE' // 화면 흔들기: 다른 플레이어 화면 흔들림
  | 'SCREEN_BLIND' // 화면 가리기: 다른 플레이어 화면 일부 가림
  | 'BALL_DISRUPT' // 공 방해: 다른 플레이어 공 위치 약간 변경
  | 'REVERSE_CONTROL' // 역방향: 다른 플레이어 조작 방향 반대
  | 'SLOW_SHOT' // 슬로우: 다른 플레이어 다음 타격 속도 감소
  | 'MAGNET_HOLE' // 자석 구멍: 공을 끌어당김
  | 'BONUS_POINTS' // 보너스 포인트: 다음 성공 시 2배 점수

export interface PoolItem {
  type: PoolItemType
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const POOL_ITEMS: Record<PoolItemType, PoolItem> = {
  ACCURACY_BOOST: {
    type: 'ACCURACY_BOOST',
    name: '정확도 향상',
    description: '다음 타격 정확도 증가',
    icon: '🎯',
    rarity: 'common',
  },
  POWER_SHOT: {
    type: 'POWER_SHOT',
    name: '파워 샷',
    description: '더 강하게 칠 수 있음',
    icon: '💪',
    rarity: 'common',
  },
  GUIDE_LINE: {
    type: 'GUIDE_LINE',
    name: '가이드 라인',
    description: '경로 표시',
    icon: '📏',
    rarity: 'rare',
  },
  DOUBLE_SHOT: {
    type: 'DOUBLE_SHOT',
    name: '더블 샷',
    description: '정답 시 2번 칠 수 있음',
    icon: '⚡',
    rarity: 'rare',
  },
  SCREEN_SHAKE: {
    type: 'SCREEN_SHAKE',
    name: '화면 흔들기',
    description: '다른 플레이어 화면 흔들림',
    icon: '🌊',
    rarity: 'epic',
  },
  SCREEN_BLIND: {
    type: 'SCREEN_BLIND',
    name: '화면 가리기',
    description: '다른 플레이어 화면 일부 가림',
    icon: '👁️',
    rarity: 'epic',
  },
  BALL_DISRUPT: {
    type: 'BALL_DISRUPT',
    name: '공 방해',
    description: '다른 플레이어 공 위치 약간 변경',
    icon: '🌀',
    rarity: 'epic',
  },
  REVERSE_CONTROL: {
    type: 'REVERSE_CONTROL',
    name: '역방향',
    description: '다른 플레이어 조작 방향 반대',
    icon: '🔄',
    rarity: 'legendary',
  },
  SLOW_SHOT: {
    type: 'SLOW_SHOT',
    name: '슬로우',
    description: '다른 플레이어 다음 타격 속도 감소',
    icon: '🐌',
    rarity: 'legendary',
  },
  MAGNET_HOLE: {
    type: 'MAGNET_HOLE',
    name: '자석 구멍',
    description: '공을 끌어당김',
    icon: '🧲',
    rarity: 'legendary',
  },
  BONUS_POINTS: {
    type: 'BONUS_POINTS',
    name: '보너스 포인트',
    description: '다음 성공 시 2배 점수',
    icon: '⭐',
    rarity: 'rare',
  },
}

/**
 * 랜덤 아이템 생성
 * 확률: Common 50%, Rare 30%, Epic 15%, Legendary 5%
 */
export function generatePoolItem(): PoolItem {
  const random = Math.random()
  
  let itemPool: PoolItem[]
  
  if (random < 0.5) {
    // Common (50%)
    itemPool = Object.values(POOL_ITEMS).filter(item => item.rarity === 'common')
  } else if (random < 0.8) {
    // Rare (30%)
    itemPool = Object.values(POOL_ITEMS).filter(item => item.rarity === 'rare')
  } else if (random < 0.95) {
    // Epic (15%)
    itemPool = Object.values(POOL_ITEMS).filter(item => item.rarity === 'epic')
  } else {
    // Legendary (5%)
    itemPool = Object.values(POOL_ITEMS).filter(item => item.rarity === 'legendary')
  }
  
  return itemPool[Math.floor(Math.random() * itemPool.length)]
}

/**
 * 포켓볼 공 위치 (2D 좌표)
 */
export interface BallPosition {
  x: number // 0 ~ 1 (테이블 너비 비율)
  y: number // 0 ~ 1 (테이블 높이 비율)
  vx: number // x 방향 속도
  vy: number // y 방향 속도
}

/**
 * 구멍 위치 (6개 구멍)
 */
export const HOLES: Array<{ x: number; y: number; points: number }> = [
  { x: 0, y: 0, points: 10 }, // 좌상
  { x: 0.5, y: 0, points: 15 }, // 상단 중앙
  { x: 1, y: 0, points: 10 }, // 우상
  { x: 0, y: 1, points: 10 }, // 좌하
  { x: 0.5, y: 1, points: 15 }, // 하단 중앙
  { x: 1, y: 1, points: 10 }, // 우하
]

/**
 * 공을 칠 때의 힘과 방향
 */
export interface ShotPower {
  angle: number // 0 ~ 360도
  power: number // 0 ~ 1 (0.5가 기본)
}

/**
 * 정답 속도에 따른 힘 계산
 * @param answerTime 정답까지 걸린 시간 (ms)
 * @param timeLimit 전체 제한 시간 (ms)
 */
export function calculateShotPower(
  answerTime: number,
  timeLimit: number = 30000
): number {
  // 빠를수록 더 강하게 칠 수 있음
  // 0초에 답하면 최대 1.0, 시간이 지날수록 감소 (최소 0.3)
  const speedRatio = Math.max(0, 1 - answerTime / timeLimit)
  return 0.3 + speedRatio * 0.7
}

/**
 * 공이 구멍에 들어갔는지 확인
 * @param ballPos 공 위치
 * @param holePos 구멍 위치
 * @param holeRadius 구멍 반지름 (기본 0.05)
 */
export function isBallInHole(
  ballPos: BallPosition,
  holePos: { x: number; y: number },
  holeRadius: number = 0.05
): boolean {
  const dx = ballPos.x - holePos.x
  const dy = ballPos.y - holePos.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  return distance < holeRadius
}

/**
 * 점수 계산
 * @param holePoints 구멍 기본 점수
 * @param answerTime 정답 시간 (빠를수록 보너스)
 * @param consecutiveStreak 연속 성공 횟수
 * @param hasBonusPoints 보너스 포인트 아이템 여부
 */
export function calculateScore(
  holePoints: number,
  answerTime: number,
  consecutiveStreak: number = 0,
  hasBonusPoints: boolean = false
): number {
  // 기본 점수
  let score = holePoints
  
  // 속도 보너스 (10초 이내면 보너스)
  if (answerTime < 10000) {
    score += Math.floor((10000 - answerTime) / 1000) * 2
  }
  
  // 연속 성공 보너스 (연속 3회마다 +5점)
  if (consecutiveStreak > 0) {
    score += Math.floor(consecutiveStreak / 3) * 5
  }
  
  // 보너스 포인트 아이템
  if (hasBonusPoints) {
    score *= 2
  }
  
  return Math.floor(score)
}

/**
 * 아이템 효과 적용
 */
export interface PoolItemEffect {
  type: PoolItemType
  targetPlayerId?: string // 특정 플레이어 대상
  duration?: number // 지속 시간 (문제 수)
  value?: number // 효과 값
}

export function applyPoolItemEffect(
  item: PoolItem,
  currentPlayerId: string,
  allPlayers: Array<{ id: string }>
): PoolItemEffect {
  switch (item.type) {
    case 'ACCURACY_BOOST':
      return { type: 'ACCURACY_BOOST', duration: 1 }
    
    case 'POWER_SHOT':
      return { type: 'POWER_SHOT', duration: 1 }
    
    case 'GUIDE_LINE':
      return { type: 'GUIDE_LINE', duration: 1 }
    
    case 'DOUBLE_SHOT':
      return { type: 'DOUBLE_SHOT', duration: 1 }
    
    case 'SCREEN_SHAKE':
      return { type: 'SCREEN_SHAKE', duration: 1 }
    
    case 'SCREEN_BLIND':
      return { type: 'SCREEN_BLIND', duration: 1 }
    
    case 'BALL_DISRUPT':
      // 다른 플레이어 중 랜덤 선택
      const otherPlayers = allPlayers.filter(p => p.id !== currentPlayerId)
      if (otherPlayers.length > 0) {
        const target = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]
        return { type: 'BALL_DISRUPT', targetPlayerId: target.id }
      }
      return { type: 'BALL_DISRUPT' }
    
    case 'REVERSE_CONTROL':
      return { type: 'REVERSE_CONTROL', duration: 1 }
    
    case 'SLOW_SHOT':
      return { type: 'SLOW_SHOT', duration: 1 }
    
    case 'MAGNET_HOLE':
      return { type: 'MAGNET_HOLE', duration: 1 }
    
    case 'BONUS_POINTS':
      return { type: 'BONUS_POINTS', duration: 1 }
    
    default:
      return { type: 'ACCURACY_BOOST', duration: 1 }
  }
}

/**
 * 공 물리 시뮬레이션 (간단한 버전)
 * @param ballPos 현재 공 위치
 * @param shotPower 타격 힘과 방향
 * @param friction 마찰 계수 (기본 0.95)
 */
export function simulateBallPhysics(
  ballPos: BallPosition,
  shotPower: ShotPower,
  friction: number = 0.95
): BallPosition {
  // 타격 적용
  const radians = (shotPower.angle * Math.PI) / 180
  const newVx = Math.cos(radians) * shotPower.power * 0.1
  const newVy = Math.sin(radians) * shotPower.power * 0.1
  
  // 속도 업데이트
  let vx = ballPos.vx + newVx
  let vy = ballPos.vy + newVy
  
  // 마찰 적용
  vx *= friction
  vy *= friction
  
  // 위치 업데이트
  let x = ballPos.x + vx
  let y = ballPos.y + vy
  
  // 벽 충돌 (반사)
  if (x < 0 || x > 1) {
    vx = -vx * 0.8
    x = Math.max(0, Math.min(1, x))
  }
  if (y < 0 || y > 1) {
    vy = -vy * 0.8
    y = Math.max(0, Math.min(1, y))
  }
  
  // 속도가 너무 작으면 정지
  if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001) {
    vx = 0
    vy = 0
  }
  
  return { x, y, vx, vy }
}
