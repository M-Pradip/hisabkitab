import "server-only";

import { prisma } from "@/lib/prisma";

export async function updateParticipantPaymentStatus({
  participantId,
  paymentStatus,
}: {
  participantId: string;
  paymentStatus: "PAID" | "UNPAID";
}) {
  return prisma.participant.update({
    where: { id: participantId },
    data: {
      paymentStatus,
      paidAt: paymentStatus === "PAID" ? new Date() : null,
    },
  });
}

export async function getParticipantById(participantId: string) {
  return prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      session: true,
    },
  });
}

export async function createParticipant({
  sessionId,
  name,
  email,
  phoneNumber,
  shareAmount,
}: {
  sessionId: string;
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  shareAmount: number;
}) {
  return prisma.participant.create({
    data: {
      sessionId,
      name,
      email: email || null,
      phoneNumber: phoneNumber || null,
      shareAmount,
    },
  });
}

export async function updateParticipantEmail({
  participantId,
  email,
}: {
  participantId: string;
  email: string | null;
}) {
  return prisma.participant.update({
    where: { id: participantId },
    data: {
      email,
    },
  });
}

export async function incrementParticipantReminder({
  participantId,
  sentAt,
}: {
  participantId: string;
  sentAt: Date;
}) {
  return prisma.participant.update({
    where: { id: participantId },
    data: {
      reminderCount: {
        increment: 1,
      },
      lastReminderSent: sentAt,
    },
  });
}
