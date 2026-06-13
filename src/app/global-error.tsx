"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Algo salió mal</h2>
          <button onClick={reset}>Reintentar</button>
        </div>
      </body>
    </html>
  );
}
