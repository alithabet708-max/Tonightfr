"use client";

import { useEffect } from "react";

export default function SuccessPage() {
  useEffect(() => {
    // This page is used as a callback for Expo auth
    // It should close the webview and return to the app
    const timer = setTimeout(() => {
      if (window.close) {
        window.close();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f0e8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div style={{ fontSize: "48px" }}>✅</div>
      <h1
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "24px",
          color: "#0f0e0c",
          textAlign: "center",
        }}
      >
        Success!
      </h1>
      <p style={{ color: "#8a8070", fontSize: "15px", textAlign: "center" }}>
        You're all set. Returning to the app...
      </p>
    </div>
  );
}
