import type {
  DocumentScanItem,
  DocumentScanPage,
  DocumentScanTable,
} from "@/types/document-intelligence";

type AzureAnalyzeResult = {
  content?: string;
  pages?: Array<{
    pageNumber?: number;
    width?: number;
    height?: number;
    unit?: string;
    angle?: number;
    lines?: Array<{
      content?: string;
      text?: string;
      boundingPolygon?: number[];
      confidence?: number;
    }>;
  }>;
  tables?: Array<{
    rowCount?: number;
    columnCount?: number;
    cells?: Array<{
      rowIndex?: number;
      columnIndex?: number;
      content?: string;
      kind?: string;
      confidence?: number;
    }>;
  }>;
};

const NOISE_KEYWORDS = [
  "subtotal",
  "sub total",
  "total",
  "grand total",
  "vat",
  "tax",
  "service",
  "discount",
  "change",
  "cash",
  "card",
  "balance",
  "amount due",
  "amount paid",
  "tip",
  "receipt",
  "invoice",
  "thank you",
  "table",
  "bill no",
  "bill number",
  "invoice no",
  "invoice number",
  "order no",
  "token",
  "gst",
  "sgst",
  "cgst",
  "round off",
  "roundoff",
  "payment",
  "qty",
  "quantity",
];

function text(value: unknown) {
  return String(value || "").trim();
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").replace(/[•·]/g, " ").trim();
}

function hasNoise(value: string) {
  const lower = value.toLowerCase();
  return NOISE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function hasLetters(value: string) {
  return /[A-Za-z]/.test(value);
}

function parsePrice(value: string) {
  const normalized = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");

  if (!normalized || normalized === "-") {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

function parseQuantity(value: string) {
  const directMatch = value.match(/\b(?:x|qty|quantity)\s*[:\-]?\s*(\d{1,3})\b/i);
  if (directMatch) {
    const quantity = Number(directMatch[1]);
    return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
  }

  const postfixMatch = value.match(/\b(\d{1,3})\s*[xX]\b/);
  if (postfixMatch) {
    const quantity = Number(postfixMatch[1]);
    return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
  }

  return null;
}

function stripQuantity(value: string) {
  return value
    .replace(/\b(?:x|qty|quantity)\s*[:\-]?\s*\d{1,3}\b/i, "")
    .replace(/\b\d{1,3}\s*[xX]\b/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseReceiptLine(line: string) {
  const cleaned = normalize(line);

  if (!cleaned || cleaned.length < 2 || hasNoise(cleaned)) {
    return null;
  }

  const patterns = [
    /^(?<name>.+?)\s+(?:x|X)\s*(?<qty>\d{1,3})\s+(?:Rs\.?|NPR\.?|रु\.?)?\s*(?<price>\d[\d,]*(?:\.\d{1,2})?)$/,
    /^(?<name>.+?)\s+(?<qty>\d{1,3})\s*(?:x|X)\s+(?:Rs\.?|NPR\.?|रु\.?)?\s*(?<price>\d[\d,]*(?:\.\d{1,2})?)$/,
    /^(?<name>.+?)\s+(?:x|X)\s*(?<qty>\d{1,3})\s*$/,
    /^(?<name>.+?)\s+(?:Rs\.?|NPR\.?|रु\.?)?\s*(?<price>\d[\d,]*(?:\.\d{1,2})?)$/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);

    if (!match?.groups?.name) {
      continue;
    }

    const rawName = normalize(match.groups.name);
    const price = match.groups.price ? parsePrice(match.groups.price) : null;
    const quantity = match.groups.qty ? Number(match.groups.qty) : parseQuantity(cleaned);

    if (!rawName || !hasLetters(rawName)) {
      continue;
    }

    if (hasNoise(rawName)) {
      continue;
    }

    if (price === null && !match.groups.qty) {
      continue;
    }

    return {
      name: stripQuantity(rawName),
      price,
      quantity: Number.isFinite(quantity as number) && (quantity as number) > 0 ? Math.round(quantity as number) : undefined,
      rawText: cleaned,
    };
  }

  return null;
}

function extractLineItemCandidates(result: AzureAnalyzeResult) {
  const candidates: DocumentScanItem[] = [];

  for (const page of result.pages || []) {
    for (const line of page?.lines || []) {
      const parsed = parseReceiptLine(text(line?.content || line?.text));

      if (!parsed || parsed.price === null) {
        continue;
      }

      candidates.push({
        id: crypto.randomUUID(),
        name: parsed.name,
        price: parsed.price,
        quantity: parsed.quantity,
        source: "line",
        rawText: parsed.rawText,
      });
    }
  }

  return candidates;
}

function extractTableCandidates(result: AzureAnalyzeResult) {
  const candidates: DocumentScanItem[] = [];

  for (const table of result.tables || []) {
    const cellsByRow = new Map<number, Array<{ columnIndex?: number; content?: string }>>();

    for (const cell of table?.cells || []) {
      const rowIndex = Number(cell?.rowIndex ?? -1);

      if (rowIndex < 0) {
        continue;
      }

      const nextRow = cellsByRow.get(rowIndex) || [];
      nextRow.push(cell);
      cellsByRow.set(rowIndex, nextRow);
    }

    for (const cells of cellsByRow.values()) {
      const sorted = [...cells].sort(
        (left, right) => Number(left?.columnIndex ?? 0) - Number(right?.columnIndex ?? 0),
      );

      const rowText = normalize(
        sorted.map((cell) => text(cell?.content)).filter(Boolean).join(" "),
      );

      if (!rowText || hasNoise(rowText)) {
        continue;
      }

      const priceCell = [...sorted]
        .reverse()
        .find((cell) => parsePrice(text(cell?.content)) !== null);

      if (!priceCell) {
        continue;
      }

      const price = parsePrice(text(priceCell.content));

      if (price === null) {
        continue;
      }

      const name = normalize(
        sorted
          .filter((cell) => cell !== priceCell)
          .map((cell) => text(cell?.content))
          .filter(Boolean)
          .join(" "),
      );

      if (!name || !hasLetters(name) || hasNoise(name)) {
        continue;
      }

      const quantity = parseQuantity(name);

      candidates.push({
        id: crypto.randomUUID(),
        name: stripQuantity(name),
        price,
        quantity: quantity || undefined,
        source: "table",
        rawText: rowText,
      });
    }
  }

  return candidates;
}

export function buildDocumentScanPages(result: AzureAnalyzeResult): DocumentScanPage[] {
  return (result.pages || []).map((page, index) => ({
    pageNumber: Number(page?.pageNumber || index + 1),
    width: page?.width,
    height: page?.height,
    unit: page?.unit,
    angle: page?.angle,
    lines: (page?.lines || []).map((line) => ({
      text: normalize(text(line?.content || line?.text)),
      confidence: line?.confidence,
      boundingPolygon: line?.boundingPolygon,
    })),
  }));
}

export function buildDocumentScanTables(result: AzureAnalyzeResult): DocumentScanTable[] {
  return (result.tables || []).map((table, index) => ({
    index,
    rowCount: Number(table?.rowCount || 0),
    columnCount: Number(table?.columnCount || 0),
    cells: (table?.cells || []).map((cell) => ({
      rowIndex: Number(cell?.rowIndex || 0),
      columnIndex: Number(cell?.columnIndex || 0),
      content: normalize(text(cell?.content)),
      kind: cell?.kind,
      confidence: cell?.confidence,
    })),
  }));
}

export function extractDocumentText(result: AzureAnalyzeResult) {
  return normalize(text(result?.content));
}

export function extractSuggestedItems(result: AzureAnalyzeResult) {
  const candidates = [...extractTableCandidates(result), ...extractLineItemCandidates(result)];
  const seen = new Set<string>();
  const items: DocumentScanItem[] = [];

  for (const candidate of candidates) {
    const key = `${candidate.name.toLowerCase()}|${candidate.price.toFixed(2)}|${candidate.quantity || 1}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push(candidate);
  }

  return items;
}

