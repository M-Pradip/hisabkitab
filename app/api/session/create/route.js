import { NextResponse } from "next/server";
import { createSession } from "@/lib/store";

export const runtime = "nodejs";

export async function POST() {
  const session = await createSession();

  return NextResponse.json({
    session,
  });
}
