'use client'

import { motion } from 'framer-motion'

interface ScreenShakeProps {
  intensity?: number
  duration?: number
  children: React.ReactNode
  isShaking?: boolean
}

export default function ScreenShake({
  intensity = 10,
  duration = 500,
  children,
  isShaking = false,
}: ScreenShakeProps) {
  return (
    <motion.div
      animate={
        isShaking
          ? {
              x: [0, -intensity, intensity, -intensity, intensity, 0],
              y: [0, -intensity, intensity, -intensity, intensity, 0],
            }
          : {}
      }
      transition={{ duration: duration / 1000 }}
    >
      {children}
    </motion.div>
  )
}
