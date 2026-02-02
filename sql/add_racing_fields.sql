-- ============================================
-- 레이싱 게임을 위한 필드 추가
-- ============================================
-- 기존 테이블에 레이싱 게임 관련 필드를 추가합니다.

-- rooms 테이블에 game_mode 필드 추가
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS game_mode TEXT DEFAULT 'gold_quest' 
CHECK (game_mode IN ('gold_quest', 'racing'));

-- players 테이블에 position 필드 추가 (레이싱에서 위치)
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- players 테이블에 active_item 필드 추가 (현재 활성 아이템)
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS active_item JSONB DEFAULT NULL;

-- players 테이블에 item_effects 필드 추가 (적용 중인 아이템 효과)
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS item_effects JSONB DEFAULT '[]'::jsonb;
