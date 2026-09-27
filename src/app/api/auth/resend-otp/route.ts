import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { sendOtpEmail } from '@/lib/nodemailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'Account is already verified. Please login.' },
        { status: 400 }
      );
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    try {
      await sendOtpEmail(normalizedEmail, user.name, otp);
    } catch (emailErr: any) {
      console.error('Failed to resend verification email:', emailErr);
      return NextResponse.json(
        { error: emailErr.message || 'Failed to send OTP email.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (err: any) {
    console.error('Resend OTP API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while resending OTP' },
      { status: 500 }
    );
  }
}
