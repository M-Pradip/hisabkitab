"use client";

import Link from "next/link";
import { useState } from "react";

export default function SessionHeader({
  title,
  badge,
  backHref,
  rightContent,
  className = "",
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!rightContent?.copyText) {
      return;
    }

    await navigator.clipboard.writeText(rightContent.copyText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={`header ${className}`}>
      {backHref ? (
        <Link href={backHref} className="back-btn" aria-label="Go back">
          ←
        </Link>
      ) : null}

      <h1 className="header-title">{title}</h1>

      {badge ? <span className="people-badge">{badge}</span> : null}

      {rightContent ? (
        <div className="flex flex-shrink-0 items-center gap-2">
          {rightContent.node ? rightContent.node : null}
          {rightContent.copyText ? (
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full bg-[#243b84] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
