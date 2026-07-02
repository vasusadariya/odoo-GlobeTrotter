import mongoose from "mongoose"

const CommunityPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title must be less than 100 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      minlength: [10, "Content must be at least 10 characters"],
    },
    coverImage: {
      type: String,
      required: [true, "Cover image is required"],
    },
    tags: {
      type: [String],
      required: [true, "At least one tag is required"],
      validate: {
        validator: function(tags) {
          return tags.length > 0;
        },
        message: "Please select at least one tag"
      },
      enum: {
        values: ["solo travel", "family", "culture", "adventure", "budget", "luxury", "nature", "food", "photography", "village", "city", "beach"],
        message: "Invalid tag selected"
      }
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    views: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
)

// Create text index for search functionality
CommunityPostSchema.index({ title: "text", content: "text" })

export default mongoose.models.CommunityPost || mongoose.model("CommunityPost", CommunityPostSchema)