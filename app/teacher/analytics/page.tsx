'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Download, TrendingUp, Target, Users } from 'lucide-react'
import type { Database } from '@/types/database.types'

type Question = Database['public']['Tables']['questions']['Row']

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

export default function AnalyticsPage() {
  const [questionSets, setQuestionSets] = useState<any[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuestionSets()
  }, [])

  useEffect(() => {
    if (selectedSetId) {
      loadQuestions(selectedSetId)
    }
  }, [selectedSetId])

  const loadQuestionSets = async () => {
    try {
      const { data, error } = await ((supabase
        .from('questions') as any)
        .select('set_id, created_at')
        .order('created_at', { ascending: false }) as any)

      if (error) throw error

      const grouped = (data as any[]).reduce((acc: any, item: any) => {
        if (!acc[item.set_id]) {
          acc[item.set_id] = {
            set_id: item.set_id,
            name: item.set_id.replace('set-', '문제집 '),
            question_count: 0,
            created_at: item.created_at,
          }
        }
        acc[item.set_id].question_count++
        return acc
      }, {})

      const sets = Object.values(grouped)
      setQuestionSets(sets as any[])
      if (sets.length > 0) {
        setSelectedSetId((sets[0] as any).set_id)
      }
    } catch (error) {
      console.error('Error loading question sets:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async (setId: string) => {
    try {
      const { data, error } = await ((supabase
        .from('questions') as any)
        .select('*')
        .eq('set_id', setId) as any)

      if (error) throw error
      setQuestions((data as Question[]) || [])
    } catch (error) {
      console.error('Error loading questions:', error)
    }
  }

  // 문제별 통계 데이터 생성 (더미 데이터 - 실제로는 게임 결과에서 가져와야 함)
  const questionStats = questions.map((q, index) => ({
    name: `문제 ${index + 1}`,
    correctRate: Math.floor(Math.random() * 40) + 60, // 60-100% (더미)
    attempts: Math.floor(Math.random() * 20) + 10, // 10-30명 (더미)
  }))

  const typeDistribution = questions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const typeData = Object.entries(typeDistribution).map(([type, count]) => ({
    name: type === 'CHOICE' ? '객관식' : type === 'OX' ? 'OX' : type === 'SHORT' ? '주관식' : '빈칸',
    value: count,
  }))

  const handleExport = () => {
    // 엑셀 다운로드 로직 (실제로는 라이브러리 사용)
    alert('엑셀 다운로드 기능은 준비 중입니다.')
  }

  if (loading) {
    return <div className="text-center py-12">로딩 중...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">문제별 통계</h1>
          <p className="text-gray-600 mt-2">문제집별 성취도와 정답률을 분석하세요</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>

      {/* 문제집 선택 */}
      {questionSets.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>문제집 선택</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {questionSets.map((set: any) => (
                <button
                  key={set.set_id}
                  onClick={() => setSelectedSetId(set.set_id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedSetId === set.set_id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{set.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {set.question_count}개 문제
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSetId && questions.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* 문제별 정답률 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                문제별 정답률
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={questionStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="correctRate" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 문제 유형 분포 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                문제 유형 분포
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 통계 요약 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                통계 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">총 문제 수</div>
                  <div className="text-3xl font-bold text-blue-600">{questions.length}개</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">평균 정답률</div>
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round(
                      questionStats.reduce((sum, q) => sum + q.correctRate, 0) /
                        questionStats.length
                    ) || 0}
                    %
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">총 시도 횟수</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {questionStats.reduce((sum, q) => sum + q.attempts, 0)}회
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">문제 유형</div>
                  <div className="text-3xl font-bold text-yellow-600">
                    {Object.keys(typeDistribution).length}종류
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-gray-600">선택한 문제집에 문제가 없습니다.</p>
        </Card>
      )}
    </div>
  )
}
