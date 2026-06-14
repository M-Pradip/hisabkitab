import { NextResponse } from "next/server";
import { broadcastSession } from "@/lib/sse";
import { applySessionAction, getSession } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { id } = await params;
  const session = getSession(id);

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({ session });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const payload = await request.json();
  const session = applySessionAction(id, payload);

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  broadcastSession(id, session);

  return NextResponse.json({ session });
}
