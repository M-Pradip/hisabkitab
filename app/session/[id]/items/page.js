"use client";

import SessionHeader from "@/components/SessionHeader";
import { useSessionState } from "@/lib/useSessionState";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

function makeId() {
  return crypto.randomUUID();
}

export default function ItemsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id;
  const { session, status, error, updateSession } = useSessionState(sessionId);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  // New: local, optimistic items state
  const [localItems, setLocalItems] = useState(session?.items || []);
  useEffect(() => {
    setLocalItems(session?.items || []);
  }, [session?.items]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/session/${sessionId}/claim`;
  }, [sessionId]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen justify-center bg-[#f0f0f5] px-4 py-5">
        <div className="screen-panel">Loading...</div>
      </main>
    );
  }

  if (status === "missing" || status === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f0f0f5] px-4 py-5">
        <div className="screen-panel text-center">
          <h1 className="text-3xl font-bold text-[#1c1c1e]">
            Session not found
          </h1>
          <p className="mt-2 text-[#666]">{error}</p>
        </div>
      </main>
    );
  }

  const addItem = async () => {
    const name = itemName.trim();
    const price = Number(itemPrice);

    if (!name || Number.isNaN(price)) {
      return;
    }

    const newItem = {
      id: makeId(),
      name,
      price,
      quantity: 1, // include quantity when adding a new item
    };

    // optimistic update
    setLocalItems((prev) => [...prev, newItem]);

    try {
      await updateSession({
        type: "add_item",
        item: newItem,
      });
    } catch (err) {
      // revert on error
      setLocalItems((prev) => prev.filter((i) => i.id !== newItem.id));
      console.error("Failed to add item:", err);
    }

    setItemName("");
    setItemPrice("");
  };

  // New: update item quantity by delta (e.g. +1 or -1). Minimum quantity is 1.
  const updateItemQuantity = async (itemId, delta) => {
    const existing = (session?.items || localItems).find((i) => i.id === itemId);
    if (!existing) return;

    const newQty = Math.max(1, (existing.quantity || 1) + delta);

    // optimistic update
    setLocalItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, quantity: newQty } : it)),
    );

    try {
      await updateSession({
        type: "update_item",
        item: {
          ...existing,
          quantity: newQty,
        },
      });
    } catch (err) {
      // revert on error: reset from authoritative session or roll back one delta
      setLocalItems(session?.items || (prev => prev.map(it => it.id === itemId ? { ...it, quantity: existing.quantity || 1 } : it)));
      console.error("Failed to update item quantity:", err);
    }
  };

  // New: delete an item
  const deleteItem = async (itemId) => {
    // optimistic update
    const previous = localItems;
    setLocalItems((prev) => prev.filter((i) => i.id !== itemId));

    try {
      await updateSession({
        type: "delete_item",
        itemId,
      });
    } catch (err) {
      // revert on error
      setLocalItems(previous);
      console.error("Failed to delete item:", err);
    }
  };

  const hostName = session?.participants?.find(
    (participant) => participant.role === "host",
  )?.name;

  return (
    <main className="flex min-h-screen justify-center bg-[#f0f0f5] px-4 py-5">
      <div className="screen-panel">
        <SessionHeader
          title="Assign Items"
          badge={
            hostName
              ? `Host: ${hostName}`
              : `${session?.participants?.length || 0} people`
          }
          homeHref="/"
          backHref={`/session/${sessionId}/participants`}
        />

        <p className="hint">
          Host adds items here, then shares the link for participants to join
        </p>

        <div className="rounded-[16px] bg-white p-4">
          <div className="mb-3 text-[11px] font-bold tracking-[0.07em] text-[#aaa]">
            ADD ITEM
          </div>
          <div className="flex gap-3 max-sm:flex-col">
            <input
              type="text"
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              placeholder="Item name"
              className="h-[52px] min-w-0 flex-1 rounded-[16px] border border-[#e6e1de] bg-[#faf8f7] px-4 text-[16px] outline-none"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={itemPrice}
              onChange={(event) => setItemPrice(event.target.value)}
              placeholder="Price"
              className="h-[52px] w-full rounded-[16px] border border-[#e6e1de] bg-[#faf8f7] px-4 text-[16px] outline-none sm:max-w-[120px]"
            />
            <button
              type="button"
              onClick={addItem}
              className="h-[52px] rounded-[16px] bg-[#243b84] px-5 text-[16px] font-semibold text-white"
            >
              Add
            </button>
          </div>
        </div>

        {/* Replaced ItemList with inline list so we can show quantity, +/- and Delete */}
        <div className="mt-4">
          <div className="mb-3 text-[11px] font-bold tracking-[0.07em] text-[#aaa]">
            CURRENT ITEMS
          </div>

          <div className="rounded-[12px] bg-white divide-y">
            {(localItems || []).length === 0 ? (
              <div className="p-4 text-[#666]">No items yet</div>
            ) : (
              (localItems || []).map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between p-4"
                >
                  <div>
                    <div className="font-semibold text-[16px] text-[#111]">
                      {it.name}
                    </div>
                    <div className="text-sm text-[#666]">
                      Price: ${Number(it.price).toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-full border bg-[#faf8f7]">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(it.id, -1)}
                        className="px-3 py-2 text-[16px]"
                      >
                        −
                      </button>
                      <div className="px-4 text-[14px] font-medium">
                        {it.quantity || 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(it.id, 1)}
                        className="px-3 py-2 text-[16px]"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteItem(it.id)}
                      className="text-sm text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="share-card">
          <p className="share-label">SHARE WITH YOUR GROUP</p>
          <div className="share-row">
            <span className="share-link">/session/{sessionId}/claim</span>
            <button
              type="button"
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              Copy
            </button>
          </div>
          <p className="share-note">
            Anyone with this link can join and select their name
          </p>
        </div>

        <div className="footer">
          <button
            type="button"
            onClick={() => router.push(`/session/${sessionId}/claim`)}
            className="pref-btn"
          >
            Split Bill →
          </button>
        </div>
      </div>
    </main>
  );
}
