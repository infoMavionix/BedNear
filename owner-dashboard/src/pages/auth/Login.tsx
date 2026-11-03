
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Building2,
} from "lucide-react";
import axios from "axios";

import { api } from "../../services/api";
import { updatePageTitle } from "../../utils/updatePageTitle";

type UserRole = "ADMIN" | "OWNER" | "CANDIDATE";

type LoginResponse = {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive?: boolean;
    phone?: string | null;
    businessName?: string | null;
  };
};

type LoginLocationState = {
  registered?: boolean;
  email?: string;
  from?: {
    pathname?: string;
  };
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const registrationState =
    (location.state as LoginLocationState | null) ?? null;

  const registered = registrationState?.registered === true;
  const registeredEmail = registrationState?.email ?? "";

  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    // Clear any previous account session before signing in.
    sessionStorage.removeItem("bednear_token");
    sessionStorage.removeItem("jwt");
    sessionStorage.removeItem("bednear_user");

    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const { token, user } = response.data;

      // Validate the response.
      if (!token || !user || !user.id || !user.role) {
        throw new Error(
          "The server returned an incomplete login response."
        );
      }

      if (user.isActive === false) {
        throw new Error(
          "Your account is inactive. Please contact support."
        );
      }

      if (!["ADMIN", "OWNER", "CANDIDATE"].includes(user.role)) {
        throw new Error("Your account has an unsupported role.");
      }

      // Candidates cannot access the owner/admin dashboard.
      if (user.role === "CANDIDATE") {
        updatePageTitle();

        setError(
          "This account cannot access the owner dashboard. Please use the BedNear user app."
        );
        return;
      }

      // Save the authenticated session.
      sessionStorage.setItem("bednear_token", token);
      sessionStorage.setItem("jwt", token);
      sessionStorage.setItem("bednear_user", JSON.stringify(user));

      // Set the browser tab title according to the account role.
      updatePageTitle(user.role);

      // Redirect according to the role returned by the backend.
      if (user.role === "ADMIN") {
        navigate("/admin", { replace: true, state: null });
      } else if (user.role === "OWNER") {
        navigate("/dashboard", { replace: true, state: null });
      }
    } catch (err: unknown) {
      updatePageTitle();

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Unable to log in. Check your connection and try again."
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Unable to log in."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    boxSizing: "border-box" as const,
    width: "100%",
    padding: "13px 14px 13px 42px",
    border: "1px solid #ded6eb",
    borderRadius: 10,
    fontSize: 14,
    outlineColor: "#6d28d9",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#f8f6fc",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          boxSizing: "border-box",
          width: "100%",
          maxWidth: 440,
          background: "#ffffff",
          border: "1px solid #eee7f7",
          borderRadius: 20,
          padding: "36px 32px",
          boxShadow: "0 12px 40px rgba(65, 30, 100, 0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              background: "#6d28d9",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Building2 size={30} />
          </div>

          <h1
            style={{
              margin: "0 0 8px",
              color: "#35116f",
              fontSize: 28,
            }}
          >
            Welcome to BedNear
          </h1>

          <p style={{ margin: 0, color: "#77718a", fontSize: 14 }}>
            Sign in to manage your PG properties.
          </p>
        </div>

        {registered && (
          <div
            role="status"
            style={{
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
              borderRadius: 9,
              padding: 12,
              marginBottom: 18,
              fontSize: 13,
            }}
          >
            Account created successfully! Please sign in.
            {registeredEmail ? ` Email: ${registeredEmail}` : ""}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Email address
          </label>

          <div style={{ position: "relative", marginBottom: 20 }}>
            <Mail
              size={18}
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8b7ca5",
              }}
            />

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              required
              style={inputStyle}
            />
          </div>

          <label
            htmlFor="password"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Password
          </label>

          <div style={{ position: "relative", marginBottom: 22 }}>
            <LockKeyhole
              size={18}
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#8b7ca5",
              }}
            />

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              style={{ ...inputStyle, paddingRight: 44 }}
            />

            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((value) => !value)}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                border: 0,
                background: "transparent",
                color: "#786b91",
                cursor: "pointer",
                padding: 5,
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                background: "#fff1f2",
                color: "#be123c",
                border: "1px solid #fecdd3",
                borderRadius: 9,
                padding: 12,
                marginBottom: 18,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              border: 0,
              borderRadius: 10,
              background: loading ? "#9b76df" : "#6d28d9",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            color: "#77718a",
            fontSize: 13,
            marginTop: 24,
          }}
        >
          New to BedNear?{" "}
          <Link
            to="/register"
            style={{
              color: "#6d28d9",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Register your PG account
          </Link>
        </p>
      </div>
    </div>
  );
}

