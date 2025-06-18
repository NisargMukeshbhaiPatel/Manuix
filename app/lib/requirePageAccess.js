import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { canAccess } from "./rbac";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// requirePageAccess({
//   product: ["read"],
//   posts: ['read'],
// })
export default async function requirePageAccess(accessChecks) {
  const referer = (await headers()).get("referer") || "/";
  const session = await getServerSession(authOptions);

  if (!session?.user?.role) {
    redirect(referer);
  }

  const hasAccess = Object.entries(accessChecks).every(
    ([collection, actions]) =>
      actions.every((action) =>
        canAccess(session.user.role, collection, action),
      ),
  );

  if (!hasAccess) redirect(referer);
}

export async function requireRoleAccess(roleRequired) {
  const referer = (await headers()).get("referer") || "/";
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || !session.user.role !== roleRequired) {
    redirect(referer);
  }
}
