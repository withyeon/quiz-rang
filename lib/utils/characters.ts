/**
 * 캐릭터/아바타 이미지 관리 유틸리티
 * 
 * 사용법:
 * 1. public/characters/ 폴더에 이미지 파일을 넣으세요
 * 2. 아래 CHARACTERS 배열에 파일명을 추가하세요
 * 3. 자동으로 이미지 경로가 생성됩니다
 */

export interface Character {
  id: string
  name: string
  imagePath: string
  emoji: string // 이미지가 없을 때 대체용 이모지
  category?: 'default' | 'premium' | 'special'
}

// 캐릭터 목록
// public/character/ 폴더에 이미지를 넣고 여기에 추가하세요
export const CHARACTERS: Character[] = [
  // SVG 블룩 캐릭터 (1.svg ~ 20.svg)
  { id: 'blook_1', name: '시바견', imagePath: '/character/1.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_2', name: '비숑 프리제', imagePath: '/character/2.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_3', name: '사모예드', imagePath: '/character/3.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_4', name: '시베리안 허스키', imagePath: '/character/4.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_5', name: '스피츠', imagePath: '/character/5.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_6', name: '보스턴 테리어', imagePath: '/character/6.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_7', name: '토이 푸들', imagePath: '/character/7.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_8', name: '말티즈', imagePath: '/character/8.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_9', name: '블랙 푸들', imagePath: '/character/9.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_10', name: '포메라니안', imagePath: '/character/10.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_11', name: '스패니얼', imagePath: '/character/11.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_12', name: '웰시 코기', imagePath: '/character/12.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_13', name: '골든 리트리버', imagePath: '/character/13.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_14', name: '시츄', imagePath: '/character/14.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_15', name: '보더 콜리', imagePath: '/character/15.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_16', name: '파피용', imagePath: '/character/16.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_17', name: '도베르만', imagePath: '/character/17.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_18', name: '웰시 코기', imagePath: '/character/18.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_19', name: '치와와', imagePath: '/character/19.svg', emoji: '🐶', category: 'default' },
  { id: 'blook_20', name: '웰시 코기', imagePath: '/character/20.svg', emoji: '🐶', category: 'default' },
]

/**
 * 캐릭터 ID로 캐릭터 정보 가져오기
 */
export function getCharacterById(id: string): Character | undefined {
  return CHARACTERS.find(char => char.id === id)
}

/**
 * 캐릭터 이미지 URL 가져오기
 * 이미지가 없으면 이모지 반환
 */
export function getCharacterImageUrl(character: Character): string {
  if (character.imagePath) {
    return character.imagePath
  }
  return '' // 이모지는 별도 처리
}

/**
 * 캐릭터 표시 컴포넌트용 props
 */
export function getCharacterDisplay(character: Character) {
  return {
    hasImage: !!character.imagePath,
    imageUrl: character.imagePath,
    emoji: character.emoji,
  }
}

/**
 * 카테고리별 캐릭터 필터링
 */
export function getCharactersByCategory(category?: Character['category']): Character[] {
  if (!category) return CHARACTERS
  return CHARACTERS.filter(char => char.category === category)
}
