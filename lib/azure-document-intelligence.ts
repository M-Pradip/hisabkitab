import {
  buildDocumentScanPages,
  buildDocumentScanTables,
  extractDocumentText,
  extractSuggestedItems,
} from "@/lib/document-receipt-parser";
import type { DocumentScanResult } from "@/types/document-intelligence";

const DEFAULT_API_VERSION = "2024-11-30";
const DEFAULT_MODEL_ID = "prebuilt-layout";
const DEFAULT_POLL_INTERVAL_MS = 1500;
const DEFAULT_TIMEOUT_MS = 90_000;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

export class AzureDocumentIntelligenceError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = "azure_document_intelligence_error") {
    super(message);
    this.name = "AzureDocumentIntelligenceError";
    this.status = status;
    this.code = code;
  }
}

export function getAzureDocumentIntelligenceConfig() {
  const endpoint = String(process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || "").trim().replace(/\/+$/, "");
  const key = String(process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || "").trim();
  const apiVersion = String(process.env.AZURE_DOCUMENT_INTELLIGENCE_API_VERSION || "").trim() || DEFAULT_API_VERSION;

  if (!endpoint || !key) {
    throw new AzureDocumentIntelligenceError(
      "Document scanning is not configured on this server.",
      500,
      "missing_configuration",
    );
  }

  return {
    endpoint,
    key,
    apiVersion,
    modelId: DEFAULT_MODEL_ID,
    pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

function sanitizeFileName(fileName: string) {
  const baseName = String(fileName || "upload")
    .split(/[\\/]/)
    .pop()
    ?.trim() || "upload";

  return baseName.replace(/[^\w.\-() ]+/g, "_").slice(0, 120) || "upload";
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function toAzureTimeoutError(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return new AzureDocumentIntelligenceError(
      "The document scan timed out. Please try again with a clearer image or a smaller file.",
      504,
      "analysis_timeout",
    );
  }

  return error;
}

async function readErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return (
        data?.error?.message ||
        data?.message ||
        data?.title ||
        response.statusText ||
        "Azure Document Intelligence returned an error."
      );
    }

    const text = await response.text();
    return text.trim() || response.statusText || "Azure Document Intelligence returned an error.";
  } catch {
    return response.statusText || "Azure Document Intelligence returned an error.";
  }
}

async function postDocumentForAnalysis(file: File, config: ReturnType<typeof getAzureDocumentIntelligenceConfig>) {
  const endpoint = new URL(
    `${config.endpoint}/documentintelligence/documentModels/${encodeURIComponent(config.modelId)}:analyze`,
  );
  endpoint.searchParams.set("api-version", config.apiVersion);

  try {
    const response = await fetchWithTimeout(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          Accept: "application/json",
          "Ocp-Apim-Subscription-Key": config.key,
        },
        body: await file.arrayBuffer(),
      },
      config.timeoutMs,
    );

    return response;
  } catch (error) {
    throw toAzureTimeoutError(error);
  }
}

async function pollOperationResult(
  operationLocation: string,
  config: ReturnType<typeof getAzureDocumentIntelligenceConfig>,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < config.timeoutMs) {
    let response;

    try {
      response = await fetchWithTimeout(
        operationLocation,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Ocp-Apim-Subscription-Key": config.key,
          },
        },
        config.timeoutMs,
      );
    } catch (error) {
      throw toAzureTimeoutError(error);
    }

    if (!response.ok) {
      throw new AzureDocumentIntelligenceError(
        await readErrorMessage(response),
        response.status >= 500 ? 502 : response.status,
        "azure_poll_failed",
      );
    }

    const payload = await response.json();
    const status = String(payload?.status || "").toLowerCase();

    if (status === "succeeded") {
      return payload;
    }

    if (status === "failed") {
      throw new AzureDocumentIntelligenceError(
        payload?.error?.message ||
          payload?.error?.code ||
          "Azure Document Intelligence could not complete the scan.",
        502,
        "azure_analysis_failed",
      );
    }

    const retryAfter = Number(response.headers.get("retry-after") || "");
    const delay =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : config.pollIntervalMs;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new AzureDocumentIntelligenceError(
    "The document scan timed out. Please try again with a clearer image or a smaller file.",
    504,
    "analysis_timeout",
  );
}

export async function analyzeDocumentWithAzure(file: File) {
  const config = getAzureDocumentIntelligenceConfig();
  const safeName = sanitizeFileName(file.name || "upload");

  if (typeof file.size === "number" && file.size > MAX_FILE_BYTES) {
    throw new AzureDocumentIntelligenceError(
      "Upload must be 20 MB or smaller.",
      413,
      "file_too_large",
    );
  }

  const initialResponse = await postDocumentForAnalysis(file, config);

  let analysisPayload: unknown = null;

  if (initialResponse.status === 202) {
    const operationLocation =
      initialResponse.headers.get("operation-location") ||
      initialResponse.headers.get("Operation-Location");

    if (!operationLocation) {
      throw new AzureDocumentIntelligenceError(
        "Azure did not return a polling URL for the document scan.",
        502,
        "missing_operation_location",
      );
    }

    analysisPayload = await pollOperationResult(operationLocation, config);
  } else if (initialResponse.ok) {
    analysisPayload = await initialResponse.json();
  } else {
    throw new AzureDocumentIntelligenceError(
      await readErrorMessage(initialResponse),
      initialResponse.status >= 500 ? 502 : initialResponse.status,
      "azure_request_failed",
    );
  }

  const analyzeResult =
    (analysisPayload as { analyzeResult?: Record<string, unknown> })?.analyzeResult ||
    (analysisPayload as Record<string, unknown>);

  const pages = buildDocumentScanPages(analyzeResult as Parameters<typeof buildDocumentScanPages>[0]);
  const tables = buildDocumentScanTables(analyzeResult as Parameters<typeof buildDocumentScanTables>[0]);
  const text = extractDocumentText(analyzeResult as Parameters<typeof extractDocumentText>[0]);
  const items = extractSuggestedItems(analyzeResult as Parameters<typeof extractSuggestedItems>[0]);

  const result: DocumentScanResult = {
    success: true,
    text,
    pages,
    tables,
    items,
    raw: analysisPayload,
    fileName: safeName,
    fileType: file.type || "application/octet-stream",
  };

  return result;
}

export { MAX_FILE_BYTES };
