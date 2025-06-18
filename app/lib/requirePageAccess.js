import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { canAccess } from "./rbac";

// requirePageAccess(role, {
//   product: ["read"],
//   posts: ['read'],
// })
export default function requirePageAccess(role, accessChecks) {
  const referer = headers().get("referer") || "/";

  const hasAccess = Object.entries(accessChecks).every(
    ([collection, actions]) =>
      actions.every((action) => canAccess(role, collection, action)),
  );

  if (!hasAccess) redirect(referer);
}

