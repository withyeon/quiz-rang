'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface ScreenFlashProps {
  show: boolean
  color?: string
  duration?: number
}

export default function ScreenFlash({
  show,
  color = 'rgba(255, 215, 0, 0.3)',
  duration = 0.3,
}: ScreenFlashProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
          className="fixed inset-0 pointer-events-none z-50"
          style={{ backgroundColor: color }}
        />
      )}
    </AnimatePresence>
  )
}
