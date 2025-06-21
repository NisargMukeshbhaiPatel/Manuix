import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// import GoogleProvider from "next-auth/providers/google";

import User from "@/models/User";
import { LOGIN, REGISTER } from "@/constants/page-routes";

import dbConnect from "@/lib/db";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          await dbConnect();
          const user = await User.findOne({
            email: credentials.email,
          }).select("+password");
          if (!user) {
            throw new Error("No user found with this email");
          }
          const isPasswordValid = await user.comparePassword(
            credentials.password,
          );
          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
          };
        } catch (error) {
          throw new Error(error.message);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      if (token.id) {
        try {
          await dbConnect();
          const dbUser = await User.findById(token.id);

          if (!dbUser) {
            // User deleted - kill the session
            return {};
          }
          // Update role if it changed
          token.role = dbUser.role;
        } catch (error) {
          console.error("Error checking user:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: LOGIN,
    signUp: REGISTER,
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
