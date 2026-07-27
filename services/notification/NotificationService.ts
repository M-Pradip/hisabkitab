import "server-only";

export type ReminderProviderName = "DEMO" | "SMS" | "WHATSAPP" | "RESEND";

export type ReminderPayload = {
  hostId: string;
  sessionId: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  sessionTitle: string;
  shareAmount: string;
  billSummary: string;
  hostQrMimeType?: string | null;
  hostQrImageData?: Uint8Array<ArrayBuffer> | null;
};

export type ReminderResult = {
  provider: ReminderProviderName;
  message: string;
  reminderLogId?: string;
  status: "SENT" | "FAILED";
};

export interface NotificationProvider {
  readonly name: ReminderProviderName;
  send(payload: ReminderPayload): Promise<ReminderResult>;
}
