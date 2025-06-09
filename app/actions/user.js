"use server";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function getCurrentUser() {
  try {
    const headersList = headers();
    const token = await getToken({
      req: { headers: Object.fromEntries(headersList) },
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.sub) {
      return null;
    }

    await connectDB();
    const user = await User.findById(token.sub).select("-password");

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

