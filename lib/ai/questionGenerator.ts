import { GoogleGenerativeAI } from '@google/generative-ai'

// 환경 변수에서 API 키 가져오기
const getApiKey = () => {
  const geminiKey = process.env.GEMINI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  
  if (geminiKey) {
    console.log('GEMINI_API_KEY 로드 성공')
    return geminiKey
  }
  if (openaiKey) {
    console.log('OPENAI_API_KEY 로드 성공')
    return openaiKey
  }
  
  console.error('AI API key not found:', {
    hasGemini: !!geminiKey,
    hasOpenAI: !!openaiKey,
  })
  throw new Error('AI API key not found. Set GEMINI_API_KEY or OPENAI_API_KEY')
}

export interface QuestionInput {
  topic?: string
  text?: string
  sourceType: 'topic' | 'youtube' | 'text' | 'pdf'
}

export interface GeneratedQuestion {
  type: 'CHOICE' | 'SHORT' | 'OX' | 'BLANK'
  question_text: string
  options: string[]
  answer: string
}

/**
 * Gemini API를 사용하여 문제 생성
 */
export async function generateQuestionsWithGemini(
  input: QuestionInput,
  questionCount: number = 5
): Promise<GeneratedQuestion[]> {
  const apiKey = getApiKey()
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  let prompt = ''

  if (input.sourceType === 'topic') {
    prompt = `다음 주제에 대해 한국 초/중/고등학교 수준의 퀴즈 문제 ${questionCount}개를 생성해주세요.

주제: ${input.topic}

각 문제는 다음 JSON 형식으로 출력해주세요:
{
  "questions": [
    {
      "type": "CHOICE" | "SHORT" | "OX" | "BLANK",
      "question_text": "문제 텍스트",
      "options": ["보기1", "보기2", "보기3", "보기4"] (CHOICE/OX인 경우만),
      "answer": "정답"
    }
  ]
}

주의사항:
- BLANK 타입의 경우 question_text에 {{blank}} 플레이스홀더를 사용하세요.
- CHOICE 타입은 반드시 4개의 보기를 제공하세요.
- OX 타입은 options에 ["O", "X"]만 포함하세요.
- SHORT 타입은 options를 빈 배열로 하세요.
- JSON만 출력하고 다른 설명은 포함하지 마세요.`
  } else if (input.sourceType === 'youtube' || input.sourceType === 'text' || input.sourceType === 'pdf') {
    prompt = `다음 텍스트를 기반으로 한국 초/중/고등학교 수준의 퀴즈 문제 ${questionCount}개를 생성해주세요.

텍스트:
${input.text}

각 문제는 다음 JSON 형식으로 출력해주세요:
{
  "questions": [
    {
      "type": "CHOICE" | "SHORT" | "OX" | "BLANK",
      "question_text": "문제 텍스트",
      "options": ["보기1", "보기2", "보기3", "보기4"] (CHOICE/OX인 경우만),
      "answer": "정답"
    }
  ]
}

주의사항:
- BLANK 타입의 경우 question_text에 {{blank}} 플레이스홀더를 사용하세요.
- CHOICE 타입은 반드시 4개의 보기를 제공하세요.
- OX 타입은 options에 ["O", "X"]만 포함하세요.
- SHORT 타입은 options를 빈 배열로 하세요.
- 텍스트의 핵심 내용을 바탕으로 문제를 만들어주세요.
- JSON만 출력하고 다른 설명은 포함하지 마세요.`
  }

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // JSON 추출 (코드 블록 제거)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return parsed.questions || []
  } catch (error) {
    console.error('Error generating questions with Gemini:', error)
    throw error
  }
}

/**
 * OpenAI API를 사용하여 문제 생성 (대체 옵션)
 */
export async function generateQuestionsWithOpenAI(
  input: QuestionInput,
  questionCount: number = 5
): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found')
  }

  let prompt = ''

  if (input.sourceType === 'topic') {
    prompt = `다음 주제에 대해 한국 초/중/고등학교 수준의 퀴즈 문제 ${questionCount}개를 생성해주세요.

주제: ${input.topic}

각 문제는 다음 JSON 형식으로 출력해주세요:
{
  "questions": [
    {
      "type": "CHOICE" | "SHORT" | "OX" | "BLANK",
      "question_text": "문제 텍스트",
      "options": ["보기1", "보기2", "보기3", "보기4"] (CHOICE/OX인 경우만),
      "answer": "정답"
    }
  ]
}

주의사항:
- BLANK 타입의 경우 question_text에 {{blank}} 플레이스홀더를 사용하세요.
- CHOICE 타입은 반드시 4개의 보기를 제공하세요.
- OX 타입은 options에 ["O", "X"]만 포함하세요.
- SHORT 타입은 options를 빈 배열로 하세요.
- JSON만 출력하고 다른 설명은 포함하지 마세요.`
  } else {
    prompt = `다음 텍스트를 기반으로 한국 초/중/고등학교 수준의 퀴즈 문제 ${questionCount}개를 생성해주세요.

텍스트:
${input.text}

각 문제는 다음 JSON 형식으로 출력해주세요:
{
  "questions": [
    {
      "type": "CHOICE" | "SHORT" | "OX" | "BLANK",
      "question_text": "문제 텍스트",
      "options": ["보기1", "보기2", "보기3", "보기4"] (CHOICE/OX인 경우만),
      "answer": "정답"
    }
  ]
}

주의사항:
- BLANK 타입의 경우 question_text에 {{blank}} 플레이스홀더를 사용하세요.
- CHOICE 타입은 반드시 4개의 보기를 제공하세요.
- OX 타입은 options에 ["O", "X"]만 포함하세요.
- SHORT 타입은 options를 빈 배열로 하세요.
- 텍스트의 핵심 내용을 바탕으로 문제를 만들어주세요.
- JSON만 출력하고 다른 설명은 포함하지 마세요.`
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates educational quiz questions in Korean.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const text = data.choices[0].message.content

    // JSON 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return parsed.questions || []
  } catch (error) {
    console.error('Error generating questions with OpenAI:', error)
    throw error
  }
}

/**
 * 기본 문제 생성 함수 (Gemini 우선, 없으면 OpenAI)
 */
export async function generateQuestions(
  input: QuestionInput,
  questionCount: number = 5
): Promise<GeneratedQuestion[]> {
  try {
    if (process.env.GEMINI_API_KEY) {
      return await generateQuestionsWithGemini(input, questionCount)
    } else if (process.env.OPENAI_API_KEY) {
      return await generateQuestionsWithOpenAI(input, questionCount)
    } else {
      throw new Error('No AI API key configured')
    }
  } catch (error) {
    console.error('Error generating questions:', error)
    throw error
  }
}
