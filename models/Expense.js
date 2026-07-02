import mongoose from "mongoose";

// Separate collection, same rationale as ItineraryComment: Trip.itinerary
// gets fully overwritten on save/regenerate, so actual-spend records need to
// live independently of it to survive those rewrites.
const ExpenseSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    itineraryItemId: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      enum: ["transport", "accommodation", "activities", "food", "other"],
      default: "other",
    },
    description: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    splitBetween: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        share: { type: Number, required: true },
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

ExpenseSchema.index({ trip: 1, date: -1 });

export default mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
