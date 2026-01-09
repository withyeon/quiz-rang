import { NextRequest, NextResponse } from 'next/server'
import { generateQuestions, type QuestionInput } from '@/lib/ai/questionGenerator'
import { getYouTubeTranscript } from '@/lib/utils/youtube'
import { extractTextFromPDF } from '@/lib/utils/pdf'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const sourceType = formData.get('sourceType') as 'topic' | 'youtube' | 'text' | 'pdf'
    const questionCount = parseInt(formData.get('questionCount') as string) || 5

    if (!['topic', 'youtube', 'text', 'pdf'].includes(sourceType)) {
      return NextResponse.json({ error: 'Invalid source type' }, { status: 400 })
    }

    let input: QuestionInput = {
      sourceType,
    }

    if (sourceType === 'topic') {
      const topic = formData.get('topic') as string
      if (!topic) {
        return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
      }
      input.topic = topic
    } else if (sourceType === 'youtube') {
      const youtubeUrl = formData.get('youtubeUrl') as string
      if (!youtubeUrl) {
        return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
      }
      const transcript = await getYouTubeTranscript(youtubeUrl)
      input.text = transcript
    } else if (sourceType === 'text') {
      const text = formData.get('text') as string
      if (!text) {
        return NextResponse.json({ error: 'Text is required' }, { status: 400 })
      }
      input.text = text
    } else if (sourceType === 'pdf') {
      const file = formData.get('file') as File
      if (!file) {
        return NextResponse.json({ error: 'PDF file is required' }, { status: 400 })
      }
      const text = await extractTextFromPDF(file)
      input.text = text
    }

    const questions = await generateQuestions(input, questionCount)

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: '생성된 문제가 없습니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error generating questions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate questions'
    
    // API 키 관련 에러인 경우 더 명확한 메시지 제공
    if (errorMessage.includes('API key') || errorMessage.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'AI API 키가 설정되지 않았습니다. GEMINI_API_KEY 또는 OPENAI_API_KEY 환경 변수를 설정해주세요.' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
