'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase, checkSupabaseConfig, testSupabaseConnection } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Pencil, FileText, Youtube, FileUp, CheckCircle2, MessageSquare, XCircle } from 'lucide-react'
import type { Database } from '@/types/database.types'
import type { GeneratedQuestion } from '@/lib/ai/questionGenerator'
import { filterNickname } from '@/lib/utils/profanityFilter'

type SourceType = 'topic' | 'youtube' | 'file'

export default function CreateQuestionPage() {
  const router = useRouter()
  const [sourceType, setSourceType] = useState<SourceType | null>(null)
  const [topic, setTopic] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [questionCount, setQuestionCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [isReviewing, setIsReviewing] = useState(false)
  const [setName, setSetName] = useState('')

  // 문제 생성
  const handleGenerate = async () => {
    // 입력 검증
    if (sourceType === 'topic' && !topic.trim()) {
      alert('주제를 입력해주세요.')
      return
    }
    if (sourceType === 'youtube' && !youtubeUrl.trim()) {
      alert('유튜브 URL을 입력해주세요.')
      return
    }
    if (sourceType === 'file' && !file) {
      alert('파일을 선택해주세요.')
      return
    }

    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append('sourceType', sourceType === 'file' ? 'pdf' : sourceType!)
      formData.append('questionCount', questionCount.toString())

      if (sourceType === 'topic') {
        formData.append('topic', topic)
      } else if (sourceType === 'youtube') {
        formData.append('youtubeUrl', youtubeUrl)
      } else if (sourceType === 'file' && file) {
        formData.append('file', file)
      }

      console.log('문제 생성 요청:', { sourceType, questionCount })
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || '문제 생성에 실패했습니다.'
        throw new Error(errorMessage)
      }

      if (!data.questions || data.questions.length === 0) {
        throw new Error('생성된 문제가 없습니다. 다시 시도해주세요.')
      }

      console.log('문제 생성 성공:', data.questions.length, '개')
      setGeneratedQuestions(data.questions)
      setIsReviewing(true)
    } catch (error) {
      console.error('Error generating questions:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      alert(`문제 생성에 실패했습니다: ${errorMessage}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // 문제 저장
  const handleSaveQuestions = async () => {
    if (!setName.trim()) {
      alert('문제집 이름을 입력해주세요.')
      return
    }

    const nameCheck = filterNickname(setName)
    if (!nameCheck.isValid) {
      alert('문제집 이름에 부적절한 단어가 포함되어 있습니다.')
      return
    }

    const supabaseCheck = checkSupabaseConfig()
    if (!supabaseCheck.isValid) {
      alert(`Supabase 연결 오류: ${supabaseCheck.error}`)
      return
    }

    console.log('Supabase 연결 테스트 시작...')
    const connectionTest = await testSupabaseConnection()
    if (!connectionTest.success) {
      alert(`Supabase 연결 실패: ${connectionTest.error}\n\n환경 변수를 확인하고 개발 서버를 재시작해주세요.`)
      return
    }

    try {
      // ID에 특수문자나 한글이 포함되지 않도록 단순 랜덤 문자열 사용
      const setId = `set-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      const questionsToSave = generatedQuestions.map((q) => {
        let optionsArray: string[] = []
        if (Array.isArray(q.options)) {
          optionsArray = q.options
        } else if (q.options && typeof q.options === 'string') {
          optionsArray = (q.options as string).split(',').map((s: string) => s.trim()).filter(Boolean)
        }

        return {
          set_id: setId,
          type: q.type,
          question_text: q.question_text.trim(),
          options: optionsArray,
          answer: q.answer.trim(),
        }
      })

      console.log('문제 저장 시도:', {
        count: questionsToSave.length,
        setId,
        sample: questionsToSave[0],
      })

      // 1. question_sets 테이블에 저장
      const { error: setListError } = await ((supabase
        .from('question_sets') as any)
        .insert({
          id: setId,
          title: setName.trim(),
          description: `AI로 생성된 문제집 (${sourceType})`
        } as any))

      if (setListError) throw setListError

      // 2. questions 테이블에 저장
      const { data, error } = await ((supabase
        .from('questions') as any)
        .insert(questionsToSave as any)
        .select() as any)

      if (error) {
        console.error('문제 저장 에러 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error,
        })

        let errorMessage = '알 수 없는 오류가 발생했습니다.'
        if (error.message) {
          errorMessage = error.message
        } else if (error.details) {
          errorMessage = error.details
        } else if (error.hint) {
          errorMessage = error.hint
        }

        throw new Error(errorMessage)
      }

      console.log('문제 저장 성공:', data)
      alert('문제가 저장되었습니다!')
      router.push('/teacher')
    } catch (error) {
      console.error('Error saving questions:', error)

      let errorMessage = '알 수 없는 오류가 발생했습니다.'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        const err = error as any
        errorMessage = err.message || err.details || err.hint || errorMessage
      }

      alert(`문제 저장에 실패했습니다: ${errorMessage}\n\n브라우저 콘솔을 확인해주세요.`)
    }
  }

  // 문제 수정
  const handleEditQuestion = (index: number, field: keyof GeneratedQuestion, value: any) => {
    const updated = [...generatedQuestions]
    updated[index] = { ...updated[index], [field]: value }
    setGeneratedQuestions(updated)
  }

  // 직접 문제 만들기
  const handleCreateManual = (type: 'CHOICE' | 'SHORT' | 'OX') => {
    // 직접 문제 만들기 페이지로 이동하거나 모달 표시
    alert(`${type === 'CHOICE' ? '선택형' : type === 'SHORT' ? '단답형' : 'OX'} 문제 만들기 기능은 준비 중입니다.`)
  }

  if (isReviewing) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Button
          variant="outline"
          onClick={() => setIsReviewing(false)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로 가기
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>문제 검수</CardTitle>
            <CardDescription>생성된 문제를 검토하고 수정한 후 저장하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">문제집 이름</label>
              <input
                type="text"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                placeholder="예: 한국사 기초 문제집"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {generatedQuestions.map((q, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>문제 {index + 1}</CardTitle>
                  <select
                    value={q.type}
                    onChange={(e) => handleEditQuestion(index, 'type', e.target.value)}
                    className="px-3 py-1 border rounded"
                  >
                    <option value="CHOICE">객관식</option>
                    <option value="OX">OX</option>
                    <option value="SHORT">주관식</option>
                    <option value="BLANK">빈칸</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">문제</label>
                  <textarea
                    value={q.question_text}
                    onChange={(e) => handleEditQuestion(index, 'question_text', e.target.value)}
                    className="w-full px-4 py-2 border rounded-md"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">보기 (쉼표로 구분)</label>
                  <textarea
                    value={Array.isArray(q.options) ? q.options.join(', ') : ''}
                    onChange={(e) =>
                      handleEditQuestion(
                        index,
                        'options',
                        e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    className="w-full px-4 py-2 border rounded-md"
                    rows={2}
                    placeholder="보기를 쉼표로 구분"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">정답</label>
                  <input
                    type="text"
                    value={q.answer}
                    onChange={(e) => handleEditQuestion(index, 'answer', e.target.value)}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsReviewing(false)}
            className="flex-1"
          >
            다시 생성
          </Button>
          <Button
            onClick={handleSaveQuestions}
            className="flex-1"
          >
            저장하기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Button
        variant="outline"
        onClick={() => router.push('/teacher')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        뒤로 가기
      </Button>

      {/* 헤더 섹션 - ZEP QUIZ 스타일 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            QUIZ AI를 이용해 다양한 문제를 빠르게 만들어 보세요
          </h1>
          {/* 로봇 마스코트 */}
          <div className="text-6xl">🤖</div>
        </div>
      </div>

      {/* AI 생성 카드들 */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* 주제 직접 입력 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className={`cursor-pointer transition-all border-2 ${sourceType === 'topic'
              ? 'border-purple-500 bg-purple-50 shadow-lg'
              : 'border-gray-200 hover:border-purple-300'
              }`}
            onClick={() => setSourceType('topic')}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Pencil className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">주제 직접 입력</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {sourceType === 'topic' ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="초5, 도형의 넓이 문제 만들어줘."
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="text-sm text-gray-500">
                    예시: 초5, 도형의 넓이 문제 만들어줘.
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  주제를 입력하면 AI가 자동으로 문제를 생성합니다
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 파일에서 추출 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className={`cursor-pointer transition-all border-2 ${sourceType === 'file'
              ? 'border-purple-500 bg-purple-50 shadow-lg'
              : 'border-gray-200 hover:border-purple-300'
              }`}
            onClick={() => setSourceType('file')}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">파일에서 추출</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {sourceType === 'file' ? (
                <div className="space-y-4">
                  <input
                    type="file"
                    accept=".pdf,.csv,.txt,.docx,.pptx,.hwp"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="text-sm text-gray-500">
                    지원 형식: pdf, csv, txt, docx, pptx, hwp
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  pdf, csv, txt, docx, pptx, hwp
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 유튜브에서 추출 */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className={`cursor-pointer transition-all border-2 relative ${sourceType === 'youtube'
              ? 'border-red-500 bg-red-50 shadow-lg'
              : 'border-gray-200 hover:border-red-300'
              }`}
            onClick={() => setSourceType('youtube')}
          >
            {/* Beta 태그 */}
            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
              Beta
            </div>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Youtube className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-lg">유튜브에서 추출</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {sourceType === 'youtube' ? (
                <div className="space-y-4">
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="유튜브 URL을 입력하세요"
                    className="w-full px-4 py-3 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="text-sm text-gray-500">
                    자막 있는 2시간 이하 영상
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  자막 있는 2시간 이하 영상
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI 생성 버튼 */}
      {sourceType && (
        <div className="mb-8">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                생성할 문제 수
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                className="w-32 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-bold"
              size="lg"
            >
              {isGenerating ? '생성 중...' : '문제 생성하기'}
            </Button>
          </div>
        </div>
      )}

      {/* 구분선 */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-gray-600 font-medium">또는 직접 문제를 만들어 보세요</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* 직접 문제 만들기 버튼들 */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleCreateManual('CHOICE')}
          className="bg-green-500 hover:bg-green-600 text-white rounded-2xl p-8 text-center transition-all shadow-lg hover:shadow-xl"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="text-xl font-bold">선택형 문제 +</div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleCreateManual('SHORT')}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl p-8 text-center transition-all shadow-lg hover:shadow-xl"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div className="text-xl font-bold">단답형 문제 +</div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleCreateManual('OX')}
          className="bg-purple-500 hover:bg-purple-600 text-white rounded-2xl p-8 text-center transition-all shadow-lg hover:shadow-xl"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8" />
            </div>
            <div className="text-xl font-bold">OX 문제 +</div>
          </div>
        </motion.button>
      </div>
    </div>
  )
}
