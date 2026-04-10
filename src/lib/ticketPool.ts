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
      const padLen = Math.max(2, String(end).length);
      for (let i = start; i <= end; i++) {
        pool.push(p.prefix + String(i).padStart(padLen, '0'));
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

export function generateRandomTicket(config: DrawConfig, drawnSet: Set<number>): number {
  const isExcluded = (n: number) => {
    const formatted = formatTicket(n, config);
    const unpadded = String(n);
    const excludes = config.excludedNumbers || [];
    return excludes.includes(formatted) || excludes.includes(unpadded) || excludes.includes(formatted.trim());
  };

  if (config.drawMode === 'alphanumeric' && config.alphaPrefixes?.length) {
    const poolSize = getPoolSize(config);
    let n: number;
    let attempts = 0;
    do { 
      n = Math.floor(Math.random() * poolSize) + 1; 
      attempts++;
      if (attempts > 10000) break;
    } while (drawnSet.has(n) || isExcluded(n));
    return n;
  }
  const min = config.minNumber ?? 1;
  const max = config.maxNumber ?? 250;
  let n: number;
  let attempts = 0;
  do { 
    n = Math.floor(Math.random() * (max - min + 1)) + min; 
    attempts++;
    if (attempts > 10000) break;
  } while (drawnSet.has(n) || isExcluded(n));
  return n;
}

/**
 * Get the digits/characters to display on the slot machine for a ticket.
 * Always returns exactly the number of digits needed (3 or 4)
 */
export function getSlotDigits(internalNum: number | null, config: DrawConfig): string[] {
  const isAlpha = config.drawMode === 'alphanumeric';
  
  // Predict max length
  let maxLen = 3;
  if (isAlpha && config.alphaPrefixes?.length) {
    const maxEnd = Math.max(...config.alphaPrefixes.map(p => p.rangeEnd ?? 99));
    const padLen = Math.max(2, String(maxEnd).length);
    const prefixLen = Math.max(...config.alphaPrefixes.map(p => p.prefix?.length ?? 1));
    maxLen = padLen + prefixLen;
  }
  
  if (internalNum === null) return Array(maxLen).fill('-');
  const label = formatTicket(internalNum, config);
  
  // Pad or trim
  const padded = label.padStart(maxLen, ' ').slice(-maxLen);
  return padded.split('');
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
