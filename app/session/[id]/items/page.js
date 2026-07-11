"use client";

import SessionHeader from "@/components/SessionHeader";
import ItemList from "@/components/ItemList";
import { useSessionState } from "@/lib/useSessionState";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  const [itemQuantity, setItemQuantity] = useState("1");

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
    const quantity = Number(itemQuantity);

    if (
      !name ||
      Number.isNaN(price) ||
      Number.isNaN(quantity) ||
      quantity <= 0
    ) {
      return;
    }

    await updateSession({
      type: "add_item",
      item: {
        id: makeId(),
        name,
        price,
        quantity: Math.max(1, Math.round(quantity)),
      },
    });

    setItemName("");
    setItemPrice("");
    setItemQuantity("1");
  };

  const saveItem = async (item) => {
    const name = String(item.name || "").trim();
    const price = Number(item.price);
    const quantity = Number(item.quantity);

    if (
      !name ||
      Number.isNaN(price) ||
      Number.isNaN(quantity) ||
      quantity <= 0
    ) {
      return;
    }

    await updateSession({
      type: "update_item",
      itemId: item.id,
      item: {
        name,
        price,
        quantity: Math.max(1, Math.round(quantity)),
      },
    });
  };

  const removeItem = async (itemId) => {
    await updateSession({
      type: "remove_item",
      itemId,
    });
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
          backHref={`/session/${sessionId}/scan`}
        />

        <p className="hint">
          Scanned receipts populate this list automatically, and you can still
          edit each row.
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
              min="1"
              step="1"
              value={itemQuantity}
              onChange={(event) => setItemQuantity(event.target.value)}
              placeholder="Qty"
              className="h-[52px] w-full rounded-[16px] border border-[#e6e1de] bg-[#faf8f7] px-4 text-[16px] outline-none sm:max-w-[100px]"
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

        <div className="rounded-[28px] bg-white p-6 shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
          <div className="mb-3 text-[11px] font-bold tracking-[0.07em] text-[#aaa]">
            EDIT RECEIPT ITEMS
          </div>
          <ItemList
            title="Current Items"
            subtitle={`${session?.items?.length || 0} live items`}
            items={session?.items || []}
            editable
            emptyMessage="Scan a receipt or add an item above."
            onUpdateItem={saveItem}
            onRemoveItem={removeItem}
          />
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
            Split Bill {"->"}
          </button>
        </div>
      </div>
    </main>
  );
}
