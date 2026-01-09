'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, Youtube, FileUp, Type } from 'lucide-react'
import type { Database } from '@/types/database.types'
import type { GeneratedQuestion } from '@/lib/ai/questionGenerator'
import { filterNickname } from '@/lib/utils/profanityFilter'

type SourceType = 'topic' | 'youtube' | 'text' | 'pdf'

export default function CreateQuestionPage() {
  const router = useRouter()
  const [sourceType, setSourceType] = useState<SourceType>('topic')
  const [topic, setTopic] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [text, setText] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
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
    if (sourceType === 'text' && !text.trim()) {
      alert('텍스트를 입력해주세요.')
      return
    }
    if (sourceType === 'pdf' && !pdfFile) {
      alert('PDF 파일을 선택해주세요.')
      return
    }

    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append('sourceType', sourceType)
      formData.append('questionCount', questionCount.toString())

      if (sourceType === 'topic') {
        formData.append('topic', topic)
      } else if (sourceType === 'youtube') {
        formData.append('youtubeUrl', youtubeUrl)
      } else if (sourceType === 'text') {
        formData.append('text', text)
      } else if (sourceType === 'pdf' && pdfFile) {
        formData.append('file', pdfFile)
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

    // 닉네임 필터링 (문제집 이름도 필터링)
    const nameCheck = filterNickname(setName)
    if (!nameCheck.isValid) {
      alert('문제집 이름에 부적절한 단어가 포함되어 있습니다.')
      return
    }

    try {
      // set_id 생성
      const setId = `set-${Date.now()}`

      const questionsToSave = generatedQuestions.map((q) => ({
        set_id: setId,
        type: q.type,
        question_text: q.question_text,
        options: q.options,
        answer: q.answer,
      }))

      console.log('문제 저장 시도:', questionsToSave.length, '개')
      const { error } = await ((supabase
        .from('questions') as any)
        .insert(questionsToSave as any))

      if (error) {
        console.error('문제 저장 에러 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      console.log('문제 저장 성공')
      alert('문제가 저장되었습니다!')
      router.push('/teacher')
    } catch (error) {
      console.error('Error saving questions:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      alert(`문제 저장에 실패했습니다: ${errorMessage}\n\n브라우저 콘솔을 확인해주세요.`)
    }
  }

  // 문제 수정
  const handleEditQuestion = (index: number, field: keyof GeneratedQuestion, value: any) => {
    const updated = [...generatedQuestions]
    updated[index] = { ...updated[index], [field]: value }
    setGeneratedQuestions(updated)
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
    <div className="max-w-4xl mx-auto p-6">
      <Button
        variant="outline"
        onClick={() => router.push('/teacher')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        뒤로 가기
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>문제 생성</CardTitle>
          <CardDescription>AI를 사용하여 문제를 자동으로 생성합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 입력 방식 선택 */}
          <div>
            <label className="block text-sm font-medium mb-3">입력 방식</label>
            <div className="grid grid-cols-4 gap-3">
              {(['topic', 'youtube', 'text', 'pdf'] as SourceType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSourceType(type)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    sourceType === type
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {type === 'topic' && (
                    <>
                      <FileText className="h-6 w-6 mx-auto mb-2 text-primary-600" />
                      <div className="text-sm font-medium">주제 입력</div>
                    </>
                  )}
                  {type === 'youtube' && (
                    <>
                      <Youtube className="h-6 w-6 mx-auto mb-2 text-red-600" />
                      <div className="text-sm font-medium">유튜브</div>
                    </>
                  )}
                  {type === 'text' && (
                    <>
                      <Type className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
                      <div className="text-sm font-medium">텍스트</div>
                    </>
                  )}
                  {type === 'pdf' && (
                    <>
                      <FileUp className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <div className="text-sm font-medium">PDF</div>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 입력 필드 */}
          <div className="space-y-4">
            {sourceType === 'topic' && (
              <div>
                <label className="block text-sm font-medium mb-2">주제</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="예: 한국사, 수학, 과학 등"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}

            {sourceType === 'youtube' && (
              <div>
                <label className="block text-sm font-medium mb-2">유튜브 URL</label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}

            {sourceType === 'text' && (
              <div>
                <label className="block text-sm font-medium mb-2">텍스트</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="텍스트를 입력하거나 붙여넣으세요..."
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}

            {sourceType === 'pdf' && (
              <div>
                <label className="block text-sm font-medium mb-2">PDF 파일</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">생성할 문제 수</label>
              <input
                type="number"
                min="1"
                max="20"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? '생성 중...' : '문제 생성하기'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
