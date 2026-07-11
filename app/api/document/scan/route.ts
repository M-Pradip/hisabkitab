import { NextResponse } from "next/server";
import {
  analyzeDocumentWithAzure,
  AzureDocumentIntelligenceError,
  MAX_FILE_BYTES,
} from "@/lib/azure-document-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/tiff",
]);

function isValidDocumentType(file: File) {
  return file.type === "application/pdf" || ALLOWED_IMAGE_TYPES.has(file.type) || file.type.startsWith("image/");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Please upload a valid image or PDF." },
        { status: 400 },
      );
    }

    if (!isValidDocumentType(file)) {
      return NextResponse.json(
        { success: false, error: "Only image files and PDFs are supported." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Upload must be 20 MB or smaller." },
        { status: 413 },
      );
    }

    const result = await analyzeDocumentWithAzure(file);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AzureDocumentIntelligenceError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to scan the document right now.";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
