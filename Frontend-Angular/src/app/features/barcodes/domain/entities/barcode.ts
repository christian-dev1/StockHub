/** Symbologies StockHub can generate (EAN-8 and UPC-A only come from manufacturers). */
export const GENERATABLE_FORMATS = ['EAN13', 'CODE128'] as const;
export type GeneratableFormat = (typeof GENERATABLE_FORMATS)[number];

export interface GeneratedBarcode {
  readonly barcode: string;
  readonly format: string;
}

export const LABEL_LAYOUTS = {
  A4_3X8: { columns: 3, rows: 8 },
  A4_2X7: { columns: 2, rows: 7 },
  A4_4X10: { columns: 4, rows: 10 },
} as const;
export type LabelLayout = keyof typeof LABEL_LAYOUTS;

export const MAX_LABELS = 1000;
export const MAX_COPIES = 500;

export interface LabelItem {
  readonly productId: string;
  readonly copies: number;
}

export interface LabelRequest {
  readonly items: readonly LabelItem[];
  readonly layout: LabelLayout;
  readonly showPrice: boolean;
  /** Index (from 0) of the first free label on a partly used sheet. */
  readonly startPosition: number;
}

/** A product that can go on a label (it has a barcode). */
export interface LabelProduct {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly barcode: string | null;
  readonly salePrice: number;
}

export function labelsPerPage(layout: LabelLayout): number {
  return LABEL_LAYOUTS[layout].columns * LABEL_LAYOUTS[layout].rows;
}

export function totalLabels(items: readonly LabelItem[]): number {
  return items.reduce((sum, item) => sum + item.copies, 0);
}

/** Same limits as the backend; returns the problem to show, or null. */
export function labelRequestProblem(
  request: LabelRequest,
): 'empty' | 'tooMany' | 'copies' | 'start' | null {
  const total = totalLabels(request.items);
  if (request.items.length === 0 || total === 0) return 'empty';
  if (
    request.items.some((i) => !Number.isInteger(i.copies) || i.copies < 1 || i.copies > MAX_COPIES)
  ) {
    return 'copies';
  }
  if (total > MAX_LABELS) return 'tooMany';
  if (request.startPosition < 0 || request.startPosition >= labelsPerPage(request.layout)) {
    return 'start';
  }
  return null;
}
