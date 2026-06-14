function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

export default function SplitSummary({ participants = [], totals }) {
  return (
    <div className="rounded-[28px] border border-[#e2ddd8] bg-white p-4 shadow-[0_2px_8px_rgba(26,26,46,.07)]">
      <div className="mb-4 rounded-[22px] bg-[#1a1a2e] px-5 py-6 text-center text-white">
        <div className="text-[1rem] font-extrabold opacity-85">
          Your Share
        </div>
        <div className="my-1 text-[2rem] font-extrabold">
          {formatCurrency(totals?.grandTotal || 0)}
        </div>
        <div className="text-[.68rem] uppercase tracking-[.12em] opacity-55">
          Your Total
        </div>
      </div>

      <div className="space-y-3">
        {participants.map((participant) => {
          const match = totals?.participantTotals?.find((entry) => entry.id === participant.id);

          return (
            <div
              key={participant.id}
              className="rounded-[14px] border border-[#e2ddd8] bg-[#f5f0eb] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#1a1a2e]">{participant.name}</p>
                  <p className="mt-1 text-xs text-[#8e8ea0]">
                    {match?.items?.length || 0} assigned item
                    {(match?.items?.length || 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <p className="text-lg font-extrabold text-[#1c2f6e]">
                  {formatCurrency(match?.total || 0)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-[14px] border border-[#e2ddd8] bg-[#f5f0eb] px-4 py-3 text-sm leading-6 text-[#3d3d5c]">
        Unassigned items total:{" "}
        <span className="font-bold text-[#1a1a2e]">
          {formatCurrency(totals?.unassignedTotal || 0)}
        </span>
      </div>
    </div>
  );
}
