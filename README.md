# 엔빵하기

더치페이 정산을 간편하게 — 링크 하나로 공유하고, 금액을 자동 계산하고, 입금 인증까지 관리하세요.

**[→ 사이트 바로가기](https://nbbang-haja.vercel.app)**

---

## 주요 기능

### 방장 (Host)
- Google 계정으로 정산방 생성
- 메뉴 및 참여자 수동 입력 또는 **AI 자동 추출** (영수증 사진, 카톡 대화 캡처)
- 참여자별 금액 자동 계산
- 1/N 또는 품목별 분할 지원
- 공유 링크 생성 → 참여자에게 전달
- 입금 인증 사진 확인 및 승인/거절
- 정산방 7일 자동 만료

### 참여자 (Participant)
- 링크만으로 접속 (로그인 불필요)
- 내가 내야 할 금액과 계좌번호 확인
- 계좌번호 원클릭 복사
- 입금 인증 사진 업로드

### 관리자
- 전체 정산방 현황 대시보드
- 사용자/방 검색 및 관리

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Next.js API Routes (Serverless) |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Google OAuth) |
| Storage | Cloudflare R2 (S3 호환) |
| AI | Google Gemini API |
| 배포 | Vercel |

---

## 로컬 개발 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/nbbang.git
cd nbbang
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 아래 값을 채워넣으세요.

```env
# Firebase (클라이언트)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (서버)
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Google Gemini AI
GEMINI_API_KEY=

# Vercel Cron 인증
CRON_SECRET=

# 관리자 Firebase UID (쉼표 구분)
NEXT_PUBLIC_ADMIN_UIDS=

# 앱 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com)에서 프로젝트 생성
2. Firestore Database 활성화
3. Authentication → Google 로그인 활성화
4. 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 후 `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` 입력
5. Firestore 보안 규칙 설정 (아래 참고)

**Firestore 보안 규칙 예시:**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.host_uid;
      allow create: if request.auth != null;
    }
    match /rooms/{roomId}/{document=**} {
      allow read: if true; // 참여자 토큰 기반 접근
      allow write: if request.auth != null && request.auth.uid == get(/databases/$(database)/documents/rooms/$(roomId)).data.host_uid;
    }
  }
}
```

### 4. Cloudflare R2 설정

1. [Cloudflare Dashboard](https://dash.cloudflare.com)에서 R2 버킷 생성
2. API 토큰 생성 (Object Read & Write 권한)
3. CORS 정책 설정:

```json
[
  {
    "AllowedOrigins": ["https://nbbang-haja.vercel.app", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### 5. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000`에서 확인하세요.

---

## 프로젝트 구조

```
app/
├── (host)/              # 방장 전용 페이지
│   ├── dashboard/       # 내 정산방 목록
│   ├── rooms/new/       # 정산방 생성
│   └── rooms/[roomId]/  # 정산방 관리, 입금 확인
├── (participant)/
│   └── join/[token]/    # 참여자 접속 페이지
├── admin/               # 관리자 대시보드
├── api/
│   ├── ai/              # Gemini AI 연동 (영수증 분석, 참여자 추출, 챗봇)
│   ├── cron/            # 자동 만료 처리
│   ├── proof/view/      # 입금 인증 이미지 조회
│   └── upload/presign/  # R2 업로드 서명 URL 발급
components/
├── host/                # 방장 UI 컴포넌트
├── participant/         # 참여자 UI 컴포넌트
└── ui/                  # 공통 UI 컴포넌트
lib/
├── firebase.ts          # Firebase 클라이언트 초기화
├── firebase-admin.ts    # Firebase Admin SDK
├── r2.ts                # Cloudflare R2 클라이언트
└── auth-context.tsx     # 인증 컨텍스트
```

---

## 배포 (Vercel)

1. Vercel에 저장소 연결
2. 환경 변수를 Vercel 프로젝트 설정에 등록
3. Vercel Cron Job 설정 (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-rooms",
      "schedule": "0 15 * * *"
    }
  ]
}
```

---

## 기여

PR과 이슈 환영합니다.

1. 이 저장소를 Fork하세요
2. 기능 브랜치를 생성하세요 (`git checkout -b feat/기능명`)
3. 변경사항을 커밋하세요 (`git commit -m 'feat: 기능 설명'`)
4. 브랜치에 Push하세요 (`git push origin feat/기능명`)
5. Pull Request를 생성하세요

---

## 라이선스

MIT License
