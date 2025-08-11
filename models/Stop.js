import mongoose from 'mongoose';

const StopSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Trip reference is required'],
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: [true, 'City reference is required'],
  },
  cityName: {
    type: String,
    required: [true, 'City name is required'],
    trim: true,
  },
  countryName: {
    type: String,
    required: [true, 'Country name is required'],
    trim: true,
  },
  arrivalDate: {
    type: Date,
    required: [true, 'Arrival date is required'],
  },
  departureDate: {
    type: Date,
    required: [true, 'Departure date is required'],
  },
  description: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    required: [true, 'Order is required for sequencing'],
  },
  accommodation: {
    name: { type: String, trim: true },
    address: { type: String, trim: true },
    cost: { type: Number, default: 0 },
    notes: { type: String, trim: true },
  },
  transportation: {
    type: { 
      type: String, 
      enum: ['flight', 'train', 'bus', 'car', 'ferry', 'other'], 
      default: 'flight' 
    },
    departureTime: { type: Date },
    arrivalTime: { type: Date },
    cost: { type: Number, default: 0 },
    notes: { type: String, trim: true },
  },
  budget: {
    accommodation: { type: Number, default: 0 },
    transportation: { type: Number, default: 0 },
    activities: { type: Number, default: 0 },
    food: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

// Virtual for getting all activities for this stop
StopSchema.virtual('activities', {
  ref: 'Activity',
  localField: '_id',
  foreignField: 'stop',
});

// Pre-save hook to validate dates
StopSchema.pre('save', function(next) {
  if (this.departureDate < this.arrivalDate) {
    return next(new Error('Departure date cannot be before arrival date'));
  }
  next();
});

export default mongoose.models.Stop || mongoose.model('Stop', StopSchema);