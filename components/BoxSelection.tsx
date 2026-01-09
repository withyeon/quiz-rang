'use client'

import { useState, useEffect } from 'react'
import type { BoxEvent } from '@/lib/game/goldQuest'

interface BoxSelectionProps {
  onBoxSelect: (boxIndex: number) => void
  selectedBox: number | null
  boxEvent: BoxEvent | null
  isSelecting: boolean
}

export default function BoxSelection({
  onBoxSelect,
  selectedBox,
  boxEvent,
  isSelecting,
}: BoxSelectionProps) {
  const [revealedBoxes, setRevealedBoxes] = useState<boolean[]>([false, false, false])

  useEffect(() => {
    if (selectedBox !== null && boxEvent) {
      // 선택된 상자만 열기
      setRevealedBoxes((prev) => {
        const newRevealed = [...prev]
        newRevealed[selectedBox] = true
        return newRevealed
      })
    }
  }, [selectedBox, boxEvent])

  const getBoxIcon = (index: number) => {
    if (!revealedBoxes[index]) return '📦'
    if (selectedBox !== index) return '📦'

    // 선택된 상자의 이벤트에 따른 아이콘
    if (!boxEvent) return '📦'
    switch (boxEvent.type) {
      case 'GOLD_GAIN':
        return '💰'
      case 'GOLD_LOSS':
        return '💸'
      case 'SWAP':
        return '🔄'
      case 'NOTHING':
        return '📭'
      default:
        return '📦'
    }
  }

  const getBoxColor = (index: number) => {
    if (!revealedBoxes[index]) return 'bg-yellow-100 border-yellow-300'
    if (selectedBox !== index) return 'bg-gray-100 border-gray-300 opacity-50'

    if (!boxEvent) return 'bg-yellow-100 border-yellow-300'
    switch (boxEvent.type) {
      case 'GOLD_GAIN':
        return 'bg-green-100 border-green-500'
      case 'GOLD_LOSS':
        return 'bg-red-100 border-red-500'
      case 'SWAP':
        return 'bg-purple-100 border-purple-500'
      case 'NOTHING':
        return 'bg-gray-100 border-gray-400'
      default:
        return 'bg-yellow-100 border-yellow-300'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        상자를 선택하세요!
      </h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => !isSelecting && onBoxSelect(index)}
            disabled={isSelecting || revealedBoxes[index]}
            className={`p-8 rounded-lg border-4 transition-all transform ${
              isSelecting || revealedBoxes[index]
                ? 'cursor-not-allowed'
                : 'hover:scale-105 hover:shadow-lg cursor-pointer'
            } ${getBoxColor(index)}`}
          >
            <div className="text-6xl mb-2">{getBoxIcon(index)}</div>
            <div className="text-sm font-medium text-gray-700">
              {revealedBoxes[index] && selectedBox === index && boxEvent
                ? boxEvent.message
                : '상자'}
            </div>
          </button>
        ))}
      </div>

      {boxEvent && selectedBox !== null && (
        <div
          className={`p-4 rounded-lg text-center font-semibold ${
            boxEvent.type === 'GOLD_GAIN'
              ? 'bg-green-50 text-green-800'
              : boxEvent.type === 'GOLD_LOSS'
              ? 'bg-red-50 text-red-800'
              : boxEvent.type === 'SWAP'
              ? 'bg-purple-50 text-purple-800'
              : 'bg-gray-50 text-gray-800'
          }`}
        >
          {boxEvent.message}
        </div>
      )}
    </div>
  )
}
