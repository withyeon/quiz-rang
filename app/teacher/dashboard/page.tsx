'use client'

import { useState } from 'react'
import { supabase, checkSupabaseConfig } from '@/lib/supabase/client'
import { usePlayersRealtime } from '@/hooks/usePlayersRealtime'
import { useRoomRealtime } from '@/hooks/useRoomRealtime'
import { useAudioContext } from '@/components/AudioProvider'
import Leaderboard from '@/components/Leaderboard'
import GameCodeModal from '@/components/GameCodeModal'
import { generateRoomCode } from '@/lib/utils/gameCode'
import QRCodeSVG from 'react-qr-code'
import type { Database } from '@/types/database.types'

type Player = Database['public']['Tables']['players']['Row']

export default function TeacherDashboard() {
  const [roomCode, setRoomCode] = useState('')
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [showGameCodeModal, setShowGameCodeModal] = useState(false)

  const { players, loading: playersLoading } = usePlayersRealtime({ roomCode })
  const { room, loading: roomLoading } = useRoomRealtime({ roomCode })
  const { playSFX } = useAudioContext()

  // 새 게임 생성 (랜덤 코드 생성)
  const handleCreateGame = async () => {
    playSFX('click')
    
    // Supabase 설정 확인
    const configCheck = checkSupabaseConfig()
    if (!configCheck.isValid) {
      alert(configCheck.error || 'Supabase 환경 변수가 설정되지 않았습니다.')
      return
    }
    
    // 랜덤 방 코드 생성
    const newRoomCode = generateRoomCode()
    setRoomCode(newRoomCode)

    try {
      console.log('방 생성 시도:', newRoomCode)
      
      // 방 생성 (waiting 상태로)
      const { data, error: createError } = await ((supabase.from('rooms') as any).insert({
        room_code: newRoomCode,
        status: 'waiting',
        current_q_index: 0,
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
    } catch (error) {
      console.error('Error creating room:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error'
      alert(`방 생성에 실패했습니다: ${errorMessage}\n\n브라우저 콘솔을 확인해주세요.`)
    }
  }

  // 실제 게임 시작 (모달에서 시작 버튼 클릭 시)
  const handleConfirmStart = async () => {
    if (!roomCode) return
    playSFX('click')

    try {
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">선생님 대시보드</h1>

        {/* 방 설정 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">게임 시작</h2>
          
          {roomCode ? (
            <div className="space-y-4">
              {/* 현재 방 코드 표시 - 블루킷/젭 퀴즈 스타일 */}
              <div className="bg-gradient-to-r from-primary-500 to-indigo-600 rounded-xl p-8 text-center shadow-lg">
                <p className="text-white/80 text-sm mb-3">게임 참가 코드</p>
                <div className="text-7xl font-bold text-white tracking-wider mb-4 neon-glow">
                  {roomCode}
                </div>
                <div className="flex items-center justify-center gap-4 text-white/90">
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

              <div className="flex gap-2">
                <button
                  onClick={() => setShowGameCodeModal(true)}
                  className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md"
                >
                  📋 코드 다시 보기
                </button>
                {!isGameStarted ? (
                  <button
                    onClick={handleConfirmStart}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md"
                  >
                    🎮 게임 시작
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleEndGame}
                      className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md"
                    >
                      ⏹️ 게임 종료
                    </button>
                    <button
                      onClick={handleResetGame}
                      className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-md"
                    >
                      🔄 초기화
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-6 text-lg">게임을 시작하려면 아래 버튼을 클릭하세요</p>
              <button
                onClick={handleCreateGame}
                className="bg-gradient-to-r from-primary-500 to-indigo-600 text-white py-5 px-10 rounded-xl hover:from-primary-600 hover:to-indigo-700 transition-all font-bold text-xl shadow-xl hover:shadow-2xl transform hover:scale-105"
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

        {/* 실시간 랭킹 */}
        {roomCode && (
          <Leaderboard players={players} currentPlayerId={null} />
        )}

        {!roomCode && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600">게임을 시작하면 여기에 참가자 목록이 표시됩니다.</p>
          </div>
        )}
      </div>

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
    </main>
  )
}
