import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ error: 'Valid OTP is required.' }, { status: 400 });
    }

    const otpDocRef = db.collection('email_otps').doc(email);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json({ error: 'Invalid or expired OTP.' }, { status: 400 });
    }

    const data = otpDoc.data();

    if (!data || data.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP.' }, { status: 400 });
    }

    const expiresAt = new Date(data.expiresAt);
    if (expiresAt < new Date()) {
      // OTP expired, delete the document
      await otpDocRef.delete();
      return NextResponse.json({ error: 'OTP has expired.' }, { status: 400 });
    }

    // OTP is valid and not expired, verify the user's email
    try {
      const userRecord = await auth.getUserByEmail(email);
      await auth.updateUser(userRecord.uid, { emailVerified: true });
    } catch (err: any) {
      console.error('Error updating user verification status:', err);
      return NextResponse.json({ error: 'Failed to update user verification status.' }, { status: 500 });
    }

    // Delete the OTP document to prevent reuse
    await otpDocRef.delete();

    return NextResponse.json({ success: true, message: 'Email verified successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred while verifying the OTP.' },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
