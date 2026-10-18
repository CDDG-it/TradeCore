import { createClient } from "@/lib/supabase/server";
import { readDashboard } from "@/lib/dashboard/reads";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

/**
 * The desk is read on the server, so the HTML arrives with the numbers in it
 * rather than with a spinner that waits for the bundle, hydration and eleven
 * round trips from the browser. The session comes in on the cookie, RLS scopes
 * every row, and the client component takes over from there.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const data = await readDashboard(supabase);
  return <DashboardClient data={data} />;
}
