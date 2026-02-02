'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface SnowEffectProps {
  isActive: boolean
  duration?: number
}

export default function SnowEffect({ isActive, duration = 2000 }: SnowEffectProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])

  useEffect(() => {
    if (!isActive) {
      setParticles([])
      return
    }

    // 눈가루 파티클 생성
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }))
    setParticles(newParticles)

    const timer = setTimeout(() => {
      setParticles([])
    }, duration)

    return () => clearTimeout(timer)
  }, [isActive, duration])

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ opacity: 1, scale: 0, x: `${particle.x}%`, y: `${particle.y}%` }}
              animate={{
                opacity: [1, 0.8, 0],
                scale: [0, 1, 1.5],
                y: `${particle.y + 100}%`,
                x: `${particle.x + (Math.random() - 0.5) * 20}%`,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 + Math.random() * 0.5 }}
              className="absolute text-4xl"
            >
              ❄️
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
