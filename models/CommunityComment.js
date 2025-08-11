import mongoose from 'mongoose';

const CommunityCommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author reference is required'],
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityPost',
    required: [true, 'Post reference is required'],
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityComment',
  },
  likeCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.models.CommunityComment || mongoose.model('CommunityComment', CommunityCommentSchema);