'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface BlizzardOverlayProps {
  isActive: boolean
  duration?: number
}

export default function BlizzardOverlay({ isActive, duration = 5000 }: BlizzardOverlayProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isActive) {
      setShow(true)
      const timer = setTimeout(() => setShow(false), duration)
      return () => clearTimeout(timer)
    }
  }, [isActive, duration])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.8, 1] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 pointer-events-none flex items-center justify-center"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-6xl"
          >
            🌨️
          </motion.div>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-20 text-2xl font-bold text-blue-600"
          >
            눈보라로 화면이 가려졌습니다!
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
