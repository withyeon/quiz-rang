/**
 * 6자리 랜덤 방 코드 생성
 * 숫자만 사용
 */
export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

/**
 * 방 코드 유효성 검사
 */
export function isValidRoomCode(code: string): boolean {
  return /^[0-9]{6}$/.test(code)
}
