import { NextResponse } from 'next/server';
import connectDB from "../../../../../lib/mongodb"
import CommunityPost from '../../../../../models/CommunityPost';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    
    await connectDB();
    
    const post = await CommunityPost.findById(id);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Increment view count
    post.views = post.views + 1;
    await post.save();
    
    return NextResponse.json({ 
      success: true,
      views: post.views
    });
    
  } catch (error) {
    console.error('Error updating view count:', error);
    return NextResponse.json(
      { error: 'Failed to update view count' },
      { status: 500 }
    );
  }
}