import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { sendMail } from '../../../../lib/mail';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    // Always return success to not reveal user existence
    if (!user) {
      return NextResponse.json(
        { message: 'If your email exists in our system, you will receive a reset link.' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}`;

    await sendMail({
      to: user.email,
      subject: 'GlobeTrotter - Password Reset',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your GlobeTrotter account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetURL}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
      `,
    });

    return NextResponse.json(
      { message: 'If your email exists in our system, you will receive a reset link.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}