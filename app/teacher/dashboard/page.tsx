'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase, checkSupabaseConfig } from '@/lib/supabase/client'
import { usePlayersRealtime } from '@/hooks/usePlayersRealtime'
import { useRoomRealtime } from '@/hooks/useRoomRealtime'
import { useAudioContext } from '@/components/AudioProvider'
import Leaderboard from '@/components/Leaderboard'
import RacingTrack from '@/components/RacingTrack'
import FishingPond from '@/components/FishingPond'
import FactoryView from '@/components/FactoryView'
import GameCodeModal from '@/components/GameCodeModal'
import { generateRoomCode } from '@/lib/utils/gameCode'
import QRCodeSVG from 'react-qr-code'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row']

export default function TeacherDashboard() {
  const [roomCode, setRoomCode] = useState('')
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [showGameCodeModal, setShowGameCodeModal] = useState(false)
  const [gameMode, setGameMode] = useState<'gold_quest' | 'racing' | 'battle_royale' | 'fishing' | 'factory' | 'cafe' | 'mafia' | 'pool' | 'dontlookdown'>('gold_quest')

  const { players, loading: playersLoading } = usePlayersRealtime({ roomCode })
  const { room, loading: roomLoading } = useRoomRealtime({ roomCode })
  const { playSFX } = useAudioContext()

  // room의 game_mode를 초기값으로 사용
  useEffect(() => {
    if (room?.game_mode) {
      setGameMode(room.game_mode as typeof gameMode)
    }
  }, [room?.game_mode])

  // 게임 모드 변경 핸들러 (방이 있으면 DB도 업데이트)
  const handleGameModeChange = async (newMode: typeof gameMode) => {
    setGameMode(newMode)

    // 이미 방이 있으면 game_mode 업데이트
    if (roomCode) {
      try {
        await ((supabase
          .from('rooms') as any)
          .update({ game_mode: newMode })
          .eq('room_code', roomCode))
      } catch (error) {
        console.error('Error updating game mode:', error)
      }
    }
  }

  // 새 게임 생성 (랜덤 코드 생성)
  const handleCreateGame = async () => {
    playSFX('click')

    // Supabase 설정 확인
    const configCheck = checkSupabaseConfig()
    if (!configCheck.isValid) {
      alert(configCheck.error || 'Supabase 환경 변수가 설정되지 않았습니다.')
      return
    }

    // URL에서 set_id 가져오기
    const params = new URLSearchParams(window.location.search)
    const setId = params.get('set')

    // 랜덤 방 코드 생성
    const newRoomCode = generateRoomCode()
    setRoomCode(newRoomCode)

    try {
      console.log('방 생성 시도:', newRoomCode, 'Set ID:', setId)

      // 방 생성 (waiting 상태로)
      const { data, error: createError } = await ((supabase.from('rooms') as any).insert({
        room_code: newRoomCode,
        status: 'waiting',
        current_q_index: 0,
        game_mode: gameMode,
        set_id: setId || null, // set_id 추가
      } as any))

      if (createError) {
        console.error('방 생성 에러 상세:', {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code,
        })
        throw createError
      }

      console.log('방 생성 성공:', data)

      // 게임 코드 모달 표시
      setShowGameCodeModal(true)
      setIsGameStarted(false)
    } catch (error: any) {
      console.error('Error creating room:', error)
      const errorMessage = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? error.message // Supabase error often has a message property
          : JSON.stringify(error)

      let userMessage = `방 생성에 실패했습니다: ${errorMessage}`
      if (errorMessage.includes('violates foreign key constraint')) {
        userMessage = `방 생성 실패: 선택한 문제집(ID: ${setId})이 존재하지 않거나 유효하지 않습니다.\n\n문제집 목록을 다시 불러오거나 다른 문제집을 선택해주세요.`
      } else {
        userMessage += `\n\n(요청한 Set ID: ${setId})`
      }

      alert(userMessage)
    }
  }

  // 실제 게임 시작 (모달에서 시작 버튼 클릭 시)
  const handleConfirmStart = async () => {
    if (!roomCode) return
    playSFX('click')

    try {
      // Battle Royale 모드일 경우 모든 플레이어 체력을 100으로 초기화
      if (gameMode === 'battle_royale') {
        const { error: healthResetError } = await ((supabase
          .from('players') as any)
          .update({ health: 100 })
          .eq('room_code', roomCode))

        if (healthResetError) {
          console.error('Error resetting health:', healthResetError)
          // 체력 초기화 실패해도 게임은 시작
        }
      }

      // 방 상태를 playing으로 변경
      const { error: updateError } = await ((supabase
        .from('rooms') as any)
        .update({ status: 'playing' })
        .eq('room_code', roomCode))

      if (updateError) throw updateError

      setIsGameStarted(true)
      setShowGameCodeModal(false)
    } catch (error) {
      console.error('Error starting game:', error)
      alert('게임 시작에 실패했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // 게임 종료
  const handleEndGame = async () => {
    if (!roomCode) return
    playSFX('click')

    try {
      const { error } = await ((supabase
        .from('rooms') as any)
        .update({ status: 'finished' })
        .eq('room_code', roomCode))

      if (error) throw error

      setIsGameStarted(false)
      alert('게임이 종료되었습니다.')
    } catch (error) {
      console.error('Error ending game:', error)
      alert('게임 종료에 실패했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // 게임 재시작
  const handleResetGame = async () => {
    if (!roomCode) return
    playSFX('click')

    try {
      const { error } = await ((supabase
        .from('rooms') as any)
        .update({ status: 'waiting', current_q_index: 0 })
        .eq('room_code', roomCode))

      if (error) throw error

      // 모든 플레이어 점수 초기화
      const { error: resetError } = await ((supabase
        .from('players') as any)
        .update({ score: 0, gold: 0 })
        .eq('room_code', roomCode))

      if (resetError) throw resetError

      setIsGameStarted(false)
      alert('게임이 초기화되었습니다.')
    } catch (error) {
      console.error('Error resetting game:', error)
      alert('게임 초기화에 실패했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  return (
    <div>
      {/* 페이지 제목 - 블루킷 스타일 */}
      <h1 className="text-4xl font-bold text-gray-900 mb-8">게임 시작</h1>

      {/* 방 설정 */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">

        {/* 게임 모드 선택 */}
        {!roomCode && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-4">게임 모드 선택</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleGameModeChange('gold_quest')}
                className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${gameMode === 'gold_quest'
                  ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <Image
                  src="/gold-quest.png"
                  alt="Gold Quest"
                  width={500}
                  height={500}
                  className="w-96 h-96 object-contain mb-4"
                />
                <div className="font-bold text-xl text-gray-900 mb-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>🏴‍☠️ 해적왕의 보물찾기</div>
                <div className="text-base text-gray-600 text-center px-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>황금빛 보물이 잠든 섬, 지도를 따라 모험을 떠나는 짜릿한 해적 어드벤처!</div>
              </button>
              <button
                onClick={() => handleGameModeChange('racing')}
                className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${gameMode === 'racing'
                  ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <Image
                  src="/racing.png"
                  alt="Racing"
                  width={500}
                  height={500}
                  className="w-96 h-96 object-contain mb-4"
                />
                <div className="font-bold text-xl text-gray-900 mb-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>🏃 미션: 등교 임파서블</div>
                <div className="text-base text-gray-600 text-center px-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>닫히는 교문을 향해 전력 질주! 장애물을 피해 달리는 스릴 만점 등교 레이싱.</div>
              </button>
              <button
                onClick={() => handleGameModeChange('battle_royale')}
                className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${gameMode === 'battle_royale'
                  ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <Image
                  src="/battle-royale.png"
                  alt="Battle Royale"
                  width={500}
                  height={500}
                  className="w-96 h-96 object-contain mb-4"
                />
                <div className="font-bold text-xl text-gray-900 mb-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>❄️ 눈싸움 대작전</div>
                <div className="text-base text-gray-600 text-center px-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>던지고 피하고 명중시켜라! 설원 위에서 펼쳐지는 예측불허 스노우 액션.</div>
              </button>
              <button
                onClick={() => handleGameModeChange('fishing')}
                className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${gameMode === 'fishing'
                  ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <Image
                  src="/fishing.png"
                  alt="Fishing"
                  width={500}
                  height={500}
                  className="w-96 h-96 object-contain mb-4"
                />
                <div className="font-bold text-xl text-gray-900 mb-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>🕹️ 두근두근 인형뽑기</div>
                <div className="text-base text-gray-600 text-center px-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>손끝에 집중하라! 집게가 움직일 때마다 심장이 쫄깃해지는 행운의 뽑기 한판.</div>
              </button>
              <button
                onClick={() => handleGameModeChange('factory')}
                className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${gameMode === 'factory'
                  ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <Image
                  src="/factory.png"
                  alt="Factory"
                  width={500}
                  height={500}
                  className="w-96 h-96 object-contain mb-4"
                />
                <div className="font-bold text-xl text-gray-900 mb-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>🏪 전설의 편의점</div>
                <div className="text-base text-gray-600 text-center px-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>진열부터 계산까지 내 손으로! 동네 최고의 핫플레이스를 만드는 경영 시뮬레이션.</div>
              </button>
              <button
                onClick={() => handleGameModeChange('cafe')}
                className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${gameMode === 'cafe'
                  ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <Image
                  src="/cafe.png"
                  alt="Cafe"
                  width={500}
                  height={500}
                  className="w-96 h-96 object-contain mb-4"
                />
                <div className="font-bold text-xl text-gray-900 mb-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>☕ 달콤 바삭 카페</div>
                <div className="text-base text-gray-600 text-center px-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>손님에게 음식을 서빙하고 카페를 성장시키는 달콤한 경영 게임!</div>
              </button>
              <button
                onClick={() => handleGameModeChange('mafia')}
                className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${gameMode === 'mafia'
                  ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <Image
                  src="/mafia.png"
                  alt="Mafia"
                  width={500}
                  height={500}
                  className="w-96 h-96 object-contain mb-4"
                />
                <div className="font-bold text-xl text-gray-900 mb-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>🕴️ 쉿! 마피아</div>
                <div className="text-base text-gray-600 text-center px-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>금고를 털고, 배신하고, 색출하라! 느와르 스타일의 심리전 게임!</div>
              </button>
              <button
                onClick={() => handleGameModeChange('pool')}
                className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${gameMode === 'pool'
                  ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <div className="text-9xl mb-4">🎱</div>
                <div className="font-bold text-xl text-gray-900 mb-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>🎱 포켓볼 게임</div>
                <div className="text-base text-gray-600 text-center px-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>퀴즈를 풀고 정답을 맞추면 공을 칠 수 있어요! 구멍에 넣으면 점수 획득!</div>
              </button>
              <button
                onClick={() => handleGameModeChange('dontlookdown')}
                className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${gameMode === 'dontlookdown'
                  ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <div className="text-9xl mb-4">⛰️</div>
                <div className="font-bold text-xl text-gray-900 mb-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>⛰️ Don't Look Down</div>
                <div className="text-base text-gray-600 text-center px-2" style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}>플랫폼을 점프하며 정상까지! 퀴즈로 에너지 얻고 더블 점프로 오르는 스릴 만점 등반 게임.</div>
              </button>
            </div>
          </div>
        )}

        {roomCode ? (
          <div className="space-y-4">
            {/* 현재 방 코드 표시 - 깔끔한 디자인 */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-8 text-center shadow-md">
              <p className="text-blue-100 text-sm mb-3 font-medium">게임 참가 코드</p>
              <div className="text-7xl font-bold text-white tracking-wider mb-4">
                {roomCode}
              </div>
              <div className="flex items-center justify-center gap-4 text-blue-50">
                <span className="text-lg font-semibold">참가자: {players.length}명</span>
              </div>
            </div>

            {/* QR 코드 미리보기 */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-md border-2 border-gray-200">
                <QRCodeSVG
                  value={typeof window !== 'undefined' ? `${window.location.origin}/play/${roomCode}` : ''}
                  size={180}
                  level="H"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowGameCodeModal(true)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-semibold border border-gray-200"
              >
                📋 코드 다시 보기
              </button>
              {!isGameStarted ? (
                <button
                  onClick={handleConfirmStart}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                >
                  🎮 게임 시작
                </button>
              ) : (
                <>
                  <button
                    onClick={handleEndGame}
                    className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-sm"
                  >
                    ⏹️ 게임 종료
                  </button>
                  <button
                    onClick={handleResetGame}
                    className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-semibold shadow-sm"
                  >
                    🔄 초기화
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-6 text-lg font-medium">게임을 시작하려면 아래 버튼을 클릭하세요</p>
            <button
              onClick={handleCreateGame}
              className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-8 rounded-lg transition-all font-semibold text-lg shadow-sm hover:shadow-md"
            >
              🎮 새 게임 시작하기
            </button>
          </div>
        )}

        {room && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600">
              상태: <span className="font-semibold">{room.status}</span> | 문제 번호:{' '}
              <span className="font-semibold">{room.current_q_index + 1}</span>
            </div>
          </div>
        )}
      </div>

      {/* 게임 모드에 따른 표시 */}
      {roomCode && room && (
        <>
          {room.game_mode === 'racing' ? (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">🏁 레이스 현황</h2>
              <RacingTrack
                players={players.map(p => ({ ...p, position: p.position || 0 }))}
                currentPlayerId={null}
                trackLength={1000}
              />
              {/* 레이싱 순위 */}
              <div className="mt-6">
                <Leaderboard
                  players={players}
                  currentPlayerId={null}
                  sortBy="score"
                  title="🏁 레이싱 순위"
                />
              </div>
            </div>
          ) : (room.game_mode as string) === 'battle_royale' ? (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">⚔️ 배틀 현황</h2>
              <div className="bg-gradient-to-br from-red-900 via-red-800 to-orange-900 rounded-xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {players.map((player) => {
                    const health = player.health || 100
                    const isAlive = health > 0
                    return (
                      <div
                        key={player.id}
                        className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 border-2 ${isAlive ? 'border-white/30' : 'border-gray-500'
                          }`}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">{player.avatar || '🐕'}</div>
                          <div className="font-bold text-white text-sm mb-1">
                            {player.nickname}
                          </div>
                          <div className={`text-lg font-bold ${isAlive ? 'text-green-300' : 'text-gray-400'
                            }`}>
                            {health} HP
                          </div>
                          {!isAlive && (
                            <div className="text-xs text-gray-400 mt-1">💀 탈락</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 text-center">
                  <div className="bg-black/50 rounded-lg p-3 inline-block">
                    <span className="text-white font-bold">
                      생존자: {players.filter(p => (p.health || 100) > 0).length}명
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (room.game_mode as string) === 'fishing' ? (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">🕹️ 인형뽑기 현황</h2>
              <FishingPond
                players={players as any}
                currentPlayerId={null}
              />
              <div className="mt-6">
                <Leaderboard
                  players={players}
                  currentPlayerId={null}
                  sortBy="score"
                  title="🎣 낚시 순위"
                />
              </div>
            </div>
          ) : (room.game_mode as string) === 'factory' ? (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">🏭 팩토리 현황</h2>
              <FactoryView
                players={players as any}
                currentPlayerId={null}
                roomCode={roomCode}
              />
            </div>
          ) : (room.game_mode as string) === 'pool' ? (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">🎱 포켓볼 게임 현황</h2>
              <Leaderboard
                players={players}
                currentPlayerId={null}
                sortBy="score"
                title="🎱 포켓볼 점수 순위"
              />
            </div>
          ) : (room.game_mode as string) === 'dontlookdown' ? (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">⛰️ Don't Look Down 현황</h2>
              <Leaderboard
                players={players}
                currentPlayerId={null}
                sortBy="score"
                title="⛰️ 높이 순위"
              />
            </div>
          ) : (
            <Leaderboard
              players={players}
              currentPlayerId={null}
              sortBy="gold"
              title="💰 금괴 순위"
            />
          )}
        </>
      )}

      {!roomCode && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <p className="text-gray-600">게임을 시작하면 여기에 참가자 목록이 표시됩니다.</p>
        </div>
      )}

      {/* 게임 코드 모달 */}
      <GameCodeModal
        roomCode={roomCode}
        isOpen={showGameCodeModal}
        onClose={() => setShowGameCodeModal(false)}
        onStartGame={handleConfirmStart}
        onCopy={() => {
          // 복사 완료 시 추가 동작 (선택적)
        }}
      />
    </div>
  )
}
