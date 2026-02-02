/**
 * Don't Look Down 게임 로직
 * Gimkit의 Don't Look Down을 기반으로 한 플랫폼 점프 퀴즈 게임
 */

// ============================================
// 타입 정의
// ============================================

export interface DLDPlayer {
    id: string
    nickname: string
    avatar: string
    x: number              // X 좌표
    y: number              // Y 좌표 (높이)
    vx: number             // X 속도
    vy: number             // Y 속도
    energy: number         // 남은 에너지
    height: number         // 최고 도달 높이 (미터)
    isOnGround: boolean    // 플랫폼 위에 있는지
    canDoubleJump: boolean // 더블 점프 가능 여부
    facingRight: boolean   // 오른쪽을 보고 있는지
}

export interface Platform {
    id: string
    x: number              // 왼쪽 끝 X 좌표
    y: number              // 상단 Y 좌표
    width: number          // 폭
    height: number         // 높이
    type: 'normal' | 'checkpoint' | 'peak' | 'start'
}

export interface GameSettings {
    duration: number           // 게임 시간 (초)
    energyPerQuestion: number  // 문제당 에너지
    summitGoal: number        // 정상 높이 (미터)
    checkpointsEnabled: boolean
}

export interface DLDGameState {
    players: Map<string, DLDPlayer>
    platforms: Platform[]
    winner: string | null
    gameStartTime: number
    settings: GameSettings
}

// ============================================
// 게임 상수
// ============================================

export const PHYSICS = {
    GRAVITY: 0.8,              // 중력
    JUMP_POWER: -15,           // 점프 힘
    DOUBLE_JUMP_POWER: -12,    // 더블 점프 힘
    MOVE_SPEED: 5,             // 이동 속도
    RUN_MULTIPLIER: 1.5,       // 달리기 배수
    MAX_FALL_SPEED: 20,        // 최대 낙하 속도
    FRICTION: 0.8,             // 마찰력
    AIR_RESISTANCE: 0.95,      // 공기 저항
} as const

export const ENERGY = {
    MOVE_COST: 1,              // 이동 시 에너지 소모 (프레임당)
    JUMP_COST: 10,             // 점프 에너지 소모
    DOUBLE_JUMP_COST: 15,      // 더블 점프 에너지 소모
} as const

export const PLAYER_SIZE = {
    WIDTH: 30,
    HEIGHT: 40,
} as const

export const METERS_PER_PIXEL = 0.1 // 10픽셀 = 1미터

// 기본 설정
export const DEFAULT_SETTINGS: GameSettings = {
    duration: 300,             // 5분
    energyPerQuestion: 100,    // 문제당 100 에너지
    summitGoal: 100,          // 100미터
    checkpointsEnabled: false,
}

// ============================================
// 플랫폼 맵 생성
// ============================================

export function generatePlatformMap(summitGoal: number): Platform[] {
    const platforms: Platform[] = []

    // 시작 플랫폼 (바닥)
    platforms.push({
        id: 'start',
        x: 0,
        y: 600,
        width: 800,
        height: 40,
        type: 'start',
    })

    // 정상까지 플랫폼 생성
    const targetPixelHeight = summitGoal / METERS_PER_PIXEL
    let currentY = 560 // 시작 위치 위
    let platformId = 0
    let checkpointCounter = 0

    while (currentY > -targetPixelHeight) {
        // 높이에 따라 난이도 조정
        const progress = Math.abs(currentY - 560) / targetPixelHeight
        const difficulty = Math.min(progress * 2, 1) // 0 ~ 1

        // 플랫폼 개수 (난이도에 따라 감소)
        const numPlatforms = Math.floor(3 - difficulty * 1) // 3 ~ 2개

        // 플랫폼 간격 (난이도에 따라 증가)
        const horizontalSpacing = 150 + difficulty * 100 // 150 ~ 250
        const verticalGap = 80 + difficulty * 30 // 80 ~ 110

        for (let i = 0; i < numPlatforms; i++) {
            const x = 50 + (i * horizontalSpacing) + (Math.random() * 50)
            const width = 100 - difficulty * 30 // 100 ~ 70

            // 화면 안에 들어오도록
            const finalX = Math.max(10, Math.min(x, 800 - width - 10))

            platforms.push({
                id: `platform_${platformId++}`,
                x: finalX,
                y: currentY,
                width,
                height: 20,
                type: 'normal',
            })
        }

        // 체크포인트 플랫폼 (200픽셀마다)
        checkpointCounter += verticalGap
        if (checkpointCounter >= 200) {
            platforms.push({
                id: `checkpoint_${platformId++}`,
                x: 350,
                y: currentY - 50,
                width: 120,
                height: 25,
                type: 'checkpoint',
            })
            checkpointCounter = 0
        }

        currentY -= verticalGap
    }

    // 정상 플랫폼
    platforms.push({
        id: 'peak',
        x: 300,
        y: currentY - 100,
        width: 200,
        height: 40,
        type: 'peak',
    })

    return platforms
}

// ============================================
// 물리 및 충돌 감지
// ============================================

export function updatePlayerPhysics(
    player: DLDPlayer,
    platforms: Platform[],
    deltaTime: number = 1
): DLDPlayer {
    const updated = { ...player }

    // 중력 적용
    updated.vy += PHYSICS.GRAVITY * deltaTime

    // 최대 낙하 속도 제한
    if (updated.vy > PHYSICS.MAX_FALL_SPEED) {
        updated.vy = PHYSICS.MAX_FALL_SPEED
    }

    // 위치 업데이트
    updated.x += updated.vx * deltaTime
    updated.y += updated.vy * deltaTime

    // 공기 저항
    updated.vx *= PHYSICS.AIR_RESISTANCE

    // 플랫폼 충돌 감지
    updated.isOnGround = false

    for (const platform of platforms) {
        if (checkPlatformCollision(updated, platform)) {
            // 위에서 떨어지는 경우만 착지
            if (player.vy > 0 && player.y + PLAYER_SIZE.HEIGHT <= platform.y + 5) {
                updated.y = platform.y - PLAYER_SIZE.HEIGHT
                updated.vy = 0
                updated.isOnGround = true
                updated.canDoubleJump = true

                // 마찰력
                updated.vx *= PHYSICS.FRICTION
            }
        }
    }

    // 높이 계산 (미터)
    const heightInMeters = Math.abs(updated.y - 600) * METERS_PER_PIXEL
    if (heightInMeters > updated.height) {
        updated.height = heightInMeters
    }

    return updated
}

function checkPlatformCollision(player: DLDPlayer, platform: Platform): boolean {
    return (
        player.x + PLAYER_SIZE.WIDTH > platform.x &&
        player.x < platform.x + platform.width &&
        player.y + PLAYER_SIZE.HEIGHT > platform.y &&
        player.y < platform.y + platform.height
    )
}

// ============================================
// 플레이어 액션
// ============================================

export function movePlayer(
    player: DLDPlayer,
    direction: 'left' | 'right',
    isRunning: boolean = false
): DLDPlayer {
    // 에너지 체크
    if (player.energy < ENERGY.MOVE_COST) {
        return player
    }

    const speed = isRunning
        ? PHYSICS.MOVE_SPEED * PHYSICS.RUN_MULTIPLIER
        : PHYSICS.MOVE_SPEED

    return {
        ...player,
        vx: direction === 'left' ? -speed : speed,
        facingRight: direction === 'right',
        energy: player.energy - ENERGY.MOVE_COST,
    }
}

export function jumpPlayer(player: DLDPlayer, isDoubleJump: boolean = false): DLDPlayer {
    if (isDoubleJump) {
        // 더블 점프
        if (!player.canDoubleJump || player.energy < ENERGY.DOUBLE_JUMP_COST) {
            return player
        }

        return {
            ...player,
            vy: PHYSICS.DOUBLE_JUMP_POWER,
            canDoubleJump: false,
            energy: player.energy - ENERGY.DOUBLE_JUMP_COST,
        }
    } else {
        // 일반 점프
        if (!player.isOnGround || player.energy < ENERGY.JUMP_COST) {
            return player
        }

        return {
            ...player,
            vy: PHYSICS.JUMP_POWER,
            isOnGround: false,
            energy: player.energy - ENERGY.JUMP_COST,
        }
    }
}

export function giveEnergy(player: DLDPlayer, amount: number): DLDPlayer {
    return {
        ...player,
        energy: player.energy + amount,
    }
}

// ============================================
// 게임 상태 확인
// ============================================

export function checkWinner(
    players: Map<string, DLDPlayer>,
    summitGoal: number
): string | null {
    for (const [id, player] of players) {
        if (player.height >= summitGoal) {
            return id
        }
    }
    return null
}

export function getLeaderboard(players: Map<string, DLDPlayer>): DLDPlayer[] {
    return Array.from(players.values())
        .sort((a, b) => b.height - a.height)
}

export function isPlayerAtPeak(player: DLDPlayer, platforms: Platform[]): boolean {
    const peakPlatform = platforms.find(p => p.type === 'peak')
    if (!peakPlatform) return false

    return checkPlatformCollision(player, peakPlatform) && player.isOnGround
}

// ============================================
// 초기 플레이어 생성
// ============================================

export function createPlayer(
    id: string,
    nickname: string,
    avatar: string
): DLDPlayer {
    return {
        id,
        nickname,
        avatar,
        x: 400, // 중앙
        y: 560, // 시작 플랫폼 위
        vx: 0,
        vy: 0,
        energy: 100, // 시작 에너지
        height: 0,
        isOnGround: true,
        canDoubleJump: true,
        facingRight: true,
    }
}
