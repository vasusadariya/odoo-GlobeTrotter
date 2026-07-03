import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';

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

    // bcrypt hashes aren't queryable, so fetch every user with a live reset
    // token and compare the candidate token against each one individually -
    // matching on the first user found with any valid token (regardless of
    // whether it's actually theirs) would let one user's reset link reset a
    // different user's password.
    const candidates = await User.find({
      passwordResetToken: { $exists: true, $ne: null },
      passwordResetExpires: { $gt: Date.now() },
    });

    const user = candidates.find((candidate) => candidate.verifyPasswordResetToken(token));

    if (!user) {
      return NextResponse.json(
        { error: 'Token is invalid or has expired' },
        { status: 400 }
      );
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.clearPasswordResetToken();
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