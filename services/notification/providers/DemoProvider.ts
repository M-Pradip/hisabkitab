import "server-only";

import { createReminderLog } from "@/lib/queries/reminders";
import { buildReminderMessage } from "@/lib/reminder-message";
import type { NotificationProvider, ReminderPayload, ReminderResult } from "@/services/notification/NotificationService";

export class DemoProvider implements NotificationProvider {
  readonly name = "DEMO" as const;

  async send(payload: ReminderPayload): Promise<ReminderResult> {
    const message = buildReminderMessage({
      participantName: payload.participantName,
      sessionTitle: payload.sessionTitle,
      shareAmount: payload.shareAmount,
      billSummary: payload.billSummary,
    });

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
