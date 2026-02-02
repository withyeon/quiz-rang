// Mafia Heist: Deceptive Dinos 스타일 게임 로직 및 타입 정의

export type MultiplierType = 1.5 | 2

export interface Player {
  id: string
  name: string
  isAi: boolean
  cash: number
  diamonds: number
  status: 'active' | 'jailed' | 'investigating'
  isCheating: boolean // 치팅 중인지
  cheatEndTime?: number // 치팅 종료 시간
  multipliers: MultiplierType[] // 보유한 배수들 (스택 가능)
}

export interface SafeVault {
  id: string
  reward: 'cash' | 'diamond' | 'multiplier_1.5' | 'multiplier_2' | 'empty'
  amount: number
  multiplierType?: MultiplierType
}

export interface GameLog {
  id: string
  message: string
  type: 'info' | 'warning' | 'success' | 'danger'
  timestamp: number
}

// AI 봇 이름들
export const AI_NAMES = ['Tony', 'Vinnie', 'Sonny', 'Frankie', 'Joey']

// 금고 개수 (Deceptive Dinos 스타일: 3개)
export const VAULT_COUNT = 3

// 시간 포맷팅 (MM:SS)
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 3개 금고 생성 (Deceptive Dinos 스타일)
// Deceptive Dinos 보상 참고:
// - Amber: +10 Fossils
// - Dino Egg: +25 Fossils
// - Dino Fossil: +50 Fossils
// - Stegosaurus: +75 Fossils
// - Velociraptor: +100 Fossils
// - Brontosaurus: +125 Fossils
// - Triceratops: +250 Fossils
// - Tyrannosaurus Rex: +500 Fossils
// - x1.5 Multiplier
// - x2 Multiplier
export function generateSafeVaults(): SafeVault[] {
  const vaults: SafeVault[] = []
  
  // 보상 분배 확률 (Deceptive Dinos 스타일):
  // - 소액 현금 (10-25): 25%
  // - 중간 현금 (50-100): 20%
  // - 대액 현금 (125-250): 10%
  // - 최대 현금 (500): 3%
  // - 다이아몬드 (1-3): 15%
  // - 배수 x1.5: 5% (낮은 확률)
  // - 배수 x2: 3% (낮은 확률)
  // - 빈칸: 19%
  
  for (let i = 0; i < VAULT_COUNT; i++) {
    const rand = Math.random()
    let reward: SafeVault['reward']
    let amount = 0
    let multiplierType: MultiplierType | undefined

    if (rand < 0.25) {
      // 소액 현금 (10-25) - Amber, Dino Egg 수준
      reward = 'cash'
      amount = Math.floor(Math.random() * 16) + 10 // 10-25
    } else if (rand < 0.45) {
      // 중간 현금 (50-100) - Dino Fossil, Stegosaurus, Velociraptor 수준
      reward = 'cash'
      const tier = Math.random()
      if (tier < 0.33) {
        amount = 50 // Dino Fossil
      } else if (tier < 0.67) {
        amount = 75 // Stegosaurus
      } else {
        amount = 100 // Velociraptor
      }
    } else if (rand < 0.55) {
      // 대액 현금 (125-250) - Brontosaurus, Triceratops 수준
      reward = 'cash'
      const tier = Math.random()
      if (tier < 0.5) {
        amount = 125 // Brontosaurus
      } else {
        amount = 250 // Triceratops
      }
    } else if (rand < 0.58) {
      // 최대 현금 (500) - Tyrannosaurus Rex 수준
      reward = 'cash'
      amount = 500
    } else if (rand < 0.73) {
      // 다이아몬드
      reward = 'diamond'
      amount = Math.floor(Math.random() * 3) + 1 // 1-3
    } else if (rand < 0.78) {
      // 배수 x1.5 (5% 확률)
      reward = 'multiplier_1.5'
      multiplierType = 1.5
      amount = 1
    } else if (rand < 0.81) {
      // 배수 x2 (3% 확률)
      reward = 'multiplier_2'
      multiplierType = 2
      amount = 1
    } else {
      // 빈칸 (19% 확률)
      reward = 'empty'
      amount = 0
    }

    vaults.push({
      id: `vault-${Date.now()}-${i}`,
      reward,
      amount,
      multiplierType,
    })
  }

  return vaults
}

// 초기 플레이어 생성
export function createInitialPlayers(): Player[] {
  const players: Player[] = [
    {
      id: 'player',
      name: 'Boss',
      isAi: false,
      cash: 0,
      diamonds: 0,
      status: 'active',
      isCheating: false,
      multipliers: [],
    },
  ]

  // AI 봇 3명 추가
  const selectedNames = [...AI_NAMES].sort(() => Math.random() - 0.5).slice(0, 3)
  selectedNames.forEach((name) => {
    players.push({
      id: `ai-${name.toLowerCase()}`,
      name,
      isAi: true,
      cash: Math.floor(Math.random() * 100) + 50, // 초기 자금
      diamonds: 0,
      status: 'active',
      isCheating: false,
      multipliers: [],
    })
  })

  return players
}

// 배수 계산 (모든 배수를 곱함)
export function calculateTotalMultiplier(multipliers: MultiplierType[]): number {
  return multipliers.reduce((total, mult) => total * mult, 1)
}

// 금고 열기 (배수 적용)
export function openSafeVault(
  vault: SafeVault,
  player: Player
): { newPlayer: Player; log: string } {
  let newPlayer = { ...player }
  let log = ''
  const totalMultiplier = calculateTotalMultiplier(player.multipliers)

  switch (vault.reward) {
    case 'cash': {
      const baseAmount = vault.amount
      const finalAmount = Math.floor(baseAmount * totalMultiplier)
      newPlayer.cash += finalAmount
      if (totalMultiplier > 1) {
        log = `${player.name}가 금고에서 $${baseAmount}를 발견했습니다! (배수 x${totalMultiplier.toFixed(1)} 적용: $${finalAmount})`
      } else {
        log = `${player.name}가 금고에서 $${finalAmount}를 발견했습니다.`
      }
      break
    }
    case 'diamond': {
      const baseAmount = vault.amount
      const finalAmount = Math.floor(baseAmount * totalMultiplier)
      newPlayer.diamonds += finalAmount
      if (totalMultiplier > 1) {
        log = `${player.name}가 다이아몬드 ${baseAmount}개를 발견했습니다! (배수 x${totalMultiplier.toFixed(1)} 적용: ${finalAmount}개)`
      } else {
        log = `${player.name}가 다이아몬드 ${finalAmount}개를 발견했습니다!`
      }
      break
    }
    case 'multiplier_1.5': {
      newPlayer.multipliers.push(1.5)
      log = `${player.name}가 배수 x1.5를 획득했습니다! (현재 배수: x${calculateTotalMultiplier(newPlayer.multipliers).toFixed(1)})`
      break
    }
    case 'multiplier_2': {
      newPlayer.multipliers.push(2)
      log = `${player.name}가 배수 x2를 획득했습니다! (현재 배수: x${calculateTotalMultiplier(newPlayer.multipliers).toFixed(1)})`
      break
    }
    case 'empty':
      log = `${player.name}가 빈 금고를 열었습니다.`
      break
  }

  return { newPlayer, log }
}

// Cheat 버튼 사용 (모든 금고 내용 보기)
export function useCheat(
  vaults: SafeVault[],
  player: Player,
  currentTime: number
): { newPlayer: Player; log: string; vaultContents: SafeVault[] } {
  // 치팅 시작 (5초간 지속)
  const cheatDuration = 5000
  const newPlayer = {
    ...player,
    isCheating: true,
    cheatEndTime: currentTime + cheatDuration,
  }

  // 모든 금고 내용 반환
  const vaultContents = vaults.map(v => ({ ...v }))

  return {
    newPlayer,
    log: `${player.name}가 치팅을 시작했습니다... (5초간 지속)`,
    vaultContents,
  }
}

// 치팅 감지 및 처벌
export function detectCheating(
  cheater: Player,
  currentTime: number
): { newPlayer: Player; log: string; caught: boolean } {
  // 치팅 중이고 아직 시간이 안 지났으면 감지
  if (cheater.isCheating && cheater.cheatEndTime && currentTime < cheater.cheatEndTime) {
    // 큰 손실: 현재 자금의 50% 차감
    const penalty = Math.floor(cheater.cash * 0.5)
    const newPlayer = {
      ...cheater,
      cash: Math.max(0, cheater.cash - penalty),
      isCheating: false,
      cheatEndTime: undefined,
    }

    return {
      newPlayer,
      log: `🚨 ${cheater.name}의 치팅이 발각되었습니다! $${penalty}를 잃었습니다.`,
      caught: true,
    }
  }

  // 치팅 시간이 지났으면 자동 종료
  if (cheater.isCheating && cheater.cheatEndTime && currentTime >= cheater.cheatEndTime) {
    return {
      newPlayer: {
        ...cheater,
        isCheating: false,
        cheatEndTime: undefined,
      },
      log: `${cheater.name}의 치팅 시간이 종료되었습니다.`,
      caught: false,
    }
  }

  return {
    newPlayer: cheater,
    log: '',
    caught: false,
  }
}

// 세탁된 자금 계산 (현금 + 다이아몬드 * 100)
export function calculateLaunderedCash(player: Player): number {
  return player.cash + player.diamonds * 100
}

// 조사 시도 (Deceptive Dinos 스타일)
export function attemptInvestigate(
  investigator: Player,
  target: Player,
  currentTime: number
): {
  success: boolean
  newInvestigator: Player
  newTarget: Player
  log: string
  result: 'CHEATER' | 'CLEAR'
  recovered?: number
} {
  if (target.status !== 'active') {
    return {
      success: false,
      newInvestigator: investigator,
      newTarget: target,
      log: `${target.name}는 이미 감옥에 있습니다.`,
      result: 'CLEAR',
    }
  }

  // 치팅 중이면 검거 성공
  if (target.isCheating && target.cheatEndTime && currentTime < target.cheatEndTime) {
    // 치팅 중인 플레이어의 자금 일부 획득 (30%)
    const recovered = Math.floor(target.cash * 0.3)
    const newInvestigator = {
      ...investigator,
      cash: investigator.cash + recovered,
    }
    const newTarget = {
      ...target,
      cash: Math.max(0, target.cash - recovered),
      isCheating: false,
      cheatEndTime: undefined,
    }

    return {
      success: true,
      newInvestigator,
      newTarget,
      log: `🚨 CHEATER! ${target.name}가 치팅 중이었습니다! ${investigator.name}는 $${recovered}를 획득했습니다.`,
      result: 'CHEATER',
      recovered,
    }
  }

  // 결백하면 아무것도 없음
  return {
    success: false,
    newInvestigator: investigator,
    newTarget: target,
    log: `CLEAR: ${target.name}는 결백했습니다.`,
    result: 'CLEAR',
  }
}


// AI 치팅 힌트 생성
export function generateCheatHint(cheater: Player): string {
  const hints = [
    `${cheater.name}가 주위를 두리번거립니다...`,
    `${cheater.name}의 행동이 수상합니다.`,
    `${cheater.name}가 금고를 계속 들여다봅니다...`,
    `누군가 치팅을 시도하고 있는 것 같습니다...`,
  ]
  return hints[Math.floor(Math.random() * hints.length)]
}

// AI 자동 행동 (금고 열기로 자금 획득)
export function aiAutoEarn(player: Player): { newPlayer: Player; log: string } {
  const baseEarned = Math.floor(Math.random() * 30) + 10 // 10-40
  const totalMultiplier = calculateTotalMultiplier(player.multipliers)
  const finalEarned = Math.floor(baseEarned * totalMultiplier)
  
  const newPlayer = {
    ...player,
    cash: player.cash + finalEarned,
  }
  
  if (totalMultiplier > 1) {
    const log = `${player.name}가 금고를 열어 $${baseEarned}를 획득했습니다. (배수 x${totalMultiplier.toFixed(1)} 적용: $${finalEarned})`
    return { newPlayer, log }
  } else {
    const log = `${player.name}가 금고를 열어 $${finalEarned}를 획득했습니다.`
    return { newPlayer, log }
  }
}

// AI 치팅 시도 (랜덤)
export function aiAttemptCheat(
  player: Player,
  vaults: SafeVault[],
  currentTime: number
): { newPlayer: Player; log: string; vaultContents: SafeVault[] | null } {
  // AI는 20% 확률로 치팅 시도
  if (Math.random() < 0.2 && !player.isCheating) {
    const result = useCheat(vaults, player, currentTime)
    const hint = generateCheatHint(result.newPlayer)
    return {
      newPlayer: result.newPlayer,
      log: hint,
      vaultContents: result.vaultContents,
    }
  }
  
  return {
    newPlayer: player,
    log: '',
    vaultContents: null,
  }
}
