"use client";

import Link from "next/link";

export default function SessionHeader({
  title,
  badge,
  homeHref = "/",
  homeLabel = "Home",
  backHref,
  className = "",
}) {
  return (
    <div className={`header ${className}`}>
      {homeHref ? (
        <Link
          href={homeHref}
          className="rounded-full border border-[#c7c7cc] bg-white px-4 py-2 text-sm font-semibold text-[#1c1c1e] transition hover:bg-[#f6f6f8]"
        >
          {homeLabel}
        </Link>
      ) : null}

      {backHref ? (
        <Link href={backHref} className="back-btn" aria-label="Go back">
          {"<"}
        </Link>
      ) : null}

      <h1 className="header-title">{title}</h1>

      {badge ? <span className="people-badge">{badge}</span> : null}
    </div>
  );
}
