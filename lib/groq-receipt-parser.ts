import type { DocumentScanItem } from "@/types/document-intelligence";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

type GroqReceiptResult = {
  items?: Array<{
    name?: unknown;
    quantity?: unknown;
    price?: unknown;
  }>;
  taxAmount?: unknown;
  taxLabel?: unknown;
};

function money(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0
    ? Math.round(amount * 100) / 100
    : null;
}

function quantity(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? Math.max(1, Math.round(amount))
    : 1;
}

function parseJson(content: string): GroqReceiptResult | null {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned) as GroqReceiptResult;
  } catch {
    const objectStart = cleaned.indexOf("{");
    const objectEnd = cleaned.lastIndexOf("}");

    if (objectStart < 0 || objectEnd <= objectStart) {
      return null;
    }

    try {
      return JSON.parse(
        cleaned.slice(objectStart, objectEnd + 1),
      ) as GroqReceiptResult;
    } catch {
      return null;
    }
  }
}

function normalizeItems(items: GroqReceiptResult["items"]): DocumentScanItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.flatMap((item) => {
    const name = String(item?.name || "").trim();
    const price = money(item?.price);

    if (!name || price === null) {
      return [];
    }

    return [
      {
        id: crypto.randomUUID(),
        name,
        price,
        quantity: quantity(item?.quantity),
        source: "ai",
      },
    ];
  });
}

export async function analyzeReceiptWithGroq(
  text: string,
  fallbackItems: DocumentScanItem[],
) {
  const apiKey = String(process.env.GROQ_API_KEY || "").trim();

  if (!apiKey || !text.trim()) {
    return { items: fallbackItems, taxAmount: 0, taxLabel: "" };
  }

  let response: Response;

  try {
    response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You extract restaurant receipt data. Return only valid JSON. Include only purchased food or drink line items, never subtotal, total, VAT, tax, discount, service charge, payment, date, table, or receipt metadata. Preserve the receipt's displayed line price and quantity. Extract the tax or VAT amount separately.",
          },
          {
            role: "user",
            content: `Return this exact JSON shape: {"items":[{"name":"string","quantity":1,"price":0}],"taxAmount":0,"taxLabel":"VAT"}. Use taxAmount 0 when no tax/VAT amount is present. OCR text:\n${text}`,
          },
        ],
      }),
    });
  } catch {
    return { items: fallbackItems, taxAmount: 0, taxLabel: "" };
  }

  if (!response.ok) {
    return { items: fallbackItems, taxAmount: 0, taxLabel: "" };
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  const parsed = typeof content === "string" ? parseJson(content) : null;
  const items = normalizeItems(parsed?.items);
  const taxAmount = money(parsed?.taxAmount) ?? 0;

  return {
    items: items.length ? items : fallbackItems,
    taxAmount,
    taxLabel: String(parsed?.taxLabel || (taxAmount ? "VAT" : "")).trim(),
  };
}
