import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#f8fafc",
      }}
    >
      {/* Main Content Area */}
      <main
        style={{
          flex: "1 1 auto",
          width: "100%",
          minWidth: 0, /* ปลดล็อกปัญหา Flex item หดตัวผิดปกติบนมือถือ */
        }}
      >
        {children}
      </main>
    </div>
  );
}