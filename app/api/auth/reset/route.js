import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import bcryptjs from 'bcryptjs';

export async function POST(request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Hash the provided token to compare with stored hash
    const hashedToken = bcryptjs.hashSync(token, 10);

    const user = await User.findOne({
      passwordResetToken: { $exists: true },
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token is invalid or has expired' },
        { status: 400 }
      );
    }

    // Verify token (constant-time comparison)
    const isTokenValid = bcryptjs.compareSync(token, user.passwordResetToken);

    if (!isTokenValid) {
      return NextResponse.json(
        { error: 'Token is invalid or has expired' },
        { status: 400 }
      );
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.emailVerified = new Date();

    await user.save();

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}