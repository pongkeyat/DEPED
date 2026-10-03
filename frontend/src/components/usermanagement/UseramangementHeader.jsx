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
      <div className="relative w-full min-h-[88px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Left Accent Bar */}
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3E74]" />
        
        <div className="flex min-h-[88px] flex-col justify-between gap-4 px-6 py-4 pl-7 sm:flex-row sm:items-center">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3E74]">
              <Users size={24} className="stroke-[2.2]" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1E3E74]">
                User Management
              </h1>

              <p className="mt-0.5 text-sm text-gray-500">
                Manage system users, assign roles, update account statuses, and configure access permissions.
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Add User Button connected to State */}
            <button 
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E3E74] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17325e] cursor-pointer"
            >
              <UserPlus size={16} />
              Add User
            </button>

            <button 
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-[#1E3E74] cursor-pointer"
            >
              <ShieldAlert size={16} className="text-gray-500" />
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