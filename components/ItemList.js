"use client";

import { useEffect, useState } from "react";

function formatMoney(value) {
  const amount = Number(value || 0);

  return `Rs ${Number.isFinite(amount) ? amount.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "0"}`;
}

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
  const [activeItemId, setActiveItemId] = useState("");

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

    setActiveItemId((current) =>
      current && items.some((item) => item.id === current) ? current : "",
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
          items.map((item, index) => {
            const draftItem =
              draftItems.find((entry) => entry.id === item.id) ||
              {
                id: item.id,
                name: String(item?.name || ""),
                quantityText: String(item?.quantity ?? 1),
                priceText: String(item?.price ?? ""),
              };
            const isActive = editable && activeItemId === item.id;
            const quantity = Number(item.quantity || draftItem.quantityText || 1);

            return (
              <div
                key={item.id}
                className={`border-b border-[#f1f3f8] px-4 py-3 ${
                  index === items.length - 1 ? "border-b-0" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!editable) {
                      return;
                    }

                    setActiveItemId((current) =>
                      current === item.id ? "" : item.id,
                    );
                  }}
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-[#1a1f3c]">
                      {item.name}
                    </div>
                    <div className="mt-1 text-[12px] text-[#9aa0b4]">
                      Qty {Number.isFinite(quantity) ? Math.max(1, Math.round(quantity)) : 1}
                      {editable ? " · Tap to edit" : ""}
                    </div>
                  </div>
                  <span className="shrink-0 text-[14px] font-semibold text-[#1a1f3c]">
                    {formatMoney(item.price)}
                  </span>
                </button>

                {editable && isActive ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1.7fr)_88px_120px]">
                    <input
                      type="text"
                      value={draftItem.name}
                      onChange={(event) =>
                        updateDraftItem(item.id, { name: event.target.value })
                      }
                      className="h-[54px] min-w-0 rounded-[14px] border border-[#e6e1de] bg-[#faf8f7] px-5 text-[17px] outline-none sm:col-span-1 sm:text-[18px]"
                      placeholder="Item name"
                    />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={draftItem.quantityText}
                      onChange={(event) =>
                        updateDraftItem(item.id, {
                          quantityText: event.target.value,
                        })
                      }
                      className="h-[48px] rounded-[14px] border border-[#e6e1de] bg-[#faf8f7] px-4 text-[15px] outline-none"
                      placeholder="Qty"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draftItem.priceText}
                      onChange={(event) =>
                        updateDraftItem(item.id, { priceText: event.target.value })
                      }
                      className="h-[48px] rounded-[14px] border border-[#e6e1de] bg-[#faf8f7] px-4 text-[15px] outline-none"
                      placeholder="Price"
                    />

                    <div className="flex flex-wrap gap-2 sm:col-span-3">
                      <button
                        type="button"
                        onClick={() => saveItem(draftItem)}
                        disabled={savingItemId === item.id}
                        className="h-[44px] rounded-full bg-[#243b84] px-5 text-[14px] font-semibold text-white disabled:opacity-60"
                      >
                        {savingItemId === item.id ? "Saving..." : "Save"}
                      </button>
                      {onRemoveItem ? (
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="h-[44px] rounded-full border border-[#e6e1de] bg-white px-5 text-[14px] font-semibold text-[#c0392b]"
                        >
                          Delete
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setActiveItemId("")}
                        className="h-[44px] rounded-full border border-transparent bg-transparent px-3 text-[14px] font-semibold text-[#6f6f86]"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="px-4 py-6 text-center text-sm text-[#9aa0b4]">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
