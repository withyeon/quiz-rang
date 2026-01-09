'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAudioContext } from '@/components/AudioProvider'

interface QuizViewProps {
  question: {
    id: string
    question_text: string
    options: string[]
    answer: string
  }
  onAnswer: (answer: string) => void
  timeLimit?: number
}

export default function QuizView({ question, onAnswer, timeLimit }: QuizViewProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState(timeLimit || 30)
  const { playSFX } = useAudioContext()

  const MotionDiv = motion.div
  const MotionButton = motion.button

  // 시간 제한 카운트다운
  useEffect(() => {
    if (selectedAnswer || !timeLimit) return // 이미 답을 선택했거나 시간 제한이 없으면 중단
    
    let timerId: NodeJS.Timeout | null = null
    
    timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 시간 초과 시 자동으로 빈 답안 처리
          if (timerId) {
            clearInterval(timerId)
            timerId = null
          }
          // 다음 tick에서 onAnswer 호출 (상태 업데이트 후)
          setTimeout(() => {
            if (!selectedAnswer) {
              onAnswer('') // 시간 초과 처리
            }
          }, 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerId) {
        clearInterval(timerId)
      }
    }
  }, [selectedAnswer, timeLimit]) // onAnswer를 dependency에서 제거

  // 문제가 바뀔 때마다 시간 리셋
  useEffect(() => {
    setTimeLeft(timeLimit || 30)
    setSelectedAnswer('')
  }, [question.id, timeLimit])

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return // 이미 답을 선택했으면 무시
    playSFX('click')
    setSelectedAnswer(answer)
    onAnswer(answer)
  }

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-2xl p-8 max-w-2xl mx-auto border-2 border-primary-200 glow-box"
    >
      <div className="mb-6">
        {timeLimit && (
          <MotionDiv
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex justify-between items-center mb-4 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-lg p-3 text-white"
          >
            <div className="text-sm font-medium">남은 시간</div>
            <div className="text-3xl font-bold neon-glow">{timeLeft}초</div>
          </MotionDiv>
        )}
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
          {question.question_text}
        </h2>
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option
          const isCorrect = option === question.answer
          const showResult = selectedAnswer !== ''

          return (
            <MotionButton
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={selectedAnswer !== ''}
              whileHover={selectedAnswer === '' ? { scale: 1.02, x: 5 } : {}}
              whileTap={selectedAnswer === '' ? { scale: 0.98 } : {}}
              className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
                selectedAnswer === ''
                  ? 'border-primary-300 hover:border-primary-500 hover:bg-gradient-to-r hover:from-primary-50 hover:to-indigo-50 cursor-pointer shadow-md hover:shadow-xl'
                  : isSelected
                  ? isCorrect
                    ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 scale-105 shadow-lg glow-box'
                    : 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50 scale-105 shadow-lg'
                  : isCorrect && showResult
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-gray-50 opacity-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    selectedAnswer === ''
                      ? 'bg-indigo-100 text-indigo-600'
                      : isSelected
                      ? isCorrect
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : isCorrect && showResult
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-lg font-medium text-gray-800 flex-1">{option}</span>
                {showResult && isSelected && (
                  <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
                )}
                {showResult && !isSelected && isCorrect && (
                  <span className="text-2xl">✅</span>
                )}
              </div>
            </MotionButton>
          )
        })}
      </div>

      {selectedAnswer && (
        <MotionDiv
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`mt-6 p-6 rounded-xl text-center font-bold text-2xl shadow-2xl ${
            selectedAnswer === question.answer
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-2 border-green-300 glow-box'
              : 'bg-gradient-to-r from-red-400 to-pink-500 text-white border-2 border-red-300'
          }`}
        >
          {selectedAnswer === question.answer ? (
            <MotionDiv
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              ✅ 정답입니다!
            </MotionDiv>
          ) : (
            '❌ 오답입니다.'
          )}
        </MotionDiv>
      )}
    </MotionDiv>
  )
}
