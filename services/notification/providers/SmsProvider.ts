import "server-only";

import type { NotificationProvider, ReminderPayload, ReminderResult } from "@/services/notification/NotificationService";

export class SmsProvider implements NotificationProvider {
  readonly name = "SMS" as const;

  async send(payload: ReminderPayload): Promise<ReminderResult> {
    throw new Error(
      `SMS provider is not configured yet. Message preview: ${payload.participantName}`,
    );
  }
}
