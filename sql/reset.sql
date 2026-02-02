-- ============================================
-- 퀴즈독 (Quiz-Dog) 데이터베이스 초기화
-- ============================================
-- ⚠️ 주의: 이 파일은 모든 데이터를 삭제합니다!
-- 개발 환경에서만 사용하세요.

-- 외래 키 제약 조건 때문에 순서대로 삭제해야 합니다.
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- 트리거 함수 삭제
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 인덱스는 테이블 삭제 시 자동으로 삭제됩니다.

-- ============================================
-- 초기화 완료
-- ============================================
-- 이제 setup.sql을 다시 실행하여 테이블을 생성하세요.
