'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type GameType = 'sequential' | 'free' | 'round' | 'team'

interface GameTypeInfo {
  id: GameType
  name: string
  description: string
  icon: string
  thumbnail: string
  isPro?: boolean
}

const GAME_TYPES: GameTypeInfo[] = [
  {
    id: 'sequential',
    name: '순서 풀이',
    description: '문제를 주어진 순서대로 풀어야 완료할 수 있어요',
    icon: '🎯',
    thumbnail: '⛷️',
  },
  {
    id: 'free',
    name: '자유 풀이',
    description: '원하는 순서대로 자유롭게 문제를 선택해서 풀 수 있어요',
    icon: '🗺️',
    thumbnail: '🏔️',
  },
  {
    id: 'round',
    name: '라운드전',
    description: '라운드별로 문제를 풀며 경쟁하는 방식이에요',
    icon: '⚔️',
    thumbnail: '🏟️',
  },
  {
    id: 'team',
    name: '팀전',
    description: '팀을 나눠서 함께 문제를 풀며 경쟁해요',
    icon: '👥',
    thumbnail: '🎄',
  },
]

interface GameTypeSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (gameType: GameType) => void
  questionSetName?: string
}

export default function GameTypeSelector({
  isOpen,
  onClose,
  onSelect,
  questionSetName,
}: GameTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<GameType | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedFilter, setSelectedFilter] = useState<string>('recommended')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConfirm = () => {
    if (selectedType) {
      onSelect(selectedType)
      onClose()
    }
  }

  if (!mounted || !isOpen) return null

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex"
        >
          {/* Left Panel - 카테고리 및 필터 */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
            <h2 className="text-xl font-bold text-gray-900 mb-6">게임 유형 선택</h2>

            {/* 카테고리 */}
            <div className="mb-6">
              <div className="space-y-1">
                {[
                  { id: 'all', name: '전체' },
                  { id: 'sequential', name: '순서 풀이' },
                  { id: 'free', name: '자유 풀이' },
                  { id: 'round', name: '라운드전' },
                  { id: 'team', name: '팀전' },
                ].map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-purple-600 text-white font-semibold'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 필터 버튼 */}
            <div className="space-y-2">
              {['추천', '무료', 'Basic', 'Pro'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`w-full px-4 py-2 rounded-lg border-2 transition-colors ${
                    selectedFilter === filter
                      ? filter === 'Pro'
                        ? 'bg-green-500 text-white border-green-600'
                        : 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {filter}
                    {filter === 'Pro' && <Zap className="h-4 w-4" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Middle Panel - 게임 유형 리스트 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">추천 게임 유형</h3>
              <div className="grid grid-cols-2 gap-4">
                {GAME_TYPES.filter((type) => 
                  selectedCategory === 'all' || type.id === selectedCategory
                ).map((type) => (
                  <motion.div
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`relative cursor-pointer rounded-xl border-4 transition-all ${
                      selectedType === type.id
                        ? 'border-purple-500 bg-purple-50 scale-105 shadow-xl'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* 썸네일 */}
                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                      <span className="text-6xl">{type.thumbnail}</span>
                      {type.isPro && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Pro
                        </div>
                      )}
                      {selectedType === type.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 bg-purple-500/20 flex items-center justify-center"
                        >
                          <div className="bg-purple-600 text-white rounded-full p-3">
                            <Check className="h-6 w-6" />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{type.icon}</span>
                        <h4 className="font-bold text-gray-900">{type.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pro 게임 유형 (추가) */}
            {selectedFilter === 'Pro' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Pro 게임 유형</h3>
                <div className="grid grid-cols-2 gap-4">
                  {GAME_TYPES.map((type) => (
                    <motion.div
                      key={`pro-${type.id}`}
                      onClick={() => setSelectedType(type.id)}
                      className={`relative cursor-pointer rounded-xl border-4 transition-all ${
                        selectedType === type.id
                          ? 'border-green-500 bg-green-50 scale-105 shadow-xl'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="aspect-video bg-gradient-to-br from-green-100 to-emerald-100 rounded-t-xl flex items-center justify-center relative overflow-hidden">
                        <span className="text-6xl">{type.thumbnail}</span>
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Pro
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{type.icon}</span>
                          <h4 className="font-bold text-gray-900">{type.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - 선택된 게임 유형 상세 */}
          {selectedType && (
            <div className="w-80 bg-gray-50 border-l border-gray-200 p-6 flex flex-col">
              <button
                onClick={onClose}
                className="self-end text-gray-400 hover:text-gray-600 mb-4"
              >
                <X className="h-6 w-6" />
              </button>

              {(() => {
                const type = GAME_TYPES.find(t => t.id === selectedType)!
                return (
                  <>
                    {/* 미리보기 */}
                    <div className="bg-white rounded-xl p-4 mb-4 border-2 border-gray-200 relative aspect-video flex items-center justify-center overflow-hidden">
                      <span className="text-8xl">{type.thumbnail}</span>
                      <Button
                        size="sm"
                        className="absolute top-2 right-2 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        ▷ 체험하기
                      </Button>
                    </div>

                    {/* 제목 및 배지 */}
                    <div className="mb-4">
                      {type.isPro && (
                        <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold mb-2 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Pro
                        </span>
                      )}
                      <h3 className="text-2xl font-bold text-gray-900">{type.name}</h3>
                    </div>

                    {/* 설명 */}
                    <div className="mb-6 space-y-2">
                      <p className="text-gray-700">{type.description}</p>
                      {type.id === 'sequential' && (
                        <p className="text-sm text-gray-600">
                          문제를 주어진 순서대로 풀어야 완료할 수 있어요
                        </p>
                      )}
                      {type.isPro && (
                        <p className="text-sm text-purple-600 flex items-center gap-1">
                          <Zap className="h-4 w-4" />
                          Pro 플랜에서만 이용할 수 있어요
                        </p>
                      )}
                    </div>

                    {/* 확인 버튼 */}
                    <Button
                      onClick={handleConfirm}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg font-bold"
                    >
                      이 유형으로 게임 시작하기
                    </Button>
                  </>
                )
              })()}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
