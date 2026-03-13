// ---------------------------------------------------------------------------
// ticketPool.ts — Ticket pool helpers for numeric and alphanumeric draw modes
// ---------------------------------------------------------------------------
import type { DrawConfig } from './drawConfig';

export interface AlphaPrefix {
  prefix: string;    // e.g. "A", "B", "XY"
  rangeStart: number; // e.g. 1
  rangeEnd: number;   // e.g. 99
}

/**
 * Build the full ordered pool of ticket labels.
 * - Numeric mode: ["001", "002", ..., "200"] for range 1–200
 * - Alphanumeric mode: ["A01", "A02", ..., "B01", ...] based on prefixes
 */
export function buildTicketPool(config: DrawConfig): string[] {
  if (config.drawMode === 'alphanumeric' && config.alphaPrefixes?.length) {
    const pool: string[] = [];
    for (const p of config.alphaPrefixes) {
      const start = p.rangeStart ?? 1;
      const end = p.rangeEnd ?? 99;
      for (let i = start; i <= end; i++) {
        pool.push(p.prefix + String(i).padStart(2, '0'));
      }
    }
    return pool;
  }
  // Numeric mode
  const min = config.minNumber ?? 1;
  const max = config.maxNumber ?? 250;
  const pool: string[] = [];
  for (let i = min; i <= max; i++) {
    pool.push(String(i).padStart(3, '0'));
  }
  return pool;
}

/** Total number of drawable tickets. */
export function getPoolSize(config: DrawConfig): number {
  if (config.drawMode === 'alphanumeric' && config.alphaPrefixes?.length) {
    return config.alphaPrefixes.reduce((sum, p) => sum + ((p.rangeEnd ?? 99) - (p.rangeStart ?? 1) + 1), 0);
  }
  return (config.maxNumber ?? 250) - (config.minNumber ?? 1) + 1;
}

/**
 * Format an internal ticket number for display.
 * - Numeric mode: pad to 3 digits
 * - Alphanumeric mode: look up in the pool (1-based index)
 */
export function formatTicket(internalNum: number, config: DrawConfig): string {
  if (config.drawMode === 'alphanumeric' && config.alphaPrefixes?.length) {
    const pool = buildTicketPool(config);
    return pool[internalNum - 1] ?? '???';
  }
  return String(internalNum).padStart(3, '0');
}

/**
 * Generate a random unused ticket number.
 * - Numeric mode: random in [minNumber, maxNumber]
 * - Alphanumeric mode: random in [1, poolSize]
 */
export function generateRandomTicket(config: DrawConfig, drawnSet: Set<number>): number {
  if (config.drawMode === 'alphanumeric' && config.alphaPrefixes?.length) {
    const poolSize = getPoolSize(config);
    let n: number;
    do { n = Math.floor(Math.random() * poolSize) + 1; } while (drawnSet.has(n));
    return n;
  }
  const min = config.minNumber ?? 1;
  const max = config.maxNumber ?? 250;
  let n: number;
  do { n = Math.floor(Math.random() * (max - min + 1)) + min; } while (drawnSet.has(n));
  return n;
}

/**
 * Get the digits/characters to display on the slot machine for a ticket.
 * Always returns exactly 3 characters.
 */
export function getSlotDigits(internalNum: number | null, config: DrawConfig): string[] {
  if (internalNum === null) return ['-', '-', '-'];
  const label = formatTicket(internalNum, config);
  // Pad or trim to 3 characters
  const padded = label.padStart(3, ' ').slice(-3);
  return [padded[0], padded[1], padded[2]];
}

/** Get random characters for slot spinning animation based on mode */
export function getRandomSpinChar(position: number, config: DrawConfig): string {
  if (config.drawMode === 'alphanumeric' && config.alphaPrefixes?.length) {
    if (position === 0) {
      // First position: spin through available prefixes
      const prefixes = config.alphaPrefixes.map(p => p.prefix);
      return prefixes[Math.floor(Math.random() * prefixes.length)] || 'A';
    }
    // Other positions: spin through digits
    return String(Math.floor(Math.random() * 10));
  }
  return String(Math.floor(Math.random() * 10));
}
