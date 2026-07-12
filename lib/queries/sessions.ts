import "server-only";

import { prisma } from "@/lib/prisma";

export async function getExpenseSessionsForHost(hostId: string) {
  return prisma.expenseSession.findMany({
    where: { hostId },
    orderBy: { createdAt: "desc" },
    include: {
      participants: {
        orderBy: { createdAt: "asc" },
      },
      reminderLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          participant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function getExpenseSessionById(sessionId: string, hostId: string) {
  return prisma.expenseSession.findFirst({
    where: {
      id: sessionId,
      hostId,
    },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          hostProfile: {
            select: {
              id: true,
              fullName: true,
              paymentProvider: true,
              phoneNumber: true,
              premiumStatus: true,
              paymentQrImageData: true,
              paymentQrImageMimeType: true,
              paymentQrImageName: true,
            },
          },
        },
      },
      participants: {
        orderBy: { createdAt: "asc" },
      },
      reminderLogs: {
        orderBy: { createdAt: "desc" },
        include: {
          participant: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });
}

export async function createExpenseSession({
  hostId,
  title,
  description,
  totalAmount,
  currency,
}: {
  hostId: string;
  title: string;
  description?: string | null;
  totalAmount: number;
  currency: string;
}) {
  return prisma.expenseSession.create({
    data: {
      hostId,
      title,
      description: description || null,
      totalAmount,
      currency,
    },
  });
}
