
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  UserRound,
  Building2,
  MapPin,
  ShieldCheck,
  Save,
  Pencil,
  CheckCircle2,
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

import {
  getProfile,
  updateProfile,
  changePassword,
  type OwnerProfile,
} from "../../services/profile.service";

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

type PasswordForm = {
  current: string;
  next: string;
  confirm: string;
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

const initialPasswords: PasswordForm = {
  current: "",
  next: "",
  confirm: "",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function toProfileForm(user: OwnerProfile): ProfileForm {
  return {
    ...initialProfile,
    fullName: user.name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    businessName: user.businessName ?? "",
  };
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [savedProfile, setSavedProfile] =
    useState<ProfileForm>(initialProfile);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] =
    useState<PasswordForm>(initialPasswords);

  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordNoticeIsError, setPasswordNoticeIsError] =
    useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setNotice("");
    setNoticeIsError(false);

    try {
      const user = await getProfile();
      const loadedProfile = toProfileForm(user);

      setProfile(loadedProfile);
      setSavedProfile(loadedProfile);
    } catch (error: unknown) {
      setNotice(
        getErrorMessage(
          error,
          "Unable to load your profile. Please log in again and retry."
        )
      );
      setNoticeIsError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setNotice("");
    setNoticeIsError(false);
  };

  const updatePasswordField = (
    field: keyof PasswordForm,
    value: string
  ) => {
    setPasswords((current) => ({ ...current, [field]: value }));
    setPasswordNotice("");
    setPasswordNoticeIsError(false);
  };

  const completedFields = [
    profile.fullName,
    profile.email,
    profile.phone,
    profile.businessName,
  ].filter((value) => value.trim()).length;

  const completion = Math.round((completedFields / 4) * 100);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile.fullName.trim() || profile.fullName.trim().length < 2) {
      setNotice("Enter your full name using at least 2 characters.");
      setNoticeIsError(true);
      return;
    }

    if (
      profile.phone &&
      !/^[6-9]\d{9}$/.test(profile.phone.trim())
    ) {
      setNotice("Enter a valid 10-digit Indian mobile number.");
      setNoticeIsError(true);
      return;
    }

    if (!profile.businessName.trim()) {
      setNotice("Enter your business or PG owner name.");
      setNoticeIsError(true);
      return;
    }

    setSaving(true);
    setNotice("");
    setNoticeIsError(false);

    try {
      const updatedUser = await updateProfile({
        name: profile.fullName.trim(),
        phone: profile.phone.trim() || null,
        businessName: profile.businessName.trim(),
      });

      const updatedProfile: ProfileForm = {
        ...profile,
        fullName: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone ?? "",
        businessName: updatedUser.businessName ?? "",
      };

      setProfile(updatedProfile);
      setSavedProfile(updatedProfile);
      setEditing(false);
      setNotice("Profile updated successfully.");
      setNoticeIsError(false);
    } catch (error: unknown) {
      setNotice(
        getErrorMessage(
          error,
          "Failed to update your profile. Please try again."
        )
      );
      setNoticeIsError(true);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setProfile({ ...savedProfile });
    setEditing(false);
    setNotice("");
    setNoticeIsError(false);
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordNotice("");
    setPasswordNoticeIsError(false);

    if (
      !passwords.current ||
      !passwords.next ||
      !passwords.confirm
    ) {
      setPasswordNotice("Fill in all password fields.");
      setPasswordNoticeIsError(true);
      return;
    }

    if (passwords.next.length < 8) {
      setPasswordNotice(
        "Your new password must contain at least 8 characters."
      );
      setPasswordNoticeIsError(true);
      return;
    }

    if (passwords.next !== passwords.confirm) {
      setPasswordNotice(
        "New password and confirmation do not match."
      );
      setPasswordNoticeIsError(true);
      return;
    }

    if (passwords.current === passwords.next) {
      setPasswordNotice(
        "Your new password must differ from your current password."
      );
      setPasswordNoticeIsError(true);
      return;
    }

    setChangingPassword(true);

    try {
      const message = await changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });

      setPasswords({ ...initialPasswords });
      setPasswordNotice(message || "Password updated successfully.");
      setPasswordNoticeIsError(false);
    } catch (error: unknown) {
      setPasswordNotice(
        getErrorMessage(
          error,
          "Failed to change password. Please try again."
        )
      );
      setPasswordNoticeIsError(true);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page-heading">
        <div>
          <p className="eyebrow">ACCOUNT MANAGEMENT</p>
          <h1>My Profile</h1>
          <p className="dashboard-subtitle">
            Manage your personal information, business details and account
            security.
          </p>
        </div>

        {!editing && !loading && (
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setEditing(true);
              setNotice("");
              setNoticeIsError(false);
            }}
          >
            <Pencil size={16} />
            Edit Profile
          </button>
        )}
      </div>

      {notice && (
        <div
          className={`profile-notice ${
            noticeIsError ? "profile-notice-error" : ""
          }`}
          role={noticeIsError ? "alert" : "status"}
        >
          {noticeIsError ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <div className="profile-section-card">
          <LoaderCircle className="animate-spin" size={24} />
          <p>Loading your profile...</p>
        </div>
      ) : (
        <div className="profile-layout">
          <aside className="profile-sidebar">
            <section className="profile-summary-card">
              <div className="profile-avatar">
                {profile.fullName.trim()
                  ? profile.fullName
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()
                  : <UserRound size={30} />}
              </div>

              <h2>{profile.fullName || "PG Owner"}</h2>
              <p>{profile.businessName || "BedNear Owner Account"}</p>

              <span className="profile-account-badge">
                <CheckCircle2 size={13} />
                Owner Account
              </span>

              <div className="profile-completion">
                <div className="profile-completion-heading">
                  <span>Profile completion</span>
                  <strong>{completion}%</strong>
                </div>

                <div className="profile-progress-track">
                  <div style={{ width: `${completion}%` }} />
                </div>

                <small>
                  Complete your details to help us contact you.
                </small>
              </div>
            </section>

            <section className="profile-help-card">
              <div className="profile-help-icon">
                <ShieldCheck size={21} />
              </div>
              <h3>Keep your account secure</h3>
              <p>
                Use a strong password and keep your contact details up to
                date.
              </p>
            </section>
          </aside>

          <div className="profile-main">
            <form onSubmit={saveProfile}>
              <section className="profile-section-card">
                <div className="profile-section-heading">
                  <div className="profile-section-icon purple">
                    <UserRound size={21} />
                  </div>
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
                      onChange={(event) =>
                        updateField("fullName", event.target.value)
                      }
                      placeholder="Enter your full name"
                      required
                      minLength={2}
                      maxLength={100}
                      disabled={!editing || saving}
                      autoComplete="name"
                    />
                  </label>

                  <label className="room-field">
                    Email Address *
                    <input
                      type="email"
                      value={profile.email}
                      placeholder="you@example.com"
                      required
                      disabled
                      autoComplete="email"
                      title="Email editing is not enabled by the current backend API."
                    />
                    <small>
                      Email changes are not supported by the current backend.
                    </small>
                  </label>

                  <label className="room-field">
                    Mobile Number
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={profile.phone}
                      onChange={(event) =>
                        updateField(
                          "phone",
                          event.target.value.replace(/\D/g, "")
                        )
                      }
                      placeholder="10-digit mobile number"
                      disabled={!editing || saving}
                      autoComplete="tel-national"
                    />
                  </label>
                </div>
              </section>

              <section className="profile-section-card">
                <div className="profile-section-heading">
                  <div className="profile-section-icon orange">
                    <Building2 size={21} />
                  </div>
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
                      onChange={(event) =>
                        updateField("businessName", event.target.value)
                      }
                      placeholder="Enter business or owner name"
                      required
                      maxLength={150}
                      disabled={!editing || saving}
                    />
                  </label>

                  <label className="room-field">
                    Owner Type
                    <select
                      value={profile.ownerType}
                      onChange={(event) =>
                        updateField("ownerType", event.target.value)
                      }
                      disabled={!editing || saving}
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
                  <div className="profile-section-icon green">
                    <MapPin size={21} />
                  </div>
                  <div>
                    <h2>Contact Address</h2>
                    <p>Your address for account and business communication.</p>
                  </div>
                </div>

                <div className="profile-fields-grid">
                  <label className="room-field profile-field-full">
                    Address
                    <input
                      value={profile.address}
                      onChange={(event) =>
                        updateField("address", event.target.value)
                      }
                      placeholder="Building, street and area"
                      disabled={!editing || saving}
                      autoComplete="street-address"
                    />
                  </label>

                  <label className="room-field">
                    Locality
                    <input
                      value={profile.locality}
                      onChange={(event) =>
                        updateField("locality", event.target.value)
                      }
                      placeholder="e.g. Vijayanagar"
                      disabled={!editing || saving}
                    />
                  </label>

                  <label className="room-field">
                    City
                    <input
                      value={profile.city}
                      onChange={(event) =>
                        updateField("city", event.target.value)
                      }
                      disabled={!editing || saving}
                      autoComplete="address-level2"
                    />
                  </label>

                  <label className="room-field">
                    State
                    <input
                      value={profile.state}
                      onChange={(event) =>
                        updateField("state", event.target.value)
                      }
                      disabled={!editing || saving}
                      autoComplete="address-level1"
                    />
                  </label>

                  <label className="room-field">
                    PIN Code
                    <input
                      value={profile.pincode}
                      onChange={(event) =>
                        updateField(
                          "pincode",
                          event.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit PIN code"
                      disabled={!editing || saving}
                      autoComplete="postal-code"
                    />
                  </label>
                </div>

                <p className="dashboard-subtitle">
                  Address and owner type are not saved yet because the current
                  profile API does not support these fields.
                </p>

                {editing && (
                  <div className="profile-form-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="primary-button"
                      disabled={saving}
                    >
                      {saving ? (
                        <LoaderCircle className="animate-spin" size={16} />
                      ) : (
                        <Save size={16} />
                      )}
                      {saving ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                )}
              </section>
            </form>

            <section className="profile-section-card">
              <div className="profile-section-heading">
                <div className="profile-section-icon blue">
                  <LockKeyhole size={21} />
                </div>
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
                        onChange={(event) =>
                          updatePasswordField("current", event.target.value)
                        }
                        placeholder="Enter current password"
                        autoComplete="current-password"
                        required
                        disabled={changingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={
                          showPassword ? "Hide passwords" : "Show passwords"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>
                  </label>

                  <label className="room-field">
                    New Password *
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwords.next}
                      onChange={(event) =>
                        updatePasswordField("next", event.target.value)
                      }
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                      disabled={changingPassword}
                    />
                  </label>

                  <label className="room-field">
                    Confirm New Password *
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(event) =>
                        updatePasswordField("confirm", event.target.value)
                      }
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                      disabled={changingPassword}
                    />
                  </label>
                </div>

                {passwordNotice && (
                  <div
                    className={`profile-notice ${
                      passwordNoticeIsError ? "profile-notice-error" : ""
                    }`}
                    role={passwordNoticeIsError ? "alert" : "status"}
                  >
                    {passwordNoticeIsError ? (
                      <AlertCircle size={18} />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    <span>{passwordNotice}</span>
                  </div>
                )}

                <div className="profile-form-actions">
                  <button
                    type="submit"
                    className="secondary-button"
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                      <LockKeyhole size={16} />
                    )}
                    {changingPassword ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
