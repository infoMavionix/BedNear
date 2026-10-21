
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, Mail, LockKeyhole, UserRound, Phone } from "lucide-react";
import axios from "axios";
import { api } from "../../services/api";

type RegisterResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    businessName?: string | null;
  };
};

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<RegisterResponse>("/auth/register", {
        name: name.trim(),
        businessName: businessName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("The server did not return a valid registration response.");
      }

      // Do not automatically log in after registration.
localStorage.removeItem("jwt");
localStorage.removeItem("bednear_token");
localStorage.removeItem("bednear_user");

navigate("/login", {
  replace: true,
  state: {
    registered: true,
    email: user.email,
  },
});
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Registration failed. Please try again."
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Registration failed."
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
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          border: "1px solid #eee7f7",
          borderRadius: 20,
          padding: "32px",
          boxShadow: "0 12px 40px rgba(65, 30, 100, 0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              background: "#6d28d9",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <Building2 size={30} />
          </div>

          <h1 style={{ margin: "0 0 8px", color: "#35116f", fontSize: 27 }}>
            Create your owner account
          </h1>
          <p style={{ margin: 0, color: "#77718a", fontSize: 14 }}>
            Register to list and manage your PG on BedNear.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>
          <div style={{ position: "relative", margin: "8px 0 16px" }}>
            <UserRound size={18} style={{ position: "absolute", left: 13, top: 14, color: "#8b7ca5" }} />
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" required minLength={2} style={inputStyle} />
          </div>

          <label htmlFor="businessName">PG or business name</label>
          <div style={{ position: "relative", margin: "8px 0 16px" }}>
            <Building2 size={18} style={{ position: "absolute", left: 13, top: 14, color: "#8b7ca5" }} />
            <input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your PG business name" style={inputStyle} />
          </div>

          <label htmlFor="email">Email address</label>
          <div style={{ position: "relative", margin: "8px 0 16px" }}>
            <Mail size={18} style={{ position: "absolute", left: 13, top: 14, color: "#8b7ca5" }} />
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required style={inputStyle} />
          </div>

          <label htmlFor="phone">Phone number</label>
          <div style={{ position: "relative", margin: "8px 0 16px" }}>
            <Phone size={18} style={{ position: "absolute", left: 13, top: 14, color: "#8b7ca5" }} />
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Your phone number" autoComplete="tel" style={inputStyle} />
          </div>

          <label htmlFor="password">Password</label>
          <div style={{ position: "relative", margin: "8px 0 16px" }}>
            <LockKeyhole size={18} style={{ position: "absolute", left: 13, top: 14, color: "#8b7ca5" }} />
            <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required minLength={8} style={{ ...inputStyle, paddingRight: 44 }} />
            <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} style={{ position: "absolute", right: 10, top: 10, border: 0, background: "transparent", color: "#786b91", cursor: "pointer", padding: 5 }}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label htmlFor="confirmPassword">Confirm password</label>
          <div style={{ position: "relative", margin: "8px 0 20px" }}>
            <LockKeyhole size={18} style={{ position: "absolute", left: 13, top: 14, color: "#8b7ca5" }} />
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Enter your password again" autoComplete="new-password" required style={inputStyle} />
          </div>

          {error && (
            <div role="alert" style={{ background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", borderRadius: 9, padding: 12, marginBottom: 18, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: "100%", padding: 14, border: 0, borderRadius: 10, background: loading ? "#9b76df" : "#6d28d9", color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "wait" : "pointer" }}>
            {loading ? "Creating account..." : "Create owner account"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#77718a", fontSize: 13, marginTop: 24 }}>
          Already registered?{" "}
          <Link to="/login" style={{ color: "#6d28d9", fontWeight: 700, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
