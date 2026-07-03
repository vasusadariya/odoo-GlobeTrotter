import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import connectDB from "../../../../lib/mongodb"
import CommunityPost from '../../../../models/CommunityPost';
import User from '../../../../models/User';

export async function GET(request, props) {
  const params = await props.params;
  try {
    const { id } = params;
    
    await connectDB();
    
    const post = await CommunityPost.findById(id)
      .populate('author', 'name image')
      .lean();
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ post });
    
  } catch (error) {
    console.error('Error fetching community post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// Unpublish - only for posts that were generated from a trip (post.trip set)
// and only by their author. General post editing/deletion is out of scope
// for this pass.
export async function DELETE(request, props) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({
      $or: [{ googleId: session.user.id }, { email: session.user.email }],
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const post = await CommunityPost.findById(params.id);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (!post.trip) {
      return NextResponse.json(
        { error: 'Only trip-published posts can be unpublished here' },
        { status: 400 }
      );
    }

    if (post.author.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'You do not own this post' }, { status: 403 });
    }

    await CommunityPost.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Post unpublished' });
  } catch (error) {
    console.error('Error unpublishing community post:', error);

    if (error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to unpublish post' }, { status: 500 });
  }
}