import {
  sendArchivedSessionReminder,
  sendSessionReminder,
} from "@/services/reminders/reminder-service";
import { reminderRequestSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = reminderRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid reminder request." },
        { status: 400 },
      );
    }

    const isArchivedPayload =
      Boolean(parsed.data.participantName) &&
      Boolean(parsed.data.sessionTitle) &&
      Boolean(parsed.data.shareAmount) &&
      Boolean(parsed.data.billSummary);

    const result = isArchivedPayload
      ? await sendArchivedSessionReminder({
          participantEmail: parsed.data.email ?? "",
          participantName: parsed.data.participantName ?? "Participant",
          sessionTitle: parsed.data.sessionTitle ?? "Bill split session",
          shareAmount: parsed.data.shareAmount ?? "0",
          billSummary: parsed.data.billSummary ?? "",
        })
      : await sendSessionReminder({
          sessionId: parsed.data.sessionId ?? "",
          participantId: parsed.data.participantId ?? "",
          email: parsed.data.email,
        });

    return Response.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send reminder.";

    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("one notification per day") ||
            message.includes("5 notifications") ||
            message.includes("Too many reminder requests")
          ? 429
          : 400;

    return Response.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
