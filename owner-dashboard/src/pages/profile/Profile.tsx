import { useState } from "react";
import {
  UserRound, Building2, MapPin, ShieldCheck, Save,
  Pencil, CheckCircle2, LockKeyhole, Eye, EyeOff
} from "lucide-react";

type ProfileForm = {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  ownerType: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
};

const initialProfile: ProfileForm = {
  fullName: "",
  email: "",
  phone: "",
  businessName: "",
  ownerType: "Individual Owner",
  address: "",
  locality: "",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "",
};

export default function Profile() {
  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [savedProfile, setSavedProfile] = useState<ProfileForm>(initialProfile);
  const [editing, setEditing] = useState(true);
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordNotice, setPasswordNotice] = useState("");

  const updateField = (field: keyof ProfileForm, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setNotice("");
  };

  const completedFields = [
    profile.fullName,
    profile.email,
    profile.phone,
    profile.businessName,
    profile.address,
    profile.locality,
    profile.city,
    profile.pincode,
  ].filter((value) => value.trim()).length;

  const completion = Math.round((completedFields / 8) * 100);

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!/^[6-9]\d{9}$/.test(profile.phone)) {
      setNotice("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      setNotice("Enter a valid email address.");
      return;
    }

    if (!/^\d{6}$/.test(profile.pincode)) {
      setNotice("Enter a valid 6-digit PIN code.");
      return;
    }

    setSavedProfile({ ...profile });
    setEditing(false);
    setNotice("Profile updated in this demo session.");
  }

  function cancelEdit() {
    setProfile({ ...savedProfile });
    setEditing(false);
    setNotice("");
  }

  function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordNotice("");

    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setPasswordNotice("Fill in all password fields.");
      return;
    }

    if (passwords.next.length < 8) {
      setPasswordNotice("Your new password must contain at least 8 characters.");
      return;
    }

    if (passwords.next !== passwords.confirm) {
      setPasswordNotice("New password and confirmation do not match.");
      return;
    }

    setPasswordNotice(
      "Demo only: connect the password-change API before using this feature."
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-page-heading">
        <div>
          <p className="eyebrow">ACCOUNT MANAGEMENT</p>
          <h1>My Profile</h1>
          <p className="dashboard-subtitle">
            Manage your personal information, business details and account security.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setEditing(true);
              setNotice("");
            }}
          >
            <Pencil size={16} /> Edit Profile
          </button>
        )}
      </div>

      {notice && (
        <div className="profile-notice">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <section className="profile-summary-card">
            <div className="profile-avatar">
              {profile.fullName.trim()
                ? profile.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
                : <UserRound size={30} />}
            </div>

            <h2>{profile.fullName || "PG Owner"}</h2>
            <p>{profile.businessName || "BedNear Owner Account"}</p>

            <span className="profile-account-badge">
              <CheckCircle2 size={13} /> Owner Account
            </span>

            <div className="profile-completion">
              <div className="profile-completion-heading">
                <span>Profile completion</span>
                <strong>{completion}%</strong>
              </div>
              <div className="profile-progress-track">
                <div style={{ width: `${completion}%` }} />
              </div>
              <small>Complete your details to help us contact you.</small>
            </div>
          </section>

          <section className="profile-help-card">
            <div className="profile-help-icon"><ShieldCheck size={21} /></div>
            <h3>Keep your account secure</h3>
            <p>Use a strong password and keep your contact details up to date.</p>
          </section>
        </aside>

        <div className="profile-main">
          <form onSubmit={saveProfile}>
            <section className="profile-section-card">
              <div className="profile-section-heading">
                <div className="profile-section-icon purple"><UserRound size={21} /></div>
                <div>
                  <h2>Personal Information</h2>
                  <p>Your name and contact information.</p>
                </div>
              </div>

              <div className="profile-fields-grid">
                <label className="room-field">
                  Full Name *
                  <input
                    value={profile.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="Enter your full name"
                    required
                    disabled={!editing}
                    autoComplete="name"
                  />
                </label>

                <label className="room-field">
                  Email Address *
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={!editing}
                    autoComplete="email"
                  />
                </label>

                <label className="room-field">
                  Mobile Number *
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={profile.phone}
                    onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit mobile number"
                    required
                    disabled={!editing}
                    autoComplete="tel-national"
                  />
                </label>
              </div>
            </section>

            <section className="profile-section-card">
              <div className="profile-section-heading">
                <div className="profile-section-icon orange"><Building2 size={21} /></div>
                <div>
                  <h2>Business Information</h2>
                  <p>Details about you and your PG business.</p>
                </div>
              </div>

              <div className="profile-fields-grid">
                <label className="room-field">
                  Business / Owner Name *
                  <input
                    value={profile.businessName}
                    onChange={(e) => updateField("businessName", e.target.value)}
                    placeholder="Enter business or owner name"
                    required
                    disabled={!editing}
                  />
                </label>

                <label className="room-field">
                  Owner Type *
                  <select
                    value={profile.ownerType}
                    onChange={(e) => updateField("ownerType", e.target.value)}
                    disabled={!editing}
                  >
                    <option>Individual Owner</option>
                    <option>Partnership</option>
                    <option>Company</option>
                    <option>Property Manager</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="profile-section-card">
              <div className="profile-section-heading">
                <div className="profile-section-icon green"><MapPin size={21} /></div>
                <div>
                  <h2>Contact Address</h2>
                  <p>Your address for account and business communication.</p>
                </div>
              </div>

              <div className="profile-fields-grid">
                <label className="room-field profile-field-full">
                  Address *
                  <input
                    value={profile.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Building, street and area"
                    required
                    disabled={!editing}
                    autoComplete="street-address"
                  />
                </label>

                <label className="room-field">
                  Locality *
                  <input
                    value={profile.locality}
                    onChange={(e) => updateField("locality", e.target.value)}
                    placeholder="e.g. Vijayanagar"
                    required
                    disabled={!editing}
                  />
                </label>

                <label className="room-field">
                  City *
                  <input
                    value={profile.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    required
                    disabled={!editing}
                    autoComplete="address-level2"
                  />
                </label>

                <label className="room-field">
                  State *
                  <input
                    value={profile.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    required
                    disabled={!editing}
                    autoComplete="address-level1"
                  />
                </label>

                <label className="room-field">
                  PIN Code *
                  <input
                    value={profile.pincode}
                    onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit PIN code"
                    required
                    disabled={!editing}
                    autoComplete="postal-code"
                  />
                </label>
              </div>

              {editing && (
                <div className="profile-form-actions">
                  <button type="button" className="cancel-button" onClick={cancelEdit}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    <Save size={16} /> Save Profile
                  </button>
                </div>
              )}
            </section>
          </form>

          <section className="profile-section-card">
            <div className="profile-section-heading">
              <div className="profile-section-icon blue"><LockKeyhole size={21} /></div>
              <div>
                <h2>Account Security</h2>
                <p>Change your password to protect your account.</p>
              </div>
            </div>

            <form onSubmit={submitPassword}>
              <div className="profile-fields-grid">
                <label className="room-field">
                  Current Password *
                  <div className="profile-password-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide passwords" : "Show passwords"}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>

                <label className="room-field">
                  New Password *
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwords.next}
                    onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>

                <label className="room-field">
                  Confirm New Password *
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>
              </div>

              {passwordNotice && (
                <div className="profile-password-notice">{passwordNotice}</div>
              )}

              <div className="profile-form-actions">
                <button type="submit" className="secondary-button">
                  <LockKeyhole size={16} /> Change Password
                </button>
              </div>
            </form>
          </section>

          <div className="demo-notice">
            <ShieldCheck size={17} />
            <span>
              Demo mode: profile information is held in browser memory and is not saved
              to the server. Password changes are not performed. Connect authenticated
              backend endpoints before production use.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
