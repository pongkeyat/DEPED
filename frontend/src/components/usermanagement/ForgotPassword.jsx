import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  Loader2
} from "lucide-react";
import { forgotPasswordApi } from "../../api/AuthApi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPasswordApi(trimmedEmail);

      setSuccess(
        result?.message ||
        "If an account with that email exists, a password reset link has been sent."
      );

      setEmail("");
    } catch (err) {
      console.error("Forgot password error:", err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to process your request. Please try again."
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
              <Mail size={48} strokeWidth={1.5} />
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

            {!success ? (
              <>
                {/* TITLE */}
                <div className="mb-5 text-center">

                  <h3 className="text-xl font-bold text-[#123a72]">
                    Forgot Password?
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Enter your registered email address and we
                    will send you a password reset link.
                  </p>

                </div>

                {/* FORM */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >

                  {/* ERROR */}
                  {error && (
                    <div className="rounded-md border border-red-100 bg-red-50 p-2.5 text-center text-xs font-medium text-red-600">
                      ⚠️ {error}
                    </div>
                  )}

                  {/* EMAIL */}
                  <div className="flex flex-col gap-1">

                    <label
                      htmlFor="email"
                      className="px-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      EMAIL
                    </label>

                    <div className="relative">

                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError("");
                        }}
                        placeholder="Enter your email"
                        autoComplete="email"
                        disabled={loading}
                        className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[#123a72] focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                      />

                    </div>

                  </div>

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-[#123a72] py-2 text-sm font-semibold text-white transition hover:bg-[#0b2a5b] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                        Sending...
                      </span>
                    ) : (
                      "Send Reset Link"
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
            ) : (
              /* SUCCESS */
              <div className="text-center">

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle
                    size={30}
                    className="text-green-600"
                  />
                </div>

                <h3 className="text-xl font-bold text-[#123a72]">
                  Check Your Email
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {success}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  If you don't see the email, please check your
                  spam or junk folder.
                </p>

                <Link
                  to="/login"
                  className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#123a72] hover:text-blue-700 hover:underline"
                >
                  <ArrowLeft size={14} />
                  Back to Login
                </Link>

              </div>
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