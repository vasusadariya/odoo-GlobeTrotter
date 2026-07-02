import mongoose from 'mongoose';

const CitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'City name is required'],
    trim: true,
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
  },
  region: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  images: [{
    url: { type: String },
    caption: { type: String, trim: true },
  }],
  costIndex: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,  // 1 = very cheap, 10 = very expensive
  },
  popularityRank: {
    type: Number,
    default: 0,
  },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  tags: [{
    type: String,
    trim: true,
  }],
  timezone: {
    type: String,
    default: 'UTC',
    trim: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.City || mongoose.model('City', CitySchema);