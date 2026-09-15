import { useState } from "react";
import { Users, UserPlus, ShieldAlert } from "lucide-react";
import RegisterUserModal from "./RegisterUserModal"; // Adjust path if needed

export default function UserManagementHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUserRegistered = (formData) => {
    console.log("User successfully captured in parent component:", formData);
    // You can refresh a user data list here if needed
  };

  return (
    <>
      <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Blue Accent */}
            <div className="w-1 h-10 bg-blue-900 rounded-full"></div>

            <Users className="w-5 h-5 text-blue-900" />

            <div>
              <h1 className="text-lg font-bold text-blue-900">
                User Management
              </h1>

              <p className="text-xs text-gray-500">
                Manage system users, assign roles, update account statuses, and configure access permissions.
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Add User Button connected to State */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-md bg-blue-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800 transition"
            >
              <UserPlus size={16} />
              Add User
            </button>

            <button className="flex items-center gap-2 rounded-md bg-gray-100 border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition">
              <ShieldAlert size={16} />
              Permissions
            </button>
          </div>
        </div>
      </div>

      {/* Connected Register User Modal Component */}
      <RegisterUserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUserRegistered={handleUserRegistered}
      />
    </>
  );
}