import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCircle,
  HelpCircle,
  LogOut,
  X,
  AlertTriangle,
} from "lucide-react";
import depedLogo from "../assets/deped-logo.png";

export default function Header({ isLoggedIn }) {
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  const handleNavigate = () => {
    navigate("/login");
  };

  const handleApplyNow = () => {
    navigate("/apply");
  };

  // Open logout confirmation
  const handleLogout = () => {
    setIsProfileOpen(false);
    setShowLogoutConfirmation(true);
  };

  // Confirm logout
  const confirmLogout = () => {
    setShowLogoutConfirmation(false);
    setIsProfileOpen(false);

    // If you have login data stored in localStorage,
    // you can remove it here.
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  // Cancel logout
  const cancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  const handleHelp = () => {
    setIsProfileOpen(false);
    navigate("/help");
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="w-full bg-gradient-to-b from-[#1e3c72] via-[#112244] to-[#0d1b2a] text-white font-sans relative overflow-visible flex flex-col">

        <header className="w-full flex justify-between items-center px-8 py-4 border-b border-white/10 shrink-0">

          {/* ================= LOGO AND BRAND ================= */}
          <div className="flex items-center gap-3">

            <img
              src={depedLogo}
              alt="DepEd Logo"
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />

            <div>
              <h1 className="text-sm font-bold tracking-wide leading-tight">
                Region 1
              </h1>

              <p className="text-[10px] text-gray-400">
                Department of Education • Region I
              </p>
            </div>

          </div>

          {/* ================= NAVIGATION AND ACTIONS ================= */}
          <div className="flex items-center gap-8">

            {!isLoggedIn ? (
              <>
                {/* APPLY NOW */}
                <button
                  type="button"
                  onClick={handleApplyNow}
                  className="flex items-center gap-2 hover:text-white transition text-sm text-gray-300"
                >
                  <span>➜</span>
                  Apply Now
                </button>

                {/* STAFF LOGIN */}
                <button
                  type="button"
                  onClick={handleNavigate}
                  className="border border-white/40 hover:border-white px-4 py-2 rounded-md flex items-center gap-2 text-xs transition"
                >
                  <span>➜</span>
                  Staff Login
                </button>
              </>
            ) : (

              /* ================= PROFILE MENU ================= */
              <div className="relative z-[9999]">

                {/* PERSON ICON */}
                <button
                  type="button"
                  onClick={() =>
                    setIsProfileOpen((prev) => !prev)
                  }
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition cursor-pointer"
                  title="Account"
                >
                  <UserCircle
                    size={32}
                    strokeWidth={1.8}
                    className="text-white"
                  />
                </button>

                {/* ================= DROPDOWN ================= */}
                {isProfileOpen && (
                  <div
                    className="
                      absolute
                      right-0
                      top-12
                      w-44
                      bg-white
                      text-gray-800
                      rounded-lg
                      shadow-2xl
                      border
                      border-gray-200
                      overflow-hidden
                      z-[99999]
                    "
                  >

                    {/* HELP */}
                    <button
                      type="button"
                      onClick={handleHelp}
                      className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-4
                        py-3
                        text-sm
                        hover:bg-gray-100
                        transition
                        text-left
                      "
                    >
                      <HelpCircle
                        size={18}
                        className="text-gray-600"
                      />

                      <span>Help</span>
                    </button>

                    {/* LOGOUT */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-4
                        py-3
                        text-sm
                        hover:bg-red-50
                        transition
                        text-left
                        text-red-600
                        border-t
                        border-gray-100
                      "
                    >
                      <LogOut size={18} />

                      <span>Logout</span>
                    </button>

                  </div>
                )}

              </div>
            )}

          </div>
        </header>
      </div>

      {/* ========================================================= */}
      {/*                    LOGOUT CONFIRMATION                    */}
      {/* ========================================================= */}

      {showLogoutConfirmation && (
        <div
          className="
            fixed
            inset-0
            z-[999999]
            flex
            items-center
            justify-center
            bg-black/50
            backdrop-blur-sm
            px-4
          "
        >

          {/* MODAL */}
          <div
            className="
              w-full
              max-w-md
              bg-white
              rounded-xl
              shadow-2xl
              overflow-hidden
            "
          >

            {/* ================= MODAL HEADER ================= */}
            <div
              className="
                flex
                items-center
                justify-between
                px-6
                py-4
                border-b
                border-gray-200
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    flex
                    items-center
                    justify-center
                    w-10
                    h-10
                    rounded-full
                    bg-red-100
                  "
                >
                  <AlertTriangle
                    size={21}
                    className="text-red-600"
                  />
                </div>

                <h2 className="text-lg font-semibold text-gray-800">
                  Confirm Logout
                </h2>

              </div>

              {/* CLOSE BUTTON */}
              <button
                type="button"
                onClick={cancelLogout}
                className="
                  p-1.5
                  rounded-full
                  hover:bg-gray-100
                  transition
                "
              >
                <X
                  size={20}
                  className="text-gray-500"
                />
              </button>

            </div>

            {/* ================= MESSAGE ================= */}
            <div className="px-6 py-6">

              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to logout from your account?
              </p>

            </div>

            {/* ================= ACTION BUTTONS ================= */}
            <div
              className="
                flex
                justify-end
                gap-3
                px-6
                py-4
                bg-gray-50
                border-t
                border-gray-200
              "
            >

              {/* CANCEL */}
              <button
                type="button"
                onClick={cancelLogout}
                className="
                  px-5
                  py-2
                  text-sm
                  font-medium
                  text-gray-700
                  bg-white
                  border
                  border-gray-300
                  rounded-md
                  hover:bg-gray-100
                  transition
                "
              >
                Cancel
              </button>

              {/* CONFIRM LOGOUT */}
              <button
                type="button"
                onClick={confirmLogout}
                className="
                  px-5
                  py-2
                  text-sm
                  font-medium
                  text-white
                  bg-red-600
                  rounded-md
                  hover:bg-red-700
                  transition
                "
              >
                Logout
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}