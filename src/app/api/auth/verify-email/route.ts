import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { admin } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const verifyLink = await admin.auth().generateEmailVerificationLink(email, {
      url: 'https://chronoaiassistant.vercel.app/verify-email',
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <tr>
            <td style="color: #333333; font-size: 24px; font-weight: bold; padding-bottom: 20px; text-align: center;">
              Verify Your Email Address
            </td>
          </tr>
          <tr>
            <td style="color: #555555; font-size: 16px; line-height: 1.5; padding-bottom: 30px; text-align: center;">
              Thank you for signing up for Chrono. Please verify your email address by clicking the button below to get started.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <a href="${verifyLink}" style="display: inline-block; background-color: #000000; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 6px;">
                Verify Email Address
              </a>
            </td>
          </tr>
          <tr>
            <td style="color: #777777; font-size: 14px; line-height: 1.5; text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verifyLink}" style="color: #0066cc; word-break: break-all;">${verifyLink}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Chrono" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify your email address for Chrono',
      text: `Verify your email address by clicking here: ${verifyLink}`,
      html: html,
    });

    return NextResponse.json({ message: 'Email verification sent successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error sending email verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
