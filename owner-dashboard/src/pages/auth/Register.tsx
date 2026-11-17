
import {
  useRef,
  useState,
  type FormEvent,
  type CSSProperties,
  type ChangeEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  Building2,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  UserRound,
  Phone,
  MapPin,
  FileText,
  Upload,
  CheckCircle2,
  X,
  ShieldCheck,
} from "lucide-react";

import axios from "axios";
import { api } from "../../services/api";

type RegisterResponse = {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    businessName?: string | null;
    verificationStatus?: string;
  };
};

type OwnerType = "Individual Owner" | "Company";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const inputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  height: 48,
  padding: "12px 14px",
  border: "1px solid #ded6eb",
  borderRadius: 10,
  fontSize: 14,
  color: "#281b3d",
  background: "#fff",
  outlineColor: "#6d28d9",
  fontFamily: "inherit",
};

const labelStyle: CSSProperties = {
  display: "block",
  color: "#35234e",
  fontSize: 13,
  fontWeight: 650,
  marginBottom: 8,
};

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="register-section">
      <div className="register-section-heading">
        <div className="register-section-icon">{icon}</div>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="register-field">
      <label htmlFor={id} style={labelStyle}>
        {label} *
      </label>
      {children}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();

  const ownerIdentityRef = useRef<HTMLInputElement>(null);
  const pgLicenseRef = useRef<HTMLInputElement>(null);

  // Personal information
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Business information
  const [businessName, setBusinessName] = useState("");
  const [ownerType, setOwnerType] =
    useState<OwnerType>("Individual Owner");

  // Business address
  const [address, setAddress] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("");

  // Verification documents
  const [ownerIdentityFile, setOwnerIdentityFile] =
    useState<File | null>(null);

  const [pgLicenseFile, setPgLicenseFile] =
    useState<File | null>(null);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validateFile(file: File, label: string): boolean {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError(
        `${label}: Only PDF, JPG, PNG and WebP files are allowed.`
      );
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`${label}: File size must not exceed 10 MB.`);
      return false;
    }

    return true;
  }

  function handleOwnerIdentityChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;
    setError("");

    if (file && !validateFile(file, "Owner identity document")) {
      event.target.value = "";
      setOwnerIdentityFile(null);
      return;
    }

    setOwnerIdentityFile(file);
  }

  function handlePgLicenseChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;
    setError("");

    if (file && !validateFile(file, "PG licence document")) {
      event.target.value = "";
      setPgLicenseFile(null);
      return;
    }

    setPgLicenseFile(file);
  }

  function removeOwnerIdentity() {
    setOwnerIdentityFile(null);

    if (ownerIdentityRef.current) {
      ownerIdentityRef.current.value = "";
    }
  }

  function removePgLicense() {
    setPgLicenseFile(null);

    if (pgLicenseRef.current) {
      pgLicenseRef.current.value = "";
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (loading) return;

    // Personal information validation
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    const normalizedPhone = phone
      .trim()
      .replace(/[\s()-]/g, "");

    if (!/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
      setError("Please enter a valid phone number with country code if required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Business information validation
    if (businessName.trim().length < 2) {
      setError("Please enter your PG or business name.");
      return;
    }

    // Address validation
    if (address.trim().length < 5) {
      setError("Please enter your complete business address.");
      return;
    }

    if (locality.trim().length < 2) {
      setError("Please enter your locality.");
      return;
    }

    if (city.trim().length < 2 || state.trim().length < 2) {
      setError("Please enter your city and state.");
      return;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setError("Please enter a valid 6-digit PIN code.");
      return;
    }

    // Document validation
    if (!ownerIdentityFile) {
      setError("Please upload your owner identity document.");
      return;
    }

    if (!pgLicenseFile) {
      setError("Please upload your PG licence document.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // Personal information
      formData.append("name", name.trim());
      formData.append("email", normalizedEmail);
      formData.append("phone", normalizedPhone);
      formData.append("password", password);

      // Business information
      formData.append("businessName", businessName.trim());
      formData.append("ownerType", ownerType);

      // Business address
      formData.append("address", address.trim());
      formData.append("locality", locality.trim());
      formData.append("city", city.trim());
      formData.append("state", state.trim());
      formData.append("pincode", pincode.trim());

      // Verification documents
      formData.append("ownerIdentity", ownerIdentityFile);
      formData.append("pgLicense", pgLicenseFile);

      // Do not manually set Content-Type here.
      // Axios/browser will generate the multipart boundary.
      const response = await api.post<RegisterResponse>(
        "/auth/register",
        formData
      );

      const { user } = response.data;

      if (!user) {
        throw new Error(
          "The server did not return a valid registration response."
        );
      }

      // Registration does not automatically log the owner in.
      sessionStorage.removeItem("jwt");
      sessionStorage.removeItem("bednear_token");
      sessionStorage.removeItem("bednear_user");

      localStorage.removeItem("jwt");
      localStorage.removeItem("bednear_token");
      localStorage.removeItem("bednear_user");

      navigate("/login", {
        replace: true,
        state: {
          registered: true,
          email: user.email,
          message:
            response.data.message ||
            "Your registration has been submitted. Your account is waiting for admin verification.",
        },
      });
    } catch (err) {
      console.error("Owner registration error:", err);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const serverMessage = err.response?.data?.message;

        if (status === 409) {
          setError(
            "This email address is already registered. Please sign in using your existing account."
          );
        } else if (status === 400) {
          setError(
            serverMessage ||
              "Please check your registration details and uploaded documents."
          );
        } else if (status === 413) {
          setError(
            "Uploaded documents are too large. Maximum size is 10 MB per document."
          );
        } else if (status === 401) {
          setError(
            serverMessage || "Your request could not be authorized."
          );
        } else if (status === 500) {
          setError(
            serverMessage ||
              "A server error occurred while submitting registration."
          );
        } else if (!err.response) {
          setError(
            "Cannot connect to the server. Please check whether the backend is running."
          );
        } else {
          setError(
            serverMessage ||
              `Registration failed. Server returned ${status}.`
          );
        }
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function renderPasswordField(
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    visible: boolean,
    toggle: () => void,
    placeholder: string
  ) {
    return (
      <Field id={id} label={label}>
        <div className="register-input-wrap">
          <LockKeyhole
            size={17}
            className="register-input-icon"
          />

          <input
            id={id}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            autoComplete="new-password"
            required
            minLength={8}
            style={{
              ...inputStyle,
              paddingLeft: 42,
              paddingRight: 45,
            }}
          />

          <button
            type="button"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={toggle}
            className="register-eye-button"
          >
            {visible ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>
      </Field>
    );
  }

  function renderFileUpload(
    title: string,
    description: string,
    file: File | null,
    inputRef: RefObject<HTMLInputElement | null>,
    onChange: (event: ChangeEvent<HTMLInputElement>) => void,
    onRemove: () => void,
    inputId: string
  ) {
    return (
      <div className="register-field">
        <label htmlFor={inputId} style={labelStyle}>
          {title} *
        </label>

        <p className="register-upload-description">
          {description}
        </p>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          onChange={onChange}
          style={{ display: "none" }}
        />

        {!file ? (
          <label
            htmlFor={inputId}
            className="register-upload-box"
          >
            <div className="register-upload-icon">
              <Upload size={24} />
            </div>

            <strong>Choose document</strong>

            <span>
              PDF, JPG, PNG or WebP
              <br />
              Maximum file size: 10 MB
            </span>
          </label>
        ) : (
          <div className="register-selected-file">
            <FileText size={25} color="#15803d" />

            <div className="register-selected-file-info">
              <strong>{file.name}</strong>
              <span>
                {(file.size / (1024 * 1024)).toFixed(2)} MB · Selected
              </span>
            </div>

            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${title}`}
              className="register-remove-file"
            >
              <X size={19} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="register-page">
      <style>{`
        .register-page,
        .register-page * {
          box-sizing: border-box;
        }

        .register-page {
          min-height: 100vh;
          width: 100%;
          padding: 28px clamp(14px, 3vw, 48px);
          background: #f7f5fb;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #281b3d;
        }

        .register-container {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #eee7f7;
          border-radius: 20px;
          padding: clamp(20px, 3vw, 42px);
          box-shadow: 0 12px 40px rgba(65, 30, 100, 0.06);
        }

        .register-header {
          text-align: center;
          margin: 0 auto 34px;
        }

        .register-logo {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          border-radius: 17px;
          background: #6d28d9;
          color: white;
        }

        .register-header h1 {
          margin: 0 0 9px;
          color: #35116f;
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 750;
          letter-spacing: -0.6px;
        }

        .register-header p {
          margin: 0;
          color: #827791;
          font-size: 14px;
          line-height: 1.6;
        }

        .register-section {
          padding: clamp(17px, 2vw, 26px);
          margin-bottom: 22px;
          border: 1px solid #eee7f7;
          border-radius: 15px;
          background: #fff;
        }

        .register-section-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 24px;
        }

        .register-section-icon {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f2eaff;
          color: #6d28d9;
        }

        .register-section-heading h2 {
          margin: 0;
          color: #35116f;
          font-size: 17px;
          font-weight: 700;
        }

        .register-section-heading p {
          margin: 5px 0 0;
          color: #8b7ca5;
          font-size: 12px;
          line-height: 1.5;
        }

        .register-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .register-grid-two {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .register-field {
          min-width: 0;
        }

        .register-input-wrap {
          position: relative;
          width: 100%;
        }

        .register-input-icon {
          position: absolute;
          left: 13px;
          top: 15px;
          color: #8b7ca5;
          pointer-events: none;
        }

        .register-input-wrap input {
          padding-left: 42px !important;
        }

        .register-input-wrap input:focus,
        .register-field input:focus,
        .register-field select:focus,
        .register-field textarea:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.09);
          outline: none;
        }

        .register-eye-button {
          position: absolute;
          right: 10px;
          top: 9px;
          padding: 6px;
          border: 0;
          background: transparent;
          color: #786b91;
          cursor: pointer;
        }

        .register-upload-description {
          color: #827791;
          font-size: 12px;
          line-height: 1.6;
          min-height: 38px;
          margin: 0 0 12px;
        }

        .register-upload-box {
          min-height: 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 20px;
          border: 1.5px dashed #c9b5e8;
          border-radius: 13px;
          background: #fcfaff;
          color: #6d28d9;
          cursor: pointer;
          text-align: center;
          transition: background .2s, border-color .2s;
        }

        .register-upload-box:hover {
          background: #f6efff;
          border-color: #8b5cf6;
        }

        .register-upload-box strong {
          font-size: 14px;
        }

        .register-upload-box span {
          color: #8b7ca5;
          font-size: 11px;
          line-height: 1.6;
        }

        .register-upload-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f0e7ff;
        }

        .register-selected-file {
          min-height: 100px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          background: #f0fdf4;
        }

        .register-selected-file-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .register-selected-file-info strong {
          color: #166534;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .register-selected-file-info span {
          color: #4b7c5b;
          font-size: 11px;
        }

        .register-remove-file {
          border: 0;
          background: transparent;
          color: #b91c1c;
          padding: 6px;
          cursor: pointer;
        }

        .register-notice {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          background: #f7f3ff;
          margin-top: 22px;
        }

        .register-notice p {
          margin: 0;
          color: #67547e;
          font-size: 12px;
          line-height: 1.7;
        }

        .register-error {
          padding: 14px 16px;
          margin-bottom: 20px;
          border: 1px solid #fecdd3;
          border-radius: 10px;
          background: #fff1f2;
          color: #be123c;
          font-size: 13px;
          line-height: 1.5;
        }

        .register-submit {
          width: 100%;
          min-height: 54px;
          padding: 15px 20px;
          border: 0;
          border-radius: 11px;
          background: #6d28d9;
          color: white;
          font-size: 15px;
          font-weight: 750;
          cursor: pointer;
          transition: background .2s, transform .2s;
        }

        .register-submit:hover:not(:disabled) {
          background: #5b21b6;
          transform: translateY(-1px);
        }

        .register-submit:disabled {
          opacity: .7;
          cursor: wait;
        }

        .register-footer {
          text-align: center;
          color: #77718a;
          font-size: 13px;
          margin: 25px 0 0;
        }

        .register-footer a {
          color: #6d28d9;
          font-weight: 750;
          text-decoration: none;
        }

        .register-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 900px) {
          .register-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .register-page {
            padding: 0;
            background: #fff;
          }

          .register-container {
            padding: 22px 16px 30px;
            border: 0;
            border-radius: 0;
            box-shadow: none;
          }

          .register-header {
            margin-bottom: 25px;
          }

          .register-header h1 {
            font-size: 24px;
          }

          .register-section {
            padding: 17px 14px;
            margin-bottom: 16px;
            border-radius: 13px;
          }

          .register-section-heading {
            margin-bottom: 20px;
          }

          .register-section-heading h2 {
            font-size: 15px;
          }

          .register-grid,
          .register-grid-two {
            grid-template-columns: minmax(0, 1fr);
            gap: 17px;
          }

          .register-upload-description {
            min-height: auto;
          }

          .register-upload-box {
            min-height: 135px;
          }
        }
      `}</style>

      <main className="register-container">
        <header className="register-header">
          <div className="register-logo">
            <Building2 size={31} />
          </div>

          <h1>Create your owner account</h1>

          <p>
            Register your PG business and submit documents for
            verification.
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          {/* PERSONAL INFORMATION */}
          <Section
            icon={<UserRound size={22} />}
            title="Personal Information"
            description="Enter your contact and login details."
          >
            <div className="register-grid">
              <Field id="name" label="Full name">
                <div className="register-input-wrap">
                  <UserRound
                    size={17}
                    className="register-input-icon"
                  />
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                    minLength={2}
                    style={{
                      ...inputStyle,
                      paddingLeft: 42,
                    }}
                  />
                </div>
              </Field>

              <Field id="email" label="Email address">
                <div className="register-input-wrap">
                  <Mail
                    size={17}
                    className="register-input-icon"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    style={{
                      ...inputStyle,
                      paddingLeft: 42,
                    }}
                  />
                </div>
              </Field>

              <Field id="phone" label="Mobile number">
                <div className="register-input-wrap">
                  <Phone
                    size={17}
                    className="register-input-icon"
                  />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    autoComplete="tel"
                    required
                    style={{
                      ...inputStyle,
                      paddingLeft: 42,
                    }}
                  />
                </div>
              </Field>

              {renderPasswordField(
                "password",
                "Password",
                password,
                setPassword,
                showPassword,
                () => setShowPassword((value) => !value),
                "At least 8 characters"
              )}

              {renderPasswordField(
                "confirmPassword",
                "Confirm password",
                confirmPassword,
                setConfirmPassword,
                showConfirmPassword,
                () => setShowConfirmPassword((value) => !value),
                "Enter password again"
              )}
            </div>
          </Section>

          {/* BUSINESS INFORMATION */}
          <Section
            icon={<Building2 size={22} />}
            title="Business Information"
            description="Details about your PG business."
          >
            <div className="register-grid-two">
              <Field
                id="businessName"
                label="PG or business name"
              >
                <input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter PG business name"
                  required
                  minLength={2}
                  style={inputStyle}
                />
              </Field>

              <Field id="ownerType" label="Owner type">
                <select
                  id="ownerType"
                  value={ownerType}
                  onChange={(e) =>
                    setOwnerType(e.target.value as OwnerType)
                  }
                  style={inputStyle}
                >
                  <option value="Individual Owner">
                    Individual Owner
                  </option>
                  <option value="Company">Company</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* BUSINESS ADDRESS */}
          <Section
            icon={<MapPin size={22} />}
            title="Business Address"
            description="Provide the registered PG or business address."
          >
            <div className="register-grid-two">
              <div
                className="register-field"
                style={{ gridColumn: "1 / -1" }}
              >
                <label htmlFor="address" style={labelStyle}>
                  Complete address *
                </label>

                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Building number, street, area and landmark"
                  required
                  rows={3}
                  style={{
                    ...inputStyle,
                    height: "auto",
                    minHeight: 90,
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <Field id="locality" label="Locality">
                <input
                  id="locality"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="Whitefield"
                  required
                  style={inputStyle}
                />
              </Field>

              <Field id="city" label="City">
                <input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  style={inputStyle}
                />
              </Field>

              <Field id="state" label="State">
                <input
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  style={inputStyle}
                />
              </Field>

              <Field id="pincode" label="PIN code">
                <input
                  id="pincode"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) =>
                    setPincode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  placeholder="560001"
                  required
                  style={inputStyle}
                />
              </Field>
            </div>
          </Section>

          {/* DOCUMENT VERIFICATION */}
          <Section
            icon={<ShieldCheck size={22} />}
            title="Owner & PG Verification"
            description="Upload documents for BedNear admin verification."
          >
            <div className="register-grid-two">
              {renderFileUpload(
                "Owner identity proof",
                "Upload Aadhaar, PAN card, passport or driving licence.",
                ownerIdentityFile,
                ownerIdentityRef,
                handleOwnerIdentityChange,
                removeOwnerIdentity,
                "ownerIdentity"
              )}

              {renderFileUpload(
                "PG licence document",
                "Upload your applicable PG, trade or establishment licence.",
                pgLicenseFile,
                pgLicenseRef,
                handlePgLicenseChange,
                removePgLicense,
                "pgLicense"
              )}
            </div>

            <div className="register-notice">
              <CheckCircle2
                size={21}
                color="#6d28d9"
                style={{ flexShrink: 0 }}
              />

              <p>
                Your documents will be stored privately and reviewed
                by authorized BedNear administrators. Your owner
                account will remain pending until verification is
                completed. You will be able to access the owner
                dashboard after approval.
              </p>
            </div>
          </Section>

          {error && (
            <div className="register-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="register-submit"
          >
            {loading
              ? "Submitting registration..."
              : "Submit registration for verification"}
          </button>
        </form>

        <p className="register-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </main>
    </div>
  );
}
