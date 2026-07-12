import { sendSessionReminder } from "@/services/reminders/reminder-service";
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

    const result = await sendSessionReminder(parsed.data);

    return Response.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send reminder.";

    const status = message === "Unauthorized" ? 401 : 400;

    return Response.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
