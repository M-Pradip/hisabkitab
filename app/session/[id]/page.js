"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSessionState } from "@/lib/useSessionState";

function PaymentOption({ active, label, accent, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-[18px] flex items-center justify-between rounded-[22px] border-[4px] px-[22px] py-[22px] text-left transition ${
        active ? "border-[#243b84]" : "border-[#d8d3cf]"
      }`}
    >
      <span className="flex items-center gap-4">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-[14px] text-2xl font-bold text-white"
          style={{ background: accent }}
        >
          {icon}
        </span>
        <span className="text-[20px] font-bold text-[#1c1c40]">{label}</span>
      </span>

      <span
        className={`flex h-[42px] w-[42px] items-center justify-center rounded-full border-[4px] ${
          active ? "border-[#243b84] bg-[#243b84]" : "border-[#d8d3cf]"
        }`}
      >
        {active ? <span className="text-[24px] font-bold text-white">✓</span> : null}
      </span>
    </button>
  );
}

export default function SessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id;
  const { session, status, error, updateSession } = useSessionState(sessionId);
  const [hostName, setHostName] = useState("");
  const [sessionNote, setSessionNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [saving, setSaving] = useState(false);

  const paymentSummary = useMemo(
    () => ({
      eSewa: { accent: "#5bbd3e", icon: "e" },
      Khalti: { accent: "#7a2ea8", icon: "K" },
      Cash: { accent: "#243b84", icon: "$" },
    }),
    []
  );

  const hostParticipant = session?.participants?.find((participant) => participant.role === "host");
  const activeHostName = hostName || session?.hostName || "";
  const activeSessionNote = sessionNote || session?.sessionNote || "";
  const activePaymentMethod = paymentMethod || session?.paymentMethod || "eSewa";

  const handleNext = async () => {
    const nextName = hostName.trim();

    if (!nextName) {
      return;
    }

    setSaving(true);

    try {
      const nextSession = await updateSession({
        type: "set_host",
        hostName: nextName,
        sessionNote: activeSessionNote,
        paymentMethod: activePaymentMethod,
      });

      const host = nextSession?.participants?.find((participant) => participant.role === "host");

      if (host && typeof window !== "undefined") {
        window.localStorage.setItem(`hk:viewer:${sessionId}`, host.id);
      }

      router.push(`/session/${sessionId}/participants`);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="flex min-h-screen justify-center bg-[#f4efeb] px-5 py-5">
        <div className="w-full max-w-[430px] rounded-[28px] bg-white p-8 shadow-[0_5px_15px_rgba(0,0,0,0.04)]">
          Loading...
        </div>
      </main>
    );
  }

  if (status === "missing" || status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4efeb] px-5 py-5">
        <div className="w-full max-w-[430px] rounded-[28px] bg-white p-8 text-center shadow-[0_5px_15px_rgba(0,0,0,0.04)]">
          <h1 className="text-3xl font-extrabold text-[#1c1c40]">Session not found</h1>
          <p className="mt-3 text-[#8e8ea7]">{error}</p>
          <Link
            href="/"
            className="mt-5 inline-flex h-[52px] items-center justify-center rounded-full bg-[#243b84] px-6 text-sm font-semibold text-white"
          >
            Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f4efeb] px-5 py-5">
      <div className="w-full max-w-[430px]">
        <div className="mb-4 flex justify-end">
          <Link
            href="/"
            className="rounded-full border border-[#c7c7cc] bg-white px-4 py-2 text-sm font-semibold text-[#1c1c1e]"
          >
            Home
          </Link>
        </div>

        <h1 className="mb-2 text-[48px] font-extrabold leading-none text-[#1c1c40]">
          Session Details
        </h1>
        <p className="mb-[30px] text-[20px] text-[#9090a8]">Who&apos;s hosting and how to pay?</p>

        <div className="mb-[25px] rounded-[28px] bg-white p-6 shadow-[0_5px_15px_rgba(0,0,0,0.04)]">
          <label className="mb-3 block text-[15px] font-bold tracking-[2px] text-[#8f8fa5]">
            HOST NAME
          </label>
            <input
              type="text"
              value={activeHostName}
              onChange={(event) => setHostName(event.target.value)}
              placeholder={hostParticipant?.name || "Your name"}
              className="mb-6 h-[72px] w-full rounded-[22px] border-[3px] border-[#ddd7d3] bg-[#faf8f7] px-6 text-[22px] outline-none"
            />

          <label className="mb-3 block text-[15px] font-bold tracking-[2px] text-[#8f8fa5]">
            SESSION NOTE <span className="font-medium tracking-normal">(optional)</span>
          </label>
            <input
              type="text"
              value={activeSessionNote}
              onChange={(event) => setSessionNote(event.target.value)}
              placeholder="e.g. Himalaya Kitchen dinner"
              className="h-[72px] w-full rounded-[22px] border-[3px] border-[#ddd7d3] bg-[#faf8f7] px-6 text-[22px] outline-none"
            />
        </div>

        <div className="mb-[25px] rounded-[28px] bg-white p-6 shadow-[0_5px_15px_rgba(0,0,0,0.04)]">
          <label className="mb-3 block text-[15px] font-bold tracking-[2px] text-[#8f8fa5]">
            PAYMENT METHOD
          </label>

          <div className="space-y-0">
            <PaymentOption
              active={activePaymentMethod === "eSewa"}
              label="eSewa"
              accent={paymentSummary.eSewa.accent}
              icon={paymentSummary.eSewa.icon}
              onClick={() => setPaymentMethod("eSewa")}
            />
            <PaymentOption
              active={activePaymentMethod === "Khalti"}
              label="Khalti"
              accent={paymentSummary.Khalti.accent}
              icon={paymentSummary.Khalti.icon}
              onClick={() => setPaymentMethod("Khalti")}
            />
            <PaymentOption
              active={activePaymentMethod === "Cash"}
              label="Cash"
              accent={paymentSummary.Cash.accent}
              icon={paymentSummary.Cash.icon}
              onClick={() => setPaymentMethod("Cash")}
            />
          </div>
        </div>

        <div className="mb-[25px] rounded-[28px] bg-white p-6 shadow-[0_5px_15px_rgba(0,0,0,0.04)]">
          <label className="mb-3 block text-[15px] font-bold tracking-[2px] text-[#8f8fa5]">
            PARTICIPANTS
          </label>
          <div className="rounded-[22px] border-[3px] border-[#ddd7d3] bg-[#faf8f7] px-5 py-4 text-[18px] text-[#7d7d95]">
            {hostName.trim() ? `${hostName.trim()} (Host)` : "Host will be added here automatically"}
          </div>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="mt-2 h-[78px] w-full rounded-[40px] bg-[#243b84] text-[24px] font-bold text-white"
          disabled={saving}
        >
          {saving ? "Saving..." : "Next →"}
        </button>
      </div>
    </main>
  );
}
