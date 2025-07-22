import { NextRequest, NextResponse } from 'next/server';
import { getUserWalletsAdmin } from '../../../../lib/firestore-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ success: false, error: 'userId 필요' }, { status: 400 });
  }
  try {
    const wallets = await getUserWalletsAdmin(userId);
    // isActive가 true이고 userMade가 false인 지갑만 필터링
    const filtered = wallets.filter(w => w.isActive && w.userMade === false);
    if (!filtered || filtered.length === 0) {
      return NextResponse.json({ success: false, error: '조건에 맞는 활성 지갑 없음' }, { status: 404 });
    }
    const address = filtered[0].address;
    return NextResponse.json({ success: true, address });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || '서버 오류' }, { status: 500 });
  }
} 