"use client";

import { useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { signUpWithCredentials } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signUpWithCredentials({
        email,
        password,
        name,
        callbackUrl: "/account/success",
        redirect: true,
      });
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account");
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
          Join to
          <span style={{ color: "#c8602a", fontStyle: "italic" }}>night</span>
        </h1>
        <p style={{ color: "#8a8070", fontSize: "15px", marginBottom: "24px" }}>
          Save your perfect nights across devices
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
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              placeholder="Your name"
            />
          </div>

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
              minLength={8}
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
              placeholder="At least 8 characters"
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
            {loading ? "Creating account..." : "Create account"}
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
          Already have an account?{" "}
          <a
            href="/account/signin"
            style={{
              color: "#c8602a",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
