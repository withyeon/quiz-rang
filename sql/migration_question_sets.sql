-- ============================================
-- Migration: Add question_sets table and link to rooms
-- ============================================

-- 1. Create question_sets table
CREATE TABLE IF NOT EXISTS question_sets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Populate question_sets from existing questions
INSERT INTO question_sets (id, title, created_at)
SELECT 
    set_id, 
    '문제집 ' || set_id, -- Default title
    MIN(created_at)
FROM questions
GROUP BY set_id
ON CONFLICT (id) DO NOTHING;

-- 3. Add FK to questions table (optional, but good for integrity)
-- Note: We first ensure all set_ids in questions exist in question_sets (handled by step 2)
ALTER TABLE questions 
ADD CONSTRAINT fk_questions_set 
FOREIGN KEY (set_id) 
REFERENCES question_sets(id) 
ON DELETE CASCADE;

-- 4. Add set_id to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS set_id TEXT REFERENCES question_sets(id);

-- 5. Enable Realtime for question_sets (optional, for real-time updates on teacher dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE question_sets;

-- 6. Trigger for updated_at
CREATE TRIGGER update_question_sets_updated_at
  BEFORE UPDATE ON question_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
