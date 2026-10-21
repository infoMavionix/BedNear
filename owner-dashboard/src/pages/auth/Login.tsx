
import { useState, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Building2,
} from "lucide-react";
import axios from "axios";
import { api } from "../../services/api";

type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type LoginLocationState = {
  registered?: boolean;
  email?: string;
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

    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        email: email.trim(),
        password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error(
          "The server did not return a valid login response."
        );
      }

      // Save the fresh authentication token.
      localStorage.setItem("jwt", token);
      localStorage.setItem("bednear_token", token);
      localStorage.setItem("bednear_user", JSON.stringify(user));

      // Clear the registration success state after login.
      navigate("/dashboard", {
        replace: true,
        state: null,
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Unable to log in. Please check your connection and try again."
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

          <p
            style={{
              margin: 0,
              color: "#77718a",
              fontSize: 14,
            }}
          >
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

          <div
            style={{
              position: "relative",
              marginBottom: 20,
            }}
          >
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
              style={{
                boxSizing: "border-box",
                width: "100%",
                padding: "13px 14px 13px 42px",
                border: "1px solid #ded6eb",
                borderRadius: 10,
                fontSize: 14,
                outlineColor: "#6d28d9",
              }}
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

          <div
            style={{
              position: "relative",
              marginBottom: 22,
            }}
          >
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
              style={{
                boxSizing: "border-box",
                width: "100%",
                padding: "13px 44px 13px 42px",
                border: "1px solid #ded6eb",
                borderRadius: 10,
                fontSize: 14,
                outlineColor: "#6d28d9",
              }}
            />

            <button
              type="button"
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              onClick={() =>
                setShowPassword((value) => !value)
              }
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
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
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
