import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../../lib/firebase';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '../../../../lib/firebase-admin';

// 인기 chronos 6개 반환 API
export async function GET(req: NextRequest) {
  try {
    let userId = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const idToken = authHeader.replace('Bearer ', '');
      try {
        const decoded = await getAuth().verifyIdToken(idToken);
        userId = decoded.uid;
      } catch {}
    }
    const chronosRef = collection(firestore, 'chronos');
    const q = query(
      chronosRef,
      where('isPublic', '==', true),
      orderBy('likeCount', 'desc'),
      limit(6)
    );
    const snapshot = await getDocs(q);
    // userId 목록 추출
    const userIds = Array.from(new Set(snapshot.docs.map(docSnap => docSnap.data().userId).filter(Boolean)));
    // userId → displayName 매핑
    const userMap: Record<string, string> = {};
    await Promise.all(userIds.map(async (uid) => {
      const userDocSnap = await adminDb.collection('users').doc(uid).get();
      const userData = userDocSnap.exists ? userDocSnap.data() : undefined;
      userMap[uid] = userData && userData.displayName
        ? userData.displayName
        : uid.slice(0, 6) + '...';
    }));
    const data = await Promise.all(snapshot.docs.map(async docSnap => {
      const chronosId = docSnap.id;
      let likedByMe = false;
      let likeCount = 0;
      if (userId) {
        const likeDoc = await adminDb.collection('chronos').doc(chronosId).collection('likes').doc(userId).get();
        likedByMe = likeDoc.exists;
      }
      // likeCount 계산
      const likesSnap = await adminDb.collection('chronos').doc(chronosId).collection('likes').get();
      likeCount = likesSnap.size;
      const chronosData = docSnap.data() || {};
      // Timestamp -> string 변환 (완전히 안전하게)
      const createdAt =
        chronosData && chronosData.createdAt && typeof chronosData.createdAt.toDate === "function"
          ? chronosData.createdAt.toDate().toISOString()
          : typeof chronosData?.createdAt === "string"
            ? chronosData.createdAt
            : null;
      const openDate =
        chronosData && chronosData.openDate && typeof chronosData.openDate.toDate === "function"
          ? chronosData.openDate.toDate().toISOString()
          : typeof chronosData?.openDate === "string"
            ? chronosData.openDate
            : null;
      return {
        id: chronosId,
        ...chronosData,
        createdAt,
        openDate,
        likedByMe,
        likeCount,
        displayName: chronosData.userId ? userMap[chronosData.userId] : ''
      };
    }));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '알 수 없는 오류' }, { status: 500 });
  }
} 