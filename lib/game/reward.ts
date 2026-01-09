/**
 * 간단한 보상 로직 (Phase 2용)
 * 60% 확률로 +100 Gold
 * 30% 확률로 -10% Gold
 * 10% 확률로 꽝
 */
export interface Reward {
  type: 'gold_gain' | 'gold_loss' | 'nothing'
  amount: number
  message: string
}

export function generateReward(currentGold: number): Reward {
  const random = Math.random()

  if (random < 0.6) {
    // 60% 확률: +100 Gold
    return {
      type: 'gold_gain',
      amount: 100,
      message: '+100 Gold 획득! 🎉',
    }
  } else if (random < 0.9) {
    // 30% 확률: -10% Gold
    const lossAmount = Math.floor(currentGold * 0.1)
    return {
      type: 'gold_loss',
      amount: lossAmount,
      message: `-${lossAmount} Gold 손실... 😢`,
    }
  } else {
    // 10% 확률: 꽝
    return {
      type: 'nothing',
      amount: 0,
      message: '아무것도 없습니다... 📭',
    }
  }
}
