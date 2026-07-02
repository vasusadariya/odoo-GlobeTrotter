import mongoose from "mongoose";

// Kept as a separate collection (not embedded in Trip.itinerary items)
// deliberately: both POST /api/trips/[id]/itinerary and
// POST /api/generate-and-view/[tripId] fully overwrite trip.itinerary on
// save/regenerate, so embedded comments would be lost on every edit.
// Keyed by (trip, itineraryItemId) - item ids are stable across rewrites.
const ItineraryCommentSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    itineraryItemId: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    kind: {
      type: String,
      enum: ["comment", "reaction"],
      default: "comment",
    },
    text: {
      type: String,
      trim: true,
    },
    emoji: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

ItineraryCommentSchema.index({ trip: 1, itineraryItemId: 1 });

export default mongoose.models.ItineraryComment || mongoose.model("ItineraryComment", ItineraryCommentSchema);
