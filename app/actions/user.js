"use server";
import User from "@/models/User";
import dbConnect from "@/lib/db";
import crypto from "crypto";
import { createCollectionRBAC } from "@/lib/rbac";

// Initialize RBAC for users collection
const { withCreate, withRead, withUpdate, withDelete } =
  createCollectionRBAC("users");

function generateActivationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export const getAllUsers = withRead(async () => {
  try {
    await dbConnect();

    const users = await User.find({}).sort({ createdAt: -1 });

    return {
      success: true,
      users: users.map((user) => user.toJSON()),
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
});

export const getUserById = withRead(async (userId) => {
  try {
    await dbConnect();

    const user = await User.findById(userId);

    if (!user) {
      return { error: "User not found" };
    }

    return {
      success: true,
      user: user.toJSON(),
    };
  } catch (error) {
    console.error("Get user error:", error);
    return { error: "Failed to fetch user" };
  }
});

export const createUserWithToken = withCreate(async (formData) => {
  const email = formData.get("email");
  const role = formData.get("role");

  // Validation
  if (!email || !role) {
    return { error: "All fields are required" };
  }

  try {
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: "User already exists with this email" };
    }

    const activationToken = generateActivationToken();

    const user = await User.create({
      name: "Not Active",
      email,
      role,
      activationToken,
    });

    return {
      success: true,
      message:
        "User created successfully. Share the activation token with the user.",
      activationToken, // Include token for admin to share
    };
  } catch (error) {
    console.error("User creation error:", error);
    return { error: "Failed to create user" };
  }
});

export const updateUserRole = withUpdate(async (formData) => {
  const userId = formData.get("userId");
  const newRole = formData.get("role");

  if (!userId || !newRole) {
    return { error: "User ID and role are required" };
  }

  try {
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return { error: "User not found" };
    }

    user.role = newRole;
    await user.save();

    return {
      success: true,
      message: "User role updated successfully",
      user: user.toJSON(),
    };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { error: "Failed to update user role" };
  }
});

export const deleteUser = withDelete(async (formData) => {
  const userId = formData.get("userId");

  if (!userId) {
    return { error: "User ID is required" };
  }

  try {
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return { error: "User not found" };
    }

    await User.findByIdAndDelete(userId);

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { error: "Failed to delete user" };
  }
});

export async function activateUserAccount(formData) {
  const name = formData.get("name");
  const token = formData.get("token");
  const password = formData.get("password");
  if (!name || !token || !password) {
    return { error: "Token and password are required" };
  }

  try {
    await dbConnect();

    // Find user by activation token
    const user = await User.findOne({
      activationToken: token,
    });

    if (!user) {
      return { error: "Invalid activation token" };
    }

    // Update user
    user.password = password;
    user.name = name;
    user.activationToken = null;
    await user.save();

    return {
      success: true,
      email: user.email,
    };
  } catch (error) {
    console.error("Error activating account:", error);
    return {
      success: false,
      error: "Failed to activate account",
    };
  }
}
