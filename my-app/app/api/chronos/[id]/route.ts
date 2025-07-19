import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../../../lib/firebase';

// 특정 타임캡슐 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chronosId = params.id;
    const chronosRef = doc(firestore, 'chronos', chronosId);
    const chronosSnap = await getDoc(chronosRef);

    if (!chronosSnap.exists()) {
      return NextResponse.json(
        { error: '타임캡슐을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const chronosData = {
      id: chronosSnap.id,
      ...chronosSnap.data()
    };

    return NextResponse.json({
      success: true,
      data: chronosData
    });

  } catch (error) {
    console.error('타임캡슐 조회 오류:', error);
    return NextResponse.json(
      { error: '타임캡슐 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 타임캡슐 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chronosId = params.id;
    const body = await request.json();
    
    const chronosRef = doc(firestore, 'chronos', chronosId);
    const chronosSnap = await getDoc(chronosRef);

    if (!chronosSnap.exists()) {
      return NextResponse.json(
        { error: '타임캡슐을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 수정 가능한 필드들
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    // 민감한 필드들은 수정 불가
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;

    await updateDoc(chronosRef, updateData);

    return NextResponse.json({
      success: true,
      message: '타임캡슐이 성공적으로 수정되었습니다.',
      chronosId
    });

  } catch (error) {
    console.error('타임캡슐 수정 오류:', error);
    return NextResponse.json(
      { error: '타임캡슐 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

 