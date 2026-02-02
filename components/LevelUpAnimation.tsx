'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface LevelUpAnimationProps {
  show: boolean
  level: number
  onComplete?: () => void
}

export default function LevelUpAnimation({
  show,
  level,
  onComplete,
}: LevelUpAnimationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onComplete?.()
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* 배경 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600"
          />

          {/* 레벨업 메시지 */}
          <div className="relative z-10 text-center">
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 360],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-9xl mb-6"
            >
              ⬆️
            </motion.div>

            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl md:text-7xl font-bold text-white mb-2"
              style={{
                textShadow: '0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(255,215,0,0.6)',
              }}
            >
              LEVEL UP!
            </motion.h2>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1] }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-8xl md:text-9xl font-bold text-yellow-300"
              style={{
                textShadow: '0 0 40px rgba(255,215,0,1), 0 0 80px rgba(255,215,0,0.8)',
              }}
            >
              {level}
            </motion.div>

            {/* 파티클 효과 */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  scale: 0,
                }}
                animate={{
                  x: (Math.random() - 0.5) * 800,
                  y: (Math.random() - 0.5) * 800,
                  opacity: [1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: Math.random() * 0.3,
                }}
                className="absolute text-3xl"
                style={{
                  left: '50%',
                  top: '50%',
                }}
              >
                ✨
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
