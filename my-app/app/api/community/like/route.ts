import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

// POST /api/community/like
export async function POST(req: NextRequest) {
  const db = adminDb;
  const { chronosId } = await req.json();
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 });
  }
  const idToken = authHeader.replace('Bearer ', '');
  let userId = '';
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    userId = decoded.uid;
  } catch {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }
  // 게시글 정보 가져오기
  const chronosRef = db.collection('chronos').doc(chronosId);
  const chronosSnap = await chronosRef.get();
  if (!chronosSnap.exists) {
    return NextResponse.json({ error: '존재하지 않는 게시글' }, { status: 404 });
  }
  const chronosData = chronosSnap.data();
  if (chronosData?.authorId === userId) {
    return NextResponse.json({ error: '본인 글에는 좋아요 불가' }, { status: 400 });
  }
  // 이미 좋아요 눌렀는지 확인
  const likeRef = chronosRef.collection('likes').doc(userId);
  const likeSnap = await likeRef.get();
  if (likeSnap.exists) {
    return NextResponse.json({ error: '이미 좋아요를 눌렀습니다.' }, { status: 400 });
  }
  // 좋아요 추가(취소 불가)
  await likeRef.set({ likedAt: new Date() });
  return NextResponse.json({ success: true });
} 