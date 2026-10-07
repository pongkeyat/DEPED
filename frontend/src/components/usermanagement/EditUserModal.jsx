import { useEffect, useState } from "react";
import axios from "axios";
import { X, UserRound, Save } from "lucide-react";

const ROLES = [
    { value: "admin", label: "Administrator" },
    { value: "hro", label: "Human Resource Officer" },
    { value: "hrmpsb", label: "HRMPSB" },
];

const EditUserModal = ({ user, onClose, onUpdated }) => {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        role: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                role: (user.role || "").toLowerCase(),
            });
            setError("");
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!user?.id) {
            setError("User ID is missing.");
            return;
        }

        try {
            setSaving(true);

            const apiUrl =
                import.meta.env.VITE_UPDATE_USER_API ||
                `${import.meta.env.VITE_USER_API || "/api/users"}/${user.id}`;

            const response = await axios.patch(
                apiUrl,
                {
                    first_name: formData.first_name.trim(),
                    last_name: formData.last_name.trim(),
                    email: formData.email.trim(),
                    role: formData.role,
                },
                { withCredentials: true }
            );

            onUpdated({
                ...user,
                ...formData,
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim(),
                role: formData.role,
                ...(response.data?.data || {}),
            });

            onClose();
        } catch (err) {
            console.error("Error updating user:", err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to update user. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    const inputClass =
        "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !saving) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-user-title"
                className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-indigo-50 p-2">
                            <UserRound className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2
                                id="edit-user-title"
                                className="text-lg font-semibold text-gray-800"
                            >
                                Edit User
                            </h2>
                            <p className="text-xs text-gray-500">
                                Update account information and role.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 p-5">
                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="first_name"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    First Name
                                </label>
                                <input
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className={inputClass}
                                    placeholder="Enter first name"
                                    required
                                    maxLength={100}
                                    autoComplete="given-name"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="last_name"
                                    className="mb-1.5 block text-sm font-medium text-gray-700"
                                >
                                    Last Name
                                </label>
                                <input
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className={inputClass}
                                    placeholder="Enter last name"
                                    required
                                    maxLength={100}
                                    autoComplete="family-name"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Enter email address"
                                required
                                maxLength={254}
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="role"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                User Role
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className={inputClass}
                                required
                            >
                                <option value="" disabled>
                                    Select a role
                                </option>
                                {ROLES.map((role) => (
                                    <option
                                        key={role.value}
                                        value={role.value}
                                    >
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={16} />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;