import { YoutubeTranscript } from 'youtube-transcript'

/**
 * 유튜브 비디오 ID 추출
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * 유튜브 자막 추출
 */
export async function getYouTubeTranscript(videoUrl: string): Promise<string> {
  const videoId = extractVideoId(videoUrl)
  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'ko', // 한국어 우선, 없으면 영어
    })

    // 자막 텍스트 합치기
    const text = transcript.map((item) => item.text).join(' ')
    return text
  } catch (error) {
    // 한국어 자막이 없으면 영어로 시도
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en',
      })
      const text = transcript.map((item) => item.text).join(' ')
      return text
    } catch (fallbackError) {
      throw new Error(
        `Failed to fetch transcript: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
