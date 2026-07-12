import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getSplitBillHistoryForHost } from "@/lib/queries/session-history";
import { getCurrentHost } from "@/lib/queries/users";
import { formatMoney, formatRelativeTime } from "@/utils/format";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [currentHost, sessions] = await Promise.all([
    getCurrentHost(session.user.id),
    getSplitBillHistoryForHost(session.user.id),
  ]);

  if (!currentHost) {
    redirect("/login");
  }

  const hostName = currentHost.hostProfile?.fullName ?? currentHost.name ?? "Host";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <Link href="/" className="inline-flex">
            <BrandMark compact />
          </Link>

          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Session history
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              Welcome, {hostName}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              These are the saved sessions created by this host account. Open any
              session to see the bill split summary, participants, reminders, and
              payment status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Home
            </Link>
            <Link href="/profile" className="inline-flex">
              <Badge className="bg-slate-100 text-slate-800">Edit profile</Badge>
            </Link>
            <LogoutButton />
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                History
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Your sessions
              </h2>
            </div>
            <Badge className="bg-slate-100 text-slate-800">
              {sessions.length} saved
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            {sessions.map((item) => {
              const summary = item.summary as {
                metadata?: {
                  itemCount?: number;
                  participantCount?: number;
                };
                totals?: {
                  grandTotal?: number;
                };
                session?: {
                  sessionNote?: string;
                  hostName?: string;
                };
              };
              const itemCount = summary?.metadata?.itemCount ?? 0;
              const participantCount = summary?.metadata?.participantCount ?? 0;
              const totalAmount = summary?.totals?.grandTotal ?? 0;
              const title =
                item.title ||
                summary?.session?.sessionNote ||
                summary?.session?.hostName ||
                "Bill split session";

              return (
                <Link
                  key={item.id}
                  href={`/dashboard/${item.id}`}
                  className="block rounded-[24px] border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">
                        {title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Saved {formatRelativeTime(item.updatedAt)}
                      </p>
                    </div>
                    <Badge
                      className={
                        item.status === "CLOSED"
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-slate-100 text-slate-700"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniStat
                      label="Total"
                      value={formatMoney(totalAmount, item.currency)}
                    />
                    <MiniStat label="Participants" value={participantCount} />
                    <MiniStat label="Items" value={itemCount} />
                  </div>
                </Link>
              );
            })}

            {sessions.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                No bill split history yet. When you press Split Bill or Close
                Session, the summary will appear here.
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </main>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}
