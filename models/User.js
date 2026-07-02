import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
            minlength: [2, "First name must be at least 2 characters"],
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
            minlength: [2, "Last name must be at least 2 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+$/i, "Invalid email address"],
            index: true,
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            unique: true,
            trim: true,
            match: [/^[+]?[1-9][\d]{0,15}$/, "Invalid phone number"],
            index: true,
        },
        // Keep phoneNumber for backward compatibility
        phoneNumber: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            required: [true, "City is required"],
            trim: true,
            minlength: [2, "City must be at least 2 characters"],
        },
        country: {
            type: String,
            required: [true, "Country is required"],
            trim: true,
            minlength: [2, "Country must be at least 2 characters"],
        },
        additionalInfo: {
            type: String,
            trim: true,
            maxlength: [
                500,
                "Additional information must be less than 500 characters",
            ],
            default: "",
        },
        password: {
            type: String,
            required: function () {
                return !this.googleId;
            },
            minlength: [6, "Password must be at least 6 characters"],
        },
        googleId: {
            type: String,
            sparse: true,
            index: true,
        },
        image: {
            type: String,
            default: null,
        },
        emailVerified: {
            type: Date,
            default: null,
        },
        passwordResetToken: {
            type: String,
            default: null,
        },
        passwordResetExpires: {
            type: Date,
            default: null,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
            default: null,
        },

        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0],
            },
            city: String,
            area: String,
            country: String,
            updatedAt: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Adding indexes directly in the schema definition instead of using UserSchema.index()
// This avoids the duplicate schema index warnings

// Pre-save middleware to sync phone fields and create name
UserSchema.pre("save", async function (next) {
    // Sync phone and phoneNumber fields
    if (this.phone && !this.phoneNumber) {
        this.phoneNumber = this.phone;
    } else if (this.phoneNumber && !this.phone) {
        this.phone = this.phoneNumber;
    }

    // Auto-generate name from firstName and lastName if not provided
    if (this.firstName && this.lastName && !this.name) {
        this.name = `${this.firstName} ${this.lastName}`;
    }

    // Hash password if modified
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcryptjs.genSalt(12);
        this.password = await bcryptjs.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs.compare(candidatePassword, this.password);
};

// Create password reset token
UserSchema.methods.createPasswordResetToken = function () {
    const resetToken =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

    this.passwordResetToken = bcryptjs.hashSync(resetToken, 10);
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

// Verify password reset token
UserSchema.methods.verifyPasswordResetToken = function (token) {
    if (!this.passwordResetToken || !this.passwordResetExpires) {
        return false;
    }

    if (Date.now() > this.passwordResetExpires) {
        return false;
    }

    return bcryptjs.compareSync(token, this.passwordResetToken);
};

// Clear password reset token
UserSchema.methods.clearPasswordResetToken = function () {
    this.passwordResetToken = null;
    this.passwordResetExpires = null;
};

// Update last login
UserSchema.methods.updateLastLogin = function () {
    this.lastLogin = new Date();
    return this.save();
};

// Virtual for full name
UserSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name (prioritizes name, falls back to fullName)
UserSchema.virtual("displayName").get(function () {
    return this.name || this.fullName || this.email;
});

// Transform JSON output
UserSchema.methods.toJSON = function () {
    const userObject = this.toObject();

    // Remove sensitive fields
    delete userObject.password;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;

    return userObject;
};

// Static method to find user by email or phone
UserSchema.statics.findByEmailOrPhone = function (identifier) {
    return this.findOne({
        $or: [
            { email: identifier.toLowerCase() },
            { phone: identifier },
            { phoneNumber: identifier },
        ],
    });
};

// Static method to create user with Google data
UserSchema.statics.createFromGoogle = function (googleProfile) {
    return this.create({
        name: googleProfile.name,
        firstName: googleProfile.given_name || "",
        lastName: googleProfile.family_name || "",
        email: googleProfile.email,
        googleId: googleProfile.sub,
        image: googleProfile.picture,
        emailVerified: new Date(),
        // Set default values for required fields when creating from Google
        phone: "", // Will need to be updated later
        city: "", // Will need to be updated later
        country: "", // Will need to be updated later
    });
};

export default mongoose.models.User || mongoose.model("User", UserSchema);
