import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { sendOtpEmail } from '@/lib/nodemailer';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Please provide all required fields (name, email, password)' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please login instead.' },
          { status: 409 }
        );
      } else {
        // Unverified user already exists, update password and send new OTP
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        existingUser.name = name.trim();
        existingUser.password = hashedPassword;
        existingUser.otp = otp;
        existingUser.otpExpiresAt = otpExpiresAt;
        await existingUser.save();

        try {
          await sendOtpEmail(normalizedEmail, existingUser.name, otp);
        } catch (emailErr: any) {
          console.error('Failed to send verification email:', emailErr);
          return NextResponse.json(
            { error: emailErr.message || 'Failed to send OTP verification email.' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          requiresOtp: true,
          email: normalizedEmail,
          message: 'Verification code sent to your email. Please check your inbox.',
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user in MongoDB with isVerified: false
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      isAdmin: normalizedEmail.includes('admin'),
      isVerified: false,
      otp,
      otpExpiresAt,
      watchlist: [],
      history: [],
    });

    try {
      await sendOtpEmail(normalizedEmail, user.name, otp);
    } catch (emailErr: any) {
      console.error('Failed to send verification email:', emailErr);
      return NextResponse.json(
        { error: emailErr.message || 'Failed to send OTP verification email. Please make sure email settings are configured.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      requiresOtp: true,
      email: normalizedEmail,
      message: 'Verification code sent to your email. Please check your inbox.',
    });
  } catch (err: any) {
    console.error('Signup API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
