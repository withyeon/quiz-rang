'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Check, Sparkles, Zap } from 'lucide-react'

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '₩0',
      period: '무료',
      description: '기본 기능을 무료로 사용해보세요',
      features: [
        '문제 생성 (월 10개 제한)',
        'Gold Quest 게임 플레이',
        '실시간 순위표',
        '기본 리포트',
        '커뮤니티 지원',
      ],
      cta: '무료로 시작하기',
      href: '/teacher',
      popular: false,
    },
    {
      name: 'Pro',
      price: '₩29,000',
      period: '월',
      description: 'AI 무제한과 고급 기능을 모두 사용하세요',
      features: [
        'AI 문제 생성 무제한',
        '엑셀 리포트 다운로드',
        '고급 통계 분석',
        '우선 고객 지원',
        '커스텀 브랜딩',
        'API 접근 권한',
      ],
      cta: 'Pro로 업그레이드',
      href: '/teacher',
      popular: true,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              간단하고 투명한
              <br />
              <span className="text-primary-600">요금제</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              필요에 맞는 플랜을 선택하세요. 언제든지 업그레이드하거나 다운그레이드할 수 있습니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`h-full relative ${
                    plan.popular
                      ? 'border-2 border-primary-500 shadow-xl scale-105'
                      : 'hover:shadow-lg'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        인기
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      {plan.name === 'Pro' ? (
                        <Sparkles className="h-6 w-6 text-primary-600" />
                      ) : (
                        <Sparkles className="h-6 w-6 text-gray-400" />
                      )}
                      <CardTitle className="text-3xl">{plan.name}</CardTitle>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                      {plan.period && (
                        <span className="text-gray-600">/{plan.period}</span>
                      )}
                    </div>
                    <CardDescription className="text-base mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={plan.href} className="block">
                      <Button
                        className={`w-full ${
                          plan.popular
                            ? 'bg-primary-600 hover:bg-primary-700'
                            : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                        size="lg"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                q: '무료 플랜으로도 모든 기능을 사용할 수 있나요?',
                a: '무료 플랜에서는 기본 기능을 사용할 수 있으며, AI 문제 생성은 월 10개로 제한됩니다. Pro 플랜으로 업그레이드하면 모든 기능을 무제한으로 사용할 수 있습니다.',
              },
              {
                q: '언제든지 플랜을 변경할 수 있나요?',
                a: '네, 언제든지 플랜을 변경할 수 있습니다. 업그레이드 시 즉시 적용되며, 다운그레이드 시 다음 결제 주기부터 적용됩니다.',
              },
              {
                q: '학생들도 별도로 결제해야 하나요?',
                a: '아니요, 학생들은 무료로 참여할 수 있습니다. 결제는 선생님만 하시면 됩니다.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
