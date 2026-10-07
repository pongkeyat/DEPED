import { useEffect, useState } from "react";
import {
    X,
    Pencil,
    Archive,
    Save,
    UserRound
} from "lucide-react";
import {
    getAllUsers,
    updateUser,
    archiveUser
} from "../../api/AuthApi";

const ROLES = [
    { value: "admin", label: "Administrator" },
    { value: "hro", label: "Human Resource Officer" },
    { value: "hrmpsb", label: "HRMPSB" }
];

const UserManagementTable = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // EDIT USER
    const [selectedUser, setSelectedUser] = useState(null);

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        role: ""
    });

    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState("");

    // CONFIRMATION MODALS
    const [showUpdateConfirmation, setShowUpdateConfirmation] =
        useState(false);

    const [confirmArchiveUser, setConfirmArchiveUser] =
        useState(null);

    const [archiving, setArchiving] = useState(false);

    // =========================================================
    // GET ALL ACTIVE USERS
    // =========================================================
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getAllUsers();

            const userList = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.data?.data)
                    ? response.data.data
                    : Array.isArray(response?.users)
                        ? response.users
                        : [];

            setUsers(
                userList.filter(user => !user.is_archived)
            );
        } catch (err) {
            console.error("Error fetching users:", err);

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to load users."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // =========================================================
    // FORMAT ROLE
    // =========================================================
    const formatRole = (role) => {
        if (!role) return "N/A";

        const matchedRole = ROLES.find(
            item =>
                item.value === role.toLowerCase()
        );

        return matchedRole?.label || role;
    };

    // =========================================================
    // OPEN EDIT MODAL
    // =========================================================
    const handleEdit = (user) => {
        setSelectedUser(user);

        setFormData({
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email: user.email || "",
            role: user.role?.toLowerCase() || ""
        });

        setModalError("");
    };

    // =========================================================
    // CLOSE EDIT MODAL
    // =========================================================
    const handleCloseModal = () => {
        if (saving) return;

        setSelectedUser(null);
        setModalError("");
        setShowUpdateConfirmation(false);
    };

    // =========================================================
    // HANDLE FORM CHANGES
    // =========================================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // =========================================================
    // SAVE BUTTON
    // ONLY VALIDATES AND OPENS CONFIRMATION
    // =========================================================
    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!selectedUser?.id) {
            setModalError(
                "Unable to identify the selected user."
            );
            return;
        }

        const payload = {
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            role: formData.role
        };

        if (
            !payload.first_name ||
            !payload.last_name ||
            !payload.email ||
            !payload.role
        ) {
            setModalError(
                "Please complete all fields."
            );
            return;
        }

        setModalError("");

        // DO NOT UPDATE YET
        // SHOW CONFIRMATION FIRST
        setShowUpdateConfirmation(true);
    };

    // =========================================================
    // CONFIRM UPDATE
    // THIS ACTUALLY CALLS THE API
    // =========================================================
    const confirmUpdate = async () => {
        if (!selectedUser?.id) return;

        const payload = {
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            role: formData.role
        };

        try {
            setSaving(true);
            setModalError("");

            const response = await updateUser(
                selectedUser.id,
                payload
            );

            const returnedUser =
                response?.data?.user ||
                response?.user ||
                (
                    response?.data &&
                    !Array.isArray(response.data) &&
                    typeof response.data === "object"
                        ? response.data
                        : {}
                );

            const updatedUser = {
                ...selectedUser,
                ...payload,
                ...returnedUser
            };

            setUsers(prev =>
                prev.map(user =>
                    user.id === selectedUser.id
                        ? updatedUser
                        : user
                )
            );

            // CLOSE BOTH MODALS
            setShowUpdateConfirmation(false);
            setSelectedUser(null);
        } catch (err) {
            console.error(
                "Failed to update user:",
                err
            );

            setModalError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to update user."
            );

            setShowUpdateConfirmation(false);
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // OPEN ARCHIVE CONFIRMATION
    // =========================================================
    const handleArchiveClick = (user) => {
        setConfirmArchiveUser(user);
    };

    // =========================================================
    // CONFIRM ARCHIVE
    // =========================================================
    const handleArchive = async () => {
        if (!confirmArchiveUser) return;

        try {
            setArchiving(true);
            setError("");

            await archiveUser(
                confirmArchiveUser.id
            );

            setUsers(prev =>
                prev.filter(
                    user =>
                        user.id !==
                        confirmArchiveUser.id
                )
            );

            setConfirmArchiveUser(null);
        } catch (err) {
            console.error(
                "Failed to archive user:",
                err
            );

            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to archive user."
            );
        } finally {
            setArchiving(false);
        }
    };

    // =========================================================
    // LOADING STATE
    // =========================================================
    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <p className="text-sm text-gray-500">
                    Loading users...
                </p>
            </div>
        );
    }

    // =========================================================
    // ERROR STATE
    // =========================================================
    if (error) {
        return (
            <div className="p-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">

                    <p className="text-sm text-red-600">
                        {error}
                    </p>

                    <button
                        onClick={fetchUsers}
                        className="mt-3 text-sm font-semibold text-red-700 hover:underline"
                    >
                        Try again
                    </button>

                </div>
            </div>
        );
    }

    return (
        <div className="w-full">

            {/* =====================================================
                USERS TABLE
            ====================================================== */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full text-left">

                        <thead className="border-b border-gray-200 bg-gray-50">

                            <tr>

                                {[
                                    "No.",
                                    "Name",
                                    "Email",
                                    "Role",
                                    "Password Status",
                                    "Actions"
                                ].map(header => (
                                    <th
                                        key={header}
                                        className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                                            header === "Actions"
                                                ? "text-right"
                                                : ""
                                        }`}
                                    >
                                        {header}
                                    </th>
                                ))}

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-100">

                            {users.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="px-6 py-10 text-center text-sm text-gray-500"
                                    >
                                        No active users found.
                                    </td>

                                </tr>

                            ) : (

                                users.map((user, index) => (

                                    <tr
                                        key={user.id}
                                        className="transition hover:bg-gray-50"
                                    >

                                        {/* NUMBER */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {index + 1}
                                        </td>

                                        {/* NAME */}
                                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                                            {user.first_name}{" "}
                                            {user.last_name}
                                        </td>

                                        {/* EMAIL */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {user.email}
                                        </td>

                                        {/* ROLE */}
                                        <td className="px-6 py-4">

                                            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                                {formatRole(
                                                    user.role
                                                )}
                                            </span>

                                        </td>

                                        {/* PASSWORD STATUS */}
                                        <td className="px-6 py-4">

                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                    user.is_password_changed
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {user.is_password_changed
                                                    ? "Changed"
                                                    : "Temporary Password"}
                                            </span>

                                        </td>

                                        {/* ACTIONS */}
                                        <td className="space-x-3 whitespace-nowrap px-6 py-4 text-right">

                                            {/* EDIT */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleEdit(user)
                                                }
                                                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-900"
                                                title="Edit User"
                                            >
                                                <Pencil size={14} />
                                            </button>

                                            {/* ARCHIVE */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleArchiveClick(user)
                                                }
                                                className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-900"
                                                title="Archive User"
                                            >
                                                <Archive size={14} />
                                            </button>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* =====================================================
                EDIT USER MODAL
            ====================================================== */}
            {selectedUser && (

                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(e) => {
                        if (
                            e.target === e.currentTarget &&
                            !showUpdateConfirmation
                        ) {
                            handleCloseModal();
                        }
                    }}
                >

                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-user-title"
                        className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
                    >

                        {/* HEADER */}
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                    <UserRound size={20} />
                                </div>

                                <div>

                                    <h2
                                        id="edit-user-title"
                                        className="text-lg font-semibold text-gray-900"
                                    >
                                        Edit User
                                    </h2>

                                    <p className="text-xs text-gray-500">
                                        Update user information and role.
                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={handleCloseModal}
                                disabled={saving}
                                aria-label="Close modal"
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        {/* FORM */}
                        <form onSubmit={handleUpdate}>

                            <div className="space-y-4 p-5">

                                {modalError && (

                                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                                        {modalError}
                                    </div>

                                )}

                                {/* FIRST NAME */}
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
                                        type="text"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        required
                                        disabled={saving}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                                        placeholder="Enter first name"
                                    />

                                </div>

                                {/* LAST NAME */}
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
                                        type="text"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        required
                                        disabled={saving}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                                        placeholder="Enter last name"
                                    />

                                </div>

                                {/* EMAIL */}
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
                                        required
                                        disabled={saving}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                                        placeholder="Enter email address"
                                    />

                                </div>

                                {/* ROLE */}
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
                                        required
                                        disabled={saving}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-50"
                                    >

                                        <option value="">
                                            Select a role
                                        </option>

                                        {ROLES.map(role => (
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

                            {/* FOOTER */}
                            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">

                                <button
                                    type="button"
                                    onClick={handleCloseModal}
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

                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

            {/* =====================================================
                UPDATE CONFIRMATION MODAL
            ====================================================== */}
            {showUpdateConfirmation && selectedUser && (

                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">

                        {/* CONTENT */}
                        <div className="p-5">

                            <div className="mb-4 flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                    <Save size={20} />
                                </div>

                                <div>

                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Confirm Changes
                                    </h2>

                                    <p className="text-xs text-gray-500">
                                        Please confirm before saving.
                                    </p>

                                </div>

                            </div>

                            <p className="text-sm leading-6 text-gray-600">

                                Are you sure you want to save the
                                changes made to{" "}

                                <span className="font-semibold text-gray-900">
                                    {selectedUser.first_name}{" "}
                                    {selectedUser.last_name}
                                </span>
                                ?

                            </p>

                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">

                            <button
                                type="button"
                                onClick={() =>
                                    setShowUpdateConfirmation(false)
                                }
                                disabled={saving}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmUpdate}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save size={16} />

                                {saving
                                    ? "Saving..."
                                    : "Confirm Update"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* =====================================================
                ARCHIVE CONFIRMATION MODAL
            ====================================================== */}
            {confirmArchiveUser && (

                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl">

                        {/* CONTENT */}
                        <div className="p-5">

                            <div className="mb-4 flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                    <Archive size={20} />
                                </div>

                                <div>

                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Archive User
                                    </h2>

                                    <p className="text-xs text-gray-500">
                                        Confirm before archiving.
                                    </p>

                                </div>

                            </div>

                            <p className="text-sm leading-6 text-gray-600">

                                Are you sure you want to archive{" "}

                                <span className="font-semibold text-gray-900">
                                    {confirmArchiveUser.first_name}{" "}
                                    {confirmArchiveUser.last_name}
                                </span>
                                ?

                            </p>

                            <p className="mt-2 text-xs text-gray-500">
                                The user will no longer appear in
                                the active users list.
                            </p>

                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">

                            <button
                                type="button"
                                onClick={() =>
                                    setConfirmArchiveUser(null)
                                }
                                disabled={archiving}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleArchive}
                                disabled={archiving}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Archive size={16} />

                                {archiving
                                    ? "Archiving..."
                                    : "Confirm Archive"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

export default UserManagementTable;