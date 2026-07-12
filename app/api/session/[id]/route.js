import { NextResponse } from "next/server";
import { broadcastSession } from "@/lib/sse";
import { applySessionAction, deleteSession, getSession } from "@/lib/store";
import { auth } from "@/lib/auth";
import {
  buildSplitBillSnapshot,
  upsertSplitBillHistory,
} from "@/lib/queries/session-history";

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

  if (
    payload?.type === "save_history_snapshot" ||
    payload?.type === "close_session"
  ) {
    try {
      const currentSession = await auth();
      const userId = currentSession?.user?.id;

      if (userId) {
        const hostName =
          currentSession?.user?.name?.trim() || session.hostName || "Host";
        const snapshot = buildSplitBillSnapshot(session);

        await upsertSplitBillHistory({
          sourceSessionId: session.id,
          hostId: userId,
          hostName,
          title: session.sessionNote || hostName || "Bill split session",
          totalAmount: snapshot.totals.grandTotal,
          currency: "NPR",
          status: payload.type === "close_session" ? "CLOSED" : "SAVED",
          summary: snapshot,
        });
      }
    } catch {
      // Best-effort history persistence. The live session flow should still work.
    }
  }

  broadcastSession(id, session);

  return NextResponse.json({ session });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;

  await deleteSession(id);

  return NextResponse.json({ ok: true });
}
