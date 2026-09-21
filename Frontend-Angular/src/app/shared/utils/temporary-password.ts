/** A readable random temporary password satisfying the password policy. */
export function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  const letters = Array.from(bytes.slice(0, 9), (b) => alphabet[b % alphabet.length]).join('');
  const numbers = Array.from(bytes.slice(9), (b) => digits[b % digits.length]).join('');
  return `${letters}${numbers}`;
}
