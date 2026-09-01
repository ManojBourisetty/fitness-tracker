import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { checkBearerToken } from "@/lib/healthSyncAuth";

/** Read endpoint the app's own frontend calls to display synced Apple Health data. */
export async function GET(request: Request) {
  if (!checkBearerToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "health_metrics_read",
    since ? { since_date: since } : undefined
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ rows: data ?? [] }, { status: 200 });
}
