import mongoose from "mongoose"

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  duration: String,
  cost: { type: Number, default: 0 },
  category: {
    type: String,
    enum: ["sightseeing", "food", "adventure", "culture", "shopping", "nightlife", "nature", "other"],
    default: "other",
  },
  location: String,
  coordinates: {
    lat: Number,
    lng: Number,
  },
  images: [String],
  rating: Number,
  bookingUrl: String,
})

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: String,
  coordinates: {
    lat: Number,
    lng: Number,
  },
  placeId: String,
  activities: [activitySchema],
  estimatedDays: { type: Number, default: 1 },
  notes: String,
  count: { type: Number, default: 1 }, // Add count field to track destination popularity
  image: String, // Optional field to store destination image
})

const itineraryItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ["destination", "accommodation", "transport", "activity", "meal", "other"],
    default: "activity",
  },
  destinations: [destinationSchema],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  budget: { type: Number, default: 0 },
  location: String,
  coordinates: {
    lat: Number,
    lng: Number,
  },
  notes: String,
})

const travelerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: {
    type: String,
    enum: ["owner", "collaborator", "viewer"],
    default: "viewer",
  },
  joinedAt: { type: Date, default: Date.now },
})

const budgetSchema = new mongoose.Schema({
  transport: { type: Number, default: 0 },
  accommodation: { type: Number, default: 0 },
  activities: { type: Number, default: 0 },
  food: { type: Number, default: 0 },
  other: { type: Number, default: 0 },
})

const tripSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    destinations: [destinationSchema],
    itinerary: [itineraryItemSchema],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    travelers: [travelerSchema],
    coverImage: String,
    images: [String],
    budgetLimit: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    totalBudget: budgetSchema,
    status: {
      type: String,
      enum: ["draft", "planned", "in-progress", "completed", "cancelled"],
      default: "draft",
    },
    privacy: {
      type: String,
      enum: ["private", "shared", "public"],
      default: "private",
    },
    isPublic: { type: Boolean, default: false },
    tags: [String],
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  },
)

// Virtual for trip duration
tripSchema.virtual("duration").get(function () {
  const diffTime = Math.abs(this.endDate - this.startDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

// Virtual for estimated cost
tripSchema.virtual("estimatedCost").get(function () {
  if (this.totalBudget) {
    return Object.values(this.totalBudget).reduce((sum, amount) => sum + amount, 0)
  }
  return 0
})

// Static method to get top destinations by count
tripSchema.statics.getTopDestinations = async function(limit = 10, country = null) {
  const matchStage = country ? { "destinations.country": country } : {};
  
  const pipeline = [
    { $match: matchStage },
    { $unwind: "$destinations" },
    {
      $group: {
        _id: {
          name: "$destinations.name", 
          country: "$destinations.country"
        },
        count: { $sum: 1 },
        coordinates: { $first: "$destinations.coordinates" },
        placeId: { $first: "$destinations.placeId" },
        image: { $first: "$destinations.image" },
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        name: "$_id.name",
        country: "$_id.country",
        count: 1,
        coordinates: 1,
        placeId: 1,
        image: 1
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

// Method to increment destination count (updates existing destination or adds a new one)
tripSchema.methods.incrementDestinationCount = async function(destinationName, country) {
  const Trip = mongoose.model('Trip');
  
  // First, update all existing trips with this destination
  await Trip.updateMany(
    { "destinations.name": destinationName, "destinations.country": country },
    { $inc: { "destinations.$.count": 1 } }
  );
  
  // Also update this trip if it contains the destination
  const destinationIndex = this.destinations.findIndex(
    dest => dest.name === destinationName && dest.country === country
  );
  
  if (destinationIndex >= 0) {
    this.destinations[destinationIndex].count += 1;
    await this.save();
  }
  
  return this;
};

// Ensure virtual fields are serialized
tripSchema.set("toJSON", { virtuals: true })

// Index for better query performance
tripSchema.index({ owner: 1, createdAt: -1 })
tripSchema.index({ privacy: 1, isPublic: 1 })
tripSchema.index({ startDate: 1, endDate: 1 })
tripSchema.index({ "destinations.name": 1, "destinations.country": 1 }) // Index for destination lookup

export default mongoose.models.Trip || mongoose.model("Trip", tripSchema)