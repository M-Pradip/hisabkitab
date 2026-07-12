"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { setParticipantPaymentStatusAction } from "@/actions/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/hooks/use-toast";
import { buildReminderMessage } from "@/utils/reminder-message";
import { formatMoney, formatPhoneNumber, formatRelativeTime, getInitials } from "@/utils/format";

type ParticipantRow = {
  id: string;
  name: string;
  phoneNumber: string | null;
  shareAmount: string;
  paymentStatus: "PAID" | "UNPAID";
  reminderCount: number;
  lastReminderSent: string | null;
  paidAt: string | null;
};

type ReminderRow = {
  id: string;
  participantName: string;
  provider: string;
  status: string;
  message: string;
  createdAt: string;
};

export function SessionDashboardClient({
  sessionId,
  sessionTitle,
  sessionDescription,
  totalAmount,
  currency,
  participantCount,
  paidCount,
  unpaidCount,
  participants,
  reminderLogs,
  qrImageAvailable,
}: {
  sessionId: string;
  sessionTitle: string;
  sessionDescription?: string | null;
  totalAmount: string;
  currency: string;
  participantCount: number;
  paidCount: number;
  unpaidCount: number;
  participants: ParticipantRow[];
  reminderLogs: ReminderRow[];
  qrImageAvailable: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedParticipant, setSelectedParticipant] =
    useState<ParticipantRow | null>(null);
  const [sending, setSending] = useState(false);

  const filteredParticipants = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return participants;
    }

    return participants.filter((participant) => {
      return (
        participant.name.toLowerCase().includes(query) ||
        participant.phoneNumber?.toLowerCase().includes(query)
      );
    });
  }, [participants, search]);

  const billSummary = useMemo(() => {
    return [
      `Total: ${currency} ${totalAmount}`,
      `Members: ${participantCount}`,
      `Paid: ${paidCount}`,
      `Unpaid: ${unpaidCount}`,
    ].join(" | ");
  }, [currency, totalAmount, participantCount, paidCount, unpaidCount]);

  const outstandingBalance = useMemo(() => {
    const total = filteredParticipants.reduce((sum, participant) => {
      return participant.paymentStatus === "UNPAID"
        ? sum + Number(participant.shareAmount)
        : sum;
    }, 0);

    return formatMoney(total, currency);
  }, [currency, filteredParticipants]);

  const collectedAmount = useMemo(() => {
    const total = filteredParticipants.reduce((sum, participant) => {
      return participant.paymentStatus === "PAID"
        ? sum + Number(participant.shareAmount)
        : sum;
    }, 0);

    return formatMoney(total, currency);
  }, [currency, filteredParticipants]);

  async function sendReminder() {
    if (!selectedParticipant) {
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/reminders/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          participantId: selectedParticipant.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to send reminder.");
      }

      toast({
        title: "Reminder queued",
        description: data.message,
        variant: "success",
      });

      setSelectedParticipant(null);
      router.refresh();
    } catch (error) {
      toast({
        title: "Reminder failed",
        description:
          error instanceof Error ? error.message : "Failed to send reminder.",
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Members" value={participantCount} />
        <StatCard
          label="Paid Members"
          value={paidCount}
          tone="emerald"
        />
        <StatCard label="Unpaid Members" value={unpaidCount} tone="amber" />
        <StatCard
          label="Outstanding Balance"
          value={outstandingBalance}
          tone="rose"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Collected Amount"
          value={collectedAmount}
          tone="sky"
        />
        <StatCard
          label="Reminder Sent"
          value={participants.filter((participant) => participant.reminderCount > 0).length}
          tone="slate"
        />
        <StatCard
          label="QR Status"
          value={qrImageAvailable ? "Available" : "Missing"}
          tone={qrImageAvailable ? "emerald" : "rose"}
        />
        <StatCard label="Session" value={sessionTitle} tone="violet" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Participants
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Search, mark payment, and send reminders from a single place.
              </p>
            </div>
            <div className="w-full max-w-sm">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or phone"
              />
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
            <div className="grid grid-cols-[1.2fr_0.9fr_0.7fr_0.8fr_0.8fr_1.2fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <div>Participant</div>
              <div>Phone</div>
              <div>Amount Due</div>
              <div>Status</div>
              <div>Reminders</div>
              <div>Actions</div>
            </div>

            <div className="divide-y divide-slate-100 bg-white">
              {filteredParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="grid grid-cols-[1.2fr_0.9fr_0.7fr_0.8fr_0.8fr_1.2fr] items-center gap-3 px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                      {getInitials(participant.name)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">
                        {participant.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {participant.paidAt ? `Paid ${formatRelativeTime(participant.paidAt)}` : "Awaiting payment"}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-slate-700">
                    {formatPhoneNumber(participant.phoneNumber)}
                  </div>

                  <div className="text-sm font-semibold text-slate-900">
                    {formatMoney(participant.shareAmount, currency)}
                  </div>

                  <div>
                    <Badge
                      className={
                        participant.paymentStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-amber-100 text-amber-900"
                      }
                    >
                      {participant.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>

                  <div className="text-sm text-slate-700">
                    {participant.reminderCount}{" "}
                    <span className="text-slate-500">
                      {participant.reminderCount === 1 ? "reminder" : "reminders"}
                    </span>
                    <div className="text-xs text-slate-500">
                      {formatRelativeTime(participant.lastReminderSent)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <form action={setParticipantPaymentStatusAction}>
                      <input type="hidden" name="sessionId" value={sessionId} />
                      <input type="hidden" name="participantId" value={participant.id} />
                      <input type="hidden" name="paymentStatus" value="PAID" />
                      <Button type="submit" variant="secondary" className="px-3 py-2 text-xs">
                        Mark Paid
                      </Button>
                    </form>
                    <form action={setParticipantPaymentStatusAction}>
                      <input type="hidden" name="sessionId" value={sessionId} />
                      <input type="hidden" name="participantId" value={participant.id} />
                      <input type="hidden" name="paymentStatus" value="UNPAID" />
                      <Button type="submit" variant="secondary" className="px-3 py-2 text-xs">
                        Mark Unpaid
                      </Button>
                    </form>
                    <Button
                      type="button"
                      className="px-3 py-2 text-xs"
                      onClick={() => setSelectedParticipant(participant)}
                    >
                      Send Reminder
                    </Button>
                  </div>
                </div>
              ))}

              {filteredParticipants.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No participants match your search.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-900">Reminder history</h2>
            <div className="mt-4 space-y-4">
              {reminderLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-900">
                      {log.participantName}
                    </div>
                    <Badge className="bg-slate-100 text-slate-700">{log.provider}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">{log.message}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    {log.status} • {formatRelativeTime(log.createdAt)}
                  </div>
                </div>
              ))}

              {reminderLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                  No reminders have been sent yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-300">
              Summary
            </div>
            <div className="mt-4 text-lg font-semibold">{sessionTitle}</div>
            {sessionDescription ? (
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {sessionDescription}
              </p>
            ) : null}
            <div className="mt-4 text-sm text-slate-200">
              Outstanding reminder preview will show the payment QR before send.
            </div>
          </div>
        </div>
      </section>

      <Modal
        open={Boolean(selectedParticipant)}
        title={
          selectedParticipant
            ? `Send reminder to ${selectedParticipant.name}`
            : "Send reminder"
        }
        description="Review the reminder message and QR preview before confirming."
        onClose={() => setSelectedParticipant(null)}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setSelectedParticipant(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={sendReminder} isLoading={sending}>
              Confirm send
            </Button>
          </>
        }
      >
        {selectedParticipant ? (
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Preview
                </div>
                <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {buildReminderMessage({
                    participantName: selectedParticipant.name,
                    sessionTitle,
                    shareAmount: selectedParticipant.shareAmount,
                    billSummary,
                  })}
                </pre>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Payment QR
                </div>
                {qrImageAvailable ? (
                  <img
                    src="/api/host/profile/qr"
                    alt="Host payment QR"
                    className="mt-3 aspect-square w-full rounded-3xl border border-slate-200 bg-white object-contain p-3"
                  />
                ) : (
                  <div className="mt-3 flex aspect-square w-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                    No QR image available
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "emerald" | "amber" | "rose" | "sky" | "slate" | "violet";
}) {
  const toneClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-900 border-emerald-100",
    amber: "bg-amber-50 text-amber-900 border-amber-100",
    rose: "bg-rose-50 text-rose-900 border-rose-100",
    sky: "bg-sky-50 text-sky-900 border-sky-100",
    slate: "bg-slate-50 text-slate-900 border-slate-200",
    violet: "bg-violet-50 text-violet-900 border-violet-100",
  };

  return (
    <div className={`rounded-[28px] border p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] ${toneClasses[tone]}`}>
      <div className="text-sm font-medium opacity-70">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
