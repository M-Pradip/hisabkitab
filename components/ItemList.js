"use client";

import { useEffect, useState } from "react";

export default function ItemList({
  items = [],
  title = "Items",
  subtitle = "",
  emptyMessage = "No items yet.",
  editable = false,
  onUpdateItem,
  onRemoveItem,
}) {
  const [draftItems, setDraftItems] = useState([]);
  const [savingItemId, setSavingItemId] = useState("");

  useEffect(() => {
    // Keep editable drafts in sync when the session item list changes externally.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftItems(
      items.map((item) => ({
        ...item,
        name: String(item?.name || ""),
        quantityText: String(item?.quantity ?? 1),
        priceText: String(item?.price ?? ""),
      })),
    );
  }, [items]);

  const updateDraftItem = (itemId, patch) => {
    setDraftItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    );
  };

  const saveItem = async (item) => {
    if (!onUpdateItem) {
      return;
    }

    const name = String(item.name || "").trim();
    const quantity = Number(item.quantityText);
    const price = Number(item.priceText);

    if (
      !name ||
      Number.isNaN(quantity) ||
      quantity <= 0 ||
      Number.isNaN(price)
    ) {
      return;
    }

    setSavingItemId(item.id);

    try {
      await onUpdateItem({
        id: item.id,
        name,
        quantity: Math.max(1, Math.round(quantity)),
        price,
      });
    } finally {
      setSavingItemId("");
    }
  };

  return (
    <div className="rounded-[28px] border border-[#e4e8f0] bg-white shadow-[0_2px_16px_rgba(26,31,60,0.08)]">
      <div className="border-b border-[#e4e8f0] px-4 py-4 text-center">
        <h2 className="text-[15px] font-extrabold text-[#1a1f3c]">{title}</h2>
        {subtitle ? (
          <span className="text-[12px] text-[#9aa0b4]">{subtitle}</span>
        ) : null}
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
          <div className="px-4 py-6 text-center text-sm text-[#9aa0b4]">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
