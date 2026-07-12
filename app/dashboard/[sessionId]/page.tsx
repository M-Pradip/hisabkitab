import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getSplitBillHistoryById } from "@/lib/queries/session-history";
import { formatMoney, formatRelativeTime } from "@/utils/format";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { sessionId } = await params;
  const history = await getSplitBillHistoryById(sessionId, session.user.id);

  if (!history) {
    notFound();
  }

  const snapshot = history.summary as {
    session?: {
      hostName?: string;
      sessionNote?: string;
      paymentProvider?: string;
      paymentMethod?: string;
      paymentQrImage?: string;
      paymentQrFileName?: string;
      closedAt?: string;
      participants?: Array<{
        id: string;
        name: string;
        role?: string;
      }>;
      items?: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }>;
    };
    totals?: {
      grandTotal?: number;
      unassignedTotal?: number;
      hasUnassigned?: boolean;
      unassignedItems?: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
      }>;
      participantTotals?: Array<{
        id: string;
        name: string;
        role?: string;
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
    metadata?: {
      itemCount?: number;
      participantCount?: number;
      savedAt?: string;
    };
  };

  const sessionData = snapshot.session || {};
  const totals = snapshot.totals || {};
  const title =
    history.title ||
    sessionData.sessionNote ||
    sessionData.hostName ||
    "Bill split session";
  const participantCount =
    snapshot.metadata?.participantCount ?? sessionData.participants?.length ?? 0;
  const itemCount = snapshot.metadata?.itemCount ?? sessionData.items?.length ?? 0;
  const grandTotal = totals.grandTotal ?? Number(history.totalAmount);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <Link href="/" className="inline-flex">
            <BrandMark compact />
          </Link>

          <Badge
            className={
              history.status === "CLOSED"
                ? "bg-emerald-100 text-emerald-900"
                : "bg-slate-100 text-slate-700"
            }
          >
            {history.status}
          </Badge>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Bill split summary
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {title}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
                  {sessionData.hostName
                    ? `Hosted by ${sessionData.hostName}`
                    : "Saved bill split summary from the legacy session flow."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Saved {formatRelativeTime(history.updatedAt)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {participantCount} participants
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {itemCount} items
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MiniStat
                label="Grand Total"
                value={formatMoney(grandTotal, history.currency)}
              />
              <MiniStat label="Participants" value={participantCount} />
              <MiniStat label="Items" value={itemCount} />
              <MiniStat
                label="Unassigned"
                value={totals.hasUnassigned ? totals.unassignedItems?.length ?? 0 : 0}
              />
            </div>

            {totals.hasUnassigned ? (
              <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Warning: {totals.unassignedItems?.length ?? 0} item
                {totals.unassignedItems?.length === 1 ? "" : "s"} were left
                unassigned.
              </div>
            ) : null}

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Participant shares
              </div>
              <div className="mt-4 space-y-3">
                {(totals.participantTotals || []).map((participant) => (
                  <div
                    key={participant.id}
                    className="rounded-[20px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
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
                      </div>
                      <div className="text-lg font-semibold text-slate-950">
                        {formatMoney(participant.total, history.currency)}
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
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Session details
              </div>
              <dl className="mt-4 space-y-4 text-sm">
                <Row label="Host" value={sessionData.hostName || history.hostName} />
                <Row label="Session note" value={sessionData.sessionNote || "Not provided"} />
                <Row
                  label="Payment method"
                  value={sessionData.paymentMethod || sessionData.paymentProvider || "Unknown"}
                />
                <Row
                  label="Closed at"
                  value={sessionData.closedAt ? formatRelativeTime(sessionData.closedAt) : "Saved only"}
                />
                <Row
                  label="Last saved"
                  value={formatRelativeTime(history.updatedAt)}
                />
              </dl>
            </Card>

            <Card>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                QR Preview
              </div>
              {sessionData.paymentQrImage ? (
                <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <Image
                    src={sessionData.paymentQrImage}
                    alt={sessionData.paymentQrFileName || "Payment QR"}
                    width={320}
                    height={320}
                    unoptimized
                    className="mx-auto max-h-[280px] w-full rounded-[18px] object-contain"
                  />
                  <p className="mt-3 text-center text-sm text-slate-600">
                    {sessionData.paymentQrFileName || "Uploaded QR"}
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No QR image was saved with this session.
                </div>
              )}
            </Card>

            <Card>
              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Items
              </div>
              <div className="mt-4 space-y-3">
                {(sessionData.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[18px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-950">{item.name}</div>
                      <div className="text-sm text-slate-600">
                        {item.quantity > 1 ? `${item.quantity}x ` : ""}
                        {formatMoney(item.price * item.quantity, history.currency)}
                      </div>
                    </div>
                  </div>
                ))}

                {(sessionData.items || []).length === 0 ? (
                  <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    No items were saved for this split.
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-950">{value}</dd>
    </div>
  );
}
