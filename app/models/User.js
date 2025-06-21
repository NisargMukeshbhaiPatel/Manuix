import mongoose from "mongoose" 
import bcrypt from "bcryptjs";
import { roles } from "@/constants/rbac";

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
      required: function () {
        // Password is required only if no token exists (user is activated)
        return !this.activationToken;
      },
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // don't include password in queries by default
    },
    role: {
      type: String,
      enum: roles,
      default: "user",
    },
    activationToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,

    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        delete ret.activationToken;
        ret.id = ret._id.toString();
        ret._id = ret._id.toString();
        return ret;
      },
    },
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

export default mongoose.models.User || mongoose.model("User", UserSchema);
