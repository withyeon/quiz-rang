# 🎨 이미지/캐릭터 통합 가이드

## ✅ 이미지 통합 시스템이 준비되었습니다!

이제 이미지 파일을 프로젝트에 추가하면 자동으로 게임에 반영됩니다.

## 📁 폴더 구조

```
K-Blooket/
├── public/                    # ← 여기에 이미지 넣기!
│   ├── characters/           # 캐릭터 이미지
│   │   ├── dog1.png
│   │   ├── dog2.png
│   │   └── ...
│   ├── avatars/              # 아바타 이미지
│   ├── items/                # 아이템 이미지
│   └── backgrounds/          # 배경 이미지
```

## 🚀 사용 방법

### 1단계: 이미지 파일 추가

1. `public/characters/` 폴더를 만드세요 (없으면 자동 생성)
2. 이미지 파일을 넣으세요 (PNG, JPG, SVG 권장)
3. 파일명은 영문과 숫자만 사용 (예: `dog1.png`, `cat_01.png`)

### 2단계: 캐릭터 등록

`lib/utils/characters.ts` 파일을 열어서:

```typescript
export const CHARACTERS: Character[] = [
  // 기존 이모지 캐릭터들...
  
  // 새 이미지 캐릭터 추가
  { 
    id: 'dog1', 
    name: '강아지 1', 
    imagePath: '/characters/dog1.png',  // ← 파일 경로
    emoji: '🐕',  // 이미지 로딩 실패 시 대체용
    category: 'default' 
  },
  { 
    id: 'cat1', 
    name: '고양이 1', 
    imagePath: '/characters/cat1.png',
    emoji: '🐱',
    category: 'premium' 
  },
]
```

### 3단계: 컴포넌트에서 사용

기존 아바타 선택 부분을 `CharacterSelector`로 교체:

```tsx
import CharacterSelector from '@/components/CharacterSelector'
import { CHARACTERS, type Character } from '@/lib/utils/characters'

// 기존 코드
const [selectedAvatar, setSelectedAvatar] = useState('🎮')

// 변경 후
const [selectedCharacter, setSelectedCharacter] = useState<Character>(CHARACTERS[0])

// JSX에서
<CharacterSelector
  selectedCharacterId={selectedCharacter.id}
  onSelect={(char) => {
    setSelectedCharacter(char)
    // DB에 저장할 때는 char.id 또는 char.imagePath 사용
  }}
/>
```

## 🎮 게임에서 이미지 표시

### 아바타 표시 컴포넌트

```tsx
import Image from 'next/image'
import { getCharacterById, getCharacterDisplay } from '@/lib/utils/characters'

function PlayerAvatar({ characterId }: { characterId: string }) {
  const character = getCharacterById(characterId)
  if (!character) return <span>❓</span>
  
  const display = getCharacterDisplay(character)
  
  if (display.hasImage) {
    return (
      <Image
        src={display.imageUrl}
        alt={character.name}
        width={64}
        height={64}
        className="rounded-full"
      />
    )
  }
  
  return <span className="text-4xl">{display.emoji}</span>
}
```

## 📝 예시: 아바타 선택 화면 교체

`app/play/[room_code]/page.tsx`에서:

```tsx
// 기존
const avatars = ['🎮', '👤', '🎯', ...]
<div className="flex gap-2 flex-wrap">
  {avatars.map((avatar) => (
    <button onClick={() => setSelectedAvatar(avatar)}>
      {avatar}
    </button>
  ))}
</div>

// 변경 후
import CharacterSelector from '@/components/CharacterSelector'
import { CHARACTERS, type Character } from '@/lib/utils/characters'

const [selectedCharacter, setSelectedCharacter] = useState<Character>(CHARACTERS[0])

<CharacterSelector
  selectedCharacterId={selectedCharacter.id}
  onSelect={setSelectedCharacter}
/>
```

## 🎨 이미지 권장 사양

- **캐릭터/아바타**: 128x128px ~ 256x256px, PNG (투명 배경)
- **아이템**: 64x64px ~ 128x128px
- **배경**: 1920x1080px (또는 게임 화면 크기에 맞게)
- **형식**: PNG (투명 배경), SVG (벡터), JPG (일반 이미지)

## 🔄 자동 반영

- `public/` 폴더의 파일은 개발 서버 재시작 없이 바로 반영됩니다
- Next.js가 자동으로 `/` 경로로 제공합니다
- 예: `public/characters/dog1.png` → `/characters/dog1.png`

## 💡 팁

1. **파일명 규칙**: 영문, 숫자, 언더스코어(_)만 사용
2. **최적화**: 큰 이미지는 압축 후 사용 (TinyPNG 등)
3. **폴백**: 이미지 로딩 실패 시 이모지가 표시됩니다
4. **카테고리**: 기본/프리미엄/특별 등으로 분류 가능

## 🎯 다음 단계

1. 이미지 파일을 `public/characters/`에 넣기
2. `lib/utils/characters.ts`에 캐릭터 추가
3. 기존 아바타 선택 부분을 `CharacterSelector`로 교체
4. 게임 내 아바타 표시 부분도 이미지 지원하도록 수정

준비되면 알려주세요! 🚀
