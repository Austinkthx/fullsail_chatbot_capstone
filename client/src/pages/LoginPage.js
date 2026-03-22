import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((e) => e.msg).join(", "));
      } else if (typeof detail === "string") {
        setError(detail);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Cyan top-bar accent line */}
        <div className="auth-top-bar" />

        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <path d="M10 12h12M10 16h8M10 20h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--neon-cyan)' }} />
              </svg>
            </div>
          </div>
          <h1>NexusChat</h1>
          <div className="auth-subtitle">Multi-LLM Chatbot</div>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={!isRegister ? "active" : ""}
            onClick={() => { setIsRegister(false); setError(""); }}
          >
            Sign In
          </button>
          <button
            className={isRegister ? "active" : ""}
            onClick={() => { setIsRegister(true); setError(""); }}
          >
            Create Account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Authenticating..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}