'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  BookOpen,
  Play,
  MoreVertical,
  FileText,
  Youtube,
  FileUp,
  Edit,
  Trash2,
  ArrowLeft,
} from 'lucide-react'
import type { Database } from '@/types/database.types'
import type { GeneratedQuestion } from '@/lib/ai/questionGenerator'

type QuestionSet = {
  set_id: string
  name: string
  question_count: number
  created_at: string
  subject?: string
}

const SUBJECT_ICONS: Record<string, { icon: string; color: string }> = {
  default: { icon: '📚', color: 'bg-blue-100 text-blue-600' },
  math: { icon: '🔢', color: 'bg-green-100 text-green-600' },
  science: { icon: '🔬', color: 'bg-purple-100 text-purple-600' },
  history: { icon: '📜', color: 'bg-yellow-100 text-yellow-600' },
  korean: { icon: '📖', color: 'bg-red-100 text-red-600' },
  english: { icon: '🔤', color: 'bg-indigo-100 text-indigo-600' },
}

type SourceType = 'topic' | 'youtube' | 'text' | 'pdf'

function TeacherPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const createType = searchParams?.get('create') as SourceType | null
  
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // 문제 생성 관련 상태
  const [sourceType, setSourceType] = useState<SourceType>(createType || 'topic')
  const [topic, setTopic] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [text, setText] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [questionCount, setQuestionCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [isReviewing, setIsReviewing] = useState(false)
  const [setName, setSetName] = useState('')

  useEffect(() => {
    if (!createType) {
      loadQuestionSets()
    }
  }, [createType])

  const loadQuestionSets = async () => {
    try {
      setLoading(true)
      const { data, error } = await ((supabase
        .from('questions') as any)
        .select('set_id, created_at')
        .order('created_at', { ascending: false }) as any)

      if (error) throw error

      // set_id별로 그룹화
      const grouped = (data as any[]).reduce((acc, item: any) => {
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
      }, {} as Record<string, QuestionSet>)

      setQuestionSets(Object.values(grouped))
    } catch (error) {
      console.error('Error loading question sets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSubjectIcon = (setId: string) => {
    const subject = Object.keys(SUBJECT_ICONS).find((key) => setId.includes(key))
    return SUBJECT_ICONS[subject || 'default']
  }

  const handleStartGame = (setId: string) => {
    // 게임 시작 로직
    window.location.href = `/teacher/dashboard?set=${setId}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">내 문제집</h1>
          <p className="text-gray-600 mt-2">생성한 문제집을 관리하고 게임을 시작하세요</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          새 문제집 만들기
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : questionSets.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">아직 문제집이 없습니다</h3>
          <p className="text-gray-600 mb-6">
            새 문제집을 만들어서 수업을 더욱 재미있게 만들어보세요
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            첫 문제집 만들기
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionSets.map((set, index) => {
            const subjectIcon = getSubjectIcon(set.set_id)
            return (
              <motion.div
                key={set.set_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${subjectIcon.color}`}
                      >
                        {subjectIcon.icon}
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-100 rounded">
                        <MoreVertical className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                    <CardTitle className="text-xl">{set.name}</CardTitle>
                    <CardDescription>
                      {set.question_count}개의 문제 • {new Date(set.created_at).toLocaleDateString('ko-KR')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleStartGame(set.set_id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        게임 시작
                      </Button>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">새 문제집 만들기</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Card
                  className="cursor-pointer hover:border-primary-500 transition-colors"
                  onClick={() => router.push('/teacher/create')}
                >
                  <CardHeader>
                    <FileText className="h-8 w-8 text-primary-600 mb-2" />
                    <CardTitle className="text-lg">주제 입력</CardTitle>
                    <CardDescription>키워드로 AI가 문제를 생성합니다</CardDescription>
                  </CardHeader>
                </Card>
                <Card
                  className="cursor-pointer hover:border-primary-500 transition-colors"
                  onClick={() => router.push('/teacher/create')}
                >
                  <CardHeader>
                    <Youtube className="h-8 w-8 text-red-600 mb-2" />
                    <CardTitle className="text-lg">유튜브</CardTitle>
                    <CardDescription>자막을 추출하여 문제를 생성합니다</CardDescription>
                  </CardHeader>
                </Card>
                <Card
                  className="cursor-pointer hover:border-primary-500 transition-colors"
                  onClick={() => router.push('/teacher/create')}
                >
                  <CardHeader>
                    <FileUp className="h-8 w-8 text-indigo-600 mb-2" />
                    <CardTitle className="text-lg">PDF 업로드</CardTitle>
                    <CardDescription>PDF 파일에서 문제를 생성합니다</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  취소
                </Button>
              </div>
            </div>
          </motion.div>
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
