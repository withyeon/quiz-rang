# K-Blooket

한국 교육 현장에 최적화된 실시간 게이미피케이션 퀴즈 플랫폼

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# AI API 설정 (문제 생성 기능 사용 시 필수)
# Gemini API 또는 OpenAI API 중 하나만 설정
GEMINI_API_KEY=your-gemini-api-key-here
# 또는
# OPENAI_API_KEY=your-openai-api-key-here
```

**API 키 발급 방법:**
- **Supabase**: https://supabase.com → 프로젝트 생성 → Settings > API
- **Gemini API**: https://makersuite.google.com/app/apikey (무료 할당량 많음, 권장)
- **OpenAI API**: https://platform.openai.com/api-keys

3. 개발 서버 실행:
```bash
npm run dev
```

## Supabase 데이터베이스 설정

다음 SQL을 Supabase SQL Editor에서 실행하여 테이블을 생성하세요:

```sql
-- rooms 테이블
CREATE TABLE rooms (
  room_code TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  current_q_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- players 테이블 (Realtime 활성화 필수)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL REFERENCES rooms(room_code) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  gold INTEGER NOT NULL DEFAULT 0,
  avatar TEXT,
  is_online BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- questions 테이블
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CHOICE', 'SHORT', 'OX', 'BLANK')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- 인덱스 생성
CREATE INDEX idx_players_room_code ON players(room_code);
CREATE INDEX idx_players_score ON players(score DESC);
CREATE INDEX idx_questions_set_id ON questions(set_id);
```

## 주요 기능

### Phase 1: 환경설정 및 Realtime 테스트 ✅
- Next.js App Router 설정
- Supabase 클라이언트 연동
- players 테이블 Realtime 구독
- 실시간 점수 업데이트 테스트 UI

### Phase 2: Gold Quest 게임 로직 ✅
- 퀴즈 문제 표시 (CHOICE, OX, SHORT, BLANK)
- 답안 제출 및 정답 확인
- Gold Quest 상자 시스템 (Gold 획득/손실, Swap, Nothing)
- 게임 플로우 통합

### Phase 3: AI 문제 생성 ✅
- 주제 기반 문제 생성
- 유튜브 자막 추출 및 문제 생성
- PDF 텍스트 추출 및 문제 생성
- 텍스트 입력 기반 문제 생성
- 문제 검수 UI (엑셀 시트 스타일)

### Phase 4: 디테일 기능 ✅
- 닉네임 필터링 (비속어 필터)
- 선생님 강퇴 기능
- 아바타(이모지) 선택 기능

## 페이지 구조

- `/` - 메인 페이지 (방 입장, 플레이어 목록)
- `/game` - 게임 페이지 (퀴즈 플레이)
- `/teacher` - 선생님 페이지 (문제 생성)

## 사용 방법

1. **선생님**: `/teacher` 페이지에서 문제 생성
   - 주제, 유튜브, 텍스트, PDF 중 선택
   - AI가 문제 생성
   - 검수 후 저장

2. **학생**: `/` 페이지에서 방 입장
   - 방 코드 입력
   - 닉네임 및 아바타 선택
   - "게임 시작하기" 클릭

3. **게임 플레이**:
   - 문제 풀기
   - 정답 시 상자 선택
   - 이벤트 적용 (Gold 획득/손실, Swap 등)
   - 다음 문제로 진행

## 기술 스택

- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Database & Backend: Supabase (PostgreSQL)
- Realtime: Supabase Realtime
- AI: Gemini API / OpenAI API
- External Libs: youtube-transcript, pdf-parse
