/**
 * Browser helpers for files returned by the API. Protected endpoints need the
 * bearer token, so files are fetched as blobs and handed to the browser here
 * rather than through plain links.
 */

/** Offers a blob as a download under the given file name. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Opens the browser print dialog for a PDF, through a hidden frame (no pop-up blocker). */
export function printBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  frame.src = url;
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => {
      frame.remove();
      URL.revokeObjectURL(url);
    }, 60_000);
  };
  document.body.appendChild(frame);
}

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Early check of a picture before upload, for a quicker message; the backend
 * still inspects the content and remains the authority.
 */
export function imageFileProblem(file: File): 'type' | 'size' | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return 'type';
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) return 'size';
  return null;
}

export const IMPORT_EXTENSIONS = ['.csv', '.xlsx'] as const;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export function importFileProblem(file: File): 'type' | 'size' | null {
  const name = file.name.toLowerCase();
  if (!IMPORT_EXTENSIONS.some((extension) => name.endsWith(extension))) return 'type';
  if (file.size === 0 || file.size > MAX_IMPORT_BYTES) return 'size';
  return null;
}
