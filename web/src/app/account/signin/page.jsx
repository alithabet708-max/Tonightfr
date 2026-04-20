"use client";

import { useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { signInWithCredentials } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithCredentials({
        email,
        password,
        callbackUrl: "/account/success",
        redirect: true,
      });
    } catch (err) {
      console.error("Signin error:", err);
      setError("Invalid email or password");
      setLoading(false);
    }
  };

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
      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          backgroundColor: "#faf7f2",
          borderRadius: "16px",
          padding: "32px",
          border: "1.5px solid #e8dfc8",
        }}
      >
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "28px",
            letterSpacing: "-0.5px",
            color: "#0f0e0c",
            marginBottom: "8px",
          }}
        >
          Welcome back to
          <span style={{ color: "#c8602a", fontStyle: "italic" }}>night</span>
        </h1>
        <p style={{ color: "#8a8070", fontSize: "15px", marginBottom: "24px" }}>
          Sign in to see your saved nights
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "#8a8070",
                marginBottom: "6px",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1.5px solid #e8dfc8",
                fontSize: "15px",
                backgroundColor: "white",
                color: "#0f0e0c",
                outline: "none",
              }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "#8a8070",
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1.5px solid #e8dfc8",
                fontSize: "15px",
                backgroundColor: "white",
                color: "#0f0e0c",
                outline: "none",
              }}
              placeholder="Your password"
            />
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fdf0f0",
                borderRadius: "8px",
                marginBottom: "16px",
                border: "1.5px solid #b05050",
              }}
            >
              <p style={{ color: "#b05050", fontSize: "13px", margin: 0 }}>
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#c8602a",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "500",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "14px",
            color: "#8a8070",
          }}
        >
          Don't have an account?{" "}
          <a
            href="/account/signup"
            style={{
              color: "#c8602a",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
