/**
 * Random identifier for idempotency keys. crypto.randomUUID only exists in
 * secure contexts; a POS reached over plain HTTP on a LAN still needs a key.
 */
export function randomId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
