import "server-only";

import { prisma } from "@/lib/prisma";

export async function getLatestReminderForParticipant(participantId: string) {
  return prisma.reminderLog.findFirst({
    where: { participantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createReminderLog({
  sessionId,
  participantId,
  hostId,
  provider,
  status,
  message,
}: {
  sessionId: string;
  participantId: string;
  hostId: string;
  provider: "DEMO" | "SMS" | "WHATSAPP";
  status: "SENT" | "FAILED";
  message: string;
}) {
  return prisma.reminderLog.create({
    data: {
      sessionId,
      participantId,
      hostId,
      provider,
      status,
      message,
    },
  });
}
