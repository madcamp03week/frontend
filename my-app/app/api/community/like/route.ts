import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { ethers } from 'ethers';
import { CHRONOS_DAO_ABI } from '@/lib/contract-abi';

const CHRONOS_DAO_CONTRACT_ADDR = process.env.CHRONOS_DAO_CONTRACT_ADDR;
const INFURA_URL = process.env.INFURA_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// POST /api/community/like
export async function POST(req: NextRequest) {
  const db = adminDb;
  const { chronosId, likerAddress } = await req.json();
  console.log('chronosId', chronosId);
  console.log('likerAddress', likerAddress);
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
  // 스마트 컨트랙트 호출로 토큰 이동
  if (!CHRONOS_DAO_CONTRACT_ADDR) {
    return NextResponse.json({ error: 'DAO 컨트랙트 주소가 설정되지 않았습니다.' }, { status: 500 });
  }
  if (!INFURA_URL) {
    return NextResponse.json({ error: 'INFURA_URL이 설정되지 않았습니다.' }, { status: 500 });
  }
  if (!PRIVATE_KEY) {
    return NextResponse.json({ error: 'PRIVATE_KEY가 설정되지 않았습니다.' }, { status: 500 });
  }
  if (!likerAddress || !ethers.isAddress(likerAddress)) {
    console.log('likerAddress', likerAddress);
    return NextResponse.json({ error: '유효하지 않은 likerAddress입니다.' }, { status: 400 });
  }
  const tokenId = chronosData?.tokenId;
  if (!tokenId) {
    return NextResponse.json({ error: '게시글의 tokenId가 유효하지 않습니다.' }, { status: 500 });
  }
  console.log('tokenId', tokenId);
  try {
    const provider = new ethers.JsonRpcProvider(INFURA_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CHRONOS_DAO_CONTRACT_ADDR, CHRONOS_DAO_ABI, wallet);
    // like(postId, from) 호출: postId는 chronosId, from은 likerAddress
    const tx = await contract.like(tokenId, likerAddress);
    const receipt = await tx.wait();

    console.log('receipt', receipt);
    // Firestore에 좋아요 기록 저장
    await likeRef.set({ likedAt: new Date(), txHash: receipt.hash });
    return NextResponse.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '스마트 컨트랙트 호출 실패' }, { status: 500 });
  }
} 