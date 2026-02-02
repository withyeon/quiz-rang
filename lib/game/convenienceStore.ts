/**
 * 편의점 운영 게임 로직
 */

export type ProductTier = '일반' | '희귀' | '영웅' | '전설'

export interface Product {
  id: string // 고유 ID (배치될 때마다 생성)
  baseId: string // 원본 상품 ID
  name: string
  emoji: string // 하위 호환성
  image: string // 상품 이미지 경로
  tier: ProductTier
  income: number // 초당 수익
  color: string // 카드 배경색
  borderColor: string
  category: ProductCategory // 상품 카테고리 (시너지용)
  level?: number // 업그레이드 레벨 (1-5)
  sellPrice?: number // 판매 시 가격
}

// 등장 가능한 상품 목록 (Loot Table)
// 상품 카테고리 (시너지용)
export type ProductCategory = '음료' | '식품' | '간식' | '프리미엄'

export const PRODUCT_POOL: Omit<Product, 'id' | 'sellPrice' | 'level'>[] = [
  // 일반 (Common) - 50%
  { baseId: 'p1', name: '생수', emoji: '💧', image: '/store/water.svg', tier: '일반', income: 10, color: 'bg-slate-100', borderColor: 'border-slate-400', category: '음료' },
  { baseId: 'p2', name: '삼각김밥', emoji: '🍙', image: '/store/kimbap.svg', tier: '일반', income: 15, color: 'bg-green-50', borderColor: 'border-green-400', category: '식품' },
  { baseId: 'p3', name: '츄파춥스', emoji: '🍭', image: '/store/lollipop.svg', tier: '일반', income: 12, color: 'bg-pink-50', borderColor: 'border-pink-300', category: '간식' },
  { baseId: 'p4', name: '초코바', emoji: '🍫', image: '/store/chocolate.svg', tier: '일반', income: 8, color: 'bg-amber-50', borderColor: 'border-amber-300', category: '간식' },

  // 희귀 (Rare) - 30%
  { baseId: 'p5', name: '뚱바나나우유', emoji: '🍌', image: '/store/banana_milk.svg', tier: '희귀', income: 50, color: 'bg-yellow-50', borderColor: 'border-yellow-400', category: '음료' },
  { baseId: 'p6', name: '컵라면', emoji: '🍜', image: '/store/cup_ramen.svg', tier: '희귀', income: 60, color: 'bg-orange-50', borderColor: 'border-orange-400', category: '식품' },
  { baseId: 'p7', name: '도시락', emoji: '🍱', image: '/store/lunch_box.svg', tier: '희귀', income: 55, color: 'bg-red-50', borderColor: 'border-red-400', category: '식품' },

  // 영웅 (Epic) - 15%
  { baseId: 'p8', name: '탄산음료', emoji: '🥤', image: '/store/soda.svg', tier: '영웅', income: 200, color: 'bg-blue-50', borderColor: 'border-blue-500', category: '음료' },
  { baseId: 'p9', name: '아이스크림 콘', emoji: '🍦', image: '/store/ice_cream.svg', tier: '영웅', income: 250, color: 'bg-purple-50', borderColor: 'border-purple-500', category: '프리미엄' },
  { baseId: 'p10', name: '치킨', emoji: '🍗', image: '/store/chicken.svg', tier: '영웅', income: 220, color: 'bg-emerald-50', borderColor: 'border-emerald-500', category: '식품' },

  // 전설 (Legendary) - 5%
  { baseId: 'p11', name: '두바이 초콜릿', emoji: '🍫', image: '/store/dubai_choco.svg', tier: '전설', income: 1000, color: 'bg-amber-50', borderColor: 'border-amber-500', category: '프리미엄' },
  { baseId: 'p12', name: '캐릭터 빵', emoji: '🍞', image: '/store/character_bread.svg', tier: '전설', income: 1200, color: 'bg-indigo-50', borderColor: 'border-indigo-500', category: '간식' },
  { baseId: 'p13', name: '떡볶이', emoji: '🍢', image: '/store/tteokbokki.svg', tier: '전설', income: 1500, color: 'bg-red-50', borderColor: 'border-red-500', category: '식품' },
]

export const GRID_SIZE = 10 // 10칸 진열대 (Blooket Factory와 동일)

// 고객 타입
export type CustomerType = 'normal' | 'vip' | 'bulk'

export interface Customer {
  id: string
  type: CustomerType
  emoji: string
  name: string
  bonusMultiplier: number // 수익 배율
  visitChance: number // 방문 확률 (0-1)
}

export const CUSTOMERS: Customer[] = [
  { id: 'c1', type: 'normal', emoji: '👤', name: '일반 고객', bonusMultiplier: 1.0, visitChance: 0.7 },
  { id: 'c2', type: 'vip', emoji: '👑', name: 'VIP 고객', bonusMultiplier: 2.0, visitChance: 0.2 },
  { id: 'c3', type: 'bulk', emoji: '🛒', name: '대량 구매', bonusMultiplier: 3.0, visitChance: 0.1 },
]

// 이벤트 타입
export type EventType = 'sale' | 'bonus' | 'rush'

export interface StoreEvent {
  id: string
  type: EventType
  name: string
  emoji: string
  description: string
  multiplier: number // 수익 배율
  duration: number // 지속 시간 (초)
  chance: number // 발생 확률
}

export const STORE_EVENTS: StoreEvent[] = [
  {
    id: 'e1',
    type: 'sale',
    name: '특별 할인',
    emoji: '🏷️',
    description: '모든 상품 수익 2배!',
    multiplier: 2.0,
    duration: 30,
    chance: 0.15,
  },
  {
    id: 'e2',
    type: 'bonus',
    name: '보너스 타임',
    emoji: '⭐',
    description: '모든 상품 수익 3배!',
    multiplier: 3.0,
    duration: 20,
    chance: 0.1,
  },
  {
    id: 'e3',
    type: 'rush',
    name: '러시아워',
    emoji: '🚶',
    description: '고객이 몰려옵니다! 수익 1.5배',
    multiplier: 1.5,
    duration: 40,
    chance: 0.2,
  },
]

/**
 * 가챠 시스템 (랜덤 뽑기)
 */
export function generateProductOptions(): Product[] {
  const options: Product[] = []

  for (let i = 0; i < 3; i++) {
    const rand = Math.random() * 100
    let tier: ProductTier = '일반'

    // 확률 설정: 전설(5%), 영웅(15%), 희귀(30%), 일반(50%)
    if (rand > 95) tier = '전설'
    else if (rand > 80) tier = '영웅'
    else if (rand > 50) tier = '희귀'
    else tier = '일반'

    // 해당 티어 풀에서 랜덤 선택
    const pool = PRODUCT_POOL.filter(p => p.tier === tier)
    const picked = pool[Math.floor(Math.random() * pool.length)]

    // 고유 ID 부여 및 판매 가격 계산
    const product: Product = {
      ...picked,
      id: `${picked.baseId}-${Date.now()}-${i}`,
      sellPrice: picked.income * 10, // 판매 시 수익의 10배
    }

    options.push(product)
  }

  return options
}

/**
 * 총 초당 수익 계산 (시너지 포함)
 */
export function calculateTotalCPS(products: Product[]): number {
  // 카테고리별 개수 계산
  const categoryCount: Record<ProductCategory, number> = {
    '음료': 0,
    '식품': 0,
    '간식': 0,
    '프리미엄': 0,
  }

  products.forEach(product => {
    categoryCount[product.category]++
  })

  // 각 상품의 수익에 시너지 배율 적용
  return products.reduce((total, product) => {
    const level = product.level || 1
    const baseIncome = product.income * level // 레벨에 따라 income 증가

    // 시너지 배율 계산: 같은 카테고리 개수에 따라 1.5배씩 증가
    const categoryMultiplier = 1 + (categoryCount[product.category] - 1) * 0.5

    return total + Math.floor(baseIncome * categoryMultiplier)
  }, 0)
}

/**
 * 상품 판매 (진열대가 꽉 찼을 때)
 */
export function sellProduct(
  product: Product,
  products: Product[]
): { success: boolean; newProducts: Product[]; money: number } {
  const index = products.findIndex(p => p.id === product.id)

  if (index === -1) {
    return { success: false, newProducts: products, money: 0 }
  }

  const newProducts = products.filter(p => p.id !== product.id)
  const sellPrice = product.sellPrice || product.income * 10

  return {
    success: true,
    newProducts,
    money: sellPrice,
  }
}

/**
 * 고객 방문 (랜덤 보너스 수익)
 */
export function generateCustomer(): Customer | null {
  const rand = Math.random()
  let cumulativeChance = 0

  for (const customer of CUSTOMERS) {
    cumulativeChance += customer.visitChance
    if (rand <= cumulativeChance) {
      return customer
    }
  }

  return null
}

/**
 * 고객 구매 보너스 계산
 */
export function calculateCustomerBonus(
  baseIncome: number,
  customer: Customer
): number {
  return Math.floor(baseIncome * customer.bonusMultiplier)
}

/**
 * 이벤트 발생 확인
 */
export function checkEvent(): StoreEvent | null {
  const rand = Math.random()
  let cumulativeChance = 0

  for (const event of STORE_EVENTS) {
    cumulativeChance += event.chance
    if (rand <= cumulativeChance) {
      return event
    }
  }

  return null
}

/**
 * 티어별 색상 클래스
 */
export function getTierColor(tier: ProductTier): string {
  switch (tier) {
    case '일반':
      return 'bg-green-500'
    case '희귀':
      return 'bg-blue-500'
    case '영웅':
      return 'bg-purple-500'
    case '전설':
      return 'bg-amber-500'
    default:
      return 'bg-gray-500'
  }
}

/**
 * 업그레이드 비용 계산 (레벨에 따라 exponential 증가)
 */
export function getUpgradeCost(product: Product): number {
  const level = product.level || 1
  if (level >= 5) return Infinity // 최대 레벨

  const baseCost = product.income * 20
  return Math.floor(baseCost * Math.pow(2, level - 1))
}

/**
 * 상품 업그레이드
 */
export function upgradeProduct(
  product: Product,
  products: Product[]
): { success: boolean; newProducts: Product[]; cost: number } {
  const index = products.findIndex(p => p.id === product.id)

  if (index === -1 || (product.level || 1) >= 5) {
    return { success: false, newProducts: products, cost: 0 }
  }

  const cost = getUpgradeCost(product)
  const newProducts = [...products]
  newProducts[index] = {
    ...product,
    level: (product.level || 1) + 1,
  }

  return {
    success: true,
    newProducts,
    cost,
  }
}

/**
 * 카테고리별 시너지 배율 계산
 */
export function getCategorySynergy(category: ProductCategory, products: Product[]): number {
  const count = products.filter(p => p.category === category).length
  return 1 + (count - 1) * 0.5 // 1.0x, 1.5x, 2.0x, 2.5x, ...
}

/**
 * 카테고리 이모지
 */
export function getCategoryEmoji(category: ProductCategory): string {
  switch (category) {
    case '음료':
      return '🥤'
    case '식품':
      return '🍱'
    case '간식':
      return '🍬'
    case '프리미엄':
      return '⭐'
  }
}

/**
 * 티어별 한글 이름
 */
export function getTierName(tier: ProductTier): string {
  return tier
}
