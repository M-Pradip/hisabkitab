"use client";

import { useState } from "react";

export default function ParticipantList({
  participants = [],
  onAddParticipant,
  onRemoveParticipant,
}) {
  const [name, setName] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextName = name.trim();

    if (!nextName) {
      return;
    }

    await onAddParticipant(nextName);
    setName("");
  };

  return (
    <div className="rounded-[28px] bg-white p-6 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
      <h1 className="mb-2 text-[clamp(2rem,6vw,3rem)] font-extrabold leading-none text-[#1d1d43]">
        Who&apos;s joining?
      </h1>
      <p className="mb-6 text-[clamp(1rem,3vw,1.2rem)] text-[#8e8ea7]">
        Add all participants to the bill
      </p>

      <form className="flex gap-3" onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          className="h-[60px] min-w-0 flex-1 rounded-[18px] border-[3px] border-[#ddd7d3] bg-[#faf8f7] px-5 text-[18px] outline-none placeholder:text-[#9a97a9]"
        />
        <button
          type="submit"
          className="h-[60px] w-[60px] shrink-0 rounded-[18px] bg-[#243b84] text-[32px] font-normal leading-none text-white transition hover:opacity-95"
          aria-label="Add participant"
        >
          +
        </button>
      </form>

      <div className="mt-[18px] text-[16px] font-semibold text-[#8e8ea7]">
        <span>{participants.length}</span> added
      </div>

      <div className="mt-4 space-y-[10px]">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between gap-3 rounded-[16px] border-2 border-[#e8e1dc] bg-[#faf8f7] px-4 py-3"
          >
            <div className="min-w-0">
              <div className="break-words text-[16px] font-semibold text-[#1d1d43]">
                {participant.name}
              </div>
              {participant.role === "host" ? (
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#3aaa6e]">
                  Host
                </div>
              ) : null}
            </div>
            {onRemoveParticipant ? (
              participant.role === "host" ? (
                <span className="rounded-full bg-[#e8f5e2] px-3 py-1 text-xs font-semibold text-[#3aaa6e]">
                  Host
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onRemoveParticipant(participant.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#dc3545] text-sm font-bold text-white"
                  aria-label={`Remove ${participant.name}`}
                >
                  ×
                </button>
              )
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
