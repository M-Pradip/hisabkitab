export default function ItemList({ items = [], title = "Items", subtitle = "" }) {
  return (
    <div className="rounded-[28px] border border-[#e4e8f0] bg-white shadow-[0_2px_16px_rgba(26,31,60,0.08)]">
      <div className="border-b border-[#e4e8f0] px-4 py-4 text-center">
        <h2 className="text-[15px] font-extrabold text-[#1a1f3c]">{title}</h2>
        {subtitle ? <span className="text-[12px] text-[#9aa0b4]">{subtitle}</span> : null}
      </div>

      <div>
        {items.length ? (
          items.map((item, index) => (
            <div
              key={item.id}
              className={`flex justify-between border-b border-[#f1f3f8] px-4 py-[11px] ${
                index === items.length - 1 ? "border-b-0" : ""
              }`}
            >
              <span className="text-sm text-[#1a1f3c]">{item.name}</span>
              <span className="text-sm text-[#1a1f3c]">
                Rs {Number(item.price || 0).toFixed(0)}
              </span>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-sm text-[#9aa0b4]">No items yet.</div>
        )}
      </div>
    </div>
  );
}
