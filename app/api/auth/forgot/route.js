import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import nodemailer from 'nodemailer';

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

    // Send email (if email server configured)
    if (process.env.EMAIL_SERVER_HOST) {
      try {
        const transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_SERVER_HOST,
          port: process.env.EMAIL_SERVER_PORT,
          secure: false,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        });

        const resetURL = `${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}`;

        await transporter.sendMail({
          from: process.env.EMAIL_SERVER_USER,
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
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Log the reset link for development
        console.log(`Reset link: ${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}`);
      }
    } else {
      // Log the reset link for development when email server not configured
      console.log(`Reset link: ${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}`);
    }

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