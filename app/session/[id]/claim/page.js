"use client";

import { calculateSplits } from "@/lib/calculations";
import { useSessionState } from "@/lib/useSessionState";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function formatRs(value) {
  return `Rs ${Math.round(value || 0).toLocaleString("en-IN")}`;
}

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id;
  const { session, status, error, updateSession } = useSessionState(sessionId);
  const [selectedUserId, setSelectedUserId] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(`hk:viewer:${sessionId}`) || null;
  });
  const [screen, setScreen] = useState(() => {
    if (typeof window === "undefined") {
      return "who";
    }

    return window.localStorage.getItem(`hk:viewer:${sessionId}`)
      ? "claim"
      : "who";
  });
  const palette = ["#e63946", "#1c2f6e", "#2dc653", "#f4a728", "#7a2ea8"];

  const totals = useMemo(() => calculateSplits(session), [session]);
  const sessionTitle = session?.sessionNote || "Himalaya Kitchen";
  const totalBill = totals.grandTotal;
  const participantCount = session?.participants?.length || 0;
  const itemCount = session?.items?.length || 0;

  const currentUser = session?.participants?.find(
    (participant) => participant.id === selectedUserId,
  );

  const currentUserClaims = useMemo(() => {
    if (!currentUser) {
      return new Set();
    }

    return new Set(
      (session?.items || [])
        .filter((item) =>
          (session?.claims?.[item.id] || []).includes(currentUser.id),
        )
        .map((item) => item.id),
    );
  }, [currentUser, session]);

  const claimableItems = session?.items || [];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedViewerId = window.localStorage.getItem(`hk:viewer:${sessionId}`);
    const timer = window.setTimeout(() => {
      setSelectedUserId(savedViewerId);
      setScreen(savedViewerId ? "claim" : "who");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [sessionId]);

  const selectUser = (participant) => {
    setSelectedUserId(participant.id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`hk:viewer:${sessionId}`, participant.id);
    }
    setScreen("claim");
  };

  const toggleClaim = async (itemId) => {
    if (!currentUser) {
      return;
    }

    await updateSession({
      type: "toggle_claim",
      itemId,
      participantId: currentUser.id,
    });
  };

  const goToResults = () => {
    setScreen("split");
  };

  if (status === "loading") {
    return (
      <main className="flex min-h-screen justify-center bg-[#f5f0eb] px-5 py-5">
        <div className="app-shell">Loading...</div>
      </main>
    );
  }

  if (status === "missing" || status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f0eb] px-5 py-5">
        <div className="app-shell text-center">
          <h1 className="text-3xl font-bold text-[#1a1a2e]">
            Session not found
          </h1>
          <p className="mt-2 text-[#8e8ea0]">{error}</p>
          <Link
            href="/"
            className="mx-auto mt-5 inline-flex h-[52px] items-center justify-center rounded-full bg-[#243b84] px-6 text-sm font-semibold text-white"
          >
            Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f5f0eb] px-5 py-5">
      <div className="app-shell">
        {screen === "who" ? (
          <div className="screen active" id="screen-who">
            <div className="receipt-banner" style={{ marginTop: 8 }}>
              <Link
                href="/"
                className="mr-2 inline-flex h-10 items-center justify-center rounded-full border border-white/30 bg-white/10 px-4 text-xs font-semibold text-white"
              >
                Home
              </Link>
              <div className="receipt-icon">🧾</div>
              <div className="receipt-info">
                <div className="receipt-title">{sessionTitle}</div>
                <div className="receipt-meta">
                  {itemCount} items &middot; {participantCount} participants
                </div>
              </div>
              <div className="receipt-total">{formatRs(totalBill)}</div>
            </div>

            <div className="who-heading">Select Your Name</div>
            <div className="who-subheading">
              Choose the participant you want to control
            </div>

            <div className="who-grid">
              {session?.participants?.map((participant, index) => (
                <button
                  key={participant.id}
                  type="button"
                  onClick={() => selectUser(participant)}
                  className="who-card text-left"
                >
                  <div
                    className="who-avatar"
                    style={{ background: palette[index % palette.length] }}
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="who-name">
                    {participant.name}
                    {participant.role === "host" ? (
                      <span className="ml-2 rounded-full bg-[#e8f5e2] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3aaa6e]">
                        Host
                      </span>
                    ) : null}
                  </div>
                  <div className="who-arrow">→</div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => router.push(`/session/${sessionId}/items`)}
              className="mt-4 text-sm font-semibold text-[#243b84]"
            >
              Back to items
            </button>
          </div>
        ) : null}

        {screen === "claim" && currentUser ? (
          <div className="screen active" id="screen-claim">
            <div className="top-bar">
              <Link
                href="/"
                className="rounded-full border border-[#c7c7cc] bg-white px-4 py-2 text-xs font-semibold text-[#1a1a2e]"
              >
                Home
              </Link>
              <button
                type="button"
                className="back-btn"
                onClick={() => setScreen("who")}
              >
                ←
              </button>
              <span className="step-label">Claim Items</span>
              <div className="user-pill">
                <div className="pill-dot" style={{ background: palette[0] }} />
                {currentUser.name}
              </div>
            </div>

            <div className="receipt-banner">
              <div className="receipt-icon">🧾</div>
              <div className="receipt-info">
                <div className="receipt-title">{sessionTitle}</div>
                <div className="receipt-meta">
                  {itemCount} items &middot; {participantCount} participants
                </div>
              </div>
              <div className="receipt-total">{formatRs(totalBill)}</div>
            </div>

            <div
              className={`instruction ${currentUserClaims.size ? "hidden" : ""}`}
            >
              Tap items you consumed to claim them
            </div>

            <div
              className={`done-panel ${currentUserClaims.size ? "show" : ""}`}
            >
              ✅ Claim saved. Tap split bill when everyone is done.
            </div>

            {totals.hasUnassigned ? (
              <div className="mb-0 inline-flex rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">
                Unassigned items: {totals.unassignedItems.length}
              </div>
            ) : null}

            <div className="items-section">
              <div className="items-section-heading">What did you have?</div>
              <div className="items-grid">
                {claimableItems.map((item) => {
                  const selected = currentUserClaims.has(item.id);
                  const claimCount = (session?.claims?.[item.id] || []).length;
                  const claimantNames = (session?.claims?.[item.id] || [])
                    .map(
                      (participantId) =>
                        session?.participants?.find(
                          (participant) => participant.id === participantId,
                        )?.name,
                    )
                    .filter(Boolean);

                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => toggleClaim(item.id)}
                      className={`item-card ${selected ? "claimed" : ""}`}
                    >
                      <div className="item-emoji">🍽️</div>
                      <div className="item-body">
                        <div className="item-name">{item.name}</div>
                        <div className="item-qty-price">
                          {formatRs(item.price)} · claimed by {claimCount}{" "}
                          participant
                          {claimCount === 1 ? "" : "s"}
                        </div>
                        <div className="item-unit-price">
                          {claimantNames.length
                            ? claimantNames.join(", ")
                            : "No one claimed yet"}
                        </div>
                      </div>
                      <div className="item-right">
                        <div className="item-add-hint">
                          {selected ? "Selected" : "+ Add"}
                        </div>
                        <div className="item-check">{selected ? "✓" : ""}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ height: 16 }} />

            <button
              type="button"
              onClick={goToResults}
              className="btn btn-primary"
            >
              SPLIT BILL
            </button>
          </div>
        ) : null}

        {screen === "split" ? (
          <div className="screen active" id="screen-split">
            <div className="top-bar">
              <Link
                href="/"
                className="rounded-full border border-[#c7c7cc] bg-white px-4 py-2 text-xs font-semibold text-[#1a1a2e]"
              >
                Home
              </Link>
              <button
                type="button"
                className="back-btn"
                onClick={() => setScreen("claim")}
              >
                ←
              </button>
              <span className="step-label">Split Summary</span>
              <div className="user-pill">
                <div className="pill-dot" style={{ background: palette[0] }} />
                All participants
              </div>
            </div>

            <div className="split-header">
              <div className="split-restaurant">{sessionTitle}</div>
              <div className="split-total">{formatRs(totalBill)}</div>
              <div className="split-total-label">Grand Total</div>
            </div>

            <div className="split-list">
              {totals.participantTotals.map((participant, index) => (
                <div
                  className="split-row"
                  key={participant.id}
                  style={{ animationDelay: `${index * 0.06}s` }}
                >
                  <div className="item-emoji-sm">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="split-info">
                    <div className="split-person">
                      {participant.name}
                      {participant.role === "host" ? (
                        <span className="ml-2 rounded-full bg-[#e8f5e2] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3aaa6e]">
                          Host
                        </span>
                      ) : null}
                    </div>
                    <div className="split-items-list">
                      {participant.items.length
                        ? `${participant.items.length} item${participant.items.length === 1 ? "" : "s"}`
                        : "No assigned items"}
                    </div>
                  </div>
                  <div className="split-amount-col">
                    <div className="split-amount">
                      {formatRs(participant.total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totals.hasUnassigned ? (
              <div className="bill-note mb-4">
                <span style={{ color: "var(--muted)", fontSize: ".78rem" }}>
                  Warning: <b>{totals.unassignedItems.length}</b> unassigned
                  item
                  {totals.unassignedItems.length === 1 ? "" : "s"}.
                </span>
              </div>
            ) : null}

            <div className="bill-note">
              <span style={{ color: "var(--muted)", fontSize: ".78rem" }}>
                {session?.participants?.length || 0} participants ·{" "}
                {claimableItems.length} items
              </span>
            </div>

            <button
              type="button"
              className="btn btn-green"
              onClick={() =>
                alert(
                  `Split completed for ${sessionTitle}. All client views are synced.`,
                )
              }
            >
              Done
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
