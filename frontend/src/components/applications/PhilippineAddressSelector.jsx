import React, { useEffect, useState } from "react";

const PSGC = "https://psgc.gitlab.io/api";
// Region I (Ilocos Region): Ilocos Norte, Ilocos Sur, La Union, Pangasinan
const REGION_1 = { code: "010000000", name: "Region I (Ilocos Region)" };

const selectClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1E3E74] disabled:cursor-not-allowed disabled:bg-slate-100";

async function getList(path) {
  const res = await fetch(`${PSGC}${path}`);
  if (!res.ok) throw new Error("Failed to load locations");
  const data = await res.json();
  return data
    .map((d) => ({ code: d.code, name: d.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Cascading Philippine address: Province -> City/Municipality -> Barangay -> Street.
 * Data: PSGC public API (psgc.gitlab.io).
 *
 * value:    { province, city, barangay, street }  (each of the first three is {code,name} or null)
 * onChange: (parts, fullAddressString) => void
 */
export default function PhilippineAddressSelector({ value, onChange }) {
  const parts = value || { province: null, city: null, barangay: null, street: "" };

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  const emit = (next) => {
    const full = [
      next.street?.trim(),
      next.barangay?.name,
      next.city?.name,
      next.province?.name,
    ]
      .filter(Boolean)
      .join(", ");
    onChange(next, full);
  };

  // Load provinces once (+ NCR, which has no provinces)
  useEffect(() => {
    let cancelled = false;
    setLoading("provinces");
    getList(`/regions/${REGION_1.code}/provinces/`)
      .then((list) => !cancelled && setProvinces(list))
      .catch(() => !cancelled && setError("Could not load locations. Check your internet connection."))
      .finally(() => !cancelled && setLoading(""));
    return () => {
      cancelled = true;
    };
  }, []);

  // Load cities when province changes (also restores lists when returning to this step)
  useEffect(() => {
    if (!parts.province) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoading("cities");
    const path = parts.province.isRegion
      ? `/regions/${parts.province.code}/cities-municipalities/`
      : `/provinces/${parts.province.code}/cities-municipalities/`;
    getList(path)
      .then((list) => !cancelled && setCities(list))
      .catch(() => !cancelled && setError("Could not load cities/municipalities."))
      .finally(() => !cancelled && setLoading(""));
    return () => {
      cancelled = true;
    };
  }, [parts.province?.code]);

  // Load barangays when city changes
  useEffect(() => {
    if (!parts.city) {
      setBarangays([]);
      return;
    }
    let cancelled = false;
    setLoading("barangays");
    getList(`/cities-municipalities/${parts.city.code}/barangays/`)
      .then((list) => !cancelled && setBarangays(list))
      .catch(() => !cancelled && setError("Could not load barangays."))
      .finally(() => !cancelled && setLoading(""));
    return () => {
      cancelled = true;
    };
  }, [parts.city?.code]);

  const pick = (list, code) => list.find((i) => i.code === code) || null;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="bg-[#1E3E74] px-6 py-3 font-semibold text-white">
        Residential Address
        <span className="ml-2 text-xs font-normal text-blue-100">
          ({REGION_1.name} only)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
        {error && (
          <p className="md:col-span-2 text-sm text-red-600">{error}</p>
        )}

        <label className="text-sm font-medium">
          Province <span className="text-red-500">*</span>
          <select
            required
            className={`${selectClass} mt-1`}
            value={parts.province?.code || ""}
            onChange={(e) =>
              emit({
                province: pick(provinces, e.target.value),
                city: null,
                barangay: null,
                street: parts.street,
              })
            }
          >
            <option value="">
              {loading === "provinces" ? "Loading..." : "-- Select Province --"}
            </option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          City / Municipality <span className="text-red-500">*</span>
          <select
            required
            disabled={!parts.province}
            className={`${selectClass} mt-1`}
            value={parts.city?.code || ""}
            onChange={(e) =>
              emit({
                ...parts,
                city: pick(cities, e.target.value),
                barangay: null,
              })
            }
          >
            <option value="">
              {loading === "cities" ? "Loading..." : "-- Select City / Municipality --"}
            </option>
            {cities.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          Barangay <span className="text-red-500">*</span>
          <select
            required
            disabled={!parts.city}
            className={`${selectClass} mt-1`}
            value={parts.barangay?.code || ""}
            onChange={(e) =>
              emit({ ...parts, barangay: pick(barangays, e.target.value) })
            }
          >
            <option value="">
              {loading === "barangays" ? "Loading..." : "-- Select Barangay --"}
            </option>
            {barangays.map((b) => (
              <option key={b.code} value={b.code}>{b.name}</option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium">
          House/Unit No. &amp; Street <span className="text-red-500">*</span>
          <input
            required
            type="text"
            disabled={!parts.barangay}
            placeholder="e.g. 123 Rizal St."
            className={`${selectClass} mt-1`}
            value={parts.street || ""}
            onChange={(e) => emit({ ...parts, street: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}