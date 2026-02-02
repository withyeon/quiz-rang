/**
 * Factory 게임 로직
 * 문제를 맞춰 공장을 운영하고 돈을 벌어 최고 부자가 되기
 */

export type FactoryType = 'basic' | 'advanced' | 'premium' | 'mega'

export interface Factory {
  id: string
  type: FactoryType
  name: string
  emoji: string
  cost: number // 구매 비용
  productionRate: number // 초당 생산량
  upgradeCost: number // 업그레이드 비용
  level: number
}

// 공장 데이터
export const FACTORIES: Record<FactoryType, Omit<Factory, 'level'>> = {
  basic: {
    id: 'basic',
    type: 'basic',
    name: '기본 공장',
    emoji: '🏭',
    cost: 100,
    productionRate: 10, // 초당 10원
    upgradeCost: 50,
  },
  advanced: {
    id: 'advanced',
    type: 'advanced',
    name: '고급 공장',
    emoji: '🏢',
    cost: 500,
    productionRate: 50, // 초당 50원
    upgradeCost: 250,
  },
  premium: {
    id: 'premium',
    type: 'premium',
    name: '프리미엄 공장',
    emoji: '🏗️',
    cost: 2000,
    productionRate: 200, // 초당 200원
    upgradeCost: 1000,
  },
  mega: {
    id: 'mega',
    type: 'mega',
    name: '메가 공장',
    emoji: '🌆',
    cost: 10000,
    productionRate: 1000, // 초당 1000원
    upgradeCost: 5000,
  },
}

export interface PlayerFactory extends Factory {
  level: number
  lastProductionTime: number
}

/**
 * 공장 생산량 계산
 */
export function calculateProduction(
  factories: PlayerFactory[],
  currentTime: number
): number {
  let totalProduction = 0

  factories.forEach((factory) => {
    const timeElapsed = (currentTime - factory.lastProductionTime) / 1000 // 초 단위
    const production = factory.productionRate * factory.level * timeElapsed
    totalProduction += production
  })

  return Math.floor(totalProduction)
}

/**
 * 공장 구매 가능 여부 확인
 */
export function canBuyFactory(money: number, factoryType: FactoryType): boolean {
  const factory = FACTORIES[factoryType]
  return money >= factory.cost
}

/**
 * 공장 구매
 */
export function buyFactory(
  factoryType: FactoryType,
  money: number
): { success: boolean; newMoney: number; factory: Factory | null } {
  const factory = FACTORIES[factoryType]

  if (money < factory.cost) {
    return { success: false, newMoney: money, factory: null }
  }

  const newFactory: PlayerFactory = {
    ...factory,
    level: 1,
    lastProductionTime: Date.now(),
  }

  return {
    success: true,
    newMoney: money - factory.cost,
    factory: newFactory,
  }
}

/**
 * 공장 업그레이드 가능 여부 확인
 */
export function canUpgradeFactory(
  money: number,
  factory: PlayerFactory
): boolean {
  return money >= factory.upgradeCost * factory.level
}

/**
 * 공장 업그레이드
 */
export function upgradeFactory(
  factory: PlayerFactory,
  money: number
): { success: boolean; newMoney: number; upgradedFactory: PlayerFactory | null } {
  const upgradeCost = factory.upgradeCost * factory.level

  if (money < upgradeCost) {
    return { success: false, newMoney: money, upgradedFactory: null }
  }

  const upgradedFactory: PlayerFactory = {
    ...factory,
    level: factory.level + 1,
  }

  return {
    success: true,
    newMoney: money - upgradeCost,
    upgradedFactory,
  }
}

/**
 * 정답 시 보상 (생산 포인트)
 */
export function getAnswerReward(answerTime: number, timeLimit: number): number {
  // 빠르게 답할수록 더 많은 보상
  const speedBonus = Math.max(0, (timeLimit - answerTime) / timeLimit)
  const baseReward = 100
  return Math.floor(baseReward * (1 + speedBonus * 2)) // 최대 300원
}

/**
 * 공장별 색상
 */
export function getFactoryColor(type: FactoryType): string {
  switch (type) {
    case 'basic':
      return 'bg-gray-500'
    case 'advanced':
      return 'bg-blue-500'
    case 'premium':
      return 'bg-purple-500'
    case 'mega':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-500'
  }
}
