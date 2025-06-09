"use client";
import { useSession } from "next-auth/react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const user = session?.user;
  console.log(user, status);
  // isLoading: status === "loading",
  // isAuthenticated: !!session,
  // isAdmin: session?.user?.role === "admin",

  return (
    <div>
      <h1>Welcome to Dashboard</h1>
      <p>Hello, {user?.name}!</p>
    </div>
  );
}
