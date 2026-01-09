'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { usePlayersRealtime } from '@/hooks/usePlayersRealtime'
import QRCodeSVG from 'react-qr-code'
import type { Database } from '@/types/database.types'
import { filterNickname } from '@/lib/utils/profanityFilter'

export default function LobbyPage() {
  const [roomCode, setRoomCode] = useState('TEST01')
  const [nickname, setNickname] = useState('')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState('🎮')
  const [isTeacher, setIsTeacher] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const avatars = ['🎮', '👤', '🎯', '🏆', '⭐', '🔥', '💎', '🌟', '🎨', '🚀', '🎪', '🎭']

  const { players, loading, error } = usePlayersRealtime({
    roomCode,
    onPlayerUpdate: (player) => {
      console.log('Player updated:', player)
    },
  })

  // 로비에서는 소리 재생하지 않음 (게임 시작 후에만 재생)

  // 초대 URL 생성
  const getInviteUrl = () => {
    if (typeof window === 'undefined') return ''
    const baseUrl = window.location.origin
    return `${baseUrl}/play/${roomCode}`
  }

  // URL 복사
  const handleCopyUrl = async () => {
    const url = getInviteUrl()
    try {
      await navigator.clipboard.writeText(url)
      alert('초대 링크가 복사되었습니다!')
    } catch (err) {
      console.error('복사 실패:', err)
      alert('복사에 실패했습니다. URL을 직접 복사해주세요.')
    }
  }

  // 방 입장
  const handleJoinRoom = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.')
      return
    }

    // 닉네임 필터링
    const nicknameCheck = filterNickname(nickname)
    if (!nicknameCheck.isValid) {
      alert('닉네임에 부적절한 단어가 포함되어 있거나 너무 깁니다. (최대 20자)')
      return
    }

    try {
      // 먼저 room이 존재하는지 확인 (없으면 생성)
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (roomError && roomError.code === 'PGRST116') {
        // 방이 없으면 생성
        const roomInsert: Database['public']['Tables']['rooms']['Insert'] = {
          room_code: roomCode,
          status: 'waiting',
          current_q_index: 0,
        }
        const { error: createError } = await (supabase
          .from('rooms')
          .insert(roomInsert as any) as any)

        if (createError) throw createError
      } else if (roomError) {
        throw roomError
      }

      // 플레이어 생성
      const playerInsert: Database['public']['Tables']['players']['Insert'] = {
        room_code: roomCode,
        nickname: nicknameCheck.filtered || nickname.trim(),
        score: 0,
        gold: 0,
        avatar: selectedAvatar,
        is_online: true,
      }
      const { data: playerData, error: playerError } = await (supabase
        .from('players')
        .insert(playerInsert as any)
        .select()
        .single() as any)

      if (playerError) throw playerError

      setPlayerId(playerData.id)
      setIsJoined(true)
    } catch (err) {
      console.error('Error joining room:', err)
      alert('방 입장에 실패했습니다: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  // 강퇴 기능 (선생님만)
  const handleKickPlayer = async (targetPlayerId: string) => {
    if (!isTeacher) return

    if (!confirm('정말 이 플레이어를 강퇴하시겠습니까?')) return

    try {
      const { error } = await supabase.from('players').delete().eq('id', targetPlayerId)

      if (error) throw error
      alert('플레이어가 강퇴되었습니다.')
    } catch (err) {
      console.error('Error kicking player:', err)
      alert('강퇴에 실패했습니다: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  // 점수 증가 (테스트용)
  const handleIncreaseScore = async () => {
    if (!playerId) return

    try {
      // 현재 점수 조회
      const { data: currentPlayer, error: fetchError } = await (supabase
        .from('players')
        .select('score, gold')
        .eq('id', playerId)
        .single() as any)

      if (fetchError) throw fetchError

      // 점수 증가
      const playerUpdate: Database['public']['Tables']['players']['Update'] = {
        score: (currentPlayer?.score || 0) + 10,
        gold: (currentPlayer?.gold || 0) + 10,
      }
      const { error: updateError } = await ((supabase
        .from('players') as any)
        .update(playerUpdate)
        .eq('id', playerId))

      if (updateError) throw updateError
    } catch (err) {
      console.error('Error updating score:', err)
      alert('점수 업데이트에 실패했습니다: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  // 점수 감소 (테스트용)
  const handleDecreaseScore = async () => {
    if (!playerId) return

    try {
      // 현재 점수 조회
      const { data: currentPlayer, error: fetchError } = await (supabase
        .from('players')
        .select('score, gold')
        .eq('id', playerId)
        .single() as any)

      if (fetchError) throw fetchError

      // 점수 감소 (0 이하로 내려가지 않도록)
      const playerUpdate: Database['public']['Tables']['players']['Update'] = {
        score: Math.max((currentPlayer?.score || 0) - 10, 0),
        gold: Math.max((currentPlayer?.gold || 0) - 10, 0),
      }
      const { error: updateError } = await ((supabase
        .from('players') as any)
        .update(playerUpdate)
        .eq('id', playerId))

      if (updateError) throw updateError
    } catch (err) {
      console.error('Error updating score:', err)
      alert('점수 업데이트에 실패했습니다: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">퀴즈랑</h1>
          <div className="flex gap-4 justify-center">
            <a
              href="/teacher"
              className="inline-block text-indigo-600 hover:text-indigo-800 underline"
            >
              선생님 페이지 (문제 생성) →
            </a>
            <span className="text-gray-400">|</span>
            <a
              href="/teacher/dashboard"
              className="inline-block text-indigo-600 hover:text-indigo-800 underline"
            >
              선생님 대시보드 (게임 관리) →
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">방 설정</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                방 코드
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isJoined}
                maxLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isJoined}
                placeholder="닉네임을 입력하세요 (최대 20자)"
                maxLength={20}
              />
              {nickname && !filterNickname(nickname).isValid && (
                <p className="text-red-500 text-xs mt-1">
                  부적절한 단어가 포함되어 있습니다.
                </p>
              )}
            </div>
            {!isJoined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  아바타 선택
                </label>
                <div className="flex gap-2 flex-wrap">
                  {avatars.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`text-3xl p-2 rounded-lg border-2 transition-all ${
                        selectedAvatar === avatar
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isTeacher}
                  onChange={(e) => setIsTeacher(e.target.checked)}
                  disabled={isJoined}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">선생님 모드 (강퇴 기능 사용 가능)</span>
              </label>
            </div>
            {!isJoined && (
              <button
                onClick={handleJoinRoom}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
              >
                방 입장
              </button>
            )}
            {isJoined && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-green-800 font-medium">
                    ✅ {nickname}님, 방에 입장하셨습니다!
                  </p>
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold text-primary-600">
                      {players.length}명 참가 중
                    </span>
                  </div>
                </div>
                <a
                  href={`/game?room=${roomCode}&playerId=${playerId}`}
                  className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium text-center mb-3"
                >
                  게임 시작하기 →
                </a>
                <div className="mt-4 p-4 bg-white rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-2">초대 링크</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={getInviteUrl()}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
                    >
                      복사
                    </button>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <QRCodeSVG value={getInviteUrl()} size={128} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isJoined && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">점수 테스트</h2>
            <div className="flex gap-4">
              <button
                onClick={handleIncreaseScore}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                +10 점수 증가
              </button>
              <button
                onClick={handleDecreaseScore}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                -10 점수 감소
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              버튼을 클릭하면 실시간으로 점수가 반영됩니다. 다른 브라우저나 탭에서도 확인해보세요!
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">플레이어 목록 (실시간)</h2>

          {loading && (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-800">에러: {error.message}</p>
              <p className="text-sm text-red-600 mt-2">
                Supabase 환경 변수가 설정되어 있는지 확인해주세요.
              </p>
            </div>
          )}

          {!loading && !error && (
            <>
              {players.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  아직 플레이어가 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                        player.id === playerId
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{player.avatar || '🎮'}</span>
                        <div>
                          <div className="font-semibold text-gray-800">
                            {player.nickname}
                            {player.id === playerId && (
                              <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                                나
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {player.is_online ? '🟢 온라인' : '🔴 오프라인'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-800">
                            {player.score}점
                          </div>
                          <div className="text-sm text-yellow-600">
                            💰 {player.gold} Gold
                          </div>
                        </div>
                        {isTeacher && player.id !== playerId && (
                          <button
                            onClick={() => handleKickPlayer(player.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            강퇴
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
