import React, { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import { resetPasswordApi } from "../../api/AuthApi";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "This password reset link is invalid or incomplete."
      );
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError(
        "Please enter and confirm your new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const passwordRegex =
      /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;

    if (!passwordRegex.test(newPassword)) {
      setError(
        "Password must contain at least one number and one special character."
      );
      return;
    }

    setLoading(true);

    try {
      const result = await resetPasswordApi(
        token,
        newPassword
      );

      setSuccess(
        result?.message ||
        "Password reset successfully."
      );

      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 2500);

    } catch (err) {
      console.error("Reset password error:", err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to reset your password. The reset link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden font-sans">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b2a5b] via-[#123a72] to-[#0a1f3d]" />

      {/* FLOATING CIRCLES */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-6">

        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#0b2a5b] to-[#123a72] p-5 text-center text-white">

            <div className="mx-auto mb-2 flex h-16 items-center justify-center">
              <Lock size={46} strokeWidth={1.5} />
            </div>

            <h2 className="text-sm font-semibold">
              Regional Office 1
            </h2>

            <p className="text-[10px] uppercase opacity-80">
              Department of Education • Region I
            </p>

          </div>

          {/* BODY */}
          <div className="p-5">

            {success ? (
              /* SUCCESS */
              <div className="text-center">

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle
                    size={30}
                    className="text-green-600"
                  />
                </div>

                <h3 className="text-xl font-bold text-[#123a72]">
                  Password Reset Successful
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {success}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Redirecting you to the login page...
                </p>

              </div>
            ) : (
              <>
                {/* TITLE */}
                <div className="mb-5 text-center">

                  <h3 className="text-xl font-bold text-[#123a72]">
                    Reset Password
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Create a new password for your account.
                  </p>

                </div>

                {/* INVALID TOKEN */}
                {!token && (
                  <div className="mb-4 rounded-md border border-red-100 bg-red-50 p-2.5 text-center text-xs font-medium text-red-600">
                    ⚠️ This password reset link is invalid or incomplete.
                  </div>
                )}

                {/* FORM */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >

                  {/* NEW PASSWORD */}
                  <div className="flex flex-col gap-1">

                    <label
                      htmlFor="newPassword"
                      className="px-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      NEW PASSWORD
                    </label>

                    <div className="relative">

                      <input
                        id="newPassword"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        disabled={loading || !token}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm outline-none transition focus:border-[#123a72] focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                      />

                      <button
                        type="button"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        disabled={loading || !token}
                        onClick={() =>
                          setShowPassword(
                            (prev) => !prev
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 disabled:cursor-not-allowed"
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div className="flex flex-col gap-1">

                    <label
                      htmlFor="confirmPassword"
                      className="px-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      CONFIRM PASSWORD
                    </label>

                    <div className="relative">

                      <input
                        id="confirmPassword"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        disabled={loading || !token}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm outline-none transition focus:border-[#123a72] focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                      />

                      <button
                        type="button"
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        disabled={loading || !token}
                        onClick={() =>
                          setShowConfirmPassword(
                            (prev) => !prev
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 disabled:cursor-not-allowed"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* PASSWORD REQUIREMENTS */}
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">

                    <p className="mb-1.5 text-[11px] font-semibold text-slate-700">
                      Password Requirements
                    </p>

                    <ul className="space-y-1 text-[11px] text-slate-500">
                      <li>• At least 8 characters</li>
                      <li>• At least one number</li>
                      <li>• At least one special character</li>
                    </ul>

                  </div>

                  {/* ERROR */}
                  {error && (
                    <div className="rounded-md border border-red-100 bg-red-50 p-2.5 text-center text-xs font-medium text-red-600">
                      ⚠️ {error}
                    </div>
                  )}

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full rounded-md bg-[#123a72] py-2 text-sm font-semibold text-white transition hover:bg-[#0b2a5b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                        Resetting...
                      </span>
                    ) : (
                      "Reset Password"
                    )}
                  </button>

                </form>

                {/* BACK */}
                <div className="mt-5 text-center">

                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#123a72] hover:text-blue-700 hover:underline"
                  >
                    <ArrowLeft size={14} />
                    Back to Login
                  </Link>

                </div>
              </>
            )}

            {/* NOTICE */}
            <div className="mt-5 border-t border-slate-200 pt-3 text-center text-[11px] text-slate-500">

              For account issues, contact the HRMO at{" "}

              <span className="font-semibold text-slate-600">
                hrmo@depedlaunion.ph
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* FOOTER */}
      <footer className="relative z-10 py-4 text-center text-xs text-white">

        <p className="text-white/60">
          © 2026 Regional Office 1
        </p>

      </footer>

    </div>
  );
}