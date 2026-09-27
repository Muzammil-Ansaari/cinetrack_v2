import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { sendOtpEmail } from '@/lib/nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'cinetrack_jwt_secret_key_2026_super_secure';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide both email and password' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email address or password' },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email address or password' },
        { status: 401 }
      );
    }

    // If account is not verified yet, require OTP verification first
    if (!user.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();

      try {
        await sendOtpEmail(normalizedEmail, user.name, otp);
      } catch (emailErr: any) {
        console.error('Failed to send OTP verification email:', emailErr);
      }

      return NextResponse.json(
        {
          requiresOtp: true,
          email: normalizedEmail,
          error: 'Your email address is not verified yet. We sent a new verification code to your email.',
        },
        { status: 403 }
      );
    }

    // Create JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userObj = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      watchlist: user.watchlist || [],
      history: user.history || [],
    };

    const response = NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: userObj,
      token,
    });

    response.cookies.set('cinetrack_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('Login API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}
