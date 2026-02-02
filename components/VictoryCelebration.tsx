'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface VictoryCelebrationProps {
  show: boolean
  message?: string
  onComplete?: () => void
}

export default function VictoryCelebration({
  show,
  message = '승리!',
  onComplete,
}: VictoryCelebrationProps) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onComplete?.()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      {/* 배경 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500"
      />

      {/* 메인 메시지 */}
      <div className="relative z-10 text-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="text-8xl mb-4"
        >
          🏆
        </motion.div>

        <motion.h1
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-6xl md:text-8xl font-bold text-white mb-4 drop-shadow-2xl"
          style={{
            textShadow: '0 0 20px rgba(0,0,0,0.5), 0 0 40px rgba(255,215,0,0.8)',
          }}
        >
          {message}
        </motion.h1>

        {/* 별 효과 */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 0,
            }}
            animate={{
              x: (Math.random() - 0.5) * 1000,
              y: (Math.random() - 0.5) * 1000,
              opacity: [1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              delay: Math.random() * 0.5,
            }}
            className="absolute text-4xl"
            style={{
              left: '50%',
              top: '50%',
            }}
          >
            ⭐
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
