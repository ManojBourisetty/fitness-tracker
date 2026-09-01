import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { checkBearerToken } from "@/lib/healthSyncAuth";
import { parseHealthAutoExportPayload } from "@/lib/healthAutoExport";

/**
 * Webhook target for the Health Auto Export iOS app's "REST API"
 * automation. Configure it to POST here with an
 * `Authorization: Bearer <HEALTH_SYNC_TOKEN>` header.
 */
export async function POST(request: Request) {
  if (!checkBearerToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rows = parseHealthAutoExportPayload(body);
  if (rows.length === 0) {
    return NextResponse.json(
      { inserted: 0, note: "No recognized metrics found in payload" },
      { status: 200 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.rpc("health_metrics_upsert", { rows });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ inserted: rows.length }, { status: 200 });
}
