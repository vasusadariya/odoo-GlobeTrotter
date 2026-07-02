import { NextResponse } from 'next/server';
import connectDB from "../../../lib/mongodb"
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import CommunityPost from '../../../models/CommunityPost'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');
    const sort = searchParams.get('sort') || 'latest';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    await connectDB();
    
    // Build query
    const query = {};
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Tags filtering
    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }
    
    // Execute query with sorting and pagination
    const sortOptions = sort === 'oldest' 
      ? { createdAt: 1 } 
      : { createdAt: -1 };
    
    const posts = await CommunityPost.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name image')
      .lean();
    
    const total = await CommunityPost.countDocuments(query);
    
    return NextResponse.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching community posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community posts' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Validate required fields
    const { title, content, coverImage, tags } = data;
    
    if (!title || !content || !coverImage || !tags || tags.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new post
    const newPost = await CommunityPost.create({
      title,
      content,
      coverImage,
      tags,
      author: session.user.id
    });
    
    // Return success with created post ID
    return NextResponse.json({ 
      message: 'Post created successfully',
      postId: newPost._id
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating community post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}