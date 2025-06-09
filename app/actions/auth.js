"use server";

import { redirect } from "next/navigation";
import { signIn } from "next-auth/react";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function registerUser(formData) {
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");

  // Validation
  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: "User already exists with this email" };
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });

    return {
      success: true,
      message: "User created successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Internal server error" };
  }
}

export async function getUserById(userId) {
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
}

export async function updateUser(userId, updateData) {
  try {
    await dbConnect();
    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return { error: "User not found" };
    }

    return {
      success: true,
      user: user.toJSON(),
    };
  } catch (error) {
    console.error("Update user error:", error);
    return { error: "Failed to update user" };
  }
}
