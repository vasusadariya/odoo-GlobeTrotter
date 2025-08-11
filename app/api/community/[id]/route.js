import { NextResponse } from 'next/server';
import connectDB from "../../../../lib/mongodb"
import CommunityPost from '../../../../models/CommunityPost';

export async function GET(request, { params }) {
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