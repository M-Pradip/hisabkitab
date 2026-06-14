import { NextResponse } from "next/server";
import { createSession } from "@/lib/store";

export const runtime = "nodejs";

export async function POST() {
  const session = createSession();

  return NextResponse.json({
    session,
  });
}
