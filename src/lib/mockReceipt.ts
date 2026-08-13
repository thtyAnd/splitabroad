import type { ReceiptItem } from '@/state/bill';

type Line = { label: string; price: number };

/**
 * Stand-in for the vision model. The demo brief calls for a scan that
 * "auto-populates" a plausible itemised bill after a short delay; these lines
 * sum to 128.50, the figure used throughout the design.
 */
const LINES: Line[] = [
  { label: 'Wagyu burger', price: 15.0 },
  { label: 'Truffle fries', price: 7.5 },
  { label: 'Craft beer × 2', price: 11.0 },
  { label: 'Yuzu highball', price: 8.5 },
  { label: 'Miso ramen', price: 14.0 },
  { label: 'Gyoza (6 pc)', price: 9.0 },
  { label: 'Sashimi platter', price: 24.0 },
  { label: 'Matcha tiramisu', price: 8.0 },
  { label: 'Green tea × 3', price: 9.0 },
  { label: 'Service fee (10%)', price: 10.6 },
  { label: 'Consumption tax', price: 11.9 },
];

export const MOCK_RESTAURANT = 'Niku Kappo Kyoto';

let scanSeq = 0;

export function mockScanResult(): { restaurant: string; items: ReceiptItem[]; total: number } {
  const run = scanSeq++;
  const items: ReceiptItem[] = LINES.map((line, i) => ({
    id: `i${run}-${i}`,
    label: line.label,
    price: line.price,
    assignedTo: [],
  }));
  const total = Math.round(items.reduce((sum, i) => sum + i.price, 0) * 100) / 100;
  return { restaurant: MOCK_RESTAURANT, items, total };
}

/** How long "Analyzing receipt…" runs before the items appear (spec: ~2s). */
export const ANALYSIS_MS = 2000;
