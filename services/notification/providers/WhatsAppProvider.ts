import "server-only";

import type { NotificationProvider, ReminderPayload, ReminderResult } from "@/services/notification/NotificationService";

export class WhatsAppProvider implements NotificationProvider {
  readonly name = "WHATSAPP" as const;

  async send(_payload: ReminderPayload): Promise<ReminderResult> {
    throw new Error("WhatsApp provider is not configured yet.");
  }
}
