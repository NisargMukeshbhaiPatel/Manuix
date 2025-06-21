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
      role: "user",//only admin can change
    });

    return {
      success: true,
      message: "User created successfully",
      user: user.toJSON(),
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Internal server error" };
  }
}
