'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import type { Database } from '@/types/database.types'
import {
  type PlayerFactory,
  FACTORIES,
  canBuyFactory,
  canUpgradeFactory,
  calculateProduction,
  getFactoryColor,
  buyFactory,
  upgradeFactory,
} from '@/lib/game/factory'
import { supabase } from '@/lib/supabase/client'

type Player = Database['public']['Tables']['players']['Row'] & {
  factories?: PlayerFactory[]
  factory_money?: number
}

interface FactoryViewProps {
  players: Player[]
  currentPlayerId: string | null
  roomCode: string
}

export default function FactoryView({
  players,
  currentPlayerId,
  roomCode,
}: FactoryViewProps) {
  const currentPlayer = players.find((p) => p.id === currentPlayerId) as Player | undefined
  const [factories, setFactories] = useState<PlayerFactory[]>(
    (currentPlayer?.factories as PlayerFactory[]) || []
  )
  const [money, setMoney] = useState(currentPlayer?.factory_money || 0)
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())

  // DB 업데이트 함수
  const updateMoneyInDB = async (newMoney: number) => {
    if (!currentPlayerId) return
    try {
      await ((supabase
        .from('players') as any)
        .update({
          factory_money: newMoney,
          score: newMoney, // 점수도 돈으로
        })
        .eq('id', currentPlayerId))
    } catch (error) {
      console.error('Error updating money:', error)
    }
  }

  // 실시간 생산량 계산
  useEffect(() => {
    const interval = setInterval(() => {
      if (factories.length > 0) {
        const production = calculateProduction(factories, Date.now())
        if (production > 0) {
          setMoney((prev) => {
            const newMoney = prev + production
            // DB 업데이트
            if (currentPlayerId) {
              updateMoneyInDB(newMoney)
            }
            return newMoney
          })
          // 공장의 마지막 생산 시간 업데이트
          setFactories((prev) =>
            prev.map((f) => ({ ...f, lastProductionTime: Date.now() }))
          )
          setLastUpdateTime(Date.now())
        }
      }
    }, 1000) // 1초마다 업데이트

    return () => clearInterval(interval)
  }, [factories, currentPlayerId])

  const handleBuyFactory = async (factoryType: keyof typeof FACTORIES) => {
    if (!canBuyFactory(money, factoryType)) return

    const result = buyFactory(factoryType, money)
    if (result.success && result.factory) {
      const newFactories = [...factories, result.factory as PlayerFactory]
      setFactories(newFactories)
      setMoney(result.newMoney)

      // DB 업데이트
      if (currentPlayerId) {
        try {
          await ((supabase
            .from('players') as any)
            .update({
              factories: newFactories,
              factory_money: result.newMoney,
              score: result.newMoney,
            })
            .eq('id', currentPlayerId))
        } catch (error) {
          console.error('Error buying factory:', error)
        }
      }
    }
  }

  const handleUpgradeFactory = async (factoryId: string) => {
    const factory = factories.find((f) => f.id === factoryId)
    if (!factory || !canUpgradeFactory(money, factory)) return

    const result = upgradeFactory(factory, money)
    if (result.success && result.upgradedFactory) {
      const newFactories = factories.map((f) =>
        f.id === factoryId ? result.upgradedFactory! : f
      )
      setFactories(newFactories)
      setMoney(result.newMoney)

      // DB 업데이트
      if (currentPlayerId) {
        try {
          await ((supabase
            .from('players') as any)
            .update({
              factories: newFactories,
              factory_money: result.newMoney,
              score: result.newMoney,
            })
            .eq('id', currentPlayerId))
        } catch (error) {
          console.error('Error upgrading factory:', error)
        }
      }
    }
  }

  // 돈 순으로 정렬
  const sortedPlayers = [...players].sort((a, b) => {
    const moneyA = a.factory_money || 0
    const moneyB = b.factory_money || 0
    return moneyB - moneyA
  })

  return (
    <div className="space-y-6">
      {/* 현재 플레이어 정보 */}
      {currentPlayer && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 shadow-2xl border-4 border-green-400">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                💰 내 자산
              </h3>
              <motion.div
                key={money}
                initial={{ scale: 1.2, color: '#10b981' }}
                animate={{ scale: 1, color: '#ffffff' }}
                className="text-4xl font-bold text-white"
              >
                {money.toLocaleString()}원
              </motion.div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-sm mb-1">공장 수</div>
              <div className="text-3xl font-bold text-white">
                {factories.length}개
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 공장 구매 섹션 */}
      {currentPlayer && (
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
          <h3 className="text-xl font-bold mb-4">🏭 공장 구매</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(FACTORIES).map((factory) => {
              const canBuy = canBuyFactory(money, factory.type)
              const ownedFactory = factories.find((f) => f.id === factory.id)

              return (
                <motion.div
                  key={factory.id}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`${getFactoryColor(
                    factory.type
                  )} rounded-xl p-4 text-white shadow-lg ${
                    !canBuy ? 'opacity-50' : 'cursor-pointer'
                  }`}
                  onClick={() => canBuy && handleBuyFactory(factory.type)}
                >
                  <div className="text-4xl mb-2">{factory.emoji}</div>
                  <div className="font-bold text-sm mb-1">{factory.name}</div>
                  <div className="text-xs opacity-90 mb-2">
                    초당 {factory.productionRate}원
                  </div>
                  <div className="text-lg font-bold">
                    {factory.cost.toLocaleString()}원
                  </div>
                  {ownedFactory && (
                    <div className="mt-2 text-xs bg-white/20 rounded px-2 py-1">
                      Lv.{ownedFactory.level}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* 내 공장 목록 */}
      {currentPlayer && factories.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
          <h3 className="text-xl font-bold mb-4">🏗️ 내 공장</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {factories.map((factory) => {
              const canUpgrade = canUpgradeFactory(money, factory)
              const upgradeCost = factory.upgradeCost * factory.level
              const production = factory.productionRate * factory.level

              return (
                <motion.div
                  key={factory.id}
                  whileHover={{ scale: 1.02 }}
                  className={`${getFactoryColor(
                    factory.type
                  )} rounded-xl p-4 text-white shadow-md`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{factory.emoji}</div>
                      <div>
                        <div className="font-bold">{factory.name}</div>
                        <div className="text-sm opacity-90">Lv.{factory.level}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        초당 {production}원
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={canUpgrade ? { scale: 1.05 } : {}}
                    whileTap={canUpgrade ? { scale: 0.95 } : {}}
                    onClick={() => handleUpgradeFactory(factory.id)}
                    disabled={!canUpgrade}
                    className={`w-full py-2 rounded-lg font-bold text-sm ${
                      canUpgrade
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : 'bg-white/20 text-white/50 cursor-not-allowed'
                    }`}
                  >
                    업그레이드 ({upgradeCost.toLocaleString()}원)
                  </motion.button>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* 순위 */}
      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
        <h3 className="text-xl font-bold mb-4">📊 부자 순위</h3>
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const playerMoney = player.factory_money || 0
            const playerFactories = (player.factories as PlayerFactory[]) || []

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  player.id === currentPlayerId
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0
                        ? 'bg-yellow-500 text-yellow-900'
                        : index === 1
                        ? 'bg-gray-400 text-white'
                        : index === 2
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="text-2xl">{player.avatar || '🐕'}</div>
                  <div>
                    <div className="font-bold text-gray-900">
                      {player.nickname}
                      {player.id === currentPlayerId && (
                        <span className="ml-2 text-yellow-500">⭐</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      공장 {playerFactories.length}개
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {playerMoney.toLocaleString()}원
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
