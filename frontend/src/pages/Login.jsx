import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ensure this matches your AuthContext file path
import logo from "../assets/Logo.png";
import { BookOpen, Info, ClipboardList, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth(); // Consume the context login method
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState(""); // Captures API error states

  const handleLandingPageClick = () => {
    navigate("/");
  };

  const handleForm = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });

    if (name === "email") setEmailError("");
    if (name === "password") setPasswordError("");
    setSubmitError("");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    let valid = true;
    setEmailError("");
    setPasswordError("");
    setSubmitError("");

    if (form.email.trim() === "") {
      setEmailError("Please enter your email.");
      valid = false;
    }

    if (form.password.trim() === "") {
      setPasswordError("Please enter your password.");
      valid = false;
    }

    if (!valid) return;

    try {
      // login() updates context state and stores 'auth_token' properly
      const result = await login(form);
      console.log("Login Success result:", result);

      // Access safe nested user object returned directly from auth wrapper logic
      const userData = result?.user;
      
      if (userData && userData.isPasswordChanged === false) {
        // Force immediate credential updates for initial logins
        navigate("/change-password");
      } else {
        // Forward directly to system operations hub
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login failed:", err);
      // Fallback extraction handling for structural Axios response errors
      const msg = err.response?.data?.error || err.message || "Invalid credentials. Please try again.";
      setSubmitError(msg);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden font-sans">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b2a5b] via-[#123a72] to-[#0a1f3d]"></div>

      {/* Floating circles */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-6">
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
          
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#0b2a5b] to-[#123a72] p-5 text-center text-white">
            <img
              src={logo}
              alt="logo"
              className="mx-auto mb-2 h-16 object-contain"
            />
            <h2 className="text-sm font-semibold">
              Regional Office 1
            </h2>
            <p className="text-[10px] uppercase opacity-80">
              Department of Education • Region I
            </p>
          </div>

          {/* BODY */}
          <div className="p-5">
            {/* TITLE */}
            <div className="mb-4 text-center">
              <h3 className="text-xl font-bold text-[#123a72]">
                System Login
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Personnel Ranking and Selection System
              </p>
            </div>

            {/* MODULE */}
            <div className="mb-4 rounded-md bg-slate-100 p-2 text-center text-xs text-slate-600">
              📍 Regional Office 1 
            </div>

            {/* FORM */}
            <form onSubmit={handleFormSubmit} className="space-y-3">
              {/* GLOBAL SUBMIT ERROR CONTAINER */}
              {submitError && (
                <div className="rounded-md bg-red-50 p-2.5 text-center text-xs font-medium text-red-600 border border-red-100">
                  ⚠️ {submitError}
                </div>
              )}

              {/* USERNAME / EMAIL */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="email" 
                  className="text-xs font-semibold text-slate-600 uppercase tracking-wide px-0.5"
                >
                  EMAIL
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Email"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#123a72] focus:ring-2 focus:ring-blue-500"
                  value={form.email}
                  onChange={handleForm}
                />
                {emailError && (
                  <p className="mt-1 text-left text-xs text-red-600">
                    {emailError}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="password" 
                  className="text-xs font-semibold text-slate-600 uppercase tracking-wide px-0.5"
                >
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    placeholder="Password"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm outline-none transition focus:border-[#123a72] focus:ring-2 focus:ring-blue-500"
                    value={form.password}
                    onChange={handleForm}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1 text-left text-xs text-red-600">
                    {passwordError}
                  </p>
                )}
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className="w-full rounded-md bg-[#123a72] pt-2 pb-2 mt-2 text-sm font-semibold text-white transition hover:bg-[#0b2a5b]"
              >
                Login
              </button>
            </form>

            {/* ACCOUNT NOTICE */}
            <div className="mt-4 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
              <p className="flex items-center justify-center gap-1">
                <Info size={12} className="text-slate-400" />
                <span>
                  For account issues, contact the HRMO at{" "}
                  <span className="font-semibold text-slate-600">
                    hrmo@depedlaunion.ph
                  </span>
                </span>    
              </p>

              <p className="mt-2 flex items-center justify-center gap-1">
                <BookOpen size={12} className="text-slate-400" />
                <span>
                  Pursuant to{" "}
                  <span className="font-semibold">
                    DepEd Order No. 007, s. 2023
                  </span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE FOOTER */}
      <footer className="relative z-10 py-4 text-center text-xs text-white">
        <button 
          onClick={handleLandingPageClick}
          className="mx-auto flex items-center justify-center gap-1 hover:underline text-white bg-transparent border-none cursor-pointer"
        >
          <ClipboardList size={14} />
          View Available Vacancies (Public)
        </button>
        <p className="mt-1 text-white/60">
          © 2026 Regional Office 1
        </p>
      </footer>
    </div>
  );
}