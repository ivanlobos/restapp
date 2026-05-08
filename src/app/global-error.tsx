"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Algo salió mal</h2>
          <button onClick={() => reset()}>Reintentar</button>
        </div>
      </body>
    </html>
  );
}
