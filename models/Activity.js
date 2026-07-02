import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  stop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stop',
    required: [true, 'Stop reference is required'],
  },
  name: {
    type: String,
    required: [true, 'Activity name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
    default: null,
  },
  date: {
    type: Date,
    required: [true, 'Activity date is required'],
  },
  startTime: {
    type: String,
    trim: true,
  },
  endTime: {
    type: String,
    trim: true,
  },
  duration: {
    type: Number,  // In minutes
    default: 60,
  },
  cost: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    enum: ['sightseeing', 'food', 'adventure', 'culture', 'relaxation', 'shopping', 'entertainment', 'other'],
    default: 'sightseeing',
  },
  location: {
    name: { type: String, trim: true },
    address: { type: String, trim: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  bookingInfo: {
    url: { type: String, trim: true },
    confirmation: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  isConfirmed: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);