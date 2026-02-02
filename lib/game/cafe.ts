// Cafe 게임 로직 및 타입 정의

export interface MenuItem {
  id: string
  name: string
  emoji: string // 하위 호환성
  image: string // 메뉴 이미지 경로
  cost: number // 구매 비용
  sellPrice: number // 판매 가격
  description: string
}

export interface Customer {
  id: string
  order: string // 주문한 메뉴 ID
  emoji: string // 하위 호환성을 위해 유지
  characterImage: string // 캐릭터 이미지 경로
  patience: number // 인내심 (초 단위)
  spawnTime: number // 생성 시간
}

export interface Upgrade {
  id: string
  name: string
  description: string
  cost: number
  effect: (state: CafeGameState) => CafeGameState
}

export interface CafeGameState {
  status: 'lobby' | 'playing' | 'ended'
  timeRemaining: number // 초 단위
  cash: number
  totalCashEarned: number
  customersServed: number
  unlockedMenus: string[] // 해금된 메뉴 ID 목록
  menuStock: Record<string, number> // 메뉴별 재고 (퀴즈 정답 시 충전)
  upgrades: {
    customerSpeed: number // 손님 등장 속도 배율 (기본 1.0)
    sellPriceMultiplier: number // 판매가 배율 (기본 1.0)
  }
  customers: Customer[]
  stats: {
    menuSales: Record<string, number> // 메뉴별 판매 횟수
  }
}

// 메뉴 데이터
export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'toast',
    name: '토스트',
    emoji: '🍞',
    image: '/cafe/toast.svg',
    cost: 0, // 기본 제공
    sellPrice: 1,
    description: '따뜻하고 바삭한 토스트',
  },
  {
    id: 'cereal',
    name: '시리얼',
    emoji: '🥣',
    image: '/cafe/cereal.svg',
    cost: 15,
    sellPrice: 3,
    description: '아침을 깨우는 시리얼',
  },
  {
    id: 'milk',
    name: '우유',
    emoji: '🥛',
    image: '/cafe/milk.svg',
    cost: 50,
    sellPrice: 8,
    description: '신선한 우유',
  },
  {
    id: 'waffle',
    name: '와플',
    emoji: '🧇',
    image: '/cafe/waffle.svg',
    cost: 200,
    sellPrice: 20,
    description: '달콤한 와플',
  },
  {
    id: 'coffee',
    name: '커피',
    emoji: '☕',
    image: '/cafe/coffee.svg',
    cost: 500,
    sellPrice: 50,
    description: '진한 에스프레소',
  },
  {
    id: 'cake',
    name: '케이크',
    emoji: '🎂',
    image: '/cafe/cake.svg',
    cost: 1000,
    sellPrice: 120,
    description: '달콤한 생크림 케이크',
  },
  {
    id: 'pizza',
    name: '피자',
    emoji: '🍕',
    image: '/cafe/pizza.svg',
    cost: 2000,
    sellPrice: 300,
    description: '치즈가 가득한 피자',
  },
  {
    id: 'burger',
    name: '버거',
    emoji: '🍔',
    image: '/cafe/burger.svg',
    cost: 5000,
    sellPrice: 800,
    description: '든든한 햄버거',
  },
]

// 업그레이드 데이터
export const UPGRADES: Upgrade[] = [
  {
    id: 'advertising',
    name: '가게 홍보',
    description: '손님 등장 속도 2배 증가',
    cost: 100,
    effect: (state) => ({
      ...state,
      upgrades: {
        ...state.upgrades,
        customerSpeed: state.upgrades.customerSpeed * 2,
      },
    }),
  },
  {
    id: 'secret_sauce',
    name: '비법 소스',
    description: '모든 메뉴 판매가 +20%',
    cost: 500,
    effect: (state) => ({
      ...state,
      upgrades: {
        ...state.upgrades,
        sellPriceMultiplier: state.upgrades.sellPriceMultiplier * 1.2,
      },
    }),
  },
  {
    id: 'faster_service',
    name: '빠른 서비스',
    description: '손님 등장 속도 추가 1.5배',
    cost: 1000,
    effect: (state) => ({
      ...state,
      upgrades: {
        ...state.upgrades,
        customerSpeed: state.upgrades.customerSpeed * 1.5,
      },
    }),
  },
  {
    id: 'premium_ingredients',
    name: '프리미엄 재료',
    description: '모든 메뉴 판매가 추가 +30%',
    cost: 2000,
    effect: (state) => ({
      ...state,
      upgrades: {
        ...state.upgrades,
        sellPriceMultiplier: state.upgrades.sellPriceMultiplier * 1.3,
      },
    }),
  },
]

// 손님 이모티콘 (하위 호환성)
export const CUSTOMER_EMOJIS = ['🐱', '🐶', '🐰', '🐻', '🐼', '🐨', '🦊', '🐷', '🐸', '🐯']

// 캐릭터 이미지 경로 (1.svg ~ 20.svg)
export function getRandomCharacterImage(): string {
  const characterNumber = Math.floor(Math.random() * 20) + 1 // 1~20
  return `/character/${characterNumber}.svg`
}

// 초기 게임 상태
export function getInitialState(): CafeGameState {
  return {
    status: 'lobby',
    timeRemaining: 420, // 7분 기본값
    cash: 0,
    totalCashEarned: 0,
    customersServed: 0,
    unlockedMenus: ['toast'], // 토스트는 기본 제공
    menuStock: {}, // 재고는 퀴즈 정답 시 충전
    upgrades: {
      customerSpeed: 1.0,
      sellPriceMultiplier: 1.0,
    },
    customers: [],
    stats: {
      menuSales: {},
    },
  }
}

// 퀴즈 정답 시 메뉴 재고충전
export function restockMenu(state: CafeGameState, menuId: string): CafeGameState {
  // 해금된 메뉴만 재고충전 가능
  if (!state.unlockedMenus.includes(menuId)) {
    return state
  }

  return {
    ...state,
    menuStock: {
      ...state.menuStock,
      [menuId]: (state.menuStock[menuId] || 0) + 1,
    },
  }
}

// 메뉴 재고 확인
export function hasStock(state: CafeGameState, menuId: string): boolean {
  return (state.menuStock[menuId] || 0) > 0
}

// 메뉴 구매 가능 여부 확인
export function canBuyMenu(state: CafeGameState, menuId: string): boolean {
  if (state.unlockedMenus.includes(menuId)) {
    return false // 이미 해금됨
  }
  const menu = MENU_ITEMS.find((m) => m.id === menuId)
  if (!menu) return false
  return state.cash >= menu.cost
}

// 메뉴 구매
export function buyMenu(state: CafeGameState, menuId: string): CafeGameState {
  if (!canBuyMenu(state, menuId)) {
    return state
  }
  const menu = MENU_ITEMS.find((m) => m.id === menuId)
  if (!menu) return state

  return {
    ...state,
    cash: state.cash - menu.cost,
    unlockedMenus: [...state.unlockedMenus, menuId],
  }
}

// 업그레이드 구매 가능 여부 확인
export function canBuyUpgrade(state: CafeGameState, upgradeId: string): boolean {
  const upgrade = UPGRADES.find((u) => u.id === upgradeId)
  if (!upgrade) return false
  return state.cash >= upgrade.cost
}

// 업그레이드 구매
export function buyUpgrade(state: CafeGameState, upgradeId: string): CafeGameState {
  if (!canBuyUpgrade(state, upgradeId)) {
    return state
  }
  const upgrade = UPGRADES.find((u) => u.id === upgradeId)
  if (!upgrade) return state

  const newState = upgrade.effect(state)
  return {
    ...newState,
    cash: newState.cash - upgrade.cost,
  }
}

// 손님 생성 (재고가 없어도 손님은 계속 나옴)
export function spawnCustomer(state: CafeGameState, currentTime: number): Customer | null {
  // 해금된 메뉴 중에서 선택 (재고 여부와 관계없이)
  if (state.unlockedMenus.length === 0) {
    return null // 해금된 메뉴가 없으면 손님 생성 안함
  }

  // 재고가 있는 메뉴 우선, 없으면 해금된 메뉴 중 랜덤
  const availableMenus = state.unlockedMenus.filter((menuId) => hasStock(state, menuId))
  const randomMenu = availableMenus.length > 0
    ? availableMenus[Math.floor(Math.random() * availableMenus.length)]
    : state.unlockedMenus[Math.floor(Math.random() * state.unlockedMenus.length)]

  const randomEmoji = CUSTOMER_EMOJIS[Math.floor(Math.random() * CUSTOMER_EMOJIS.length)]
  const characterImage = getRandomCharacterImage()

  return {
    id: `customer-${Date.now()}-${Math.random()}`,
    order: randomMenu,
    emoji: randomEmoji, // 하위 호환성
    characterImage: characterImage,
    patience: 15, // 15초 인내심
    spawnTime: currentTime,
  }
}

// 메뉴 서빙 (재고 소모)
export function serveCustomer(
  state: CafeGameState,
  customerId: string,
  menuId: string
): { success: boolean; newState: CafeGameState; earned: number } {
  const customer = state.customers.find((c) => c.id === customerId)
  if (!customer || customer.order !== menuId) {
    return { success: false, newState: state, earned: 0 }
  }

  // 재고 확인
  if (!hasStock(state, menuId)) {
    return { success: false, newState: state, earned: 0 }
  }

  const menu = MENU_ITEMS.find((m) => m.id === menuId)
  if (!menu) {
    return { success: false, newState: state, earned: 0 }
  }

  const basePrice = menu.sellPrice
  const finalPrice = Math.floor(basePrice * state.upgrades.sellPriceMultiplier)

  // 재고 소모
  const newStock = { ...state.menuStock }
  newStock[menuId] = (newStock[menuId] || 0) - 1

  const newState: CafeGameState = {
    ...state,
    cash: state.cash + finalPrice,
    totalCashEarned: state.totalCashEarned + finalPrice,
    customersServed: state.customersServed + 1,
    customers: state.customers.filter((c) => c.id !== customerId),
    menuStock: newStock,
    stats: {
      ...state.stats,
      menuSales: {
        ...state.stats.menuSales,
        [menuId]: (state.stats.menuSales[menuId] || 0) + 1,
      },
    },
  }

  return { success: true, newState, earned: finalPrice }
}

// 손님 제거 (인내심 소진)
export function removeCustomer(state: CafeGameState, customerId: string): CafeGameState {
  return {
    ...state,
    customers: state.customers.filter((c) => c.id !== customerId),
  }
}

// 시간 포맷팅 (MM:SS)
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
