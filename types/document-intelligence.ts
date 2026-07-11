export type DocumentScanItem = {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  confidence?: number;
  source?: "line" | "table";
  rawText?: string;
};

export type DocumentScanLine = {
  text: string;
  confidence?: number;
  boundingPolygon?: number[];
};

export type DocumentScanPage = {
  pageNumber: number;
  width?: number;
  height?: number;
  unit?: string;
  angle?: number;
  lines: DocumentScanLine[];
};

export type DocumentScanTableCell = {
  rowIndex: number;
  columnIndex: number;
  content: string;
  kind?: string;
  confidence?: number;
};

export type DocumentScanTable = {
  index: number;
  rowCount: number;
  columnCount: number;
  cells: DocumentScanTableCell[];
};

export type DocumentScanResult = {
  success: true;
  text: string;
  pages: DocumentScanPage[];
  tables: DocumentScanTable[];
  items: DocumentScanItem[];
  raw: unknown;
  fileName: string;
  fileType: string;
};

export type DocumentScanFailure = {
  success: false;
  error: string;
};

