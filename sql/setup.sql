-- ============================================
-- 퀴즈독 (Quiz-Dog) 데이터베이스 설정
-- ============================================
-- 이 파일은 Supabase SQL Editor에서 실행하세요.
-- Supabase 대시보드 > SQL Editor > New Query > 이 파일 내용 붙여넣기 > Run

-- ============================================
-- 1. 테이블 생성
-- ============================================

-- rooms 테이블 생성 (게임 방 정보)
CREATE TABLE IF NOT EXISTS rooms (
  room_code TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  current_q_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- players 테이블 생성 (플레이어 정보)
-- Realtime 활성화 필수
CREATE TABLE IF NOT EXISTS players (
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

-- questions 테이블 생성 (문제 정보)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('CHOICE', 'SHORT', 'OX', 'BLANK')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. 자동 업데이트 트리거 설정
-- ============================================

-- updated_at 자동 업데이트 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 자동 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. Realtime 활성화
-- ============================================
-- Supabase Realtime 기능을 사용하기 위해 필수

ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- ============================================
-- 4. 인덱스 생성 (성능 최적화)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_players_room_code ON players(room_code);
CREATE INDEX IF NOT EXISTS idx_players_score ON players(score DESC);
CREATE INDEX IF NOT EXISTS idx_questions_set_id ON questions(set_id);

-- ============================================
-- 5. RLS (Row Level Security) 정책 설정
-- ============================================
-- 보안을 강화하려면 아래 주석을 해제하세요.
-- 개발 단계에서는 비활성화해도 됩니다.

-- ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 정책 설정 (개발용)
-- CREATE POLICY "Allow all operations on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all operations on questions" ON questions FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 완료!
-- ============================================
-- 이제 애플리케이션에서 데이터베이스를 사용할 수 있습니다.
