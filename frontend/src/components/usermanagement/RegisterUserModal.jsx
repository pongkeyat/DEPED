import React, { useState } from "react";
import { Info, UserPlus, X, Mail, ShieldCheck, Loader2 } from "lucide-react";
import { registerUser } from "../../api/AuthApi"

export default function RegisterUserModal({ isOpen, onClose, onUserRegistered }) {
  const [form, setForm] = useState({
    email: "",
    role: "hro",
  });

  const [emailError, setEmailError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleForm = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });

    if (name === "email") setEmailError("");
    if (name === "role") setRoleError("");
    setSubmitError(""); // Clear general submission errors on input change
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    let valid = true;
    setEmailError("");
    setRoleError("");
    setSubmitError("");

    if (form.email.trim() === "") {
      setEmailError("Please enter an email address.");
      valid = false;
    }

    if (form.role.trim() === "") {
      setRoleError("Please select a user role.");
      valid = false;
    }

    if (!valid) return;

    setIsLoading(true);

    try {
      // Connects to your API function
      const data = await registerUser(form);
      
      console.log("Registration successful:", data);
      
      // Notify parent component to refresh list or show success banner
      if (onUserRegistered) {
        onUserRegistered(data);
      }
      
      // Reset form fields and close modal on success
      setForm({ email: "", role: "hro" });
      onClose();
    } catch (err) {
      console.error("Registration failed:", err);
      // Extracts backend error messages if provided by Axios/API
      setSubmitError(
        err.response?.data?.message || "Failed to register user. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* MODAL BACKDROP OVERLAY */}
      <div 
        className="absolute inset-0 bg-[#0a1f3d]/60 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined} // Prevent clicking away while saving
      ></div>

      {/* MAIN CONTAINER */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#0b2a5b] to-[#123a72] p-5 text-center text-white relative">
          {!isLoading && (
            <button 
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 text-white/70 hover:text-white transition"
            >
              <X size={18} />
            </button>
          )}
          
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <UserPlus className="h-6 w-6 text-white" />
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
          {/* TITLE */}
          <div className="mb-4 text-center">
            <h3 className="text-xl font-bold text-[#123a72]">
              Register System User
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Personnel Ranking and Selection System
            </p>
          </div>

          {/* BACKEND GENERAL SUBMIT ERROR */}
          {submitError && (
            <div className="mb-4 rounded-md bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
              ⚠️ {submitError}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* EMAIL */}
            <div className="flex flex-col gap-1">
              <label 
                htmlFor="email" 
                className="text-xs font-semibold text-slate-600 uppercase tracking-wide px-0.5 flex items-center gap-1"
              >
                <Mail size={12} className="text-slate-400" />
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                name="email"
                id="email"
                disabled={isLoading}
                placeholder="example@deped.gov.ph"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#123a72] focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                value={form.email}
                onChange={handleForm}
              />
              {emailError && (
                <p className="mt-1 text-left text-xs text-red-600">
                  {emailError}
                </p>
              )}
            </div>

            {/* SYSTEM ROLE */}
            <div className="flex flex-col gap-1">
              <label 
                htmlFor="role" 
                className="text-xs font-semibold text-slate-600 uppercase tracking-wide px-0.5 flex items-center gap-1"
              >
                <ShieldCheck size={12} className="text-slate-400" />
                ASSIGN SYSTEM ROLE
              </label>
              <select
                name="role"
                id="role"
                disabled={isLoading}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#123a72] focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                value={form.role}
                onChange={handleForm}
              >
                <option value="hro">Human Resource Officer (HRO)</option>
                <option value="hrmpsb">HRMPSB Member</option>
                <option value="admin">SUPER ADMIN</option>
              </select>
              {roleError && (
                <p className="mt-1 text-left text-xs text-red-600">
                  {roleError}
                </p>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-1/2 rounded-md border border-slate-300 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-1/2 flex items-center justify-center gap-2 rounded-md bg-[#123a72] py-2 text-sm font-semibold text-white transition hover:bg-[#0b2a5b] disabled:bg-slate-400"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>

          {/* POLICY NOTICE */}
          <div className="mt-4 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
            <p className="flex items-start gap-1 leading-normal">
              <Info size={12} className="text-slate-400 mt-0.5 shrink-0" />
              <span>
                New credentials will be bound by default security access privileges under system admin logging compliance.
              </span>    
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}