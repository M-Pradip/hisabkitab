"use client";

import type { DocumentScanItem, DocumentScanResult } from "@/types/document-intelligence";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

type DocumentScannerProps = {
  onScanComplete?: (result: DocumentScanResult) => Promise<void> | void;
  onReset?: () => void;
  title?: string;
  subtitle?: string;
  continueLabel?: string;
  onContinue?: () => void;
};

type Phase = "idle" | "uploading" | "analyzing" | "done";

function formatPercent(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return `${Math.max(0, Math.min(100, Math.round(value * 100)))}%`;
}

function sanitizeFileName(fileName: string) {
  return (
    String(fileName || "receipt")
      .split(/[\\/]/)
      .pop()
      ?.replace(/[^\w.\-() ]+/g, "_")
      .trim() || "receipt"
  );
}

function getBaseName(fileName: string) {
  return sanitizeFileName(fileName).replace(/\.[^.]+$/, "");
}

function itemConfidence(item: DocumentScanItem) {
  return formatPercent(item.confidence);
}

export default function DocumentScanner({
  onScanComplete,
  onReset,
  title = "Take or upload a receipt photo",
  subtitle = "Use the camera for a fresh image or upload from the gallery. PDFs are supported too.",
  continueLabel = "Use extracted items",
  onContinue,
}: DocumentScannerProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [scanResult, setScanResult] = useState<DocumentScanResult | null>(null);
  const [error, setError] = useState("");

  const phaseLabel = useMemo(() => {
    switch (phase) {
      case "uploading":
        return "Uploading file...";
      case "analyzing":
        return "Analyzing with Azure Document Intelligence...";
      case "done":
        return "Scan complete";
      default:
        return "Ready to scan";
    }
  }, [phase]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const resetScanner = () => {
    setPhase("idle");
    setProgress(0);
    setSelectedFile(null);
    setPreviewUrl("");
    setScanResult(null);
    setError("");

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }

    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
    }

    onReset?.();
  };

  const scanFile = async (file: File) => {
    setPhase("uploading");
    setProgress(12);

    try {
      const formData = new FormData();
      formData.append("file", file, sanitizeFileName(file.name || "receipt"));

      setProgress(35);
      setPhase("analyzing");

      const response = await fetch("/api/document/scan", {
        method: "POST",
        body: formData,
      });

      setProgress(82);

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || "Unable to scan this document.");
      }

      setScanResult(data as DocumentScanResult);
      setPhase("done");
      setProgress(100);

      if (onScanComplete) {
        await onScanComplete(data as DocumentScanResult);
      }
    } catch (scanError) {
      setPhase("idle");
      setProgress(0);
      setError(
        scanError instanceof Error
          ? scanError.message
          : "Unable to scan this document right now.",
      );
    }
  };

  const prepareFile = (file: File) => {
    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError("Upload must be 20 MB or smaller.");
      return;
    }

    if (!(file.type.startsWith("image/") || file.type === "application/pdf")) {
      setError("Please select an image or PDF.");
      return;
    }

    setError("");
    setScanResult(null);
    setSelectedFile(file);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (file.type.startsWith("image/")) {
      const nextUrl = URL.createObjectURL(file);
      objectUrlRef.current = nextUrl;
      setPreviewUrl(nextUrl);
    } else {
      setPreviewUrl("");
    }

    void scanFile(file);
  };

  const copyText = async () => {
    if (!scanResult?.text) {
      return;
    }

    await navigator.clipboard.writeText(scanResult.text);
  };

  const downloadText = () => {
    if (!scanResult?.text) {
      return;
    }

    const blob = new Blob([scanResult.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${getBaseName(selectedFile?.name || "receipt")}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const progressWidth =
    phase === "idle" ? 0 : phase === "done" ? 100 : Math.max(progress, 18);

  return (
    <section className="space-y-4 rounded-[28px] bg-white p-5 shadow-[0_5px_15px_rgba(0,0,0,0.04)]">
      <div className="rounded-[24px] border border-dashed border-[#d8d3cf] bg-[#faf8f7] p-5 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#eef2ff] text-[13px] font-bold text-[#243b84]">
          DOC
        </div>

        <h2 className="text-[18px] font-bold text-[#1c1c40]">{title}</h2>
        <p className="mx-auto mt-2 max-w-[26rem] text-[14px] leading-7 text-[#6f6f86]">
          {subtitle}
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="h-[52px] rounded-[16px] bg-[#dbeafe] px-5 text-[15px] font-bold text-[#1d4ed8]"
          >
            Take Photo
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="h-[52px] rounded-[16px] bg-[#fef9c3] px-5 text-[15px] font-bold text-[#854d0e]"
          >
            Choose from Gallery
          </button>
        </div>

        <div
          className="mt-5 rounded-[20px] border-2 border-dashed border-[#e4e8f0] bg-white px-4 py-6 text-sm text-[#6f6f86]"
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            const droppedFile = event.dataTransfer.files?.[0];

            if (droppedFile) {
              prepareFile(droppedFile);
            }
          }}
        >
          Drag and drop a receipt image or PDF here
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              prepareFile(file);
            }
            event.target.value = "";
          }}
        />

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,application/pdf,.pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              prepareFile(file);
            }
            event.target.value = "";
          }}
        />
      </div>

      {error ? (
        <div className="rounded-[18px] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-[14px] font-medium text-[#be123c]">
          {error}
        </div>
      ) : null}

      {selectedFile ? (
        <div className="rounded-[22px] border border-[#e4e8f0] bg-[#fafafa] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[12px] font-bold tracking-[0.18em] text-[#9aa0b4]">
                SELECTED FILE
              </div>
              <div className="mt-1 break-all text-[15px] font-semibold text-[#1a1f3c]">
                {selectedFile.name}
              </div>
              <div className="mt-1 text-[13px] text-[#6f6f86]">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <button
              type="button"
              onClick={resetScanner}
              className="rounded-full border border-[#e4e8f0] bg-white px-3 py-1 text-xs font-semibold text-[#1a1f3c]"
            >
              Reset
            </button>
          </div>

          {previewUrl ? (
            <div className="mt-4 overflow-hidden rounded-[20px] border border-[#e4e8f0] bg-white">
              <Image
                src={previewUrl}
                alt="Receipt preview"
                width={800}
                height={600}
                unoptimized
                className="max-h-[320px] w-full object-contain"
              />
            </div>
          ) : (
            <div className="mt-4 rounded-[20px] border border-[#e4e8f0] bg-white px-4 py-10 text-center text-[14px] text-[#6f6f86]">
              PDF preview is not shown, but the file is ready to scan.
            </div>
          )}
        </div>
      ) : null}

      <div className="rounded-[22px] border border-[#e4e8f0] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[12px] font-bold tracking-[0.18em] text-[#9aa0b4]">
              SCAN STATUS
            </div>
            <div className="mt-1 text-[15px] font-semibold text-[#1a1f3c]">
              {phaseLabel}
            </div>
          </div>
          <div className="text-right text-[12px] font-semibold text-[#6f6f86]">
            {progressWidth}%
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e9edf5]">
          <div
            className="h-full rounded-full bg-[#243b84] transition-all duration-300"
            style={{ width: `${progressWidth}%` }}
          />
        </div>

        <p className="mt-3 text-[13px] leading-6 text-[#6f6f86]">
          {phase === "analyzing"
            ? "Azure is reading the receipt. This usually takes a few seconds."
            : phase === "done"
              ? "The extracted text and structured fields are ready below."
              : "Pick a photo or PDF to start extracting the receipt."}
        </p>
      </div>

      {scanResult ? (
        <div className="space-y-4 rounded-[28px] border border-[#e4e8f0] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[18px] font-bold text-[#1a1f3c]">
                Extracted OCR Results
              </h3>
              <p className="mt-1 text-[13px] text-[#6f6f86]">
                The parsed items below can be imported into the items page and edited later.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyText}
                className="rounded-full border border-[#e4e8f0] bg-white px-4 py-2 text-sm font-semibold text-[#1a1f3c]"
              >
                Copy Text
              </button>
              <button
                type="button"
                onClick={downloadText}
                className="rounded-full bg-[#243b84] px-4 py-2 text-sm font-semibold text-white"
              >
                Download .txt
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-[22px] bg-[#fafafa] p-4">
                <div className="text-[12px] font-bold tracking-[0.18em] text-[#9aa0b4]">
                  FULL TEXT
                </div>
                <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap break-words text-[14px] leading-7 text-[#1a1f3c]">
                  {scanResult.text || "No text could be extracted."}
                </pre>
              </div>

              <div className="rounded-[22px] bg-[#fafafa] p-4">
                <div className="text-[12px] font-bold tracking-[0.18em] text-[#9aa0b4]">
                  SUGGESTED ITEMS
                </div>
                <div className="mt-3 space-y-3">
                  {scanResult.items.length ? (
                    scanResult.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[18px] border border-[#e4e8f0] bg-white px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[15px] font-semibold text-[#1a1f3c]">
                              {item.name}
                            </div>
                            <div className="mt-1 text-[13px] text-[#6f6f86]">
                              Rs {Number(item.price || 0).toFixed(2)}
                              {item.quantity ? ` - Qty ${item.quantity}` : ""}
                              {item.source ? ` - ${item.source}` : ""}
                            </div>
                          </div>
                          {itemConfidence(item) ? (
                            <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-[11px] font-semibold text-[#243b84]">
                              {itemConfidence(item)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-[#e4e8f0] bg-white px-4 py-6 text-center text-[14px] text-[#6f6f86]">
                      No line items were confidently detected. You can still review the text above.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[22px] bg-[#fafafa] p-4">
                <div className="text-[12px] font-bold tracking-[0.18em] text-[#9aa0b4]">
                  PAGES
                </div>
                <div className="mt-3 space-y-3">
                  {scanResult.pages.map((page) => (
                    <details
                      key={page.pageNumber}
                      className="rounded-[18px] border border-[#e4e8f0] bg-white px-4 py-3"
                    >
                      <summary className="cursor-pointer list-none text-[15px] font-semibold text-[#1a1f3c]">
                        Page {page.pageNumber}
                      </summary>
                      <div className="mt-3 space-y-2 text-[13px] text-[#6f6f86]">
                        <div>
                          {page.width ? `${page.width}` : "?"} x {page.height ? `${page.height}` : "?"}{" "}
                          {page.unit || ""}
                        </div>
                        <div>{page.lines.length} lines</div>
                        {page.lines.length ? (
                          <div className="space-y-2">
                            {page.lines.slice(0, 10).map((line, index) => (
                              <div
                                key={`${page.pageNumber}-${index}`}
                                className="rounded-[14px] bg-[#fafafa] px-3 py-2"
                              >
                                <div className="text-[#1a1f3c]">{line.text}</div>
                                {formatPercent(line.confidence) ? (
                                  <div className="mt-1 text-[11px] font-semibold text-[#243b84]">
                                    Confidence {formatPercent(line.confidence)}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] bg-[#fafafa] p-4">
                <div className="text-[12px] font-bold tracking-[0.18em] text-[#9aa0b4]">
                  TABLES
                </div>
                <div className="mt-3 space-y-3">
                  {scanResult.tables.length ? (
                    scanResult.tables.map((table) => (
                      <details
                        key={table.index}
                        className="rounded-[18px] border border-[#e4e8f0] bg-white px-4 py-3"
                      >
                        <summary className="cursor-pointer list-none text-[15px] font-semibold text-[#1a1f3c]">
                          Table {table.index + 1} - {table.rowCount} rows
                        </summary>
                        <div className="mt-3 overflow-auto">
                          <table className="min-w-full border-separate border-spacing-0 text-left text-[13px]">
                            <tbody>
                              {Array.from({ length: table.rowCount }).map((_, rowIndex) => (
                                <tr key={rowIndex}>
                                  {Array.from({ length: table.columnCount }).map((__, columnIndex) => {
                                    const cell = table.cells.find(
                                      (entry) =>
                                        entry.rowIndex === rowIndex && entry.columnIndex === columnIndex,
                                    );

                                    return (
                                      <td
                                        key={columnIndex}
                                        className="border-b border-r border-[#eef1f6] px-3 py-2 align-top last:border-r-0"
                                      >
                                        {cell?.content || ""}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    ))
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-[#e4e8f0] bg-white px-4 py-6 text-center text-[14px] text-[#6f6f86]">
                      No tables were detected.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {onContinue ? (
            <button
              type="button"
              onClick={onContinue}
              className="h-[56px] rounded-[18px] bg-[#243b84] px-5 text-[16px] font-bold text-white"
            >
              {continueLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
