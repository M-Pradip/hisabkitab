"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearSessionViewerState } from "@/lib/sessionStorage";

function BrandMark() {
  return (
    <div className="mb-[30px] text-center">
      <div className="mx-auto mb-4 flex h-[120px] w-[120px] items-center justify-center rounded-[30px] bg-[#f5f3ff] shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <svg viewBox="0 0 120 120" className="h-[88px] w-[88px]" aria-hidden="true">
          <rect x="28" y="18" width="60" height="72" rx="10" fill="#2d2b84" />
          <rect x="48" y="26" width="40" height="54" rx="8" fill="#f4c542" />
          <rect x="33" y="33" width="20" height="6" rx="3" fill="#ffffff" opacity="0.95" />
          <rect x="33" y="45" width="20" height="6" rx="3" fill="#ffffff" opacity="0.95" />
          <rect x="33" y="57" width="20" height="6" rx="3" fill="#ffffff" opacity="0.95" />
          <circle cx="57" cy="41" r="3.5" fill="#fff" />
          <circle cx="67" cy="41" r="3.5" fill="#fff" />
          <circle cx="77" cy="41" r="3.5" fill="#fff" />
          <circle cx="57" cy="53" r="3.5" fill="#fff" />
          <circle cx="67" cy="53" r="3.5" fill="#fff" />
          <circle cx="77" cy="53" r="3.5" fill="#fff" />
          <circle cx="57" cy="65" r="3.5" fill="#fff" />
          <circle cx="67" cy="65" r="3.5" fill="#fff" />
          <circle cx="77" cy="65" r="3.5" fill="#fff" />
        </svg>
      </div>
      <div className="text-[28px] font-semibold leading-none tracking-tight">
        <span className="text-[#2d2b84]">hisab</span>{" "}
        <span className="text-[#f4b000]">kitab</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);

  const createSession = async () => {
    setCreating(true);

    try {
      const response = await fetch("/api/session/create", {
        method: "POST",
      });

      const data = await response.json();
      clearSessionViewerState();
      router.replace(`/session/${data.session.id}`);
    } finally {
      setCreating(false);
    }
  };

  const joinSession = () => {
    const nextCode = code.trim();

    if (!nextCode) {
      return;
    }

    router.push(`/session/${nextCode}/claim`);
  };

  return (
    <main className="min-h-screen bg-[#d9c0b8] px-5 py-5">
      <div className="flex min-h-[calc(100vh-40px)] items-center justify-center">
        <section className="w-full max-w-[430px] rounded-[28px] bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <BrandMark />

          <p className="mb-[15px] text-[12px] font-semibold tracking-[2px] text-[#9c99c8]">
            FAIR SPLITS, ZERO DRAMA
          </p>

          <h1 className="mb-5 text-[1.9rem] font-extrabold leading-[1.1] text-[#171739] md:text-[3rem]">
            Split the bill,
            <br />
            not the friendship.
          </h1>

          <p className="mb-[30px] text-[1rem] leading-[1.8] text-[#595a7b] md:text-[1.1rem]">
            Scan your receipt, assign items, and settle up - no account needed.
          </p>

          <button
            type="button"
            onClick={createSession}
            className="mb-[18px] flex h-[68px] w-full items-center justify-center gap-3 rounded-[18px] bg-[#2d2b84] px-5 text-[1rem] font-bold text-white md:h-[72px] md:text-[1.2rem]"
          >
            <span className="text-[1.1em]">+</span>
            {creating ? "Creating..." : "Scan a Receipt"}
          </button>

          <button
            type="button"
            onClick={createSession}
            className="mb-[28px] flex h-[68px] w-full items-center justify-center gap-3 rounded-[18px] border-2 border-[#eceaf9] bg-white px-5 text-[1rem] font-bold text-[#2d2b84] md:h-[72px] md:text-[1.2rem]"
          >
            <span className="text-[1.1em]">+</span>
            Create a Session
          </button>

          <div className="mb-[28px] flex items-center text-center text-[#9b9bb7]">
            <span className="flex-1 border-b border-[#e8e8f3]" />
            <span className="px-3">or enter a code</span>
            <span className="flex-1 border-b border-[#e8e8f3]" />
          </div>

          <div className="flex gap-[14px] max-md:flex-col">
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Session code e.g. HK-A4F9"
              className="h-[56px] min-w-0 flex-1 rounded-[16px] border border-[#e6e5f3] bg-[#f7f6fd] px-4 text-base outline-none md:h-[60px]"
            />
            <button
              type="button"
              onClick={joinSession}
              className="h-[56px] rounded-[16px] bg-[#2d2b84] px-7 text-[1rem] font-bold text-white md:h-[60px] md:text-[1.1rem]"
            >
              Join
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
