import mongoose from 'mongoose';

const SharedTripSchema = new mongoose.Schema({
  originalTrip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Original trip reference is required'],
  },
  shareCode: {
    type: String,
    required: [true, 'Share code is required'],
    unique: true,
    trim: true,
  },
  shareLink: {
    type: String,
    required: [true, 'Share link is required'],
    trim: true,
  },
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  copyCount: {
    type: Number,
    default: 0,
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  privacyLevel: {
    type: String,
    enum: ['link-only', 'public'],
    default: 'link-only',
  },
  allowComments: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Virtual for getting all comments
SharedTripSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'sharedTrip',
});

export default mongoose.models.SharedTrip || mongoose.model('SharedTrip', SharedTripSchema);