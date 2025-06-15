import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { roles } from "@/lib/roles";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      maxlength: [60, "Name cannot be more than 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // don't include password in queries by default
    },
    role: {
      type: String,
      enum: roles,
      default: "user",
    },

    // isVerified: {
    //   type: Boolean,
    //   default: false,
    // },
    // avatar: {
    //   type: String,
    //   default: null,
    // },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  // remove the password field so it won't be exposed in API responses
  delete userObject.password;
  return userObject;
};

export default mongoose.models.User || mongoose.model("User", UserSchema);
