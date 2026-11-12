import React, { useState } from "react";
import { Lock, User, LogIn, AlertCircle, Building2, ShieldCheck, KeyRound } from "lucide-react";
import { login } from "../api";
import "./Login.css";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fillDemo = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await login({ username: username.trim(), password });
      // response: { access_token, user: { username, role, full_name, email } }
      if (onLogin) {
        onLogin(response.user);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        {/* Header with App Logo */}
        <div className="login-card__header">
          <div className="login-card__icon-wrap">
            <div className="login-card__icon-inner">
              <Building2 size={24} />
            </div>
          </div>
          <h2 className="login-card__title">Loan Underwriting Portal</h2>
          <p className="login-card__subtitle">
            Enterprise RBAC Authentication • PyTorch &amp; FastAPI Backend
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="login-error">
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="login-card__form">
          <div className="login-input-group">
            <label className="login-label" htmlFor="login-username">
              Username
            </label>
            <div className="login-input-wrap">
              <User size={15} className="login-input-icon" />
              <input
                id="login-username"
                type="text"
                className="login-input"
                placeholder="e.g. sejal or admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="login-input-group">
            <label className="login-label" htmlFor="login-password">
              Password
            </label>
            <div className="login-input-wrap">
              <Lock size={15} className="login-input-icon" />
              <input
                id="login-password"
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Sign In to Underwriting</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Box */}
        <div className="login-demo-box">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <KeyRound size={13} className="text-indigo-400" />
            <span>Demo Test Credentials (Click to fill):</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => fillDemo("sejal", "Sejal800")}
              className="login-demo-pill"
              title="Click to fill Officer credentials"
            >
              Officer: <strong>sejal</strong> / <strong>Sejal800</strong>
            </button>
            <button
              type="button"
              onClick={() => fillDemo("admin", "Admin@123")}
              className="login-demo-pill"
              title="Click to fill Admin credentials"
            >
              Admin: <strong>admin</strong> / <strong>Admin@123</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
