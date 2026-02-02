/**
 * 미션: 등교 임파서블 게임 로직
 * Blooket Racing 파워업 시스템 기반
 */

export type SchoolRacingItemType =
  | 'ENERGY_BOOST' // 에너지 부스트: 자동으로 1미터 앞으로
  | 'SODA_BLAST' // 소다 블라스트: 4미터 앞으로
  | 'SPICY_PEPPER' // 매운 고추: 다음 3문제가 2배 가치
  | 'WHOOSH' // 후우시: 뒤에 있는 플레이어를 1미터 뒤로
  | 'ROCKET_ATTACK' // 로켓 공격: 플레이어를 1미터 뒤로
  | 'BUSY_BEES' // 바쁜 벌들: 1등을 3미터 뒤로
  | 'FREEZE' // 얼리기: 플레이어를 7초간 얼리기
  | 'MINIFY' // 축소: 모든 플레이어 화면 축소
  | 'MIGHTY_SHIELD' // 강력한 방패: 다음 해로운 파워업 차단
  | 'BLOOK_FIESTA' // 블록 피에스타: 플레이어를 방해하는 블록 표시

export interface SchoolRacingItem {
  type: SchoolRacingItemType
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const SCHOOL_RACING_ITEMS: Record<SchoolRacingItemType, SchoolRacingItem> = {
  ENERGY_BOOST: {
    type: 'ENERGY_BOOST',
    name: '에너지 부스트',
    description: '자동으로 1미터 앞으로 이동!',
    icon: '⚡',
    rarity: 'common',
  },
  SODA_BLAST: {
    type: 'SODA_BLAST',
    name: '소다 블라스트',
    description: '4미터 앞으로 슝~ 날아감!',
    icon: '🥤',
    rarity: 'common',
  },
  SPICY_PEPPER: {
    type: 'SPICY_PEPPER',
    name: '매운 고추',
    description: '다음 3문제가 2배 가치!',
    icon: '🌶️',
    rarity: 'rare',
  },
  WHOOSH: {
    type: 'WHOOSH',
    name: '후우시',
    description: '뒤에 있는 친구를 1미터 뒤로!',
    icon: '💨',
    rarity: 'common',
  },
  ROCKET_ATTACK: {
    type: 'ROCKET_ATTACK',
    name: '로켓 공격',
    description: '아무 플레이어나 1미터 뒤로!',
    icon: '🚀',
    rarity: 'rare',
  },
  BUSY_BEES: {
    type: 'BUSY_BEES',
    name: '바쁜 벌들',
    description: '1등을 3미터 뒤로 보내기!',
    icon: '🐝',
    rarity: 'rare',
  },
  FREEZE: {
    type: 'FREEZE',
    name: '얼리기',
    description: '플레이어를 7초간 얼려서 못 움직이게!',
    icon: '❄️',
    rarity: 'epic',
  },
  MINIFY: {
    type: 'MINIFY',
    name: '축소',
    description: '모든 플레이어 화면을 축소!',
    icon: '🔍',
    rarity: 'epic',
  },
  MIGHTY_SHIELD: {
    type: 'MIGHTY_SHIELD',
    name: '강력한 방패',
    description: '다음 해로운 파워업을 차단!',
    icon: '🛡️',
    rarity: 'legendary',
  },
  BLOOK_FIESTA: {
    type: 'BLOOK_FIESTA',
    name: '블록 피에스타',
    description: '친구 화면에 블록이 나타나 방해!',
    icon: '🎉',
    rarity: 'epic',
  },
}

// 맵 스테이지
export type MapStage = 'home' | 'city' | 'school'

export interface MapStageInfo {
  stage: MapStage
  name: string
  emoji: string
  startPosition: number
  endPosition: number
  description: string
}

export const MAP_STAGES: MapStageInfo[] = [
  {
    stage: 'home',
    name: '집 앞',
    emoji: '🏠',
    startPosition: 0,
    endPosition: 33,
    description: '엄마의 잔소리를 피해 아파트 단지 탈출',
  },
  {
    stage: 'city',
    name: '시내',
    emoji: '🏙️',
    startPosition: 33,
    endPosition: 66,
    description: '횡단보도, 편의점 앞을 지나는 혼잡한 거리',
  },
  {
    stage: 'school',
    name: '학교 앞',
    emoji: '🏫',
    startPosition: 66,
    endPosition: 100,
    description: '저 멀리 교문이 보이고, 선도부 선생님이 시계를 보며 기다림',
  },
]

export const TRACK_LENGTH = 100 // 100 step

/**
 * 랜덤 아이템 생성
 * Blooket Racing: 4문제마다 2개 파워업 획득
 */
export function generateSchoolRacingItem(): SchoolRacingItem {
  const random = Math.random()
  
  let itemPool: SchoolRacingItem[]
  
  if (random < 0.5) {
    // Common (50%)
    itemPool = Object.values(SCHOOL_RACING_ITEMS).filter(item => item.rarity === 'common')
  } else if (random < 0.8) {
    // Rare (30%)
    itemPool = Object.values(SCHOOL_RACING_ITEMS).filter(item => item.rarity === 'rare')
  } else if (random < 0.95) {
    // Epic (15%)
    itemPool = Object.values(SCHOOL_RACING_ITEMS).filter(item => item.rarity === 'epic')
  } else {
    // Legendary (5%)
    itemPool = Object.values(SCHOOL_RACING_ITEMS).filter(item => item.rarity === 'legendary')
  }
  
  // 아이템 풀이 비어있으면 모든 아이템에서 선택
  if (itemPool.length === 0) {
    itemPool = Object.values(SCHOOL_RACING_ITEMS)
  }
  
  return itemPool[Math.floor(Math.random() * itemPool.length)]
}

/**
 * 정답 속도에 따른 이동 거리 계산
 * @param answerTime 정답까지 걸린 시간 (초)
 * @param timeLimit 전체 제한 시간 (초)
 * @param consecutiveCorrect 연속 정답 횟수
 * @param multiplier 추가 배율 (아이템 효과 등)
 */
export function calculateMoveDistance(
  answerTime: number,
  timeLimit: number = 30,
  consecutiveCorrect: number = 0,
  multiplier: number = 1
): number {
  // 기본 이동: 1 step
  let baseDistance = 1
  
  // 빠를수록 보너스 (10초 이내면 +1 step)
  if (answerTime < 10) {
    baseDistance += 1
  }
  
  // 연속 정답 보너스 (연속 3정답 시 +1 step)
  if (consecutiveCorrect >= 3) {
    baseDistance += 1
  }
  
  return Math.floor(baseDistance * multiplier)
}

/**
 * 아이템 효과 적용
 * Blooket Racing 파워업 시스템 기반
 */
export interface SchoolItemEffect {
  type: SchoolRacingItemType
  targetPlayerId?: string
  duration?: number
  value?: number
  affectsAll?: boolean // 모든 플레이어에게 영향
}

export function applySchoolItemEffect(
  item: SchoolRacingItem,
  currentPlayerId: string,
  allPlayers: Array<{ id: string; position: number }>,
  currentPosition: number
): SchoolItemEffect {
  switch (item.type) {
    case 'ENERGY_BOOST':
      // 자동으로 1미터 앞으로
      return { type: 'ENERGY_BOOST', value: 1 }
    
    case 'SODA_BLAST':
      // 4미터 앞으로
      return { type: 'SODA_BLAST', value: 4 }
    
    case 'SPICY_PEPPER':
      // 다음 3문제가 2배 가치
      return { type: 'SPICY_PEPPER', duration: 3 }
    
    case 'WHOOSH':
      // 뒤에 있는 플레이어를 1미터 뒤로
      const behindPlayers = allPlayers
        .filter(p => p.id !== currentPlayerId && p.position < currentPosition)
        .sort((a, b) => b.position - a.position)
      if (behindPlayers.length > 0) {
        return { type: 'WHOOSH', targetPlayerId: behindPlayers[0].id, value: -1 }
      }
      return { type: 'WHOOSH' }
    
    case 'ROCKET_ATTACK':
      // 아무 플레이어나 1미터 뒤로 (자신 제외)
      const otherPlayers = allPlayers.filter(p => p.id !== currentPlayerId)
      if (otherPlayers.length > 0) {
        const target = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]
        return { type: 'ROCKET_ATTACK', targetPlayerId: target.id, value: -1 }
      }
      return { type: 'ROCKET_ATTACK' }
    
    case 'BUSY_BEES':
      // 1등을 3미터 뒤로
      const topPlayer = allPlayers.reduce((top, p) => 
        p.position > top.position ? p : top
      )
      if (topPlayer.id !== currentPlayerId) {
        return { type: 'BUSY_BEES', targetPlayerId: topPlayer.id, value: -3 }
      }
      return { type: 'BUSY_BEES' }
    
    case 'FREEZE':
      // 플레이어를 7초간 얼리기 (랜덤 선택)
      const freezeTargets = allPlayers.filter(p => p.id !== currentPlayerId)
      if (freezeTargets.length > 0) {
        const target = freezeTargets[Math.floor(Math.random() * freezeTargets.length)]
        return { type: 'FREEZE', targetPlayerId: target.id, duration: 7 }
      }
      return { type: 'FREEZE' }
    
    case 'MINIFY':
      // 모든 플레이어 화면 축소
      return { type: 'MINIFY', affectsAll: true, duration: 5 }
    
    case 'MIGHTY_SHIELD':
      // 다음 해로운 파워업 차단 (자신에게 적용)
      return { type: 'MIGHTY_SHIELD', targetPlayerId: currentPlayerId, duration: 999 }
    
    case 'BLOOK_FIESTA':
      // 모든 플레이어 화면에 블록 표시
      return { type: 'BLOOK_FIESTA', affectsAll: true, duration: 5 }
    
    default:
      return { type: 'ENERGY_BOOST', value: 1 }
  }
}

/**
 * 현재 맵 스테이지 확인
 */
export function getCurrentStage(position: number): MapStageInfo {
  const percentage = (position / TRACK_LENGTH) * 100
  
  for (let i = MAP_STAGES.length - 1; i >= 0; i--) {
    if (percentage >= MAP_STAGES[i].startPosition) {
      return MAP_STAGES[i]
    }
  }
  
  return MAP_STAGES[0]
}
