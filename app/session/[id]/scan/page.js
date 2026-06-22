"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSessionState } from "@/lib/useSessionState";
import StepDots from "@/components/StepDots";
import ItemList from "@/components/ItemList";

export default function ScanReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id;
  const { session, status, error } = useSessionState(sessionId);

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
          <h1 className="text-2xl font-bold text-[#1c1c1e]">Session not found</h1>
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

  const sessionTitle = session?.sessionNote || "Himalaya Kitchen";
  const participantCount = session?.participants?.length || 4;
  const itemCount = session?.items?.length || 5;
  const totalText = `Rs ${(
    session?.items?.reduce((sum, item) => sum + (Number(item.price || 0) * (Number(item.quantity) || 1)), 0) || 2558
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
            ←
          </button>
          <span className="nav-title">Scan Receipt</span>
        </div>

        <StepDots active={1} total={4} />

        <div className="upload-card">
          <div className="upload-icon">📄</div>
          <div className="upload-title">Take or upload a photo</div>
          <div className="upload-sub">
            Place receipt on a flat surface for
            <br />
            best results
          </div>

          <div className="upload-btns">
            <button type="button" className="btn-upload btn-camera">
              📷 Camera
            </button>
            <button type="button" className="btn-upload btn-gallery">
              🖼️ Gallery
            </button>
          </div>
        </div>

        <div className="scan-card">
          <div className="scan-row">
            <span className="scan-dot" />
            <span className="scan-text">AI scanning receipt...</span>
          </div>

          <div className="progress-track">
            <div className="progress-fill" />
          </div>

          <div className="scan-sub">Extracting items, prices, taxes...</div>
        </div>

        <div className="extracted-header">
          <span className="extracted-label">Extracted Items</span>
          <span className="badge-found">{itemCount + 1} items found</span>
        </div>

        <ItemList
          items={
            session?.items?.length
              ? session.items
              : [
                { id: 1, name: "Momo (Veg) x 2", price: 360 },
                { id: 2, name: "Dal Bhat Set x 3", price: 720 },
                { id: 3, name: "Chowmein x 1", price: 180 },
                { id: 4, name: "Cold Drinks x 4", price: 320 },
                { id: 5, name: "Beer x 2", price: 500 },
                { id: 6, name: "Service (10%)", price: 208 },
                { id: 7, name: "VAT (13%)", price: 270 },
                { id: 8, name: "Total", price: 2558 },
              ]
          }
        />

        <div className="cta-wrap">
          <button
            type="button"
            onClick={() => router.push(`/session/${sessionId}/participants`)}
            className="btn-cta"
          >
            Looks good - Continue
            <span className="cta-arrow">→</span>
          </button>
        </div>

        <div className="text-center text-xs text-[#9aa0b4]">
          {sessionTitle} · {itemCount} items · {participantCount} participants · {totalText}
        </div>
      </div>
    </main>
  );
}
