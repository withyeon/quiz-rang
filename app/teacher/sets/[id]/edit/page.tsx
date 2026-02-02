'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, Reorder } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  GripVertical,
  Edit,
  X,
} from 'lucide-react'
import type { Database } from '@/types/database.types'

type Question = Database['public']['Tables']['questions']['Row']

export default function EditQuestionSetPage() {
  const router = useRouter()
  const params = useParams()
  // URL 디코딩 처리
  const rawSetId = params.id as string
  const setId = rawSetId ? decodeURIComponent(rawSetId) : ''

  const [questions, setQuestions] = useState<Question[]>([])
  const [setName, setSetName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [newQuestion, setNewQuestion] = useState<Partial<Question> | null>(null)

  useEffect(() => {
    if (setId) {
      loadQuestions()
    }
  }, [setId])

  const loadQuestions = async () => {
    try {
      setLoading(true)

      // 1. 문제집 정보 가져오기
      const { data: setData, error: setError } = await ((supabase
        .from('question_sets') as any)
        .select('*')
        .eq('id', setId)
        .single() as any)

      if (setError) {
        console.error('Error loading set info:', setError)
        // DB에 없다면 ID에서 유추 (fallback)
        if (!setName) setSetName(setId.replace('set-', '').replace(/-/g, ' '))
      } else if (setData) {
        setSetName(setData.title)
      }

      // 2. 문제 목록 가져오기
      const { data, error } = await ((supabase
        .from('questions') as any)
        .select('*')
        .eq('set_id', setId)
        .order('created_at', { ascending: true }) as any)

      if (error) throw error

      setQuestions((data as Question[]) || [])
    } catch (error) {
      console.error('Error loading questions:', error)
      alert('문제를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveQuestion = async (index: number) => {
    const question = questions[index]
    if (!question) return

    try {
      const { error } = await ((supabase
        .from('questions') as any)
        .update({
          type: question.type,
          question_text: question.question_text,
          options: question.options,
          answer: question.answer,
        })
        .eq('id', question.id))

      if (error) throw error

      setEditingIndex(null)
      alert('문제가 저장되었습니다.')
    } catch (error) {
      console.error('Error saving question:', error)
      alert('문제 저장에 실패했습니다.')
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('정말 이 문제를 삭제하시겠습니까?')) return

    try {
      const { error } = await ((supabase
        .from('questions') as any)
        .delete()
        .eq('id', id))

      if (error) throw error

      setQuestions(questions.filter(q => q.id !== id))
      alert('문제가 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('문제 삭제에 실패했습니다.')
    }
  }

  const handleAddQuestion = async () => {
    if (!newQuestion) return

    if (!newQuestion.type || !newQuestion.question_text || !newQuestion.answer) {
      alert('문제 유형, 문제 내용, 정답을 모두 입력해주세요.')
      return
    }

    try {
      const questionToAdd = {
        set_id: setId,
        type: newQuestion.type,
        question_text: newQuestion.question_text,
        options: newQuestion.options || [],
        answer: newQuestion.answer,
      }

      const { data, error } = await ((supabase
        .from('questions') as any)
        .insert(questionToAdd as any)
        .select()
        .single() as any)

      if (error) throw error

      setQuestions([...questions, data as Question])
      setNewQuestion(null)
      alert('문제가 추가되었습니다.')
    } catch (error) {
      console.error('Error adding question:', error)
      alert('문제 추가에 실패했습니다.')
    }
  }

  const handleReorder = async (newOrder: Question[]) => {
    setQuestions(newOrder)
    // 순서는 created_at으로 관리되므로, 필요시 별도 order 필드 추가 가능
  }

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const updateNewQuestion = (field: keyof Question, value: any) => {
    if (!newQuestion) return
    setNewQuestion({ ...newQuestion, [field]: value })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-gray-800">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/teacher')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로 가기
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">문제집 편집</h1>
            <p className="text-gray-600 mt-1">{setName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            총 {questions.length}문제
          </span>
        </div>
      </div>

      {/* 문제 목록 */}
      <div className="space-y-4 mb-6">
        <Reorder.Group
          axis="y"
          values={questions}
          onReorder={handleReorder}
          className="space-y-4"
        >
          {questions.map((question, index) => (
            <Reorder.Item
              key={question.id}
              value={question}
              className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-6"
            >
              <div className="flex items-start gap-4">
                {/* 드래그 핸들 */}
                <div className="flex-shrink-0 pt-2 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-6 w-6 text-gray-400" />
                </div>

                {/* 문제 번호 */}
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                  {index + 1}
                </div>

                {/* 문제 내용 */}
                <div className="flex-1">
                  {editingIndex === index ? (
                    <div className="space-y-4">
                      {/* 문제 유형 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          문제 유형
                        </label>
                        <select
                          value={question.type}
                          onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="CHOICE">객관식</option>
                          <option value="OX">OX</option>
                          <option value="SHORT">주관식</option>
                          <option value="BLANK">빈칸</option>
                        </select>
                      </div>

                      {/* 문제 텍스트 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          문제
                        </label>
                        <textarea
                          value={question.question_text}
                          onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          rows={3}
                        />
                      </div>

                      {/* 보기 (객관식일 때만) */}
                      {question.type === 'CHOICE' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            보기 (쉼표로 구분)
                          </label>
                          <input
                            type="text"
                            value={Array.isArray(question.options) ? question.options.join(', ') : ''}
                            onChange={(e) => {
                              const options = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                              updateQuestion(index, 'options', options)
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="보기1, 보기2, 보기3, 보기4"
                          />
                        </div>
                      )}

                      {/* 정답 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          정답
                        </label>
                        <input
                          type="text"
                          value={question.answer}
                          onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      {/* 저장/취소 버튼 */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSaveQuestion(index)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          저장
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingIndex(null)
                            loadQuestions() // 원래 상태로 복원
                          }}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                            {question.type === 'CHOICE' ? '객관식' :
                              question.type === 'OX' ? 'OX' :
                                question.type === 'SHORT' ? '주관식' : '빈칸'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingIndex(index)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            삭제
                          </Button>
                        </div>
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        {question.question_text}
                      </p>
                      {question.type === 'CHOICE' && Array.isArray(question.options) && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-1">보기:</p>
                          <div className="flex flex-wrap gap-2">
                            {question.options.map((option, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-gray-100 rounded text-sm"
                              >
                                {String(option)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-semibold">정답:</span> {question.answer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* 새 문제 추가 */}
      {newQuestion ? (
        <Card className="border-2 border-purple-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>새 문제 추가</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewQuestion(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                문제 유형
              </label>
              <select
                value={newQuestion.type || 'CHOICE'}
                onChange={(e) => updateNewQuestion('type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="CHOICE">객관식</option>
                <option value="OX">OX</option>
                <option value="SHORT">주관식</option>
                <option value="BLANK">빈칸</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                문제
              </label>
              <textarea
                value={newQuestion.question_text || ''}
                onChange={(e) => updateNewQuestion('question_text', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="문제를 입력하세요"
              />
            </div>

            {newQuestion.type === 'CHOICE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  보기 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={Array.isArray(newQuestion.options) ? newQuestion.options.join(', ') : ''}
                  onChange={(e) => {
                    const options = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    updateNewQuestion('options', options)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="보기1, 보기2, 보기3, 보기4"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정답
              </label>
              <input
                type="text"
                value={newQuestion.answer || ''}
                onChange={(e) => updateNewQuestion('answer', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="정답을 입력하세요"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddQuestion}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                추가
              </Button>
              <Button
                variant="outline"
                onClick={() => setNewQuestion(null)}
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setNewQuestion({
            type: 'CHOICE',
            question_text: '',
            options: [],
            answer: '',
          })}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-bold"
        >
          <Plus className="h-5 w-5 mr-2" />
          새 문제 추가
        </Button>
      )}
    </div>
  )
}
