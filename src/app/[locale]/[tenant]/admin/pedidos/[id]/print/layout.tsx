export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "white", zIndex: 9999, padding: "16px", fontFamily: "monospace", overflowY: "auto" }}>{children}</div>;
}
