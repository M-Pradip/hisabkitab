"use client";

import DocumentScanner from "@/components/DocumentScanner";
import StepDots from "@/components/StepDots";
import { useSessionState } from "@/lib/useSessionState";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

function toSessionItems(items = []) {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price || 0),
    quantity:
      Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0
        ? Math.max(1, Math.round(Number(item.quantity)))
        : 1,
  }));
}

export default function ScanReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id;
  const { session, status, error, updateSession } = useSessionState(sessionId);

  const handleScanComplete = async (result) => {
    const nextItems = toSessionItems(result.items || []);

    await updateSession({
      type: "set_items",
      items: nextItems,
    });
  };

  if (status === "loading") {
    return (
      <main className="flex min-h-screen justify-center bg-[#dde2ed] px-5 py-6">
        <div className="w-full max-w-[430px] rounded-[36px] bg-[#f0f0f5] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          Loading...
        </div>
      </main>
    );
  }

  if (status === "missing" || status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#dde2ed] px-5 py-6">
        <div className="w-full max-w-[430px] rounded-[36px] bg-[#f0f0f5] p-5 text-center shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <h1 className="text-2xl font-bold text-[#1c1c1e]">
            Session not found
          </h1>
          <p className="mt-2 text-[#666]">{error}</p>
          <Link
            href="/"
            className="mt-5 inline-flex h-[52px] items-center justify-center rounded-[14px] bg-[#1c1c1e] px-6 text-sm font-semibold text-white"
          >
            Home
          </Link>
        </div>
      </main>
    );
  }

  const sessionTitle = session?.sessionNote || "Receipt scan";
  const participantCount = session?.participants?.length || 0;
  const itemCount = session?.items?.length || 0;
  const totalText = `Rs ${(
    session?.items?.reduce((sum, item) => sum + Number(item.price || 0), 0) || 0
  ).toLocaleString("en-IN")}`;

  return (
    <main className="flex min-h-screen justify-center bg-[#dde2ed] px-5 py-6">
      <div className="page">
        <div className="nav">
          <Link
            href="/"
            className="rounded-full border border-[#c7c7cc] bg-white px-4 py-2 text-sm font-semibold text-[#1c1c1e]"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => router.push(`/session/${sessionId}`)}
            className="nav-back"
          >
            {"<"}
          </button>
          <span className="nav-title">Scan Receipt</span>
        </div>

        <StepDots active={1} total={4} />

        <DocumentScanner
          onScanComplete={handleScanComplete}
          onContinue={() => router.push(`/session/${sessionId}`)}
          continueLabel="Continue to host details"
        />

        <div className="text-center text-xs text-[#9aa0b4]">
          {sessionTitle} - {itemCount} items - {participantCount} participants -{" "}
          {totalText}
        </div>
      </div>
    </main>
  );
}
