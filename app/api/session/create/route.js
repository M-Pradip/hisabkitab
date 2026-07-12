import { NextResponse } from "next/server";
import { createSession } from "@/lib/store";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const currentSession = await auth();
  const hostName = currentSession?.user?.name?.trim() || "";
  const session = await createSession(
    hostName
      ? {
          hostName,
        }
      : {},
  );

  return NextResponse.json({
    session,
  });
}
