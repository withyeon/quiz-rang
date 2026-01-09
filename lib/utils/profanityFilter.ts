// 비속어 필터 (기본 목록, 실제로는 더 포괄적인 리스트 필요)
const PROFANITY_LIST = [
  '바보',
  '멍청이',
  '병신',
  '개새끼',
  '좆',
  '시발',
  '씨발',
  '개',
  '놈',
  '년',
  // 더 많은 비속어 추가 가능
]

/**
 * 닉네임에 비속어가 포함되어 있는지 확인
 */
export function containsProfanity(nickname: string): boolean {
  const lowerNickname = nickname.toLowerCase()
  return PROFANITY_LIST.some((word) => lowerNickname.includes(word.toLowerCase()))
}

/**
 * 닉네임 필터링 및 정제
 */
export function filterNickname(nickname: string): { isValid: boolean; filtered?: string } {
  const trimmed = nickname.trim()

  if (trimmed.length === 0) {
    return { isValid: false }
  }

  if (trimmed.length > 20) {
    return { isValid: false }
  }

  if (containsProfanity(trimmed)) {
    return { isValid: false }
  }

  return { isValid: true, filtered: trimmed }
}
