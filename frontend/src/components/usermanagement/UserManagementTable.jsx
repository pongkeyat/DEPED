import { useEffect, useState } from "react";
import axios from "axios";



const UserManagementTable = () => {

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // ========================================================
    // Get All Users
    // ========================================================

    const fetchUsers = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await axios.get(
                `${import.meta.env.VITE_GET_ALL_USERS}`,
                {
                    withCredentials: true
                }
            );

            setUsers(response.data.data || []);

        } catch (err) {

            console.error(
                "Error fetching users:",
                err
            );

            setError(
                err.response?.data?.error ||
                "Failed to load users."
            );

        } finally {

            setLoading(false);
        }
    };


    // ========================================================
    // Load Users
    // ========================================================

    useEffect(() => {

        fetchUsers();

    }, []);


    // ========================================================
    // Role Formatting
    // ========================================================

    const formatRole = (role) => {

        if (!role) return "N/A";

        switch (role.toLowerCase()) {

            case "admin":
                return "Administrator";

            case "hro":
                return "Human Resource Officer";

            case "hrmpsb":
                return "HRMPSB";

            default:
                return role;
        }
    };


    // ========================================================
    // Loading
    // ========================================================

    if (loading) {

        return (
            <div className="flex justify-center items-center py-10">
                <p className="text-gray-500">
                    Loading users...
                </p>
            </div>
        );
    }


    // ========================================================
    // Error
    // ========================================================

    if (error) {

        return (
            <div className="p-6">

                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-600">
                        {error}
                    </p>
                </div>

            </div>
        );
    }


    // ========================================================
    // Table
    // ========================================================

    return (
        <div className="w-full">




            {/* Table Container */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full text-left">

                        {/* Table Header */}
                        <thead className="border-b border-gray-200 bg-gray-50">

                            <tr>

                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    No.
                                </th>

                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Email
                                </th>

                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Role
                                </th>

                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Password Status
                                </th>

                            </tr>

                        </thead>


                        {/* Table Body */}
                        <tbody className="divide-y divide-gray-100">

                            {users.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="4"
                                        className="px-6 py-10 text-center text-sm text-gray-500"
                                    >
                                        No users found.
                                    </td>

                                </tr>

                            ) : (

                                users.map((user, index) => (

                                    <tr
                                        key={user.id}
                                        className="transition hover:bg-gray-50"
                                    >

                                        {/* Number */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {index + 1}
                                        </td>


                                        {/* Email */}
                                        <td className="px-6 py-4">

                                            <div className="text-sm font-medium text-gray-800">
                                                {user.email}
                                            </div>

                                        </td>


                                        {/* Role */}
                                        <td className="px-6 py-4">

                                            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                                {formatRole(user.role)}
                                            </span>

                                        </td>


                                        {/* Password Status */}
                                        <td className="px-6 py-4">

                                            {user.is_password_changed ? (

                                                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                    Changed
                                                </span>

                                            ) : (

                                                <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                                    Temporary Password
                                                </span>

                                            )}

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
};

export default UserManagementTable;