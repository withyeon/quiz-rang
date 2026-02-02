'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Search,
  ChevronUp,
  ChevronDown,
  Share2,
  Copy,
  Eye,
  Bookmark,
  Play,
  Copy as CopyIcon,
} from 'lucide-react'
import GameTypeSelector, { type GameType } from '@/components/GameTypeSelector'
import type { Database } from '@/types/database.types'

type QuestionSet = {
  set_id: string
  name: string
  question_count: number
  created_at: string
  subject?: string
  grade?: string
  creator?: string
  view_count?: number
  save_count?: number
  tags?: string[]
  is_public?: boolean
}

const SUBJECTS = [
  { id: 'integrated', name: '통합교과', icon: '📚' },
  { id: 'creative', name: '창의적 체험활동', icon: '🎨' },
  { id: 'korean', name: '국어', icon: '📖' },
  { id: 'math', name: '수학', icon: '🔢' },
  { id: 'social', name: '사회', icon: '🌍' },
  { id: 'science', name: '과학', icon: '🔬' },
  { id: 'english', name: '영어', icon: '🔤' },
  { id: 'ethics', name: '도덕', icon: '💭' },
]

const GRADES = [
  { id: 'all', name: '전체' },
  { id: 'elementary', name: '초등학교' },
  { id: 'middle', name: '중학교' },
  { id: 'high', name: '고등학교' },
]

const ELEMENTARY_GRADES = [
  { id: '1', name: '1학년' },
  { id: '2', name: '2학년' },
  { id: '3', name: '3학년' },
  { id: '4', name: '4학년' },
  { id: '5', name: '5학년' },
  { id: '6', name: '6학년' },
]

const MIDDLE_GRADES = [
  { id: '1', name: '1학년' },
  { id: '2', name: '2학년' },
  { id: '3', name: '3학년' },
]

const HIGH_GRADES = [
  { id: '1', name: '1학년' },
  { id: '2', name: '2학년' },
  { id: '3', name: '3학년' },
]

type SortType = 'popular_weekly' | 'popular_daily' | 'popular_monthly' | 'recent' | 'name'

function LibraryPageContent() {
  const router = useRouter()
  
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [allQuestionSets, setAllQuestionSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(true)
  
  // 필터 상태
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [selectedGradeCategory, setSelectedGradeCategory] = useState<string>('all')
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null)
  const [showOfficialOnly, setShowOfficialOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortType, setSortType] = useState<SortType>('popular_weekly')
  const [expandedSubjects, setExpandedSubjects] = useState(true)
  const [expandedGrades, setExpandedGrades] = useState(true)
  const [showGameTypeSelector, setShowGameTypeSelector] = useState(false)
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)

  useEffect(() => {
    loadQuestionSets()
  }, [])

  const loadQuestionSets = async () => {
    try {
      setLoading(true)
      // 모든 공개된 문제집 가져오기 (나중에 is_public 필드 추가 가능)
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
            subject: extractSubject(item.set_id),
            grade: extractGrade(item.set_id),
            creator: '선생님',
            view_count: Math.floor(Math.random() * 10000) + 100,
            save_count: Math.floor(Math.random() * 500) + 10,
            tags: generateTags(item.set_id),
            is_public: true,
          }
        }
        acc[item.set_id].question_count++
        return acc
      }, {} as Record<string, QuestionSet>)

      const sets = Object.values(grouped) as QuestionSet[]
      setAllQuestionSets(sets)
      setQuestionSets(sets)
    } catch (error) {
      console.error('Error loading question sets:', error)
    } finally {
      setLoading(false)
    }
  }

  const extractSubject = (setId: string): string => {
    const subject = SUBJECTS.find(s => setId.includes(s.id))
    return subject?.id || 'integrated'
  }

  const extractGrade = (setId: string): string => {
    const gradeMatch = setId.match(/(초|중|고)\s*(\d)/)
    if (gradeMatch) {
      const level = gradeMatch[1] === '초' ? 'elementary' : gradeMatch[1] === '중' ? 'middle' : 'high'
      return `${level}-${gradeMatch[2]}`
    }
    return 'elementary-3'
  }

  const generateTags = (setId: string): string[] => {
    const tags: string[] = []
    const grade = extractGrade(setId)
    if (grade.startsWith('elementary')) {
      tags.push(`초등 ${grade.split('-')[1]}`)
    } else if (grade.startsWith('middle')) {
      tags.push(`중등 ${grade.split('-')[1]}`)
    } else if (grade.startsWith('high')) {
      tags.push(`고등 ${grade.split('-')[1]}`)
    }
    return tags
  }

  const getSubjectCount = (subjectId: string) => {
    return allQuestionSets.filter(set => set.subject === subjectId).length
  }

  // 문제집 복사
  const handleCopySet = async (setId: string) => {
    try {
      // 원본 문제집의 문제들 가져오기
      const { data: questions, error } = await ((supabase
        .from('questions') as any)
        .select('*')
        .eq('set_id', setId) as any)

      if (error) throw error

      if (!questions || questions.length === 0) {
        alert('복사할 문제가 없습니다.')
        return
      }

      // 새 문제집 ID 생성
      const originalSet = allQuestionSets.find(s => s.set_id === setId)
      const newSetId = `set-${Date.now()}-${originalSet?.name.replace(/\s+/g, '-') || 'copied'}`

      // 문제 복사 (새 set_id로)
      const questionsToCopy = questions.map((q: any) => ({
        set_id: newSetId,
        type: q.type,
        question_text: q.question_text,
        options: q.options,
        answer: q.answer,
      }))

      const { error: insertError } = await ((supabase
        .from('questions') as any)
        .insert(questionsToCopy as any))

      if (insertError) throw insertError

      alert('문제집이 복사되었습니다! 내 문제집에서 확인하세요.')
      router.push('/teacher')
    } catch (error) {
      console.error('Error copying set:', error)
      alert('문제집 복사에 실패했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // 필터링된 문제집
  const filteredSets = useMemo(() => {
    let filtered = [...allQuestionSets]

    if (selectedSubject) {
      filtered = filtered.filter(set => set.subject === selectedSubject)
    }

    if (selectedGradeCategory !== 'all') {
      filtered = filtered.filter(set => {
        const grade = set.grade || 'elementary-3'
        return grade.startsWith(selectedGradeCategory)
      })
    }

    if (selectedGrade) {
      filtered = filtered.filter(set => {
        const grade = set.grade || 'elementary-3'
        return grade === selectedGrade
      })
    }

    if (searchQuery) {
      filtered = filtered.filter(set =>
        set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.creator?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    switch (sortType) {
      case 'popular_weekly':
      case 'popular_daily':
      case 'popular_monthly':
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        break
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return filtered
  }, [allQuestionSets, selectedSubject, selectedGradeCategory, selectedGrade, searchQuery, sortType])

  const handleStartGame = (setId: string) => {
    setSelectedSetId(setId)
    setShowGameTypeSelector(true)
  }

  const handleGameTypeSelect = (gameType: GameType) => {
    if (!selectedSetId) return
    
    const gameMode = gameType === 'sequential' ? 'gold_quest' : 
                     gameType === 'free' ? 'racing' : 'gold_quest'
    
    window.location.href = `/teacher/dashboard?set=${selectedSetId}&gameType=${gameType}&gameMode=${gameMode}`
  }

  const handleCopy = async (setId: string) => {
    const url = `${window.location.origin}/teacher/library?set=${setId}`
    try {
      await navigator.clipboard.writeText(url)
      alert('링크가 복사되었습니다!')
    } catch (error) {
      console.error('복사 실패:', error)
    }
  }

  return (
    <div className="flex gap-6">
      {/* Left Sidebar - 필터 */}
      <aside className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3">필터</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOfficialOnly}
                onChange={(e) => setShowOfficialOnly(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm text-gray-700">공식 퀴즈만 보기</span>
            </label>
          </div>

          <div className="mb-6">
            <button
              onClick={() => setExpandedSubjects(!expandedSubjects)}
              className="w-full flex items-center justify-between font-bold text-gray-900 mb-3"
            >
              <span>과목</span>
              {expandedSubjects ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {expandedSubjects && (
              <div className="space-y-2">
                {SUBJECTS.map((subject) => {
                  const count = getSubjectCount(subject.id)
                  return (
                    <button
                      key={subject.id}
                      onClick={() => setSelectedSubject(selectedSubject === subject.id ? null : subject.id)}
                      className={`w-full flex items-center justify-between p-2 rounded hover:bg-gray-100 transition-colors ${
                        selectedSubject === subject.id ? 'bg-purple-50 text-purple-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{subject.icon}</span>
                        <span className="text-sm">{subject.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{count}</span>
                        <span className="text-purple-600">+</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setExpandedGrades(!expandedGrades)}
              className="w-full flex items-center justify-between font-bold text-gray-900 mb-3"
            >
              <span>학년</span>
              {expandedGrades ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {expandedGrades && (
              <div className="space-y-2">
                {GRADES.map((grade) => (
                  <button
                    key={grade.id}
                    onClick={() => {
                      setSelectedGradeCategory(grade.id)
                      setSelectedGrade(null)
                    }}
                    className={`w-full text-left p-2 rounded hover:bg-gray-100 transition-colors ${
                      selectedGradeCategory === grade.id ? 'bg-purple-50 text-purple-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-sm">{grade.name}</span>
                  </button>
                ))}

                {selectedGradeCategory === 'elementary' && (
                  <div className="ml-4 space-y-1 mt-2">
                    {ELEMENTARY_GRADES.map((grade) => (
                      <button
                        key={grade.id}
                        onClick={() => setSelectedGrade(`elementary-${grade.id}`)}
                        className={`w-full text-left p-2 rounded hover:bg-gray-100 transition-colors text-sm ${
                          selectedGrade === `elementary-${grade.id}` ? 'bg-purple-50 text-purple-600 font-semibold' : 'text-gray-600'
                        }`}
                      >
                        {grade.name}
                      </button>
                    ))}
                  </div>
                )}

                {selectedGradeCategory === 'middle' && (
                  <div className="ml-4 space-y-1 mt-2">
                    {MIDDLE_GRADES.map((grade) => (
                      <button
                        key={grade.id}
                        onClick={() => setSelectedGrade(`middle-${grade.id}`)}
                        className={`w-full text-left p-2 rounded hover:bg-gray-100 transition-colors text-sm ${
                          selectedGrade === `middle-${grade.id}` ? 'bg-purple-50 text-purple-600 font-semibold' : 'text-gray-600'
                        }`}
                      >
                        {grade.name}
                      </button>
                    ))}
                  </div>
                )}

                {selectedGradeCategory === 'high' && (
                  <div className="ml-4 space-y-1 mt-2">
                    {HIGH_GRADES.map((grade) => (
                      <button
                        key={grade.id}
                        onClick={() => setSelectedGrade(`high-${grade.id}`)}
                        className={`w-full text-left p-2 rounded hover:bg-gray-100 transition-colors text-sm ${
                          selectedGrade === `high-${grade.id}` ? 'bg-purple-50 text-purple-600 font-semibold' : 'text-gray-600'
                        }`}
                      >
                        {grade.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1">
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="퀴즈 제목 또는 크리에이터를 검색하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {filteredSets.length.toLocaleString()}개
              </span>
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value as SortType)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="popular_weekly">↑↓ 인기순 주간</option>
                <option value="popular_daily">↑↓ 인기순 일간</option>
                <option value="popular_monthly">↑↓ 인기순 월간</option>
                <option value="recent">최신순</option>
                <option value="name">이름순</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : filteredSets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
            <p className="text-gray-600">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSets.map((set, index) => {
              const subject = SUBJECTS.find(s => s.id === set.subject) || SUBJECTS[0]
              return (
                <motion.div
                  key={set.set_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-4">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-5xl">{subject.icon}</span>
                    </div>
                    <div className="flex-1">
                      {set.tags && set.tags.length > 0 && (
                        <div className="flex gap-2 mb-2">
                          {set.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 mb-1 hover:text-purple-600 cursor-pointer">
                        {set.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{set.creator}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span>{set.question_count}문제</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {((set.view_count || 0) / 1000).toFixed(1)}K
                        </span>
                        <span className="flex items-center gap-1">
                          <Bookmark className="h-4 w-4" />
                          {set.save_count}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => handleStartGame(set.set_id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          게임 시작
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopySet(set.set_id)}
                        >
                          <CopyIcon className="h-4 w-4 mr-1" />
                          복사
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(set.set_id)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          링크 복사
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          공유
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Right Sidebar - 인기 퀴즈 */}
      <aside className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 sticky top-4">
          <h3 className="font-bold text-gray-900 mb-4">전체 인기 퀴즈</h3>
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            {['일간', '주간', '월간'].map((tab, index) => (
              <button
                key={tab}
                onClick={() => setSortType(index === 0 ? 'popular_daily' : index === 1 ? 'popular_weekly' : 'popular_monthly')}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  (index === 0 && sortType === 'popular_daily') ||
                  (index === 1 && sortType === 'popular_weekly') ||
                  (index === 2 && sortType === 'popular_monthly')
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredSets.slice(0, 5).map((set, index) => (
              <div key={set.set_id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">
                    {SUBJECTS.find(s => s.id === set.subject)?.icon || '📚'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{set.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Game Type Selector Modal */}
      <GameTypeSelector
        isOpen={showGameTypeSelector}
        onClose={() => {
          setShowGameTypeSelector(false)
          setSelectedSetId(null)
        }}
        onSelect={handleGameTypeSelect}
        questionSetName={selectedSetId ? questionSets.find(s => s.set_id === selectedSetId)?.name : undefined}
      />
    </div>
  )
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <LibraryPageContent />
    </Suspense>
  )
}
