import mongoose from 'mongoose';

const CommunityPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author reference is required'],
  },
  relatedTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SharedTrip',
  },
  images: [{
    url: { type: String },
    caption: { type: String, trim: true },
  }],
  tags: [{
    type: String,
    trim: true,
  }],
  likeCount: {
    type: Number,
    default: 0,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['published', 'draft', 'archived'],
    default: 'published',
  },
}, {
  timestamps: true,
});

// Virtual for getting all comments
CommunityPostSchema.virtual('comments', {
  ref: 'CommunityComment',
  localField: '_id',
  foreignField: 'post',
});

export default mongoose.models.CommunityPost || mongoose.model('CommunityPost', CommunityPostSchema);