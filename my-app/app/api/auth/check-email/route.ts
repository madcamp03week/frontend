// app/api/auth/check-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) {
    return NextResponse.json({ exists: false }, { status: 400 });
  }
  
  try {
    // 이메일이 Firebase Auth에 있으면 OK
    await adminAuth.getUserByEmail(email);
    return NextResponse.json({ exists: true });
  } catch (e) {
    // 없으면 404
    return NextResponse.json({ exists: false }, { status: 404 });
  }
}
