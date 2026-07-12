"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { createExpenseSession } from "@/lib/queries/sessions";
import { getExpenseSessionById } from "@/lib/queries/sessions";
import {
  createParticipant,
  updateParticipantPaymentStatus,
} from "@/lib/queries/participants";
import { createExpenseSessionSchema, participantStatusSchema } from "@/lib/validators";

export type SessionActionState = {
  error?: string;
  success?: string;
};

export async function addParticipantAction(
  _previousState: SessionActionState,
  formData: FormData,
): Promise<SessionActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "You must be signed in to add participants." };
  }

  const sessionId = String(formData.get("sessionId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
  const shareAmount = Number(formData.get("shareAmount"));

  if (!sessionId || !name || !Number.isFinite(shareAmount) || shareAmount <= 0) {
    return { error: "Please complete the participant form." };
  }

  const expenseSession = await getExpenseSessionById(sessionId, session.user.id);

  if (!expenseSession) {
    return { error: "Session not found or access denied." };
  }

  await createParticipant({
    sessionId,
    name,
    phoneNumber: phoneNumber || null,
    shareAmount,
  });

  revalidatePath(`/dashboard/${sessionId}`);
  revalidatePath("/dashboard");

  return {
    success: "Participant added successfully.",
  };
}

export async function createSessionAction(
  _previousState: SessionActionState,
  formData: FormData,
): Promise<SessionActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "You must be signed in to create a session." };
  }

  const parsed = createExpenseSessionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    totalAmount: formData.get("totalAmount"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the session form.",
    };
  }

  const created = await createExpenseSession({
    hostId: session.user.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    totalAmount: parsed.data.totalAmount,
    currency: parsed.data.currency,
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/${created.id}`);
}

export async function setParticipantPaymentStatusAction(
  formData: FormData,
): Promise<void> {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  const parsed = participantStatusSchema.safeParse({
    sessionId: formData.get("sessionId"),
    participantId: formData.get("participantId"),
    paymentStatus: formData.get("paymentStatus"),
  });

  if (!parsed.success) {
    return;
  }

  const sessionId = parsed.data.sessionId;
  const expenseSession = await getExpenseSessionById(sessionId, session.user.id);

  if (!expenseSession) {
    return;
  }

  const participant = expenseSession.participants.find(
    (entry) => entry.id === parsed.data.participantId,
  );

  if (!participant) {
    return;
  }

  await updateParticipantPaymentStatus({
    participantId: parsed.data.participantId,
    paymentStatus: parsed.data.paymentStatus,
  });

  revalidatePath(`/dashboard/${sessionId}`);
  revalidatePath("/dashboard");

  return;
}
