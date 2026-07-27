import "server-only";

import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getExpenseSessionById } from "@/lib/queries/sessions";
import {
  getParticipantById,
  incrementParticipantReminder,
  updateParticipantEmail,
} from "@/lib/queries/participants";
import { createNotificationService } from "@/services/notification";
import { sendResendEmail } from "@/services/notification/resend-email";

function formatBillSummary({
  totalAmount,
  currency,
  participantCount,
  paidCount,
  unpaidCount,
}: {
  totalAmount: string;
  currency: string;
  participantCount: number;
  paidCount: number;
  unpaidCount: number;
}) {
  return [
    `Total: ${currency} ${totalAmount}`,
    `Members: ${participantCount}`,
    `Paid: ${paidCount}`,
    `Unpaid: ${unpaidCount}`,
  ].join(" | ");
}

export async function sendSessionReminder({
  sessionId,
  participantId,
  email,
}: {
  sessionId: string;
  participantId: string;
  email?: string | null;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const hostId = session.user.id;

  const rateLimit = checkRateLimit({
    key: `reminder:${hostId}`,
    limit: 10,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    throw new Error("Too many reminder requests. Please wait a moment.");
  }

  const expenseSession = await getExpenseSessionById(sessionId, hostId);

  if (!expenseSession) {
    throw new Error("Session not found or access denied.");
  }

  const participant = await getParticipantById(participantId);

  if (!participant || participant.sessionId !== expenseSession.id) {
    throw new Error("Participant not found for this session.");
  }

  const recipientEmail = (email ?? participant.email ?? "").trim().toLowerCase();

  if (!recipientEmail) {
    throw new Error("Please add the participant email before sending.");
  }

  if (email && recipientEmail !== participant.email) {
    await updateParticipantEmail({
      participantId: participant.id,
      email: recipientEmail,
    });
  }

  if (participant.reminderCount >= 5) {
    throw new Error("This participant has already received 5 notifications.");
  }

  if (participant.lastReminderSent) {
    const elapsed = Date.now() - participant.lastReminderSent.getTime();
    if (elapsed < 24 * 60 * 60 * 1000) {
      throw new Error("This participant can only receive one notification per day.");
    }
  }

  const hostProfile = expenseSession.host.hostProfile;
  const provider = createNotificationService();

  const paidCount = expenseSession.participants.filter(
    (entry) => entry.paymentStatus === "PAID",
  ).length;
  const unpaidCount = expenseSession.participants.length - paidCount;
  const billSummary = formatBillSummary({
    totalAmount: String(expenseSession.totalAmount),
    currency: expenseSession.currency,
    participantCount: expenseSession.participants.length,
    paidCount,
    unpaidCount,
  });

  const result = await provider.send({
    hostId,
    sessionId: expenseSession.id,
    participantId: participant.id,
    participantName: participant.name,
    participantEmail: recipientEmail,
    sessionTitle: expenseSession.title,
    shareAmount: String(participant.shareAmount),
    billSummary,
    hostQrMimeType: hostProfile?.paymentQrImageMimeType ?? null,
    hostQrImageData: hostProfile?.paymentQrImageData ?? null,
  });

  await incrementParticipantReminder({
    participantId: participant.id,
    sentAt: new Date(),
  });

  return {
    message: result.message,
    provider: result.provider,
    status: result.status,
    qrImageAvailable: Boolean(hostProfile?.paymentQrImageData),
  };
}

export async function sendArchivedSessionReminder({
  participantEmail,
  participantName,
  sessionTitle,
  shareAmount,
  billSummary,
}: {
  participantEmail: string;
  participantName: string;
  sessionTitle: string;
  shareAmount: string;
  billSummary: string;
}) {
  const recipientEmail = participantEmail.trim().toLowerCase();

  if (!recipientEmail) {
    throw new Error("Please add the participant email before sending.");
  }

  return sendResendEmail({
    participantEmail: recipientEmail,
    participantName,
    sessionTitle,
    shareAmount,
    billSummary,
  });
}
