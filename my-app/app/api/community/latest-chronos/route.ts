import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { firestore } from '../../../../lib/firebase';

// 최신 chronos 10개 반환 API
export async function GET(req: NextRequest) {
  try {
    const chronosRef = collection(firestore, 'chronos');
    const q = query(
      chronosRef,
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '알 수 없는 오류' }, { status: 500 });
  }
} 