// Cafe 게임 Zustand Store

import { create } from 'zustand'
import {
  CafeGameState,
  getInitialState,
  buyMenu,
  buyUpgrade,
  serveCustomer,
  removeCustomer,
  spawnCustomer,
  restockMenu,
  MENU_ITEMS,
  UPGRADES,
} from '@/lib/game/cafe'

interface CafeStore extends CafeGameState {
  // Actions
  startGame: (duration: number) => void
  tickTimer: () => void
  earnCash: (amount: number) => void
  purchaseMenu: (menuId: string) => void
  purchaseUpgrade: (upgradeId: string) => void
  serveMenu: (customerId: string, menuId: string) => { success: boolean; earned: number }
  addCustomer: () => void
  removeExpiredCustomer: (customerId: string) => void
  resetGame: () => void
  updateCustomers: (currentTime: number) => void
  restockMenu: (menuId: string) => void // 퀴즈 정답 시 메뉴 재고충전
}

export const useCafeStore = create<CafeStore>((set, get) => ({
  ...getInitialState(),

  startGame: (duration: number) => {
    set({
      ...getInitialState(),
      status: 'playing',
      timeRemaining: duration,
    })
  },

  tickTimer: () => {
    const state = get()
    if (state.status !== 'playing') return

    const newTime = state.timeRemaining - 1
    if (newTime <= 0) {
      set({
        ...state,
        status: 'ended',
        timeRemaining: 0,
      })
    } else {
      set({
        ...state,
        timeRemaining: newTime,
      })
    }
  },

  earnCash: (amount: number) => {
    set((state) => ({
      ...state,
      cash: state.cash + amount,
      totalCashEarned: state.totalCashEarned + amount,
    }))
  },

  purchaseMenu: (menuId: string) => {
    set((state) => buyMenu(state, menuId))
  },

  purchaseUpgrade: (upgradeId: string) => {
    set((state) => buyUpgrade(state, upgradeId))
  },

  serveMenu: (customerId: string, menuId: string) => {
    const state = get()
    const result = serveCustomer(state, customerId, menuId)
    if (result.success) {
      set(result.newState)
    }
    return { success: result.success, earned: result.earned }
  },

  addCustomer: () => {
    const state = get()
    if (state.status !== 'playing') return

    const newCustomer = spawnCustomer(state, Date.now())
    if (newCustomer) {
      set({
        ...state,
        customers: [...state.customers, newCustomer],
      })
    }
  },

  restockMenu: (menuId: string) => {
    set((state) => restockMenu(state, menuId))
  },

  removeExpiredCustomer: (customerId: string) => {
    set((state) => removeCustomer(state, customerId))
  },

  resetGame: () => {
    set(getInitialState())
  },

  updateCustomers: (currentTime: number) => {
    const state = get()
    if (state.status !== 'playing') return

    // 인내심이 다한 손님 제거
    const validCustomers = state.customers.filter((customer) => {
      const elapsed = (currentTime - customer.spawnTime) / 1000
      return elapsed < customer.patience
    })

    if (validCustomers.length !== state.customers.length) {
      set({
        ...state,
        customers: validCustomers,
      })
    }
  },
}))
