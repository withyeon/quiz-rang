# 이미지 및 에셋 폴더 구조

이 폴더에 게임에서 사용할 이미지와 캐릭터 파일을 넣으세요.

## 권장 폴더 구조

```
public/
├── characters/          # 캐릭터 이미지
│   ├── dog1.png
│   ├── dog2.png
│   ├── cat1.png
│   └── ...
├── avatars/            # 아바타 이미지
│   ├── avatar1.png
│   ├── avatar2.png
│   └── ...
├── items/              # 아이템 이미지
│   ├── speed_boost.png
│   ├── shield.png
│   └── ...
├── backgrounds/        # 배경 이미지
│   ├── racing_track.png
│   ├── fishing_pond.png
│   └── ...
└── ui/                 # UI 요소
    ├── button.png
    └── ...
```

## 사용 방법

1. 이미지 파일을 위 폴더에 넣으세요
2. 파일명은 영문과 숫자, 언더스코어(_)만 사용하세요
3. 권장 형식: PNG (투명 배경), SVG (벡터), JPG (일반 이미지)
4. 크기: 캐릭터는 128x128px ~ 256x256px 권장

## 접근 방법

Next.js에서는 `/characters/dog1.png` 경로로 접근할 수 있습니다.

예시:
```tsx
<img src="/characters/dog1.png" alt="강아지 캐릭터" />
```
