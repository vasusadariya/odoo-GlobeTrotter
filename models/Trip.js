import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Trip name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
  },
  coverImage: {
    type: String,
    default: null,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Trip owner is required'],
  },
  budgetLimit: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'USD',
    trim: true,
  },
  status: {
    type: String,
    enum: ['draft', 'planned', 'in-progress', 'completed'],
    default: 'draft',
  },
  privacy: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private',
  },
  totalBudget: {
    transport: { type: Number, default: 0 },
    accommodation: { type: Number, default: 0 },
    activities: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

// Virtual for getting all stops
TripSchema.virtual('stops', {
  ref: 'Stop',
  localField: '_id',
  foreignField: 'trip',
});

// Pre-save hook to validate dates
TripSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    return next(new Error('End date cannot be before start date'));
  }
  next();
});

export default mongoose.models.Trip || mongoose.model('Trip', TripSchema);