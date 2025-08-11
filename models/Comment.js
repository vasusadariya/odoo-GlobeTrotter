import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
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
  sharedTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SharedTrip',
    required: [true, 'Shared trip reference is required'],
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema);