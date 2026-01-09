import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row']

export type BoxEventType = 'GOLD_GAIN' | 'GOLD_LOSS' | 'SWAP' | 'NOTHING'

export interface BoxEvent {
  type: BoxEventType
  value?: number // Gold 양 (GOLD_GAIN, GOLD_LOSS의 경우)
  targetPlayerId?: string // Swap 대상 플레이어 ID
  message: string
}

/**
 * Gold Quest 상자 이벤트 생성
 * @param currentGold 현재 플레이어의 Gold
 * @param players 전체 플레이어 목록
 * @param currentPlayerId 현재 플레이어 ID
 * @param isMannerMode 매너 모드 (Swap 금지) 여부
 * @returns BoxEvent
 */
export function generateBoxEvent(
  currentGold: number,
  players: Player[],
  currentPlayerId: string,
  isMannerMode: boolean = false
): BoxEvent {
  const random = Math.random()

  // 매너 모드가 아니고 Swap 확률 (15%)
  if (!isMannerMode && random < 0.15) {
    const swapTarget = selectSwapTarget(players, currentPlayerId)
    if (swapTarget) {
      return {
        type: 'SWAP',
        targetPlayerId: swapTarget.id,
        message: `${swapTarget.nickname}님과 점수를 교환합니다!`,
      }
    }
  }

  // Gold 획득 (40%)
  if (random < 0.55) {
    const gainPercent = [10, 25, 50][Math.floor(Math.random() * 3)]
    const gainAmount = Math.floor((currentGold * gainPercent) / 100)
    return {
      type: 'GOLD_GAIN',
      value: gainAmount,
      message: `+${gainAmount} Gold 획득! (${gainPercent}%)`,
    }
  }

  // Gold 손실 (30%)
  if (random < 0.85) {
    const lossPercent = [10, 25][Math.floor(Math.random() * 2)]
    const lossAmount = Math.floor((currentGold * lossPercent) / 100)
    return {
      type: 'GOLD_LOSS',
      value: lossAmount,
      message: `-${lossAmount} Gold 손실... (${lossPercent}%)`,
    }
  }

  // Nothing (15%)
  return {
    type: 'NOTHING',
    message: '아무것도 없습니다...',
  }
}

/**
 * Swap 대상 플레이어 선택
 * 50% 확률로 1등, 50% 확률로 랜덤 플레이어
 */
function selectSwapTarget(players: Player[], currentPlayerId: string): Player | null {
  const otherPlayers = players.filter((p) => p.id !== currentPlayerId)
  if (otherPlayers.length === 0) return null

  // 1등 플레이어 찾기
  const topPlayer = otherPlayers.reduce((top, player) =>
    player.score > top.score ? player : top
  )

  // 50% 확률로 1등 또는 랜덤
  if (Math.random() < 0.5 && topPlayer) {
    return topPlayer
  }

  // 랜덤 플레이어
  const randomIndex = Math.floor(Math.random() * otherPlayers.length)
  return otherPlayers[randomIndex]
}

/**
 * BoxEvent를 적용하여 플레이어 점수 업데이트
 */
export async function applyBoxEvent(
  event: BoxEvent,
  currentPlayerId: string,
  currentPlayer: Player,
  targetPlayer: Player | null,
  supabaseClient: any
): Promise<void> {
  switch (event.type) {
    case 'GOLD_GAIN':
      if (event.value !== undefined) {
        await supabaseClient
          .from('players')
          .update({
            gold: currentPlayer.gold + event.value,
            score: currentPlayer.score + event.value,
          })
          .eq('id', currentPlayerId)
      }
      break

    case 'GOLD_LOSS':
      if (event.value !== undefined) {
        await supabaseClient
          .from('players')
          .update({
            gold: Math.max(currentPlayer.gold - event.value, 0),
            score: Math.max(currentPlayer.score - event.value, 0),
          })
          .eq('id', currentPlayerId)
      }
      break

    case 'SWAP':
      if (event.targetPlayerId && targetPlayer) {
        // 두 플레이어의 점수와 Gold 교환
        const tempScore = currentPlayer.score
        const tempGold = currentPlayer.gold

        // 현재 플레이어 업데이트
        await supabaseClient
          .from('players')
          .update({
            score: targetPlayer.score,
            gold: targetPlayer.gold,
          })
          .eq('id', currentPlayerId)

        // 대상 플레이어 업데이트
        await supabaseClient
          .from('players')
          .update({
            score: tempScore,
            gold: tempGold,
          })
          .eq('id', event.targetPlayerId)
      }
      break

    case 'NOTHING':
      // 아무것도 하지 않음
      break
  }
}
