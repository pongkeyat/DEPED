import {
  Search,
  User,
  Mail,
  Smartphone,
} from "lucide-react";
import { useState } from "react";

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
    address: "",
  });

  const form = formData ?? internal;

  // Compute maximum date allowed (15 years ago from today) to enforce minimum age requirement
  const today = new Date();
  const maxDobYear = today.getFullYear() - 15;
  const maxDobDate = new Date(maxDobYear, today.getMonth(), today.getDate())
    .toISOString()
    .split("T")[0];

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Contact number validation: Only allow up to 11 digits
    if (name === "contactNumber") {
      const numericValue = value.replace(/\D/g, ""); // Remove non-digits
      if (numericValue.length > 11) return;          // Stop typing beyond 11 digits
      value = numericValue;
    }

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
        <button
          type="button"
          className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm text-slate-800 shadow hover:bg-slate-100"
        >
          <Search size={17} />
          Search Existing Applicant
        </button>
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

        {/* ADDRESS */}
        <div>
          <label className="block mb-2 text-sm font-medium text-slate-700">
            Residential Address <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            name="address"
            value={form.address ?? ""}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-[#204a87] focus:ring-2 focus:ring-blue-100 resize-none transition-shadow"
            placeholder="House/Unit No., Street, Barangay, Municipality, Province"
          />
        </div>

      </div>
    </div>
  );
}