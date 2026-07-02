import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const TripInviteSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["collaborator", "viewer"],
      default: "collaborator",
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Same hash-and-expire pattern as User.createPasswordResetToken, but with a
// longer expiry since this is an async email invite, not a same-session flow.
TripInviteSchema.methods.createInviteToken = function () {
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  this.tokenHash = bcryptjs.hashSync(token, 10);
  this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return token;
};

TripInviteSchema.methods.verifyInviteToken = function (token) {
  if (!this.tokenHash || !this.expiresAt) return false;
  if (this.status !== "pending") return false;
  if (Date.now() > this.expiresAt.getTime()) return false;

  return bcryptjs.compareSync(token, this.tokenHash);
};

export default mongoose.models.TripInvite || mongoose.model("TripInvite", TripInviteSchema);
