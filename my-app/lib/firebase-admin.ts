// lib/firebase-admin.ts

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth }   from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK 초기화 (중복 방지)
if (!getApps().length) {
  const projectId   = process.env.FIREBASE_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  let privateKey    = process.env.FIREBASE_PRIVATE_KEY!;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('[firebase-admin] 환경 변수가 설정되지 않았습니다.');
    console.error('필요: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    throw new Error('Firebase Admin SDK 환경 변수 설정 필요');
  }

  // 로컬 .env 에서 줄바꿈이 이스케이프 되어 들어올 경우 복원
  privateKey = privateKey.replace(/\\n/g, '\n');

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  console.log('[firebase-admin] 초기화 성공');
}

// Named exports
export const adminAuth = getAuth();
export const adminDb   = getFirestore();
