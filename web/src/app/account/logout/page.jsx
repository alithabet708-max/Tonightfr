"use client";

import { useEffect } from "react";
import useAuth from "@/utils/useAuth";

export default function LogoutPage() {
  const { signOut } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      await signOut({
        callbackUrl: "/account/signin",
        redirect: true,
      });
    };
    handleLogout();
  }, [signOut]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f0e8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <p style={{ color: "#8a8070", fontSize: "15px" }}>Signing out...</p>
    </div>
  );
}
