import "server-only";

import { createReminderLog } from "@/lib/queries/reminders";
import { buildReminderEmailTemplate } from "@/lib/reminder-message";
import type {
  NotificationProvider,
  ReminderPayload,
  ReminderResult,
} from "@/services/notification/NotificationService";

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || "Hisab Kitab <pradipmdr0012@gmail.com>";
}

export class ResendProvider implements NotificationProvider {
  readonly name = "RESEND" as const;

  async send(payload: ReminderPayload): Promise<ReminderResult> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    const template = buildReminderEmailTemplate({
      participantName: payload.participantName,
      participantEmail: payload.participantEmail,
      sessionTitle: payload.sessionTitle,
      shareAmount: payload.shareAmount,
      billSummary: payload.billSummary,
    });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: payload.participantEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
    });

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        responseBody?.message ||
        responseBody?.error ||
        "Unable to send email through Resend.";

      const reminderLog = await createReminderLog({
        sessionId: payload.sessionId,
        participantId: payload.participantId,
        hostId: payload.hostId,
        provider: this.name,
        status: "FAILED",
        message: `Resend error: ${errorMessage}`,
      });

      throw new Error(`Resend error: ${errorMessage} (${reminderLog.id})`);
    }

    const message = `Email sent to ${payload.participantName} <${payload.participantEmail}>`;

    const reminderLog = await createReminderLog({
      sessionId: payload.sessionId,
      participantId: payload.participantId,
      hostId: payload.hostId,
      provider: this.name,
      status: "SENT",
      message,
    });

    return {
      provider: this.name,
      status: "SENT",
      message,
      reminderLogId: reminderLog.id,
    };
  }
}
