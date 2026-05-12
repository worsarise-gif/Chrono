import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebaseAdmin';
import { isValidEmail, hashEmail } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const { email, otp, password } = await request.json();

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ error: 'Valid OTP is required.' }, { status: 400 });
    }

    const hashedEmail = hashEmail(email);
    const otpDocRef = db.collection('email_otps').doc(hashedEmail);
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
      try {
        const userRecord = await auth.getUserByEmail(email);
        await auth.updateUser(userRecord.uid, { emailVerified: true });
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          // New user registration
          if (!password || typeof password !== 'string') {
            return NextResponse.json({ error: 'Password is required for registration.' }, { status: 400 });
          }
          await auth.createUser({
            email,
            password,
            emailVerified: true,
          });
        } else {
          throw err; // Re-throw if it's a different error
        }
      }
    } catch (err: any) {
      console.error('Error updating/creating user:', err);
      return NextResponse.json({ error: 'Failed to update or create user.' }, { status: 500 });
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
