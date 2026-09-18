import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Every request that is not a static asset goes through the session check.
// There is deliberately no environment switch that turns it off: the mock
// "demo mode" is gone, and a public variable must never be able to open the
// app.
export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
