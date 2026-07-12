import "server-only";

import { DemoProvider } from "@/services/notification/providers/DemoProvider";
import { SmsProvider } from "@/services/notification/providers/SmsProvider";
import { WhatsAppProvider } from "@/services/notification/providers/WhatsAppProvider";
import type { NotificationProvider, ReminderProviderName } from "@/services/notification/NotificationService";

export function createNotificationService(): NotificationProvider {
  const provider = (process.env.REMINDER_PROVIDER ?? "DEMO").toUpperCase() as ReminderProviderName;

  switch (provider) {
    case "SMS":
      return new SmsProvider();
    case "WHATSAPP":
      return new WhatsAppProvider();
    case "DEMO":
    default:
      return new DemoProvider();
  }
}
