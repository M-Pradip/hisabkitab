import "server-only";

import { DemoProvider } from "@/services/notification/providers/DemoProvider";
import { ResendProvider } from "@/services/notification/providers/ResendProvider";
import { SmsProvider } from "@/services/notification/providers/SmsProvider";
import { WhatsAppProvider } from "@/services/notification/providers/WhatsAppProvider";
import type { NotificationProvider, ReminderProviderName } from "@/services/notification/NotificationService";

export function createNotificationService(): NotificationProvider {
  const provider = (process.env.REMINDER_PROVIDER ?? (process.env.RESEND_API_KEY ? "RESEND" : "DEMO")).toUpperCase() as ReminderProviderName;

  switch (provider) {
    case "SMS":
      return new SmsProvider();
    case "WHATSAPP":
      return new WhatsAppProvider();
    case "RESEND":
      return new ResendProvider();
    case "DEMO":
    default:
      return new DemoProvider();
  }
}
