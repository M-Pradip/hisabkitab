"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useSessionState } from "@/lib/useSessionState";
import {
  getPaymentProviderMeta,
  getPaymentProviderLabel,
  normalizePaymentProvider,
  PAYMENT_PROVIDER_OPTIONS,
  PAYMENT_PROVIDER_VALUES,
} from "@/lib/paymentOptions";

function PaymentPreview({ provider, qrImage, qrFileName }) {
  const meta = getPaymentProviderMeta(provider);

  return (
    <div className="rounded-[28px] border border-[#e8e1dc] bg-[#faf8f7] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold tracking-[2px] text-[#8f8fa5]">
            PAYMENT PREVIEW
          </p>
          <h2 className="mt-2 text-[22px] font-extrabold text-[#1c1c40]">
            {meta.label}
          </h2>
          <p className="mt-2 max-w-[24rem] text-[15px] leading-7 text-[#6f6f86]">
            {meta.description}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
          style={{ background: meta.accent }}
        >
          Live
        </span>
      </div>

      {qrImage ? (
        <div className="mt-5 overflow-hidden rounded-[24px] border border-[#e8e1dc] bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-[2px] text-[#8f8fa5]">
                QR UPLOADED
              </p>
              <p className="mt-1 text-[15px] font-semibold text-[#1c1c40]">
                {qrFileName || `${meta.label} QR`}
              </p>
            </div>
            <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-[11px] font-semibold text-[#243b84]">
              {meta.label}
            </span>
          </div>

          <div className="mt-4 flex justify-center rounded-[22px] bg-[#faf8f7] p-4">
            <Image
              src={qrImage}
              alt={`${meta.label} QR code preview`}
              width={320}
              height={320}
              unoptimized
              className="max-h-[300px] w-full max-w-[320px] rounded-[18px] object-contain"
            />
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-[24px] border border-dashed border-[#d8d3cf] bg-white p-5 text-center">
          <div className="text-[16px] font-semibold text-[#1c1c40]">
            No QR uploaded yet
          </div>
          <p className="mt-2 text-[14px] leading-7 text-[#6f6f86]">
            Upload a QR image so participants can scan and pay with{" "}
            {meta.label}.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id;
  const { session, status, error, updateSession } = useSessionState(sessionId);
  const [hostName, setHostName] = useState("");
  const [sessionNote, setSessionNote] = useState("");
  const [paymentProvider, setPaymentProvider] = useState("");
  const [paymentQrImage, setPaymentQrImage] = useState(undefined);
  const [paymentQrFileName, setPaymentQrFileName] = useState(undefined);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [saving, setSaving] = useState(false);
  const qrInputRef = useRef(null);

  const hostParticipant = session?.participants?.find(
    (participant) => participant.role === "host",
  );
  const activeHostName = hostName || session?.hostName || "";
  const activeSessionNote = sessionNote || session?.sessionNote || "";
  const sessionPaymentProvider = normalizePaymentProvider(
    session?.paymentProvider || session?.paymentMethod,
  );
  const activePaymentProvider = PAYMENT_PROVIDER_VALUES.includes(paymentProvider)
    ? paymentProvider
    : sessionPaymentProvider;
  const activePaymentMeta = getPaymentProviderMeta(activePaymentProvider);
  const activePaymentQrImage =
    paymentQrImage !== undefined ? paymentQrImage : session?.paymentQrImage || "";
  const activePaymentQrFileName =
    paymentQrFileName !== undefined
      ? paymentQrFileName
      : session?.paymentQrFileName || "";
  const selectValue = PAYMENT_PROVIDER_VALUES.includes(activePaymentProvider)
    ? activePaymentProvider
    : PAYMENT_PROVIDER_VALUES[0];

  const handleQrUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    setUploadingQr(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("provider", activePaymentProvider);

      const response = await fetch(`/api/session/${sessionId}/qr`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to upload QR.");
      }

      setPaymentQrImage(data?.session?.paymentQrImage || "");
      setPaymentQrFileName(data?.session?.paymentQrFileName || file.name);
      setPaymentProvider(data?.session?.paymentProvider || activePaymentProvider);
    } catch (error) {
      console.error(error);
    } finally {
      setUploadingQr(false);
      event.target.value = "";
    }
  };

  const clearQrUpload = async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}/qr`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to remove QR.");
      }

      setPaymentQrImage(undefined);
      setPaymentQrFileName(undefined);
      setPaymentProvider(data?.session?.paymentProvider || activePaymentProvider);
    } catch (error) {
      console.error(error);
    }

    if (qrInputRef.current) {
      qrInputRef.current.value = "";
    }
  };

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
        paymentProvider: activePaymentProvider,
        paymentMethod: getPaymentProviderLabel(activePaymentProvider),
      });

      const host = nextSession?.participants?.find(
        (participant) => participant.role === "host",
      );

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
          <h1 className="text-3xl font-extrabold text-[#1c1c40]">
            Session not found
          </h1>
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
        <p className="mb-[30px] text-[20px] text-[#9090a8]">
          Who&apos;s hosting and how should people pay?
        </p>

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
            PAYMENT PROVIDER
          </label>

          <div className="rounded-[22px] border-[3px] border-[#ddd7d3] bg-[#faf8f7] p-4">
            <select
              value={selectValue}
              onChange={(event) => setPaymentProvider(event.target.value)}
              className="h-[60px] w-full rounded-[18px] border border-[#e6e5f3] bg-white px-4 text-[18px] font-semibold text-[#1c1c40] outline-none"
            >
              {PAYMENT_PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-3 text-[14px] leading-7 text-[#6f6f86]">
              Choose the wallet or QR rail you want participants to use.
            </p>
          </div>
        </div>

        <div className="mb-[25px] rounded-[28px] bg-white p-6 shadow-[0_5px_15px_rgba(0,0,0,0.04)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="block text-[15px] font-bold tracking-[2px] text-[#8f8fa5]">
              UPLOAD QR
            </label>
            {activePaymentQrImage ? (
              <button
                type="button"
                onClick={clearQrUpload}
                className="rounded-full border border-[#ddd7d3] bg-[#faf8f7] px-3 py-1 text-[12px] font-semibold text-[#1c1c40]"
              >
                Remove
              </button>
            ) : null}
          </div>

          <label className="block cursor-pointer rounded-[24px] border-2 border-dashed border-[#d8d3cf] bg-[#faf8f7] p-4 text-center transition hover:border-[#243b84]">
            <input
              ref={qrInputRef}
              type="file"
              accept="image/*"
              disabled={uploadingQr}
              onChange={handleQrUpload}
              className="hidden"
            />

            {activePaymentQrImage ? (
              <div className="space-y-4">
                <Image
                  src={activePaymentQrImage}
                  alt={`${activePaymentMeta.label} QR preview`}
                  width={320}
                  height={320}
                  unoptimized
                  className="mx-auto max-h-[240px] rounded-[18px] object-contain"
                />
                <div className="text-[14px] font-semibold text-[#1c1c40]">
                  {activePaymentQrFileName || `${activePaymentMeta.label} QR`}
                </div>
              </div>
            ) : (
              <div className="py-8">
                <div className="text-[18px] font-bold text-[#1c1c40]">
                  {uploadingQr ? "Uploading QR..." : "Tap to upload QR"}
                </div>
                <p className="mt-2 text-[14px] leading-7 text-[#6f6f86]">
                  Upload the QR image for {activePaymentMeta.label} so
                  participants can scan it from the payment screen.
                </p>
              </div>
            )}
          </label>
        </div>

        <PaymentPreview
          provider={activePaymentProvider}
          qrImage={activePaymentQrImage}
          qrFileName={activePaymentQrFileName}
        />

        <div className="mt-6 rounded-[22px] border border-[#e8e1dc] bg-[#faf8f7] px-5 py-4 text-[14px] leading-7 text-[#6f6f86]">
          {sessionPaymentProvider === "cash"
            ? "This session started with Cash. Select a QR provider above to switch to digital payment."
            : "Participants will see this payment method and the uploaded QR on their side of the session."}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="mt-6 h-[78px] w-full rounded-[40px] bg-[#243b84] text-[24px] font-bold text-white"
          disabled={saving}
        >
          {saving ? "Saving..." : "Next →"}
        </button>
      </div>
    </main>
  );
}
