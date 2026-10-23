import {
  User,
  Mail,
  Smartphone,
} from "lucide-react";
import { useState } from "react";

// NOTE: Residential Address is now handled by <PhilippineAddressSelector />
// (rendered right below this card in ReceiveApplications.jsx).

// Local-time YYYY-MM-DD (toISOString() uses UTC and can be a day off).
const toLocalISODate = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export default function ApplicantForm({ formData, onChange }) {
  const [internal, setInternal] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    suffix: "",
    sex: "",
    dob: "",
    civilStatus: "",
    contactNumber: "",
    email: "",
  });

  const form = formData ?? internal;

  // Latest allowed birthdate: 15 years before today (minimum age requirement).
  // This is always earlier than today, so future dates can never be picked.
  const today = new Date();
  const maxDobDate = toLocalISODate(
    new Date(today.getFullYear() - 15, today.getMonth(), today.getDate())
  );

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Contact number validation: Only allow up to 11 digits
    if (name === "contactNumber") {
      const numericValue = value.replace(/\D/g, ""); // Remove non-digits
      if (numericValue.length > 11) return;          // Stop typing beyond 11 digits
      value = numericValue;
    }

    // Date of birth: reject dates past the allowed maximum (also when typed by hand)
    if (name === "dob" && value && value > maxDobDate) return;

    if (onChange) onChange(name, value);
    else setInternal((prev) => ({ ...prev, [name]: value }));
  };

  const input =
    "w-full h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-[#204a87] focus:ring-2 focus:ring-blue-100 transition-shadow";

  // Shared wrapper style for fields containing prefix icons to handle dynamic focus rings cleanly
  const iconInputWrapper =
    "flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-[#204a87] focus-within:ring-2 focus-within:ring-blue-100 transition-shadow";

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">

      {/* HEADER */}
      <div className="bg-[#204a87] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white">
            2
          </div>
          <User size={17} className="text-white" />
          <h2 className="font-semibold text-lg text-white">
            Applicant Information
          </h2>
        </div>
      </div>

      {/* BODY */}
      <div className="p-4 space-y-5">

        {/* FIRST ROW */}
        <div className="grid grid-cols-12 gap-4">
          {/* LAST NAME */}
          <div className="col-span-12 md:col-span-4">
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              required
              value={form.lastName ?? ""}
              onChange={handleChange}
              className={input}
              placeholder="DELA CRUZ"
            />
          </div>

          {/* FIRST NAME */}
          <div className="col-span-12 md:col-span-4">
            <label className="block mb-2 text-sm font-medium text-slate-700">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              required
              value={form.firstName ?? ""}
              onChange={handleChange}
              className={input}
              placeholder="JUAN"
            />
          </div>

          {/* MIDDLE NAME */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Middle Name
            </label>
            <input
              type="text"
              name="middleName"
              value={form.middleName ?? ""}
              onChange={handleChange}
              className={input}
              placeholder="SANTOS"
            />
          </div>

          {/* SUFFIX */}
          <div className="col-span-12 md:col-span-1">
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Suffix
            </label>
            <select
              name="suffix"
              value={form.suffix ?? ""}
              onChange={handleChange}
              className={input}
            >
              <option value="">—</option>
              <option value="Jr.">Jr.</option>
              <option value="Sr.">Sr.</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
            </select>
          </div>
        </div>

        {/* SECOND ROW */}
        <div className="grid grid-cols-12 gap-4">
          {/* SEX */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Sex <span className="text-red-500">*</span>
            </label>
            <select
              name="sex"
              required
              value={form.sex ?? ""}
              onChange={handleChange}
              className={input}
            >
              <option value="">-- Select --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* DATE OF BIRTH */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dob"
              required
              max={maxDobDate}
              value={form.dob ?? ""}
              onChange={handleChange}
              className={input}
            />
          </div>

          {/* CIVIL STATUS */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Civil Status
            </label>
            <select
              name="civilStatus"
              value={form.civilStatus ?? ""}
              onChange={handleChange}
              className={input}
            >
              <option value="">-- Select --</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
            </select>
          </div>

          {/* CONTACT NUMBER */}
          <div className="col-span-12 md:col-span-3">
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <div className={iconInputWrapper}>
              <div className="flex w-11 items-center justify-center bg-slate-100 border-r border-slate-300">
                <Smartphone
                  size={17}
                  className="text-[#204a87]"
                />
              </div>
              <input
                type="tel"
                name="contactNumber"
                required
                pattern="09[0-9]{9}"
                title="11-digit mobile number starting with 09"
                value={form.contactNumber ?? ""}
                onChange={handleChange}
                placeholder="09XXXXXXXXX"
                className="h-10 flex-1 px-3 text-sm bg-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* EMAIL */}
        <div>
          <label className="block mb-2 text-sm font-medium text-slate-700">
            Email Address
          </label>
          <div className={iconInputWrapper}>
            <div className="flex w-11 items-center justify-center bg-slate-100 border-r border-slate-300">
              <Mail
                size={17}
                className="text-[#204a87]"
              />
            </div>
            <input
              type="email"
              name="email"
              value={form.email ?? ""}
              onChange={handleChange}
              placeholder="juandelacruz@email.com"
              className="h-10 flex-1 px-3 text-sm bg-transparent outline-none"
            />
          </div>
        </div>

      </div>
    </div>
  );
}