'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCafeStore } from '@/store/cafeStore'
import {
  MENU_ITEMS,
  UPGRADES,
  Customer,
  formatTime,
  canBuyMenu,
  canBuyUpgrade,
  hasStock,
} from '@/lib/game/cafe'
import { X, ShoppingCart, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import QuizView from '@/components/QuizView'
import { useAudioContext } from '@/components/AudioProvider'

interface CafeViewProps {
  onGameEnd?: () => void
  roomCode?: string
}

const MAX_CUSTOMERS_IN_LINE = 3 // 카운터 앞 최대 손님 수

// 더미 문제 데이터
const DUMMY_QUESTIONS = [
  {
    id: '1',
    question_text: '한국의 수도는?',
    options: ['서울', '부산', '대구', '인천'],
    answer: '서울',
  },
  {
    id: '2',
    question_text: '태양계에서 가장 큰 행성은?',
    options: ['지구', '목성', '토성', '화성'],
    answer: '목성',
  },
  {
    id: '3',
    question_text: '2 + 2는?',
    options: ['3', '4', '5', '6'],
    answer: '4',
  },
  {
    id: '4',
    question_text: '한국의 독립기념일은?',
    options: ['3월 1일', '8월 15일', '10월 3일', '12월 25일'],
    answer: '8월 15일',
  },
  {
    id: '5',
    question_text: '지구의 위성은?',
    options: ['화성', '금성', '달', '태양'],
    answer: '달',
  },
]

type CafeViewState = 'quiz' | 'cafe' | 'wrong'

export default function CafeView({ onGameEnd, roomCode }: CafeViewProps) {
  const {
    status,
    timeRemaining,
    cash,
    totalCashEarned,
    customersServed,
    unlockedMenus,
    menuStock,
    upgrades,
    customers,
    stats,
    tickTimer,
    serveMenu,
    addCustomer,
    removeExpiredCustomer,
    updateCustomers,
    restockMenu,
  } = useCafeStore()

  const [currentView, setCurrentView] = useState<CafeViewState>('quiz')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isCorrect, setIsCorrect] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [servingAnimations, setServingAnimations] = useState<
    Array<{ id: string; x: number; y: number; amount: number }>
  >([])
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [showParticles, setShowParticles] = useState(false)
  const customerUpdateInterval = useRef<NodeJS.Timeout | null>(null)
  const timerInterval = useRef<NodeJS.Timeout | null>(null)
  const patienceUpdateInterval = useRef<NodeJS.Timeout | null>(null)
  const questionStartTime = useRef<number>(0)

  const { playSFX } = useAudioContext()

  const currentQuestion = DUMMY_QUESTIONS[currentQuestionIndex % DUMMY_QUESTIONS.length]

  // 타이머
  useEffect(() => {
    if (status === 'playing') {
      timerInterval.current = setInterval(() => {
        tickTimer()
      }, 1000)
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
    }
  }, [status, tickTimer])

  // 손님 업데이트 (인내심 체크)
  useEffect(() => {
    if (status === 'playing' && currentView === 'cafe') {
      customerUpdateInterval.current = setInterval(() => {
        updateCustomers(Date.now())
      }, 1000)

      return () => {
        if (customerUpdateInterval.current) {
          clearInterval(customerUpdateInterval.current)
        }
      }
    }
  }, [status, currentView, updateCustomers])

  // 인내심 게이지 실시간 업데이트
  useEffect(() => {
    if (status === 'playing' && currentView === 'cafe') {
      patienceUpdateInterval.current = setInterval(() => {
        setCurrentTime(Date.now())
      }, 100) // 0.1초마다 업데이트

      return () => {
        if (patienceUpdateInterval.current) {
          clearInterval(patienceUpdateInterval.current)
        }
      }
    }
  }, [status, currentView])

  // 게임 종료 처리
  useEffect(() => {
    if (status === 'ended' && onGameEnd) {
      onGameEnd()
    }
  }, [status, onGameEnd])

  // 손님을 항상 3명 유지
  useEffect(() => {
    if (status === 'playing' && currentView === 'cafe') {
      const interval = setInterval(() => {
        // 손님이 3명 미만이면 계속 추가
        if (customers.length < MAX_CUSTOMERS_IN_LINE) {
          addCustomer()
        }
      }, 2000) // 2초마다 체크

      return () => clearInterval(interval)
    }
  }, [status, currentView, customers.length, addCustomer])

  // 퀴즈 정답 제출
  const handleAnswerSubmit = (answer: string) => {
    if (!answer) {
      // 시간 초과
      playSFX('incorrect')
      setCurrentView('wrong')
      setTimeout(() => {
        setCurrentView('quiz')
        setSelectedAnswer('')
        setIsCorrect(false)
        setCurrentQuestionIndex((prev) => prev + 1)
        questionStartTime.current = Date.now()
      }, 2000)
      return
    }

    setSelectedAnswer(answer)
    const correct = answer === currentQuestion.answer
    setIsCorrect(correct)

    if (correct) {
      playSFX('correct')
      setShowParticles(true)
      setTimeout(() => setShowParticles(false), 2000)

      // 정답 시 랜덤 메뉴 재고충전
      const availableMenus = unlockedMenus
      if (availableMenus.length > 0) {
        const randomMenu = availableMenus[Math.floor(Math.random() * availableMenus.length)]
        restockMenu(randomMenu)
      }

      // 카페 화면으로 이동
      setTimeout(() => {
        setCurrentView('cafe')
        setSelectedAnswer('')
        setIsCorrect(false)
        questionStartTime.current = Date.now()
      }, 1500)
    } else {
      playSFX('incorrect')
      setCurrentView('wrong')
      setTimeout(() => {
        setCurrentView('quiz')
        setSelectedAnswer('')
        setIsCorrect(false)
        setCurrentQuestionIndex((prev) => prev + 1)
        questionStartTime.current = Date.now()
      }, 2000)
    }
  }

  // Space 키로 Restock 버튼 클릭
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && status === 'playing' && currentView === 'cafe') {
        e.preventDefault()
        setCurrentView('quiz')
        setCurrentQuestionIndex((prev) => prev + 1)
        questionStartTime.current = Date.now()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [status, currentView])

  // 손님 클릭으로 서빙 (Blooket 스타일)
  const handleCustomerClick = (customer: Customer, event: React.MouseEvent) => {
    const result = serveMenu(customer.id, customer.order)
    if (result.success) {
      // 돈 애니메이션 추가
      const rect = event.currentTarget.getBoundingClientRect()
      setServingAnimations((prev) => [
        ...prev,
        {
          id: `anim-${Date.now()}`,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          amount: result.earned,
        },
      ])

      // 애니메이션 제거
      setTimeout(() => {
        setServingAnimations((prev) => prev.slice(1))
      }, 2000)
    }
  }

  // 손님의 인내심 계산
  const getCustomerPatience = (customer: Customer) => {
    const elapsed = (currentTime - customer.spawnTime) / 1000
    const remaining = Math.max(0, customer.patience - elapsed)
    return Math.min(1, remaining / customer.patience)
  }

  // 해금된 메뉴만 필터링
  const availableMenus = MENU_ITEMS.filter((menu) => unlockedMenus.includes(menu.id))

  const isUrgent = timeRemaining <= 10 && status === 'playing'

  // 카운터 앞 손님들 (최대 5명)
  const customersInLine = customers.slice(0, MAX_CUSTOMERS_IN_LINE)

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100 overflow-hidden">
      {/* 카페 배경 */}
      <div className="absolute inset-0">
        {/* 카운터 */}
        <div className="absolute bottom-40 left-0 right-0 h-32 bg-gradient-to-b from-amber-800 to-amber-900 border-t-8 border-amber-950 shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-600 to-amber-800"></div>
          {/* 카운터 장식 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-6xl opacity-20">☕</div>
        </div>
      </div>

      {/* 상단 정보 바 */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-r from-amber-600 to-orange-600 border-b-4 border-amber-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-white/30">
              <span className="text-3xl">⏰</span>
              <span
                className={`text-3xl font-bold font-mono ${isUrgent ? 'text-red-200 animate-pulse' : 'text-white'
                  }`}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-white/30">
              <span className="text-3xl">💰</span>
              <span className="text-3xl font-bold text-yellow-200">${cash.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border-2 border-white/30">
              <span className="text-2xl">👥</span>
              <span className="text-xl font-bold text-white">{customersServed}명</span>
            </div>
          </div>
          <Button
            onClick={() => setShowShop(true)}
            className="bg-white text-amber-700 hover:bg-amber-50 font-bold text-lg px-6 py-3 shadow-xl border-4 border-amber-800"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            상점
          </Button>
        </div>
      </div>

      {/* 퀴즈 화면 */}
      {currentView === 'quiz' && (
        <div className="absolute top-24 left-0 right-0 bottom-0 z-30 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <QuizView
              question={currentQuestion}
              onAnswer={handleAnswerSubmit}
              timeLimit={30}
            />
          </div>
        </div>
      )}

      {/* 오답 화면 */}
      {currentView === 'wrong' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-24 left-0 right-0 bottom-0 z-30 flex items-center justify-center p-4"
        >
          <div className="bg-red-100 border-4 border-red-500 rounded-xl p-8 shadow-lg text-center max-w-md">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-4xl font-bold text-red-600 mb-2">틀렸습니다!</h2>
            <p className="text-gray-700">다음 문제로 넘어갑니다...</p>
          </div>
        </motion.div>
      )}

      {/* 카페 화면 */}
      {currentView === 'cafe' && (
        <>
          {/* 손님 영역 - 카운터 앞에 줄지어 배치 */}
          <div className="absolute bottom-48 left-0 right-0 z-10">
            <div className="max-w-6xl mx-auto px-8">
              <div className="flex items-end justify-center gap-4 h-64">
                <AnimatePresence>
                  {customersInLine.map((customer, index) => {
                    const menu = MENU_ITEMS.find((m) => m.id === customer.order)
                    if (!menu) return null

                    const patience = getCustomerPatience(customer)
                    const isUrgentCustomer = patience < 0.3

                    return (
                      <motion.div
                        key={customer.id}
                        initial={{ opacity: 0, y: 100, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.5, x: 200 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className="relative flex flex-col items-center cursor-pointer group"
                        onClick={(e) => handleCustomerClick(customer, e)}
                        style={{ order: index }}
                      >
                        {/* 손님 */}
                        <motion.div
                          animate={{
                            y: [0, -8, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className={`mb-2 transition-all flex items-center justify-center ${isUrgentCustomer
                              ? 'animate-pulse scale-110'
                              : 'group-hover:scale-110'
                            }`}
                        >
                          <div className="relative w-20 h-20">
                            <img
                              src={customer.characterImage}
                              alt="Customer"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                // SVG 로드 실패 시 이모지로 대체
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                if (target.parentElement) {
                                  target.parentElement.innerHTML = `<div class="text-7xl">${customer.emoji}</div>`
                                }
                              }}
                            />
                          </div>
                        </motion.div>

                        {/* 주문 말풍선 */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`bg-white rounded-2xl px-5 py-4 shadow-2xl border-4 min-w-[140px] transition-all ${isUrgentCustomer
                              ? 'border-red-500 bg-red-50 animate-pulse'
                              : 'border-amber-400 group-hover:border-amber-500'
                            }`}
                        >
                          <div className="text-center">
                            <div className="mb-2 flex items-center justify-center">
                              <img
                                src={menu.image}
                                alt={menu.name}
                                className="w-16 h-16 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  if (target.parentElement) {
                                    target.parentElement.innerHTML = `<div class="text-4xl">${menu.emoji}</div>`
                                  }
                                }}
                              />
                            </div>
                            <div className="text-sm font-bold text-gray-800 mb-2">{menu.name}</div>
                            <div className="text-xs font-semibold text-green-600">
                              +${Math.floor(menu.sellPrice * upgrades.sellPriceMultiplier)}
                            </div>
                          </div>
                        </motion.div>

                        {/* 인내심 게이지 */}
                        <div className="mt-2 w-24 h-2 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-400">
                          <motion.div
                            initial={{ width: '100%' }}
                            animate={{
                              width: `${patience * 100}%`,
                              backgroundColor: patience > 0.5 ? '#10b981' : patience > 0.3 ? '#f59e0b' : '#ef4444',
                            }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full"
                          />
                        </div>
                        <div className="text-xs text-gray-600 mt-1 font-semibold">
                          {Math.ceil(patience * customer.patience)}초
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* 접시 영역 - 카운터 아래에 모든 메뉴 슬롯 표시 (그리드 형태) */}
          <div className="absolute bottom-40 left-0 right-0 z-15">
            <div className="max-w-6xl mx-auto px-8">
              <div className="grid grid-cols-4 gap-4 justify-items-center">
                {MENU_ITEMS.map((menu, index) => {
                  const isUnlocked = unlockedMenus.includes(menu.id)
                  const stock = menuStock[menu.id] || 0
                  const hasOrder = customers.some((c) => c.order === menu.id)

                  return (
                    <motion.div
                      key={menu.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative flex flex-col items-center"
                    >
                      {/* 접시 */}
                      <div
                        className={`relative w-20 h-20 rounded-full border-4 shadow-lg transition-all ${isUnlocked
                            ? stock > 0
                              ? hasOrder
                                ? 'bg-green-100 border-green-400 scale-110'
                                : 'bg-white border-amber-300'
                              : 'bg-white border-amber-300 opacity-60'
                            : 'bg-gray-300 border-gray-500 opacity-40'
                          }`}
                      >
                        {/* 메뉴 이미지 (해금되고 재고가 있을 때만) */}
                        {isUnlocked && stock > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center p-2">
                            <img
                              src={menu.image}
                              alt={menu.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                if (target.parentElement) {
                                  target.parentElement.innerHTML = `<span class="text-4xl">${menu.emoji}</span>`
                                }
                              }}
                            />
                          </div>
                        )}

                        {/* 재고 수 (해금된 경우만) */}
                        {isUnlocked && (
                          <div
                            className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${stock > 0
                                ? 'bg-blue-500 text-white border-blue-600'
                                : 'bg-gray-500 text-white border-gray-600'
                              }`}
                          >
                            {stock}
                          </div>
                        )}

                        {/* 주문 요청 표시 */}
                        {hasOrder && isUnlocked && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-yellow-600"
                          >
                            <span className="text-sm">⚡</span>
                          </motion.div>
                        )}
                      </div>

                      {/* 메뉴 이름 (해금된 경우만) */}
                      {isUnlocked && (
                        <div className="mt-1 text-xs font-bold text-gray-700 text-center max-w-[80px] truncate">
                          {menu.name}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 하단 Restock 버튼 및 안내 */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-amber-900 to-amber-800 border-t-8 border-amber-950 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-center gap-4">
                {/* Restock 버튼 */}
                <Button
                  onClick={() => {
                    setCurrentView('quiz')
                    setCurrentQuestionIndex((prev) => prev + 1)
                    questionStartTime.current = Date.now()
                  }}
                  className="bg-teal-500 hover:bg-teal-600 text-white font-bold text-lg px-8 py-4 shadow-xl border-4 border-teal-700 min-w-[200px]"
                >
                  🍽️ Restock Food
                  <div className="text-xs mt-1 opacity-90">Space</div>
                </Button>
              </div>
              <div className="text-center text-white/80 text-sm mt-3">
                💡 손님을 클릭하여 주문한 메뉴를 서빙하세요! 재고가 없으면 Restock 버튼을 눌러주세요.
              </div>
            </div>
          </div>
        </>
      )}

      {/* 돈 획득 애니메이션 */}
      <AnimatePresence>
        {servingAnimations.map((anim) => (
          <motion.div
            key={anim.id}
            initial={{ opacity: 1, x: anim.x, y: anim.y, scale: 1 }}
            animate={{ opacity: 0, y: anim.y - 100, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none z-50"
            style={{ left: anim.x, top: anim.y }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-4xl font-bold text-green-400 drop-shadow-2xl"
              style={{ textShadow: '0 0 10px rgba(34, 197, 94, 0.8)' }}
            >
              +${anim.amount}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 상점 모달 */}
      <AnimatePresence>
        {showShop && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShop(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[80vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border-4 border-amber-300 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-8 w-8 text-amber-600" />
                  상점
                </h2>
                <button
                  onClick={() => setShowShop(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <ShopContent onClose={() => setShowShop(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// 상점 내용 컴포넌트
function ShopContent({ onClose }: { onClose: () => void }) {
  const store = useCafeStore()
  const { cash, unlockedMenus, upgrades, purchaseMenu, purchaseUpgrade } = store

  const lockedMenus = MENU_ITEMS.filter((menu) => !unlockedMenus.includes(menu.id))

  return (
    <div className="space-y-6">
      {/* 메뉴 해금 */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🍽️</span> 메뉴 해금
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lockedMenus.map((menu) => {
            const canBuy = canBuyMenu(store, menu.id)
            return (
              <Card
                key={menu.id}
                className={`border-4 ${canBuy ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
                  }`}
              >
                <CardHeader>
                  <div className="flex justify-center mb-2">
                    <img
                      src={menu.image}
                      alt={menu.name}
                      className="w-16 h-16 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        if (target.parentElement) {
                          target.parentElement.innerHTML = `<div class="text-4xl text-center">${menu.emoji}</div>`
                        }
                      }}
                    />
                  </div>
                  <CardTitle className="text-center text-lg">{menu.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <div className="text-sm text-gray-600">{menu.description}</div>
                    <div className="text-xl font-bold text-amber-600">${menu.cost}</div>
                    <Button
                      onClick={() => {
                        purchaseMenu(menu.id)
                      }}
                      disabled={!canBuy}
                      className={`w-full ${canBuy
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-gray-300 cursor-not-allowed'
                        }`}
                    >
                      {canBuy ? '구매' : '돈 부족'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 업그레이드 */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          업그레이드
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {UPGRADES.map((upgrade) => {
            const canBuy = canBuyUpgrade(store, upgrade.id)
            return (
              <Card
                key={upgrade.id}
                className={`border-4 ${canBuy ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                  }`}
              >
                <CardHeader>
                  <CardTitle>{upgrade.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">{upgrade.description}</div>
                    <div className="text-xl font-bold text-blue-600">${upgrade.cost}</div>
                    <Button
                      onClick={() => {
                        purchaseUpgrade(upgrade.id)
                      }}
                      disabled={!canBuy}
                      className={`w-full ${canBuy ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'
                        }`}
                    >
                      {canBuy ? '구매' : '돈 부족'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
