import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    // Generate a secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save to Firestore
    await db.collection('email_otps').doc(email).set({
      otp,
      expiresAt: expiresAt.toISOString(),
    });

    // Setup nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Professional HTML Email Template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
            color: #333333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            text-align: center;
          }
          .header {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 24px;
          }
          .message {
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 32px;
          }
          .otp {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
            background-color: #f4f4f5;
            padding: 16px 24px;
            border-radius: 8px;
            display: inline-block;
            margin-bottom: 32px;
          }
          .fallback {
            font-size: 14px;
            color: #666666;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Verify Your Email</div>
          <div class="message">
            Your verification code is below. It expires in 10 minutes.
          </div>
          <div class="otp">${otp}</div>
          <div class="fallback">
            If you did not request this email, you can safely ignore it.
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email
    await transporter.sendMail({
      from: `"Chrono Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Chrono',
      text: `Your verification code is ${otp}. It expires in 10 minutes.`,
      html: htmlTemplate,
    });

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending OTP email:', error);

    return NextResponse.json(
      { error: error?.message || 'An error occurred while sending the OTP email.' },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
