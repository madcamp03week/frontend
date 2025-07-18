# My App

이 프로젝트는 Next.js와 Firebase를 사용한 웹 애플리케이션입니다.

## 주요 기능

- Firebase Authentication을 통한 사용자 인증
- 폴리곤 네트워크 지갑 생성 및 관리
- **Private Key 시스템 암호화 저장** - 시스템 암호화 키로 Private Key를 암호화하여 안전하게 저장

## Private Key 암호화 기능

### 보안 특징
- 시스템 암호화 키만으로 Private Key 암호화
- 사용자 비밀번호 입력 불필요 (OAuth 로그인 지원)
- Firestore에 암호화된 Private Key만 저장
- 원본 Private Key는 메모리에서만 임시 사용

### 환경변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 환경변수를 설정하세요:

```bash
# 암호화 키 (32자 이상의 안전한 키를 사용하세요)
NEXT_PUBLIC_ENCRYPTION_KEY=your-super-secure-encryption-key-32-chars-minimum

# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 암호화 키 생성 방법

안전한 암호화 키를 생성하려면:

```bash
# Node.js를 사용한 32자 랜덤 키 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 또는 온라인 생성기 사용 (보안에 주의)
```

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

## 보안 주의사항

1. **암호화 키 관리**: `NEXT_PUBLIC_ENCRYPTION_KEY`는 절대 공개 저장소에 커밋하지 마세요
2. **OAuth 지원**: GitHub 등 OAuth 로그인 사용자도 시스템 키로 Private Key가 암호화됩니다
3. **프로덕션 환경**: 실제 서비스에서는 더 강력한 암호화 알고리즘과 키 관리 시스템을 사용하세요

## 파일 구조

```
lib/
├── crypto.ts          # Private Key 암호화/복호화 유틸리티 (시스템 키만 사용)
├── wallet.ts          # 폴리곤 지갑 생성 및 관리
├── firestore.ts       # Firestore 데이터베이스 작업
└── firebase.ts        # Firebase 설정

contexts/
└── AuthContext.tsx    # 인증 및 지갑 관리 컨텍스트
```
