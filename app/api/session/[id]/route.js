import { NextResponse } from "next/server";
import { broadcastSession } from "@/lib/sse";
import { applySessionAction, deleteSession, getSession } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { id } = await params;
  const session = await getSession(id);

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return NextResponse.json({ session });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const payload = await request.json();
  const session = await applySessionAction(id, payload);

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  broadcastSession(id, session);

  return NextResponse.json({ session });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;

  await deleteSession(id);

  return NextResponse.json({ ok: true });
}
