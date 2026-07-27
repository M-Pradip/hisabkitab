"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, formatRelativeTime } from "@/utils/format";

type ParticipantShareRow = {
  id: string;
  name: string;
  role?: string;
  total: number;
  items: Array<{
    id: string;
    name: string;
  }>;
};

type LiveParticipantRow = {
  id: string;
  email: string | null;
  paymentStatus: "PAID" | "UNPAID";
  reminderCount: number;
  lastReminderSent: string | null;
  paidAt: string | null;
};

export function ParticipantSharesClient({
  sessionId,
  currency,
  sessionTitle,
  billSummary,
  participantTotals,
  liveParticipants,
}: {
  sessionId: string;
  currency: string;
  sessionTitle: string;
  billSummary: string;
  participantTotals: ParticipantShareRow[];
  liveParticipants: LiveParticipantRow[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [sendingParticipantId, setSendingParticipantId] = useState<string | null>(
    null,
  );

  const liveParticipantMap = useMemo(
    () => new Map(liveParticipants.map((participant) => [participant.id, participant])),
    [liveParticipants],
  );

  async function sendReminder(
    event: FormEvent<HTMLFormElement>,
    participant: ParticipantShareRow,
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter the participant email before sending.",
        variant: "error",
      });
      return;
    }

    setSendingParticipantId(participant.id);

    try {
      const response = await fetch("/api/reminders/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          participantId: participant.id,
          participantName: participant.name,
          sessionTitle,
          shareAmount: participant.total.toFixed(2),
          billSummary,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to send reminder.");
      }

      toast({
        title: "Notification sent",
        description: data.message,
        variant: "success",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Notification failed",
        description:
          error instanceof Error ? error.message : "Failed to send reminder.",
        variant: "error",
      });
    } finally {
      setSendingParticipantId(null);
    }
  }

  return (
    <div className="space-y-3">
      {participantTotals.map((participant) => {
        const liveParticipant = liveParticipantMap.get(participant.id);
        const reminderCount = liveParticipant?.reminderCount ?? 0;
        const reminderDisabled =
          reminderCount >= 5 || sendingParticipantId === participant.id;

        return (
          <div
            key={participant.id}
            className="rounded-[20px] border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-slate-950">
                  {participant.name}
                  {participant.role === "host" ? (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-900">
                      Host
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {participant.items.length
                    ? `${participant.items.length} assigned item${participant.items.length === 1 ? "" : "s"}`
                    : "No assigned items"}
                </div>
                {liveParticipant ? (
                  <div className="mt-2 text-xs text-slate-500">
                    {reminderCount}/5 notifications
                    <span className="mx-2">-</span>
                    {formatRelativeTime(liveParticipant.lastReminderSent)}
                  </div>
                ) : null}
              </div>
              <div className="text-lg font-semibold text-slate-950">
                {formatMoney(participant.total, currency)}
              </div>
            </div>

            {participant.items.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {participant.items.map((item) => (
                  <span
                    key={`${participant.id}-${item.id}`}
                    className="rounded-full bg-white px-3 py-1 text-xs text-slate-700"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-4">
              <form
                className="space-y-2"
                onSubmit={(event) => sendReminder(event, participant)}
              >
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Participant email
                </label>
                <Input
                  name="email"
                  type="email"
                  defaultValue={liveParticipant?.email ?? ""}
                  placeholder="Enter participant email"
                  className="h-11"
                />
                <Button
                  type="submit"
                  className="w-full px-3 py-2 text-xs"
                  isLoading={sendingParticipantId === participant.id}
                  disabled={reminderDisabled}
                >
                  {reminderCount >= 5 ? "Limit reached" : "Send Notification"}
                </Button>
              </form>
            </div>

            {liveParticipant ? (
              <div className="mt-3 text-xs text-slate-500">
                Current status: {liveParticipant.paymentStatus}
                {liveParticipant.paidAt
                  ? ` - Paid ${formatRelativeTime(liveParticipant.paidAt)}`
                  : ""}
              </div>
            ) : null}

            {reminderCount >= 5 ? (
              <p className="mt-2 text-xs text-rose-600">
                Notification limit reached for this participant.
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
