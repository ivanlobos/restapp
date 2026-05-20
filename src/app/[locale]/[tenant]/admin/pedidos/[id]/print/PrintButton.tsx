"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        marginTop: 20, width: "100%", padding: "10px",
        background: "#111", color: "#fff", border: "none",
        borderRadius: 8, fontSize: 14, cursor: "pointer"
      }}
    >
      🖨️ Imprimir
    </button>
  );
}
