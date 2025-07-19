# My App

이 프로젝트는 Next.js와 Firebase를 사용한 웹 애플리케이션입니다.

## 주요 기능

- Firebase Authentication을 통한 사용자 인증
- 폴리곤 네트워크 지갑 생성 및 관리
- **Private Key 시스템 암호화 저장** - 시스템 암호화 키로 Private Key를 암호화하여 안전하게 저장
- **Private Key 확인 기능** - 대시보드에서 지갑의 Private Key를 안전하게 확인

## Private Key 암호화 기능

### 보안 특징
- 시스템 암호화 키만으로 Private Key 암호화
- 사용자 비밀번호 입력 불필요 (OAuth 로그인 지원)
- Firestore에 암호화된 Private Key만 저장
- 원본 Private Key는 메모리에서만 임시 사용

### Private Key 확인 기능
- **시스템 생성 지갑 (userMade=false)**: 서버에서 자동 복호화하여 평문 Private Key 제공
- **사용자 생성 지갑 (userMade=true)**: 클라이언트에서 비밀번호 입력 후 복호화
- 미래적인 디자인의 모달 UI로 안전한 Private Key 확인

### 환경변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 환경변수를 설정하세요:

```bash
# 서버 사이드 암호화 키 (32자 이상의 안전한 키를 사용하세요)
SERVER_SIDE_ENCRYPTION_KEY=your-super-secure-encryption-key-32-chars-minimum

# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK 설정 (보안 강화를 위해 필요)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 암호화 키 생성 방법

안전한 암호화 키를 생성하려면:

```bash
# Node.js를 사용한 32자 랜덤 키 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 또는 온라인 생성기 사용 (보안에 주의)
```

### Firebase Admin SDK 설정 방법

1. Firebase Console에서 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. 다운로드된 JSON 파일에서 필요한 정보 추출:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
4. 환경 변수에 설정

## 설치 및 실행

```bash
npm install
npm run dev
```

## API 사용법

### 회원가입 (지갑 자동 생성)
```typescript
const { signUp } = useAuth();
await signUp(email, password); // Private Key가 자동으로 시스템 키로 암호화되어 저장됨
```

### 새 지갑 생성
```typescript
const { createNewWallet } = useAuth();
await createNewWallet(); // 시스템 키로 Private Key 암호화
```

### Private Key 조회 API (보안 강화 버전)

지갑의 Private Key를 조회하는 API입니다. `userMade` 상태에 따라 다르게 처리됩니다.

#### POST 요청
```typescript
// Firebase ID 토큰 가져오기
const idToken = await user.getIdToken();

const response = await fetch('/api/wallet/private-key', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
  },
  body: JSON.stringify({
    walletAddress: '0x...', // 지갑 주소만 전송
  }),
});

const data = await response.json();
// data.data.userMade: false (시스템 생성) 또는 true (사용자 생성)
// data.data.privateKey: 복호화된 키 (userMade=false) 또는 암호화된 키 (userMade=true)
```

#### GET 요청
```typescript
// 보안상 GET 요청은 지원하지 않습니다. POST 요청을 사용해주세요.
```

#### 응답 형식
```json
{
  "success": true,
  "data": {
    "userMade": false,
    "privateKey": "0x1234..." // userMade=false: 복호화된 키, userMade=true: 암호화된 키
  },
  "message": "Private Key 정보를 성공적으로 조회했습니다."
}
```

## Private Key 확인 UI

### 시스템 생성 지갑 (userMade=false)
- 서버에서 자동으로 복호화된 Private Key를 바로 표시
- 클립보드 복사 기능 제공
- 추가 인증 불필요

### 사용자 생성 지갑 (userMade=true)
- 비밀번호 입력 필드 표시
- 클라이언트 사이드에서 비밀번호로 복호화
- 복호화 성공 시 Private Key 표시 및 복사 기능

### 보안 경고
- Private Key 노출 시 지갑의 모든 자산에 접근 가능
- 타인과 절대 공유하지 말 것
- 안전한 환경에서만 확인할 것

## 보안 주의사항

1. **암호화 키 관리**: `SERVER_SIDE_ENCRYPTION_KEY`는 절대 공개 저장소에 커밋하지 마세요
2. **OAuth 지원**: GitHub 등 OAuth 로그인 사용자도 시스템 키로 Private Key가 암호화됩니다
3. **프로덕션 환경**: 실제 서비스에서는 더 강력한 암호화 알고리즘과 키 관리 시스템을 사용하세요
4. **Private Key API**: 시스템 생성 지갑(userMade=false)의 Private Key는 서버에서 자동 복호화되어 제공됩니다
5. **UI 보안**: Private Key 확인 시 경고 메시지와 함께 안전한 복사 기능 제공

## 파일 구조

```
lib/
├── crypto.ts          # Private Key 암호화/복호화 유틸리티 (시스템 키만 사용)
├── wallet.ts          # 폴리곤 지갑 생성 및 관리
├── firestore.ts       # Firestore 데이터베이스 작업
└── firebase.ts        # Firebase 설정

contexts/
└── AuthContext.tsx    # 인증 및 지갑 관리 컨텍스트

components/
├── PrivateKeyWarningModal.tsx    # Private Key 확인 경고 모달
└── PrivateKeyDisplayModal.tsx    # Private Key 표시 모달

app/
├── api/
│   └── wallet/
│       └── private-key/
│           └── route.ts  # Private Key 조회 API
├── dashboard/
│   └── page.tsx          # 대시보드 (Private Key 확인 기능 포함)
└── wallet-test/
    └── page.tsx          # API 테스트 페이지
```
