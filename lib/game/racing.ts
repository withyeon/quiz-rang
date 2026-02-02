/**
 * 레이싱 게임 로직
 */

export type RacingItemType =
  | 'SPEED_BOOST' // 자신의 속도 2배
  | 'SLOW_OTHERS' // 다른 플레이어들 속도 50% 감소
  | 'TELEPORT' // 랜덤 위치로 순간이동
  | 'SHIELD' // 다음 오답 무시
  | 'FREEZE' // 다른 플레이어들 3초 일시정지
  | 'DOUBLE_POINTS' // 다음 정답 시 2배 이동
  | 'MINI_SCREEN' // 다른 플레이어들 화면 축소 (시각적 효과)
  | 'REVERSE' // 다른 플레이어들 방향 반대로
  | 'SWAP' // 다른 플레이어와 위치 교환
  | 'LIGHTNING' // 모든 플레이어들 뒤로 밀기
  | 'MAGNET' // 앞선 플레이어 끌어오기
  | 'ROCKET' // 순간적으로 앞으로 대폭 이동

export interface RacingItem {
  type: RacingItemType
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const RACING_ITEMS: Record<RacingItemType, RacingItem> = {
  SPEED_BOOST: {
    type: 'SPEED_BOOST',
    name: '속도 부스트',
    description: '다음 정답 시 이동 거리 2배!',
    icon: '⚡',
    rarity: 'common',
  },
  SLOW_OTHERS: {
    type: 'SLOW_OTHERS',
    name: '슬로우',
    description: '다른 플레이어들 속도 50% 감소',
    icon: '🐌',
    rarity: 'common',
  },
  TELEPORT: {
    type: 'TELEPORT',
    name: '순간이동',
    description: '랜덤 위치로 순간이동!',
    icon: '✨',
    rarity: 'rare',
  },
  SHIELD: {
    type: 'SHIELD',
    name: '방패',
    description: '다음 오답 무시',
    icon: '🛡️',
    rarity: 'rare',
  },
  FREEZE: {
    type: 'FREEZE',
    name: '얼음',
    description: '다른 플레이어들 3초 일시정지',
    icon: '❄️',
    rarity: 'rare',
  },
  DOUBLE_POINTS: {
    type: 'DOUBLE_POINTS',
    name: '더블 포인트',
    description: '다음 정답 시 2배 이동',
    icon: '💎',
    rarity: 'rare',
  },
  MINI_SCREEN: {
    type: 'MINI_SCREEN',
    name: '미니 화면',
    description: '다른 플레이어들 화면 축소 (시각적 효과)',
    icon: '🔍',
    rarity: 'epic',
  },
  REVERSE: {
    type: 'REVERSE',
    name: '역방향',
    description: '다른 플레이어들 방향 반대로',
    icon: '🔄',
    rarity: 'epic',
  },
  SWAP: {
    type: 'SWAP',
    name: '위치 교환',
    description: '다른 플레이어와 위치 교환',
    icon: '🔄',
    rarity: 'epic',
  },
  LIGHTNING: {
    type: 'LIGHTNING',
    name: '번개',
    description: '모든 플레이어들 뒤로 밀기',
    icon: '⚡',
    rarity: 'legendary',
  },
  MAGNET: {
    type: 'MAGNET',
    name: '자석',
    description: '앞선 플레이어 끌어오기',
    icon: '🧲',
    rarity: 'legendary',
  },
  ROCKET: {
    type: 'ROCKET',
    name: '로켓',
    description: '순간적으로 앞으로 대폭 이동',
    icon: '🚀',
    rarity: 'legendary',
  },
}

/**
 * 랜덤 아이템 생성
 * 확률: Common 50%, Rare 30%, Epic 15%, Legendary 5%
 */
export function generateRacingItem(): RacingItem {
  const random = Math.random()
  
  let itemPool: RacingItem[]
  
  if (random < 0.5) {
    // Common (50%)
    itemPool = Object.values(RACING_ITEMS).filter(item => item.rarity === 'common')
  } else if (random < 0.8) {
    // Rare (30%)
    itemPool = Object.values(RACING_ITEMS).filter(item => item.rarity === 'rare')
  } else if (random < 0.95) {
    // Epic (15%)
    itemPool = Object.values(RACING_ITEMS).filter(item => item.rarity === 'epic')
  } else {
    // Legendary (5%)
    itemPool = Object.values(RACING_ITEMS).filter(item => item.rarity === 'legendary')
  }
  
  return itemPool[Math.floor(Math.random() * itemPool.length)]
}

/**
 * 정답 속도에 따른 이동 거리 계산
 * @param answerTime 정답까지 걸린 시간 (초)
 * @param timeLimit 전체 제한 시간 (초)
 * @param multiplier 추가 배율 (아이템 효과 등)
 */
export function calculateMoveDistance(
  answerTime: number,
  timeLimit: number = 30,
  multiplier: number = 1
): number {
  // 빠를수록 더 많이 이동
  // 0초에 답하면 최대 100, 시간이 지날수록 감소
  const speedRatio = Math.max(0, 1 - answerTime / timeLimit)
  const baseDistance = speedRatio * 100
  
  return Math.floor(baseDistance * multiplier)
}

/**
 * 아이템 효과 적용
 */
export interface ItemEffect {
  type: RacingItemType
  targetPlayerId?: string // 특정 플레이어 대상 (SWAP, MAGNET 등)
  duration?: number // 지속 시간 (초)
  value?: number // 효과 값
}

export function applyItemEffect(
  item: RacingItem,
  currentPlayerId: string,
  allPlayers: Array<{ id: string; position: number }>,
  currentPosition: number
): ItemEffect {
  switch (item.type) {
    case 'SPEED_BOOST':
      return { type: 'SPEED_BOOST', duration: 1 } // 다음 1문제 동안
    
    case 'SLOW_OTHERS':
      return { type: 'SLOW_OTHERS', duration: 1 }
    
    case 'TELEPORT':
      // 랜덤 위치 (0 ~ 최대 위치의 80%)
      const maxPosition = Math.max(...allPlayers.map(p => p.position), 0)
      const teleportPosition = Math.floor(Math.random() * maxPosition * 0.8)
      return { type: 'TELEPORT', value: teleportPosition }
    
    case 'SHIELD':
      return { type: 'SHIELD', duration: 1 }
    
    case 'FREEZE':
      return { type: 'FREEZE', duration: 3 }
    
    case 'DOUBLE_POINTS':
      return { type: 'DOUBLE_POINTS', duration: 1 }
    
    case 'MINI_SCREEN':
      return { type: 'MINI_SCREEN', duration: 5 } // 5초간 시각적 효과
    
    case 'REVERSE':
      return { type: 'REVERSE', duration: 1 }
    
    case 'SWAP':
      // 다른 플레이어 중 랜덤 선택
      const otherPlayers = allPlayers.filter(p => p.id !== currentPlayerId)
      if (otherPlayers.length > 0) {
        const target = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]
        return { type: 'SWAP', targetPlayerId: target.id }
      }
      return { type: 'SWAP' }
    
    case 'LIGHTNING':
      return { type: 'LIGHTNING', value: -50 } // 모든 플레이어 50 뒤로
    
    case 'MAGNET':
      // 가장 앞선 플레이어 선택
      const topPlayer = allPlayers.reduce((top, p) => 
        p.position > top.position ? p : top
      )
      if (topPlayer.id !== currentPlayerId) {
        return { type: 'MAGNET', targetPlayerId: topPlayer.id, value: topPlayer.position * 0.3 }
      }
      return { type: 'MAGNET' }
    
    case 'ROCKET':
      return { type: 'ROCKET', value: 200 } // 200 앞으로
    
    default:
      return { type: 'SPEED_BOOST' }
  }
}
