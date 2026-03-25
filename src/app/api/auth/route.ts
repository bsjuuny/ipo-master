import { NextRequest, NextResponse } from 'next/server';
import { verifySync } from 'otplib';

export async function POST(req: NextRequest) {
  const { password, totp } = await req.json();

  const validPassword = process.env.ADMIN_KEY;
  const totpSecret = process.env.TOTP_SECRET;

  if (!validPassword || !totpSecret) {
    return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 });
  }

  if (password !== validPassword) {
    return NextResponse.json({ step: 'password', error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  if (!totp) {
    return NextResponse.json({ step: 'totp' });
  }

  const result = verifySync({ token: totp, secret: totpSecret });
  if (!result?.valid) {
    return NextResponse.json({ step: 'totp', error: '인증 코드가 올바르지 않습니다.' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
