import './globals.css';

/** Fallback for paths outside the locale segment (the proxy normally prevents this). */
export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <body className="bg-bg text-fg flex min-h-dvh items-center justify-center">
        <p>404</p>
      </body>
    </html>
  );
}
