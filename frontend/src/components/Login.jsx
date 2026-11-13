import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  Building2,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { login, register } from "../api";
import "./Login.css";

const ASSURANCES = [
  "Role-based access for credit officers and administrators",
  "Every saved decision is tied to the signed-in officer",
  "Calibrated default risk with plain-language explanations",
];

const DEMO_ACCOUNTS = [
  { role: "Credit officer", username: "sejal", password: "Sejal800" },
  { role: "Administrator", username: "admin", password: "Admin@123" },
];

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.86c2.26-2.09 3.56-5.17 3.56-8.87z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        fill="#111111"
        d="M16.36 12.72c.02 2.44 2.05 3.25 2.08 3.26-.02.06-.33 1.16-1.1 2.29-.66.99-1.35 1.97-2.44 1.99-1.07.02-1.41-.65-2.63-.65-1.22 0-1.6.63-2.62.67-1.05.04-1.85-1.07-2.52-2.05-1.37-2.03-2.42-5.74-1.01-8.24.7-1.24 1.95-2.02 3.31-2.04 1.03-.02 2 .7 2.63.7.63 0 1.81-.86 3.05-.73.52.02 1.98.21 2.92 1.58-.08.05-1.74 1.03-1.72 3.06zm-2-5.97c.55-.68.93-1.62.83-2.56-.8.03-1.78.55-2.35 1.22-.51.6-.96 1.56-.84 2.48.9.07 1.81-.46 2.36-1.14z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"
      />
    </svg>
  );
}

const SSO_PROVIDERS = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "microsoft", label: "Microsoft", Icon: MicrosoftIcon },
  { id: "apple", label: "Apple", Icon: AppleIcon },
  { id: "facebook", label: "Facebook", Icon: FacebookIcon },
];

const EMPTY_LOGIN = { username: "", password: "" };
const EMPTY_SIGNUP = { fullName: "", username: "", email: "", password: "", terms: false };

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [signupForm, setSignupForm] = useState(EMPTY_SIGNUP);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const switchMode = (next) => {
    if (loading || next === mode) return;
    setMode(next);
    setError("");
    setNotice("");
    setShowPassword(false);
  };

  const fillDemo = (account) => {
    setLoginForm({ username: account.username, password: account.password });
    setError("");
    setNotice(`${account.role} demo credentials filled. Press “Sign in” to continue.`);
  };

  const handleSso = (provider) => {
    setError("");
    setNotice(
      `${provider} single sign-on is not configured for this prototype. Use your underwriting username and password below.`
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password) {
      setError("Enter both your username and password.");
      return;
    }
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const response = await login({
        username: loginForm.username.trim(),
        password: loginForm.password,
      });
      if (onLogin) onLogin(response.user);
    } catch (err) {
      setError(err.message || "Sign-in failed. Check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { fullName, username, email, password, terms } = signupForm;

    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setError("Complete every field to create your account.");
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Enter a valid work email address, for example name@bank.internal.");
      return;
    }
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (!terms) {
      setError("Please accept the internal use policy to continue.");
      return;
    }

    setError("");
    setNotice("");
    setLoading(true);
    try {
      const response = await register({
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      if (onLogin) onLogin(response.user);
    } catch (err) {
      setError(err.message || "Account creation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <aside className="login-aside">
        <div className="login-aside__brand">
          <span className="login-aside__mark" aria-hidden="true">
            <Building2 size={18} strokeWidth={1.75} />
          </span>
          <span className="login-aside__brand-name">Loan Approval Predictor</span>
        </div>

        <div className="login-aside__body">
          <p className="login-aside__eyebrow">Credit decision support</p>
          <h1 className="login-aside__title">
            A second pair of eyes on every application.
          </h1>
          <p className="login-aside__text">
            Score an application against a calibrated default-risk model, see what drove the
            estimate, and record the officer behind each decision.
          </p>
          <ul className="login-aside__list">
            {ASSURANCES.map((item) => (
              <li key={item} className="login-aside__item">
                <span className="h-1 w-1 shrink-0 rounded-full bg-white/50" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="login-aside__foot">
          Internal prototype · Home Credit dataset · Not a final credit decision
        </p>
      </aside>

      <main className="login-main">
        <div className="login-panel">
          <div className="login-card">
            <div className="login-mobile-brand">
              <span className="login-mobile-brand__mark" aria-hidden="true">
                <Building2 size={18} strokeWidth={1.75} />
              </span>
              <span className="login-mobile-brand__name">Loan Approval Predictor</span>
            </div>

            <header className="login-card__head">
              <h2 className="login-card__title">{isLogin ? "Sign in" : "Create account"}</h2>
              <p className="login-card__subtitle">
                {isLogin
                  ? "Use your underwriting account to continue."
                  : "New officers register here. Accounts start with the officer role."}
              </p>
            </header>

            {error && (
              <div className="login-error" role="alert">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {notice && (
              <div className="login-notice" role="status">
                <Info size={15} className="mt-0.5 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            {isLogin ? (
              <form onSubmit={handleLogin} className="login-form" noValidate>
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
                      placeholder="Your username"
                      value={loginForm.username}
                      onChange={(e) =>
                        setLoginForm((prev) => ({ ...prev, username: e.target.value }))
                      }
                      autoComplete="username"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="login-input-group">
                  <div className="login-label-row">
                    <label className="login-label" htmlFor="login-password">
                      Password
                    </label>
                    <span className="login-link" aria-hidden="true">
                      Forgot password?
                    </span>
                  </div>
                  <div className="login-input-wrap">
                    <Lock size={15} className="login-input-icon" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      className="login-input login-input--toggle"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                      }
                      autoComplete="current-password"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      className="login-input-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="login-btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="login-form" noValidate>
                <div className="login-input-group">
                  <label className="login-label" htmlFor="signup-name">
                    Full name
                  </label>
                  <div className="login-input-wrap">
                    <User size={15} className="login-input-icon" />
                    <input
                      id="signup-name"
                      type="text"
                      className="login-input"
                      placeholder="Sejal Kumari"
                      value={signupForm.fullName}
                      onChange={(e) =>
                        setSignupForm((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      autoComplete="name"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="login-input-group">
                  <label className="login-label" htmlFor="signup-username">
                    Username
                  </label>
                  <div className="login-input-wrap">
                    <AtSign size={15} className="login-input-icon" />
                    <input
                      id="signup-username"
                      type="text"
                      className="login-input"
                      placeholder="letters, numbers, dots"
                      value={signupForm.username}
                      onChange={(e) =>
                        setSignupForm((prev) => ({ ...prev, username: e.target.value }))
                      }
                      autoComplete="username"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="login-input-group">
                  <label className="login-label" htmlFor="signup-email">
                    Work email
                  </label>
                  <div className="login-input-wrap">
                    <Mail size={15} className="login-input-icon" />
                    <input
                      id="signup-email"
                      type="email"
                      className="login-input"
                      placeholder="name@bank.internal"
                      value={signupForm.email}
                      onChange={(e) =>
                        setSignupForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="login-input-group">
                  <label className="login-label" htmlFor="signup-password">
                    Password
                  </label>
                  <div className="login-input-wrap">
                    <Lock size={15} className="login-input-icon" />
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      className="login-input login-input--toggle"
                      placeholder="At least 8 characters"
                      value={signupForm.password}
                      onChange={(e) =>
                        setSignupForm((prev) => ({ ...prev, password: e.target.value }))
                      }
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="login-input-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <label className="login-terms">
                  <input
                    type="checkbox"
                    checked={signupForm.terms}
                    onChange={(e) =>
                      setSignupForm((prev) => ({ ...prev, terms: e.target.checked }))
                    }
                    disabled={loading}
                  />
                  <span>
                    I understand this prototype is internal decision support and does not
                    replace credit policy.
                  </span>
                </label>

                <button type="submit" className="login-btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="login-switch">
              {isLogin ? "Don’t have an account?" : "Already registered?"}{" "}
              <button
                type="button"
                className="login-switch__link"
                onClick={() => switchMode(isLogin ? "signup" : "login")}
                disabled={loading}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>

            <div className="login-divider">
              <span>Or continue with</span>
            </div>

            <div className="login-social">
              {SSO_PROVIDERS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className="login-social-btn"
                  onClick={() => handleSso(label)}
                  aria-label={`Continue with ${label}`}
                  disabled={loading}
                >
                  <Icon />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {isLogin && (
              <div className="login-demo">
                <p className="login-demo__label">Demo accounts — tap one to fill the form</p>
                <div className="login-demo__row">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.username}
                      type="button"
                      onClick={() => fillDemo(account)}
                      className="login-demo-pill"
                      disabled={loading}
                    >
                      <span className="login-demo-pill__role">{account.role}</span>
                      <span className="login-demo-pill__cred">
                        {account.username} / {account.password}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="login-legal">
            Internal prototype · Home Credit dataset · Not a final credit decision
          </p>
        </div>
      </main>
    </div>
  );
}
