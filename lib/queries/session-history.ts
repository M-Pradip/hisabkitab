import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type SplitSessionSnapshot = {
  session: {
    id: string;
    hostId: string;
    hostName: string;
    sessionNote: string;
    paymentProvider: string;
    paymentMethod: string;
    paymentQrImage: string;
    paymentQrFileName: string;
    paymentQrPublicId: string;
    paymentQrAssetId: string;
    closedAt: string;
    qrExpiresAt: string;
    participants: Array<{
      id: string;
      name: string;
      role: string;
    }>;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    claims: Record<string, string[]>;
  };
  totals: {
    grandTotal: number;
    unassignedTotal: number;
    unassignedItems: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    hasUnassigned: boolean;
    participantTotals: Array<{
      id: string;
      name: string;
      role: string;
      total: number;
      items: Array<{
        id: string;
        name: string;
        share: number;
        price: number;
        claimedIds: string[];
      }>;
    }>;
  };
  metadata: {
    itemCount: number;
    participantCount: number;
    savedAt: string;
  };
};

type SaveSplitBillHistoryInput = {
  sourceSessionId: string;
  hostId: string;
  hostName: string;
  title: string;
  totalAmount: number;
  currency?: string;
  status?: "SAVED" | "CLOSED";
  summary: SplitSessionSnapshot;
};

export async function upsertSplitBillHistory(input: SaveSplitBillHistoryInput) {
  return prisma.billSplitHistory.upsert({
    where: {
      sourceSessionId: input.sourceSessionId,
    },
    create: {
      sourceSessionId: input.sourceSessionId,
      hostId: input.hostId,
      hostName: input.hostName,
      title: input.title,
      currency: input.currency || "NPR",
      totalAmount: new Prisma.Decimal(input.totalAmount),
      status: input.status ?? "SAVED",
      summary: input.summary as Prisma.InputJsonValue,
    },
    update: {
      hostId: input.hostId,
      hostName: input.hostName,
      title: input.title,
      currency: input.currency || "NPR",
      totalAmount: new Prisma.Decimal(input.totalAmount),
      status: input.status ?? "SAVED",
      summary: input.summary as Prisma.InputJsonValue,
    },
  });
}

export async function getSplitBillHistoryForHost(hostId: string) {
  try {
    return await prisma.billSplitHistory.findMany({
      where: { hostId },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    if (isMissingBillSplitHistoryTableError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getSplitBillHistoryById(historyId: string, hostId: string) {
  try {
    return await prisma.billSplitHistory.findFirst({
      where: {
        id: historyId,
        hostId,
      },
    });
  } catch (error) {
    if (isMissingBillSplitHistoryTableError(error)) {
      return null;
    }

    throw error;
  }
}

export function buildSplitBillSnapshot(session: {
  id: string;
  hostId?: string;
  hostName?: string;
  sessionNote?: string;
  paymentProvider?: string;
  paymentMethod?: string;
  paymentQrImage?: string;
  paymentQrFileName?: string;
  paymentQrPublicId?: string;
  paymentQrAssetId?: string;
  closedAt?: string;
  qrExpiresAt?: string;
  participants?: Array<{
    id: string;
    name: string;
    role?: string;
  }>;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity?: number;
  }>;
  claims?: Record<string, string[]>;
}) {
  const participants = (session.participants || []).map((participant) => ({
    id: participant.id,
    name: participant.name,
    role: participant.role || "participant",
  }));
  const items = (session.items || []).map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price || 0),
    quantity: Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0
      ? Math.max(1, Math.round(Number(item.quantity)))
      : 1,
  }));

  const claims: Record<string, string[]> = {};

  for (const item of items) {
    claims[item.id] = Array.isArray(session.claims?.[item.id])
      ? [...new Set(session.claims?.[item.id] || [])]
      : [];
  }

  const calculated = items.reduce(
    (acc, item) => {
      const price = Number(item.price || 0) * Number(item.quantity || 1);
      acc.grandTotal += price;

      const claimedIds = (claims[item.id] || []).filter((id) =>
        participants.some((participant) => participant.id === id),
      );

      if (claimedIds.length === 0) {
        acc.unassignedTotal += price;
        acc.unassignedItems.push(item);
        return acc;
      }

      const share = price / claimedIds.length;

      for (const participantId of claimedIds) {
        const bucket = acc.participantMap.get(participantId);

        if (!bucket) {
          continue;
        }

        bucket.total += share;
        bucket.items.push({
          id: item.id,
          name: item.name,
          share,
          price,
          claimedIds,
        });
      }

      return acc;
    },
    {
      grandTotal: 0,
      unassignedTotal: 0,
      unassignedItems: [] as Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }>,
      participantMap: new Map(
        participants.map((participant) => [
          participant.id,
          {
            id: participant.id,
            name: participant.name,
            role: participant.role,
            total: 0,
            items: [] as Array<{
              id: string;
              name: string;
              share: number;
              price: number;
              claimedIds: string[];
            }>,
          },
        ]),
      ),
    },
  );

  return {
    session: {
      id: session.id,
      hostId: session.hostId || "",
      hostName: session.hostName || "",
      sessionNote: session.sessionNote || "",
      paymentProvider: session.paymentProvider || "",
      paymentMethod: session.paymentMethod || "",
      paymentQrImage: session.paymentQrImage || "",
      paymentQrFileName: session.paymentQrFileName || "",
      paymentQrPublicId: session.paymentQrPublicId || "",
      paymentQrAssetId: session.paymentQrAssetId || "",
      closedAt: session.closedAt || "",
      qrExpiresAt: session.qrExpiresAt || "",
      participants,
      items,
      claims,
    },
    totals: {
      grandTotal: Math.round((calculated.grandTotal + Number.EPSILON) * 100) / 100,
      unassignedTotal:
        Math.round((calculated.unassignedTotal + Number.EPSILON) * 100) / 100,
      unassignedItems: calculated.unassignedItems,
      hasUnassigned: calculated.unassignedItems.length > 0,
      participantTotals: [...calculated.participantMap.values()].map(
        (participant) => ({
          ...participant,
          total: Math.round((participant.total + Number.EPSILON) * 100) / 100,
        }),
      ),
    },
    metadata: {
      itemCount: items.length,
      participantCount: participants.length,
      savedAt: new Date().toISOString(),
    },
  } satisfies SplitSessionSnapshot;
}

function isMissingBillSplitHistoryTableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes('The table `public.BillSplitHistory` does not exist') ||
    error.message.includes('relation "BillSplitHistory" does not exist')
  );
}
