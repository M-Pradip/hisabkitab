"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ParticipantList from "@/components/ParticipantList";
import { useSessionState } from "@/lib/useSessionState";

export default function ParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id;
  const { session, status, error, updateSession } = useSessionState(sessionId);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen justify-center bg-[#f4efeb] px-4 py-5">
        <div className="w-full max-w-[500px] rounded-[28px] bg-white p-6 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
          Loading...
        </div>
      </main>
    );
  }

  if (status === "missing" || status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4efeb] px-4 py-5">
        <div className="w-full max-w-[500px] rounded-[28px] bg-white p-6 text-center shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
          <h1 className="text-3xl font-extrabold text-[#1d1d43]">Session not found</h1>
          <p className="mt-2 text-[#8e8ea7]">{error}</p>
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

  const addParticipant = async (name) => {
    await updateSession({
      type: "add_participant",
      name,
    });
  };

  const removeParticipant = async (participantId) => {
    await updateSession({
      type: "remove_participant",
      participantId,
    });
  };

  return (
    <main className="flex min-h-screen justify-center bg-[#f4efeb] px-4 py-5">
      <div className="w-full max-w-[500px]">
        <div className="mb-4 flex justify-end">
          <Link
            href="/"
            className="rounded-full border border-[#c7c7cc] bg-white px-4 py-2 text-sm font-semibold text-[#1c1c1e]"
          >
            Home
          </Link>
        </div>

        <ParticipantList
          participants={session?.participants || []}
          onAddParticipant={addParticipant}
          onRemoveParticipant={removeParticipant}
        />

        <button
          type="button"
          onClick={() => router.push(`/session/${sessionId}/items`)}
          className="mt-6 h-[68px] w-full rounded-[40px] bg-[#243b84] text-[22px] font-bold text-white"
        >
          Next →
        </button>
      </div>
    </main>
  );
}
