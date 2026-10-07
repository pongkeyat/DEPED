import { useState } from "react";
import { Info, UserPlus, X, Mail, ShieldCheck, User, Loader2 } from "lucide-react";
import { registerUser } from "../../api/AuthApi"

export default function RegisterUserModal({ isOpen, onClose, onUserRegistered }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "hro",
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [emailDeliveryAccepted, setEmailDeliveryAccepted] = useState(null);

  const handleForm = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });

    // Clear specific field error on typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    setSubmitError("");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (registrationComplete) return;

    let newErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = "First name is required.";
    if (!form.last_name.trim()) newErrors.last_name = "Last name is required.";
    if (!form.email.trim()) newErrors.email = "Please enter an email address.";
    if (!form.role.trim()) newErrors.role = "Please select a user role.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const data = await registerUser(form);
      
      console.log("Registration successful:", data);
      
      if (onUserRegistered) {
        onUserRegistered(data);
      }

      if (
        data.emailAccepted === false ||
        data.emailSent === false ||
        data.emailStatus === "FAILED" ||
        data.message?.includes("welcome email failed")
      ) {
        setRegistrationComplete(true);
        setEmailDeliveryAccepted(false);
        setSubmitError(
          data.message ||
            "The account was created, but the welcome email could not be sent. Check the backend mail logs."
        );
        return;
      }

      const emailWasAccepted =
        data.emailAccepted === true ||
        data.emailStatus === "ACCEPTED" ||
        data.emailSent === true ||
        data.emailStatus === "SENT" ||
        data.message?.includes("accepted by SMTP") ||
        data.message?.includes("credentials emailed");
      setRegistrationComplete(true);
      setEmailDeliveryAccepted(emailWasAccepted);
      setSubmitError(
        emailWasAccepted
          ? "The account was created and the mail server accepted the welcome email, but inbox delivery is not confirmed. Check Spam/Junk or ask your mail administrator to check quarantine."
          : "The account was created, but the server did not report whether the welcome email was accepted. Restart the backend and check its mail logs."
      );
    } catch (err) {
      console.error("Registration failed:", err);
      setSubmitError(
        err.response?.data?.error || err.response?.data?.message || "Failed to register user. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setForm({ first_name: "", last_name: "", email: "", role: "hro" });
    setErrors({});
    setSubmitError("");
    setRegistrationComplete(false);
    setEmailDeliveryAccepted(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* MODAL BACKDROP OVERLAY */}
      <div 
        className="absolute inset-0 bg-[#0a1f3d]/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      ></div>

      {/* MAIN CONTAINER */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#0b2a5b] to-[#123a72] p-5 text-center text-white relative">
          {!isLoading && (
            <button 
              type="button"
              onClick={handleClose}
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
            <div className={`mb-4 rounded-md p-2.5 text-xs border ${
              registrationComplete && emailDeliveryAccepted
                ? "bg-blue-50 text-blue-800 border-blue-200"
                : registrationComplete
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-red-50 text-red-600 border-red-200"
            }`}>
              ⚠️ {submitError}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleFormSubmit} className="space-y-3">
            
            {/* FIRST NAME & LAST NAME ROW */}
            <div className="grid grid-cols-2 gap-2">
              {/* FIRST NAME */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="first_name" 
                  className="text-xs font-semibold text-slate-600 uppercase tracking-wide px-0.5 flex items-center gap-1"
                >
                  <User size={12} className="text-slate-400" />
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  id="first_name"
                  disabled={isLoading || registrationComplete}
                  placeholder="Juan"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#123a72] focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                  value={form.first_name}
                  onChange={handleForm}
                />
                {errors.first_name && (
                  <p className="text-[10px] text-red-600">{errors.first_name}</p>
                )}
              </div>

              {/* LAST NAME */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="last_name" 
                  className="text-xs font-semibold text-slate-600 uppercase tracking-wide px-0.5 flex items-center gap-1"
                >
                  <User size={12} className="text-slate-400" />
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  id="last_name"
                  disabled={isLoading || registrationComplete}
                  placeholder="Dela Cruz"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#123a72] focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                  value={form.last_name}
                  onChange={handleForm}
                />
                {errors.last_name && (
                  <p className="text-[10px] text-red-600">{errors.last_name}</p>
                )}
              </div>
            </div>

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
                disabled={isLoading || registrationComplete}
                placeholder="example@deped.gov.ph"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#123a72] focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                value={form.email}
                onChange={handleForm}
              />
              {errors.email && (
                <p className="text-[10px] text-red-600">{errors.email}</p>
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
                disabled={isLoading || registrationComplete}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#123a72] focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                value={form.role}
                onChange={handleForm}
              >
                <option value="hro">Human Resource Officer (HRO)</option>
                <option value="hrmpsb">HRMPSB Member</option>
                <option value="admin">SUPER ADMIN</option>
              </select>
              {errors.role && (
                <p className="text-[10px] text-red-600">{errors.role}</p>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="w-1/2 rounded-md border border-slate-300 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type={registrationComplete ? "button" : "submit"}
                disabled={isLoading}
                onClick={registrationComplete ? handleClose : undefined}
                className="w-1/2 flex items-center justify-center gap-2 rounded-md bg-[#123a72] py-2 text-sm font-semibold text-white transition hover:bg-[#0b2a5b] disabled:bg-slate-400"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  registrationComplete ? "Close" : "Create Account"
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