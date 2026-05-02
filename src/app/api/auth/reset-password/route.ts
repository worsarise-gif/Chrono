import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { auth } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    // Generate the Firebase reset password link
    const resetLink = await auth.generatePasswordResetLink(email, {
      url: 'https://chronoaiassistant.vercel.app/reset-password',
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
        <title>Reset Your Password</title>
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
          .button-container {
            margin-bottom: 32px;
          }
          .button {
            display: inline-block;
            background-color: #000000;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
          }
          .fallback {
            font-size: 14px;
            color: #666666;
            line-height: 1.5;
            word-break: break-all;
          }
          .fallback a {
            color: #0066cc;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Reset Your Password</div>
          <div class="message">
            We received a request to reset your password. Click the button below to choose a new password.
          </div>
          <div class="button-container">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          <div class="fallback">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetLink}">${resetLink}</a>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email
    await transporter.sendMail({
      from: `"Chrono Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - Chrono',
      text: `We received a request to reset your password. Please copy and paste this link into your browser to choose a new password: ${resetLink}`,
      html: htmlTemplate,
    });

    return NextResponse.json({ success: true, message: 'Password reset email sent successfully.' }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending reset password email:', error);

    // Provide general 500 error, or handle specific firebase admin / nodemailer errors if needed
    return NextResponse.json(
      { error: error?.message || 'An error occurred while sending the password reset email.' },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
