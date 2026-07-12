type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  const iconSize = compact ? "h-12 w-12" : "h-[120px] w-[120px]";
  const markSize = compact ? "h-8 w-8" : "h-[88px] w-[88px]";
  const titleSize = compact ? "text-lg" : "text-[28px]";

  return (
    <div className="flex flex-col items-center">
      <div
        className={`mb-4 flex items-center justify-center rounded-[30px] bg-[#f5f3ff] shadow-[0_10px_30px_rgba(0,0,0,0.08)] ${iconSize}`}
      >
        <svg viewBox="0 0 120 120" className={markSize} aria-hidden="true">
          <rect x="28" y="18" width="60" height="72" rx="10" fill="#2d2b84" />
          <rect x="48" y="26" width="40" height="54" rx="8" fill="#f4c542" />
          <rect
            x="33"
            y="33"
            width="20"
            height="6"
            rx="3"
            fill="#ffffff"
            opacity="0.95"
          />
          <rect
            x="33"
            y="45"
            width="20"
            height="6"
            rx="3"
            fill="#ffffff"
            opacity="0.95"
          />
          <rect
            x="33"
            y="57"
            width="20"
            height="6"
            rx="3"
            fill="#ffffff"
            opacity="0.95"
          />
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
      <div className={`${titleSize} font-semibold leading-none tracking-tight`}>
        <span className="text-[#2d2b84]">hisab</span>{" "}
        <span className="text-[#f4b000]">kitab</span>
      </div>
    </div>
  );
}
