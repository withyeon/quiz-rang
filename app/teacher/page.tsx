'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Play,
  Edit,
  Trash2,
  Plus,
  BookOpen,
} from 'lucide-react'

type QuestionSet = {
  id: string
  title: string
  description?: string
  question_count: number
  created_at: string
}

type SourceType = 'topic' | 'youtube' | 'text' | 'pdf'

function TeacherPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const createType = searchParams?.get('create') as SourceType | null

  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!createType) {
      loadQuestionSets()
    }
  }, [createType])

  const loadQuestionSets = async () => {
    try {
      setLoading(true)

      // question_sets와 questions를 조인하여 문제 개수 계산
      const { data: sets, error } = await supabase
        .from('question_sets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // 각 세트별로 문제 개수 조회
      const setsWithCount = await Promise.all(
        (sets || []).map(async (set: any) => {
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('set_id', set.id)

          return {
            ...set,
            question_count: count || 0
          }
        })
      )

      setQuestionSets(setsWithCount as QuestionSet[])
    } catch (error) {
      console.error('Error loading question sets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartGame = (setId: string) => {
    // 게임 모드 선택 화면(대시보드)으로 이동
    router.push(`/teacher/dashboard?set=${encodeURIComponent(setId)}`)
  }

  const handleDelete = async (setId: string) => {
    if (!confirm('정말 이 문제집을 삭제하시겠습니까?')) return

    try {
      const { error } = await ((supabase
        .from('questions') as any)
        .delete()
        .eq('set_id', setId) as any)

      if (error) throw error
      alert('문제집이 삭제되었습니다.')
      loadQuestionSets()
    } catch (error) {
      console.error('Error deleting question set:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">내 퀴즈함</h1>
          <p className="text-gray-600">내가 만든 문제집을 관리하세요</p>
        </div>
        <Button
          onClick={() => router.push('/teacher/create')}
          className="bg-sky-500 hover:bg-sky-600 text-white"
        >
          <Plus className="h-5 w-5 mr-2" />
          퀴즈 만들기
        </Button>
      </div>

      {/* 문제집 리스트 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : questionSets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">아직 만든 문제집이 없습니다.</p>
          <Button
            onClick={() => router.push('/teacher/create')}
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Plus className="h-5 w-5 mr-2" />
            퀴즈 만들기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questionSets.map((set, index) => (
            <motion.div
              key={set.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {set.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {set.question_count}문제
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(set.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button
                  size="sm"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => handleStartGame(set.id)}
                >
                  <Play className="h-4 w-4 mr-1" />
                  게임 시작
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/teacher/sets/${encodeURIComponent(set.id)}/edit`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(set.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  )
}

export default function TeacherPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <TeacherPageContent />
    </Suspense>
  )
}
