'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnimatedNumber from '@/components/AnimatedNumber'
import {
  Sparkles,
  Brain,
  Gamepad2,
  BarChart3,
  Zap,
  Users,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(/main-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* 반짝이는 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-sky-300 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-sky-50/30" />
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-sky-100 text-sky-700 rounded-full text-2xl font-bold mb-8 shadow-lg cloud-card font-gukguk"
            >
              <span className="text-3xl">📚</span>
              학습 목표와 재미를 동시에 잡는 실전 게이미피케이션 솔루션
              <span className="text-3xl">🎮</span>
            </motion.div>

            {/* 중앙 CTA 버튼 - 로고 위에 배치 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mb-8 flex justify-center"
            >
              <Link href="/teacher">
                <motion.div
                  whileHover={{
                    scale: 1.08,
                    rotate: [0, -2, 2, -2, 2, 0],
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    rotate: { duration: 0.5, repeat: Infinity, repeatDelay: 0.1 }
                  }}
                  className="relative"
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 10px 40px rgba(14, 165, 233, 0.4)',
                        '0 10px 60px rgba(14, 165, 233, 0.6)',
                        '0 10px 40px rgba(14, 165, 233, 0.4)',
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-sky-400 rounded-2xl blur-xl opacity-75"
                  />
                  <Button
                    size="lg"
                    className="relative text-2xl md:text-3xl px-12 md:px-16 py-8 md:py-10 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold shadow-2xl border-4 border-white/50 rounded-2xl flex items-center gap-3 overflow-hidden"
                    style={{ fontFamily: 'DNFBitBitv2, sans-serif' }}
                  >
                    {/* 반짝이 지나가는 효과 */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: 'easeInOut',
                      }}
                    />
                    <Image
                      src="/header-logo.svg"
                      alt="퀴즈독 로고"
                      width={240}
                      height={80}
                      className="h-16 md:h-20 w-auto relative z-10"
                    />
                    <span className="relative z-10">시작하기</span>
                    <motion.span
                      className="relative z-10"
                      animate={{
                        rotate: [0, 15, -15, 15, -15, 0],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                      }}
                    >
                      ✨
                    </motion.span>
                    <ArrowRight className="ml-1 h-7 w-7 md:h-8 md:w-8 relative z-10" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-6 flex justify-center"
            >
              <Image
                src="/quizdog-logo.svg"
                alt="퀴즈독 로고"
                width={600}
                height={200}
                className="w-full max-w-2xl h-auto"
                priority
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl md:text-2xl text-sky-800 mb-8 max-w-3xl mx-auto font-medium fluffy-text"
            >
              <span className="text-2xl">🐶</span> 강아지와 함께하는 재미있는 퀴즈 게임!
              <br />
              <span className="text-2xl">🐕</span> AI 기반 문제 생성부터 실시간 게임까지, 교실을 게임으로 바꿔보세요
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/teacher">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="text-lg px-10 py-7 rounded-xl fluffy-button text-white font-bold shadow-2xl">
                    <span className="text-2xl mr-2">🚀</span>
                    지금 시작하기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/pricing">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" variant="outline" className="text-lg px-10 py-7 rounded-xl border-3 border-sky-300 bg-white/90 text-sky-600 hover:bg-sky-50 font-bold shadow-lg cloud-card">
                    <span className="text-xl mr-2">🐕</span>
                    요금제 보기
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-sky-50/50 relative overflow-hidden">
        <div className="absolute inset-0 star-pattern opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.p
              className="text-gray-700 mb-6 text-lg font-semibold"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-2xl mr-2">👨‍🏫</span>
              이미 많은 선생님들이 사용하고 있습니다
              <span className="text-2xl ml-2">👩‍🏫</span>
            </motion.p>
            <div className="flex items-center justify-center gap-12 flex-wrap">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="cloud-card px-8 py-6 rounded-2xl cursor-pointer transition-shadow duration-300 hover:shadow-xl"
              >
                <div className="text-5xl font-bold text-gray-900 mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <AnimatedNumber value={1250} suffix="+" />
                </div>
                <div className="text-sm text-gray-700 mt-1 font-semibold">활성 선생님</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="cloud-card px-8 py-6 rounded-2xl cursor-pointer transition-shadow duration-300 hover:shadow-xl"
              >
                <div className="text-5xl font-bold text-gray-900 mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <AnimatedNumber value={45000} suffix="+" />
                </div>
                <div className="text-sm text-gray-700 mt-1 font-semibold">생성된 문제</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="cloud-card px-8 py-6 rounded-2xl cursor-pointer transition-shadow duration-300 hover:shadow-xl"
              >
                <div className="text-5xl font-bold text-gray-900 mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <AnimatedNumber value={280000} suffix="+" />
                </div>
                <div className="text-sm text-gray-700 mt-1 font-semibold">참여한 학생</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              강력한 기능으로
              <br />
              수업을 더욱 재미있게
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              AI 기반 문제 생성부터 실시간 게임까지, 모든 것이 한 곳에
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <Card className="h-full cloud-card border-4 border-sky-200 transition-shadow duration-300 hover:shadow-2xl">
                <CardHeader>
                  <motion.div
                    className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span className="text-4xl">🧠</span>
                  </motion.div>
                  <CardTitle className="text-2xl font-bold text-gray-800">AI 문제 생성</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    유튜브, PDF, 텍스트를 업로드하면 AI가 자동으로 퀴즈 문제를 생성합니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary-600" />
                      유튜브 자막 자동 추출
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary-600" />
                      PDF 문서 분석
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary-600" />
                      다양한 문제 유형 지원
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <Card className="h-full cloud-card border-4 border-sky-300 transition-shadow duration-300 hover:shadow-2xl">
                <CardHeader>
                  <motion.div
                    className="h-16 w-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-4xl">🎮</span>
                  </motion.div>
                  <CardTitle className="text-2xl font-bold text-gray-800">Gold Quest 게임</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    실시간 퀴즈 게임으로 학생들의 참여를 극대화하고 학습 효과를 높입니다
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                      실시간 점수 동기화
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                      상자 뽑기 보상 시스템
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                      순위표 실시간 업데이트
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <Card className="h-full cloud-card border-4 border-sky-200 transition-shadow duration-300 hover:shadow-2xl">
                <CardHeader>
                  <motion.div
                    className="h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span className="text-4xl">📊</span>
                  </motion.div>
                  <CardTitle className="text-2xl font-bold text-gray-800">상세 리포트</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    학생별 성취도와 문제별 정답률을 분석하여 수업 개선에 활용하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      학생별 성취도 분석
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      문제별 정답률 통계
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      엑셀 다운로드 지원
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 cloud-soft relative overflow-hidden">
        <div className="absolute inset-0 star-pattern opacity-20" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-white mb-6 neon-glow"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-5xl mr-3">🎉</span>
              지금 바로 시작해보세요
              <span className="text-5xl ml-3">🎉</span>
            </motion.h2>
            <p className="text-xl text-white/90 mb-8 font-semibold">
              <span className="text-2xl mr-2">🆓</span>
              무료로 시작하고, 필요할 때 업그레이드하세요
              <span className="text-2xl ml-2">✨</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/teacher">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button size="lg" variant="outline" className="text-lg px-10 py-7 rounded-xl bg-white text-sky-600 hover:bg-sky-50 font-bold border-4 border-white shadow-2xl">
                    <span className="text-2xl mr-2">🚀</span>
                    무료로 시작하기
                  </Button>
                </motion.div>
              </Link>
              <Link href="/pricing">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button size="lg" variant="outline" className="text-lg px-10 py-7 rounded-xl border-4 border-white text-white hover:bg-white/20 font-bold shadow-2xl bg-white/10 backdrop-blur-sm">
                    <span className="text-2xl mr-2">💎</span>
                    요금제 보기
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
